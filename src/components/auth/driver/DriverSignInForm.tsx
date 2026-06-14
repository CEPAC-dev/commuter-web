'use client';

import { useState } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';
import PasswordInput from '@/components/shared/PasswordInput';
import authApi, { extractToken, extractRole, extractName, extractId } from '@/lib/api/auth';
import driverApi from '@/lib/api/driver';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRedirectIfAuth } from '@/lib/auth/useRedirectIfAuth';

const EGYPT_PHONE = /^01[0125][0-9]{8}$/;

export default function DriverSignInForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const { login } = useAuth();

  useRedirectIfAuth();
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [pwErr,    setPwErr]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  function validate(): boolean {
    let ok = true;
    setPhoneErr('');
    setPwErr('');
    if (!EGYPT_PHONE.test(phone)) { setPhoneErr(t('driver_signin_mobile_error')); ok = false; }
    if (password.length < 8) { setPwErr(t('driver_signin_password_error')); ok = false; }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.login({ phone_number: phone, password });
      const token = extractToken(res);
      if (!token) throw new Error('No token received from server');
      const name = extractName(res) || phone;

      login({
        token,
        role: extractRole(res) || 'driver',
        name,
        id:   extractId(res),
      });

      toast.success(t('driver_signin_welcome', { name }));

      let destination: string;
      try {
        const status = await driverApi.getStatus() as { has_profile: boolean; is_verified: boolean };
        if (!status.has_profile) {
          destination = '/driver/onboarding';
        } else {
          destination = nextPath && !nextPath.startsWith('/driver/sign') && !nextPath.startsWith('/sign')
            ? nextPath
            : '/driver/my-requests';
        }
      } catch {
        destination = nextPath && !nextPath.startsWith('/driver/sign') && !nextPath.startsWith('/sign')
          ? nextPath
          : '/driver/my-requests';
      }
      router.replace(destination);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('driver_signin_failed'));
    } finally {
      setLoading(false);
    }
  }

  const phoneBorder = phoneErr ? '#E74C3C' : phoneFocused ? '#00C2A8' : '#D1D5DB';
  const phoneShadow = phoneFocused ? `0 0 0 3px ${phoneErr ? '#E74C3C33' : '#00C2A833'}` : 'none';

  return (
    <form onSubmit={handleSubmit} noValidate style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B1E3D', margin: '0 0 6px' }}>{t('driver_signin_title')}</h1>
      <p style={{ fontSize: 14, color: '#5A6A7A', margin: '0 0 24px' }}>{t('driver_signin_subtitle')}</p>

      {/* Mobile number */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#0B1E3D', marginBottom: 6 }}>{t('driver_signin_mobile_label')}</label>
        <div style={{ position: 'relative' }}>
          <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} aria-hidden />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            placeholder={t('driver_signin_mobile_placeholder')}
            autoComplete="tel"
            style={{
              width: '100%', height: 52,
              paddingLeft: 42, paddingRight: 16,
              border: `1.5px solid ${phoneBorder}`,
              borderRadius: 10, fontSize: 14, color: '#0B1E3D',
              background: '#fff', outline: 'none',
              boxShadow: phoneShadow,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>
        {phoneErr && <p style={{ marginTop: 5, fontSize: 12, color: '#E74C3C' }}>{phoneErr}</p>}
      </div>

      {/* Password */}
      <div style={{ marginBottom: 24 }}>
        <PasswordInput
          label={t('auth:password_label')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth:password_placeholder')}
          error={pwErr}
          autoComplete="current-password"
          rightLabel={
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#00C2A8', textDecoration: 'none' }}>{t('auth:forgot_password')}</Link>
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
        {t('auth:signin_btn')}
      </button>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#5A6A7A' }}>
        {t('driver_signin_not_registered')}{' '}
        <Link href="/driver/sign-up" style={{ color: '#00C2A8', fontWeight: 500, textDecoration: 'none' }}>{t('driver_signin_apply_link')}</Link>
      </p>
    </form>
  );
}
