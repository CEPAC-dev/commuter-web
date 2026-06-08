'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useIntent } from '@/lib/IntentContext';
import OnboardingCard from '@/components/user/onboarding/OnboardingCard';
import WizardProgress from '@/components/user/onboarding/WizardProgress';

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const { setIntent, resetIntent } = useIntent();

  function choosePrivate() {
    resetIntent();
    setIntent({ ride_type: 'private' });
    router.push('/user/onboarding/private');
  }

  function chooseShared() {
    resetIntent();
    setIntent({ ride_type: 'shared' });
    router.push('/user/onboarding/shared');
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
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#00C2A8', letterSpacing: '-0.5px' }}>
          {t('brand')}
        </span>
      </div>

      <WizardProgress current={1} total={2} />

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8 }}>
          {t('how_travel')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, margin: 0 }}>
          {t('choose_type')}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 680,
      }}>
        <OnboardingCard
          icon="🚗"
          title={t('private_title')}
          description={t('private_desc')}
          bullets={[
            t('private_bullet_1'),
            t('private_bullet_2'),
            t('private_bullet_3'),
          ]}
          ctaLabel={t('private_cta')}
          onClick={choosePrivate}
        />

        <OnboardingCard
          icon="🧑‍🤝‍🧑"
          title={t('shared_title')}
          description={t('shared_desc')}
          bullets={[
            t('shared_bullet_1'),
            t('shared_bullet_2'),
            t('shared_bullet_3'),
          ]}
          ctaLabel={t('shared_cta')}
          onClick={chooseShared}
        />
      </div>
    </div>
  );
}
