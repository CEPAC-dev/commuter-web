'use client';

import type { RequestStatus } from '@/types/user';
import { useTranslations } from 'next-intl';

const STEP_KEYS = ['submitted', 'matching', 'confirmed', 'active', 'completed'] as const;

const STATUS_STEP_INDEX: Record<RequestStatus, number> = {
  available:      0,
  submitted:      0,
  matching:       1,
  finding_driver: 1,
  driver_offered: 1,
  price_raised:   1,
  confirmed:      2,
  active:         3,
  completed:      4,
  cancelled:      -1,
};

interface StatusTimelineProps {
  status: RequestStatus;
}

export default function StatusTimeline({ status }: StatusTimelineProps) {
  const t = useTranslations('status_timeline');
  const currentIndex = STATUS_STEP_INDEX[status] ?? 0;

  if (status === 'cancelled') {
    return (
      <div
        style={{
          padding: '8px 12px',
          background: '#FFEBEE',
          borderRadius: 8,
          fontSize: 13,
          color: '#E74C3C',
          fontWeight: 600,
        }}
      >
        ✕ {t('cancelled')}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        paddingBottom: 4,
        gap: 0,
      }}
    >
      {STEP_KEYS.map((key, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;

        return (
          <div
            key={key}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            {/* Circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  marginTop: 5,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: done || current ? '#00C2A8' : '#E2E8F0',
                  border: `2px solid ${done || current ? '#00C2A8' : '#CBD5E0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  
                }}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {current && (
                  <>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#fff',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: '50%',
                        border: '2px solid #00C2A8',
                        opacity: 0.5,
                        animation: 'pulse 1.5s ease-in-out infinite',
                        
                      }}
                    />
                  </>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: current ? 700 : 500,
                  color: done || current ? '#0B1E3D' : '#A0AEC0',
                  whiteSpace: 'nowrap',
                }}
              >
                {t(key)}
              </span>
            </div>

            {/* Connector line */}
            {i < STEP_KEYS.length - 1 && (
              <div
                style={{
                  height: 2,
                  width: 32,
                  background: i < currentIndex ? '#00C2A8' : '#E2E8F0',
                  marginBottom: 14,
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
