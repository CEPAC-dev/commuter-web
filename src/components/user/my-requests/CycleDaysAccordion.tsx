'use client';

import { useState } from 'react';
import type { CycleDayRecord } from '@/types/shared';
import { useTranslations } from 'next-intl';

interface Props {
  days: CycleDayRecord[];
  driverName?: string;
}

export default function CycleDaysAccordion({ days, driverName }: Props) {
  const t = useTranslations('cycle_days');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!days || days.length === 0) {
    return (
      <div
        style={{
          padding: '14px',
          color: '#5A6A7A',
          fontSize: 13,
          textAlign: 'center',
          background: '#F8F9FA',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
        }}
      >
        No schedule records yet.
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
      {days.map((day, i) => {
        const isOpen = openIndex === i;

        const statusColor =
          day.status === 'completed' ? '#00C2A8' :
          day.status === 'cancelled' ? '#E74C3C' :
          '#9AA0A6';
        const statusLabel =
          day.status === 'completed' ? t('completed') :
          day.status === 'cancelled' ? t('cancelled') :
          t('no_show');
        const statusBg =
          day.status === 'completed' ? '#EFF7F6' :
          day.status === 'cancelled' ? '#FFEBEE' :
          '#F1F3F4';

        // Parse date without timezone shift
        const [y, m, d] = day.date.split('-').map(Number);
        const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-EG', {
          weekday: 'short', day: 'numeric', month: 'short',
        });

        return (
          <div
            key={day.date}
            style={{ borderBottom: i < days.length - 1 ? '1px solid #E2E8F0' : 'none' }}
          >
            {/* Row header */}
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                background: isOpen ? '#F8F9FA' : '#fff',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                gap: 8,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D' }}>
                  {dateLabel}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: statusColor,
                    background: statusBg,
                    borderRadius: 20,
                    padding: '2px 8px',
                  }}
                >
                  {statusLabel}
                </span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5A6A7A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                  flexShrink: 0,
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div
                style={{
                  padding: '8px 14px 12px',
                  background: '#F8F9FA',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {(
                  [
                    [t('pickup_time'),  day.pickup_time  ?? '—'],
                    [t('dropoff_time'), day.dropoff_time ?? '—'],
                    [t('driver'),       day.driver_name ?? driverName ?? '—'],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: '#5A6A7A' }}>{label}</span>
                    <span style={{ color: '#0B1E3D', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
