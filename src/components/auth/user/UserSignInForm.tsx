'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import PasswordInput from '@/components/shared/PasswordInput';
import { signIn } from '@/lib/api/auth';
import { saveSession } from '@/lib/auth';
export default function UserSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  // If already logged in (e.g. back button from bfcache), send to dashboard
  useEffect(() => {
    const token = localStorage.getItem('commuter_token');
    if (!token) return;
    const role = localStorage.getItem('commuter_role');
    router.replace(role === 'driver' ? '/driver/requests' : '/user/my-requests');
  }, [router]);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [pwErr, setPwErr]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  function validate(): boolean {
    let ok = true;
    setEmailErr('');
    setPwErr('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr('Enter a valid email address.'); ok = false; }
    if (password.length < 8) { setPwErr('Password must be at least 8 characters.'); ok = false; }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signIn({ email, password }, 'user');
      saveSession(result);
      if (typeof window !== 'undefined') localStorage.setItem('commuter_email', email);
      toast.success(`Welcome back, ${result.name}! 👋`);
      router.replace(nextPath || '/user/my-requests');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const emailBorder = emailErr ? '#E74C3C' : emailFocused ? '#00C2A8' : '#D1D5DB';
  const emailShadow = emailFocused ? `0 0 0 3px ${emailErr ? '#E74C3C33' : '#00C2A833'}` : 'none';

  return (
    <form onSubmit={handleSubmit} noValidate style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B1E3D', margin: '0 0 6px' }}>Welcome back</h1>
      <p style={{ fontSize: 14, color: '#5A6A7A', margin: '0 0 16px' }}>Sign in to your Commuter account</p>

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#0B1E3D', marginBottom: 6 }}>Email address</label>
        <div style={{ position: 'relative' }}>
          <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} aria-hidden />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="you@commuter.eg"
            autoComplete="email"
            style={{
              width: '100%', height: 52,
              paddingLeft: 42, paddingRight: 16,
              border: `1.5px solid ${emailBorder}`,
              borderRadius: 10, fontSize: 14, color: '#0B1E3D',
              background: '#fff', outline: 'none',
              boxShadow: emailShadow,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>
        {emailErr && <p style={{ marginTop: 5, fontSize: 12, color: '#E74C3C' }}>{emailErr}</p>}
      </div>

      {/* Password */}
      <div style={{ marginBottom: 28 }}>
        <PasswordInput
          label="Password"
          accentColor="#00C2A8"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          error={pwErr}
          autoComplete="current-password"
          rightLabel={
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#00C2A8', textDecoration: 'none' }}>Forgot password?</Link>
          }
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', height: 52, borderRadius: 10,
          fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
          background: '#00C2A8', color: '#0B1E3D',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading ? 0.65 : 1, transition: 'opacity 0.15s',
        }}
      >
        {loading && <Loader2 size={16} className="spin" />}
        Sign in
      </button>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#5A6A7A' }}>
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" style={{ color: '#00C2A8', fontWeight: 500, textDecoration: 'none' }}>Sign up →</Link>
      </p>
    </form>
  );
}
