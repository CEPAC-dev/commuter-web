'use client';

import { useRouter } from 'next/navigation';
import { useWizard } from '@/lib/RequestWizardContext';
import { useTranslations } from 'next-intl';

export default function RequestNewPage() {
  const t = useTranslations('request_new');
  const router = useRouter();
  const { setRideType } = useWizard();

  const CARDS = [
    {
      id: 'private' as const,
      label: t('private_label'),
      tagline: t('private_tagline'),
      description: t('private_desc'),
      pills: [t('private_pill_1'), t('private_pill_2'), t('private_pill_3')],
      accent: '#00C2A8',
      accentBg: 'rgba(0,194,168,0.1)',
      accentBorder: 'rgba(0,194,168,0.2)',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'shared' as const,
      label: t('shared_label'),
      tagline: t('shared_tagline'),
      description: t('shared_desc'),
      pills: [t('shared_pill_1'), t('shared_pill_2'), t('shared_pill_3')],
      accent: '#7B8FFF',
      accentBg: 'rgba(123,143,255,0.1)',
      accentBorder: 'rgba(123,143,255,0.2)',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7B8FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  function handleSelect(id: 'private' | 'shared') {
    setRideType(id);
    if (id === 'private') router.push('/user/request/schedule');
    else router.push('/user/request/new/shared');
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px 64px',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 28, maxWidth: 320 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0B1E3D', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {t('heading')}
        </h1>
        <p style={{ fontSize: 13, color: '#5A6A7A', margin: 0, lineHeight: 1.5 }}>
          {t('subheading')}
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 440 }}>
        {CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => handleSelect(card.id)}
            style={{
              background: '#fff',
              border: `1.5px solid #E2E8F0`,
              borderRadius: 18,
              padding: '16px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'border-color 0.18s, background 0.18s, transform 0.12s',
              width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = card.accent;
              e.currentTarget.style.background = card.accentBg;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: card.accentBg, border: `1.5px solid ${card.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{card.label}</p>
                <p style={{ fontSize: 12, color: card.accent, fontWeight: 500, margin: 0 }}>{card.tagline}</p>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: card.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={card.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: 12.5, color: '#5A6A7A', lineHeight: 1.5, margin: '0 0 12px' }}>{card.description}</p>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {card.pills.map(pill => (
                <span key={pill} style={{ fontSize: 11, fontWeight: 600, color: card.accent, background: card.accentBg, border: `1px solid ${card.accentBorder}`, borderRadius: 100, padding: '2px 9px', letterSpacing: '0.02em' }}>
                  {pill}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

