'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useIntent } from '@/lib/IntentContext';
import OnboardingCard from '@/components/user/onboarding/OnboardingCard';
import WizardProgress from '@/components/user/onboarding/WizardProgress';

export default function FriendsPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const { setIntent } = useIntent();

  function chooseCreate() {
    setIntent({ group_action: 'create' });
    router.push('/user/onboarding/shared/friends/create');
  }

  function chooseJoin() {
    setIntent({ group_action: 'join' });
    router.push('/user/onboarding/shared/friends/join');
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
          onClick={() => router.push('/user/onboarding/shared')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginRight: 'auto' }}
        >
          ← {tCommon('back')}
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#00C2A8' }}>{t('brand')}</span>
        <div style={{ marginLeft: 'auto', width: 60 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 680 }}>
        <WizardProgress current={3} total={4} />

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8 }}>
            {t('create_or_join')}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <OnboardingCard
            icon="🔑"
            title={t('create_group')}
            description={t('what_next_1')}
            ctaLabel={t('create_group')}
            onClick={chooseCreate}
          />

          <OnboardingCard
            icon="📩"
            title={t('join_group')}
            description={t('enter_code_desc')}
            ctaLabel={t('enter_group_code')}
            onClick={chooseJoin}
          />
        </div>
      </div>
    </div>
  );
}
