'use client';

import { Toaster } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import AuthSplitLayout from '@/components/shared/AuthSplitLayout';
import DriverSignInForm from '@/components/auth/driver/DriverSignInForm';

function DriverSignInLeft() {
  const t = useTranslations('driver_signup.left_panel');
  return (
    <div style={{ color: '#ffffff' }}>
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          {t('headline1')}<br />
          <span style={{ color: '#00C2A8' }}>{t('headline2')}</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          {t('signin_desc')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { value: '12,000+', label: t('stat_drivers') },
          { value: '10,000 EGP', label: t('stat_earnings') },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, borderRadius: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#00C2A8', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DriverSignInPage() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthSplitLayout
        role="driver"
        leftContent={<DriverSignInLeft />}
        rightContent={<DriverSignInForm />}
      />
    </>
  );
}
