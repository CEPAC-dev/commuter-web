'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Step3Otp from '@/components/auth/user/steps/Step3Otp';
import { sendOtp, verifyOtp } from '@/lib/api/auth';

type Step = 'email' | 'otp' | 'done';

export default function VerifyEmailPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  // Step 1 — email
  const [email, setEmail]               = useState('');
  const [emailErr, setEmailErr]         = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 2 — OTP
  const [otpLoading, setOtpLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError]           = useState<string | null>(null);

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr('Enter a valid email address.');
      return;
    }
    setEmailErr('');
    setEmailLoading(true);
    try {
      await sendOtp(email);
      setStep('otp');
    } catch (err: unknown) {
      setEmailErr(err instanceof Error ? err.message : 'Failed to send code. Try again.');
    } finally {
      setEmailLoading(false);
    }
  }

  // ── Step 2: verify OTP ──────────────────────────────────────────────────────
  async function handleVerifyOtp(code: string) {
    setOtpError(null);
    setOtpLoading(true);
    try {
      await verifyOtp(email, code);
      setStep('done');
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    setResendLoading(true);
    try {
      await sendOtp(email);
      toast.success('A new code has been sent to your email.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setResendLoading(false);
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
      <Link
        href="/sign-in"
        className="flex items-center gap-1.5 text-text-muted hover:text-primary text-sm mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={14} /> {t('back_to_signin')}
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-black text-sm">c</span>
        </div>
        <span className="text-primary font-bold text-lg">commuter</span>
      </div>

      <h1 className="text-2xl font-bold text-primary mt-5 mb-1">Verify your email</h1>
      <p className="text-sm text-text-muted mb-6">
        Enter your email address and we&apos;ll send you a verification code.
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

  // ── Done ──────────────────────────────────────────────────────────────────
  return card(
    <div className="text-center py-4">
      <CheckCircle size={56} className="text-success mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-primary mb-2">Email verified!</h2>
      <p className="text-sm text-text-muted leading-relaxed mb-6">
        Your email address has been successfully verified.<br />
        You can now sign in to your account.
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
