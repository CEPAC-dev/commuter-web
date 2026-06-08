'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useIntent } from '@/lib/IntentContext';
import OnboardingCard from '@/components/user/onboarding/OnboardingCard';
import WizardProgress from '@/components/user/onboarding/WizardProgress';

export default function SharedPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const { setIntent } = useIntent();

  function chooseFriends() {
    setIntent({ group_type: 'friends' });
    router.push('/user/onboarding/shared/friends');
  }

  function chooseOpen() {
    setIntent({ group_type: 'open' });
    router.push('/user/onboarding/shared/open');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B1E3D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 680, display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => router.push('/user/onboarding')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginRight: 'auto' }}
        >
          ← {tCommon('back')}
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#00C2A8' }}>{t('brand')}</span>
        <div style={{ marginLeft: 'auto', width: 60 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 680 }}>
        <WizardProgress current={2} total={3} />

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8 }}>
            {t('who_riding_with')}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <OnboardingCard
            icon="👥"
            title={t('ride_with_friends')}
            description={t('ride_with_friends_desc')}
            ctaLabel={t('ride_with_friends')}
            onClick={chooseFriends}
          />

          <OnboardingCard
            icon="🔍"
            title={t('open_match')}
            description={t('open_match_desc')}
            ctaLabel={t('open_match')}
            onClick={chooseOpen}
          />
        </div>
      </div>
    </div>
  );
}
