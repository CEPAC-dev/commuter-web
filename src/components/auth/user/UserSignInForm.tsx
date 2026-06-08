'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import PasswordInput from '@/components/shared/PasswordInput';
import authApi, { extractToken, extractRole, extractName, extractId } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRedirectIfAuth } from '@/lib/auth/useRedirectIfAuth';
import { saveUserData } from '@/lib/auth/tokenStorage';
export default function UserSignInForm() {
  const t = useTranslations('sign_in_form');
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr(t('email_error')); ok = false; }
    if (password.length < 8) { setPwErr(t('password_error')); ok = false; }
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

      // Store full user object so the profile page can read it without a separate API call
      if (res.user) saveUserData(res.user as unknown as Record<string, unknown>);

      login({
        token,
        role: extractRole(res) || 'user',
        name,
        id:   extractId(res),
      });

      if (typeof window !== 'undefined') localStorage.setItem('commuter_email', email);
      toast.success(t('welcome_toast', { name }));

      const safeNext = nextPath && !nextPath.startsWith('/sign') && !nextPath.startsWith('/driver/sign')
        ? nextPath
        : '/user/my-requests';
      router.replace(safeNext);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t('signin_failed');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const emailBorder = emailErr ? '#E74C3C' : emailFocused ? '#00C2A8' : '#D1D5DB';
  const emailShadow = emailFocused ? `0 0 0 3px ${emailErr ? '#E74C3C33' : '#00C2A833'}` : 'none';

  return (
    <form onSubmit={handleSubmit} noValidate style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B1E3D', margin: '0 0 6px' }}>{t('title')}</h1>
      <p style={{ fontSize: 14, color: '#5A6A7A', margin: '0 0 16px' }}>{t('subtitle')}</p>

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#0B1E3D', marginBottom: 6 }}>{t('email_label')}</label>
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
          label={t('password_label')}
          accentColor="#00C2A8"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('password_placeholder')}
          error={pwErr}
          autoComplete="current-password"
          rightLabel={
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#00C2A8', textDecoration: 'none' }}>{t('forgot_password')}</Link>
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
        {t('submit_btn')}
      </button>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#5A6A7A' }}>
        {t('no_account')}{' '}
        <Link href="/sign-up" style={{ color: '#00C2A8', fontWeight: 500, textDecoration: 'none' }}>{t('sign_up_link')}</Link>
      </p>
      <p style={{ marginTop: 10, textAlign: 'center', fontSize: 14, color: '#5A6A7A' }}>
        {t('verify_prompt')}{' '}
        <Link href="/verify-email" style={{ color: '#00C2A8', fontWeight: 500, textDecoration: 'none' }}>{t('verify_link')}</Link>
      </p>
    </form>
  );
}
