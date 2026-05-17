'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Step3Otp from '@/components/auth/user/steps/Step3Otp';
import { verifyForgotOtp, forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otpLoading, setOtpLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError]           = useState<string | null>(null);

  async function handleVerifyOtp(code: string) {
    setOtpError(null);
    setOtpLoading(true);
    try {
      await verifyForgotOtp(email, code);
      // Redirect to password reset page with email and code
      router.push(`/auth/forgot-password/reset?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
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

  const card = (children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1E3D' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {children}
      </div>
    </div>
  );

  return card(
    <>
      <Link href="/auth/forgot-password" className="flex items-center gap-1.5 text-text-muted hover:text-primary text-sm mb-6 transition-colors w-fit">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-black text-sm">c</span>
        </div>
        <span className="text-primary font-bold text-lg">commuter</span>
      </div>

      <h1 className="text-2xl font-bold text-primary mt-5 mb-1">Verify email</h1>
      <p className="text-sm text-text-muted mb-6">
        We sent a 6-digit code to {email}. Enter it below.
      </p>

      <Step3Otp
        email={email}
        loading={otpLoading}
        resendLoading={resendLoading}
        error={otpError}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </>,
  );
}
