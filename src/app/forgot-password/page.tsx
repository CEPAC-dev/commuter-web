'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Step3Otp from '@/components/auth/user/steps/Step3Otp';
import PasswordInput from '@/components/shared/PasswordInput';
import { forgotPassword, verifyForgotOtp, resetPassword } from '@/lib/api/auth';

type Step = 'email' | 'otp' | 'newpass' | 'done';

export default function ForgotPasswordPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  // Step 1 - email
  const [email, setEmail]       = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 2 - OTP
  const [otpLoading, setOtpLoading]         = useState(false);
  const [resendLoading, setResendLoading]   = useState(false);
  const [otpError, setOtpError]             = useState<string | null>(null);
  const [verifiedCode, setVerifiedCode]     = useState('');

  // Step 3 - new password
  const [password, setPassword]             = useState('');
  const [confirm, setConfirm]               = useState('');
  const [pwErr, setPwErr]                   = useState('');
  const [confirmErr, setConfirmErr]         = useState('');
  const [pwLoading, setPwLoading]           = useState(false);

  // ── Step 1: request OTP ───────────────────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr('Enter a valid email address.');
      return;
    }
    setEmailErr('');
    setEmailLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
    } catch (err: unknown) {
      setEmailErr(err instanceof Error ? err.message : 'Failed to send code. Try again.');
    } finally {
      setEmailLoading(false);
    }
  }

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  async function handleVerifyOtp(code: string) {
    setOtpError(null);
    setOtpLoading(true);
    try {
      await verifyForgotOtp(email, code);
      setVerifiedCode(code);
      setStep('newpass');
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    setResendLoading(true);
    try {
      await forgotPassword(email);
      toast.success('A new code has been sent to your email.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  }

  // ── Step 3: set new password ──────────────────────────────────────────────
  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    let ok = true;
    setPwErr('');
    setConfirmErr('');
    if (password.length < 8) { setPwErr('Password must be at least 8 characters.'); ok = false; }
    if (password !== confirm) { setConfirmErr('Passwords do not match.'); ok = false; }
    if (!ok) return;

    setPwLoading(true);
    try {
      await resetPassword(email, verifiedCode, password, confirm);
      setStep('done');
    } catch (err: unknown) {
      setPwErr(err instanceof Error ? err.message : 'Reset failed. Try again.');
    } finally {
      setPwLoading(false);
    }
  }

  const card = (children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1E3D' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {children}
      </div>
    </div>
  );

  // ── Step 1: Email ─────────────────────────────────────────────────────────
  if (step === 'email') return card(
    <>
      <Link href="/sign-in" className="flex items-center gap-1.5 text-text-muted hover:text-primary text-sm mb-6 transition-colors w-fit">
        <ArrowLeft size={14} /> {t('back_to_signin')}
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-black text-sm">c</span>
        </div>
        <span className="text-primary font-bold text-lg">commuter</span>
      </div>

      <h1 className="text-2xl font-bold text-primary mt-5 mb-1">Forgot your password?</h1>
      <p className="text-sm text-text-muted mb-6">
        Enter your email and we&apos;ll send you a verification code.
      </p>

      <form onSubmit={handleEmailSubmit} noValidate>
        <div className="mb-5">
          <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={[
                'w-full h-[52px] pl-10 pr-4 border rounded-lg text-sm text-primary bg-white',
                'focus:outline-none transition-all placeholder:text-text-muted/60',
                emailErr
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15'
                  : 'border-[#D1D5DB] focus:border-secondary focus:ring-2 focus:ring-secondary/15',
              ].join(' ')}
            />
          </div>
          {emailErr && <p className="mt-1 text-xs text-danger">{emailErr}</p>}
        </div>

        <button
          type="submit"
          disabled={emailLoading}
          className="w-full h-[52px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: '#00C2A8', color: '#0B1E3D' }}
        >
          {emailLoading && <Loader2 size={16} className="animate-spin" />}
          Send verification code
        </button>
      </form>
    </>,
  );

  // ── Step 2: OTP ───────────────────────────────────────────────────────────
  if (step === 'otp') return card(
    <Step3Otp
      email={email}
      loading={otpLoading}
      resendLoading={resendLoading}
      error={otpError}
      onVerify={handleVerifyOtp}
      onResend={handleResendOtp}
    />,
  );

  // ── Step 3: New password ──────────────────────────────────────────────────
  if (step === 'newpass') return card(
    <>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#EFF7F6', border: '2px solid #C0E6E1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 26 }}>🔑</span>
      </div>

      <h1 className="text-2xl font-bold text-primary mb-1">Set new password</h1>
      <p className="text-sm text-text-muted mb-6">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleNewPassword} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PasswordInput
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          error={pwErr}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password"
          error={confirmErr}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={pwLoading}
          className="w-full h-[52px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: '#00C2A8', color: '#0B1E3D', marginTop: 8 }}
        >
          {pwLoading && <Loader2 size={16} className="animate-spin" />}
          Reset password
        </button>
      </form>
    </>,
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  return card(
    <div className="text-center py-4">
      <CheckCircle size={56} className="text-success mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-primary mb-2">Password reset!</h2>
      <p className="text-sm text-text-muted leading-relaxed mb-6">
        Your password has been updated. You can now sign in with your new password.
      </p>
      <button
        onClick={() => router.push('/sign-in')}
        className="w-full h-[52px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: '#00C2A8', color: '#0B1E3D' }}
      >
        Go to sign in
      </button>
    </div>,
  );
}
