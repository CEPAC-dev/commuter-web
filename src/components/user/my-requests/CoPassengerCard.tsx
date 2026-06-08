'use client';

import type { CoPassenger } from '@/types/user';
import { useTranslations } from 'next-intl';

interface CoPassengerCardProps {
  passengers: CoPassenger[];
}

function GenderIcon({ gender }: { gender: 'male' | 'female' }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: gender === 'female' ? '#FCE4EC' : '#E3F2FD',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
      }}
    >
      {gender === 'female' ? '👩' : '👨'}
    </div>
  );
}

export default function CoPassengerCard({ passengers }: CoPassengerCardProps) {
  const t = useTranslations('co_passenger');
  if (!passengers.length) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#5A6A7A',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}
      >
        Your co-riders
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {passengers.map((p, i) => {
          const displayName = p.first_name;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#F8F9FA',
                borderRadius: 10,
                padding: '8px 12px',
                border: '1px solid #E2E8F0',
              }}
            >
              <GenderIcon gender={p.gender} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E3D' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 12, color: '#5A6A7A' }}>
                  {p.gender === 'female' ? t('female') : t('male')} · {t('stop', { n: i + 1 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
