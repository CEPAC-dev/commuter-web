'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]               = useState('');
  const [emailErr, setEmailErr]         = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

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
      // Redirect to OTP page with email
      router.push(`/auth/forgot-password/otp?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setEmailErr(err instanceof Error ? err.message : 'Failed to send code. Try again.');
    } finally {
      setEmailLoading(false);
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
      <Link href="/auth/signin" className="flex items-center gap-1.5 text-text-muted hover:text-primary text-sm mb-6 transition-colors w-fit">
        <ArrowLeft size={14} /> Back to sign in
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
}
