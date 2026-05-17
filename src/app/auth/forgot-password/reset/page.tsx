'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import PasswordInput from '@/components/shared/PasswordInput';
import { resetPassword } from '@/lib/api/auth';

export default function ForgotPasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const code = searchParams.get('code') || '';

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [pwErr, setPwErr]             = useState('');
  const [confirmErr, setConfirmErr]   = useState('');
  const [pwLoading, setPwLoading]     = useState(false);
  const [done, setDone]               = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let ok = true;
    setPwErr('');
    setConfirmErr('');
    if (password.length < 8) {
      setPwErr('Password must be at least 8 characters.');
      ok = false;
    }
    if (password !== confirm) {
      setConfirmErr('Passwords do not match.');
      ok = false;
    }
    if (!ok) return;

    setPwLoading(true);
    try {
      await resetPassword(email, code, password, confirm);
      setDone(true);
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

  if (done) {
    return card(
      <div className="text-center py-4">
        <CheckCircle size={56} className="text-success mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Password reset!</h2>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="w-full h-[52px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: '#00C2A8', color: '#0B1E3D' }}
        >
          Go to sign in
        </button>
      </div>,
    );
  }

  return card(
    <>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#EFF7F6',
          border: '2px solid #C0E6E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 26 }}>🔑</span>
      </div>

      <h1 className="text-2xl font-bold text-primary mb-1">Set new password</h1>
      <p className="text-sm text-text-muted mb-6">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
}
