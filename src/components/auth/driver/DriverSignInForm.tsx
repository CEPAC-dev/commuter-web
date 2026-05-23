'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import PasswordInput from '@/components/shared/PasswordInput';
import authApi, { extractToken, extractRole, extractName, extractId } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRedirectIfAuth } from '@/lib/auth/useRedirectIfAuth';

const DEMO = { email: 'driver@commuter.eg', password: 'demo1234' };

export default function DriverSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const { login } = useAuth();

  // If already logged in, bounce to dashboard (also handles bfcache).
  useRedirectIfAuth();
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
      const res = await authApi.login({ email, password });
      const token = extractToken(res);
      if (!token) throw new Error('No token received from server');
      const name = extractName(res) || email;

      login({
        token,
        role: extractRole(res) || 'driver',
        name,
        id:   extractId(res),
      });

      toast.success(`Welcome back, ${name}! 👋`);
      const safeNext = nextPath && !nextPath.startsWith('/driver/sign') && !nextPath.startsWith('/sign')
        ? nextPath
        : '/driver/requests';
      router.replace(safeNext);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const emailBorder = emailErr ? '#E74C3C' : emailFocused ? '#00C2A8' : '#D1D5DB';
  const emailShadow = emailFocused ? `0 0 0 3px ${emailErr ? '#E74C3C33' : '#00C2A833'}` : 'none';

  return (
    <form onSubmit={handleSubmit} noValidate style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B1E3D', margin: '0 0 6px' }}>Driver sign in</h1>
      <p style={{ fontSize: 14, color: '#5A6A7A', margin: '0 0 24px' }}>Enter your credentials to access the driver portal</p>

      {/* Demo credentials */}
      <button
        type="button"
        onClick={() => { setEmail(DEMO.email); setPassword(DEMO.password); setEmailErr(''); setPwErr(''); }}
        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 24, padding: '12px 14px', borderRadius: 10, background: '#EFF7F6', border: '1px solid #C0E6E1', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D', margin: '0 0 4px' }}>Demo credentials <span style={{ fontSize: 11, fontWeight: 400, color: '#00C2A8' }}>— click to fill</span></p>
        <p style={{ fontSize: 13, color: '#5A6A7A', margin: '0 0 2px' }}>Email: <strong style={{ color: '#0B1E3D' }}>{DEMO.email}</strong></p>
        <p style={{ fontSize: 13, color: '#5A6A7A', margin: 0 }}>Password: <strong style={{ color: '#0B1E3D' }}>{DEMO.password}</strong></p>
      </button>

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
      <div style={{ marginBottom: 24 }}>
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
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
          background: '#00C2A8', color: '#fff',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading ? 0.65 : 1, transition: 'opacity 0.15s',
        }}
      >
        {loading && <Loader2 size={16} className="spin" />}
        Sign in
      </button>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#5A6A7A' }}>
        Not registered yet?{' '}
        <Link href="/driver/sign-up" style={{ color: '#00C2A8', fontWeight: 500, textDecoration: 'none' }}>Apply to become a driver →</Link>
      </p>
    </form>
  );
}
