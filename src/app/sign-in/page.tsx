import { Toaster } from 'react-hot-toast';
import AuthSplitLayout from '@/components/shared/AuthSplitLayout';
import UserSignInForm from '@/components/auth/user/UserSignInForm';
import { useTranslations } from 'next-intl';

function UserSignInLeft() {
  const t = useTranslations('sign_in_page');
  return (
    <div style={{ color: '#ffffff' }}>
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          {t('headline')}<br />
          <span style={{ color: '#00C2A8' }}>{t('headline_accent')}</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          {t('tagline')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { value: t('stat_commuters_value'), label: t('stat_commuters_label') },
          { value: t('stat_savings_value'),   label: t('stat_savings_label') },
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

export default function UserSignInPage() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthSplitLayout
        role="user"
        leftContent={<UserSignInLeft />}
        rightContent={<UserSignInForm />}
      />
    </>
  );
}
