'use client';

import { useTranslations } from 'next-intl';

export default function SeatSelectorLegend() {
  const ts = useTranslations('seat_selector');

  const legendItems = [
    { fill: '#E8EAED', stroke: '#9AA0A6', label: ts('available'), icon: null },
    { fill: '#00C2A8', stroke: '#007A6A', label: ts('selected'),  icon: '✓' },
    { fill: '#F28B82', stroke: '#C5221F', label: ts('taken'),     icon: '✕' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        marginTop: 12,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      {legendItems.map(({ fill, stroke, label, icon }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="24" height="18" aria-hidden="true">
            <rect
              x="1" y="1" width="22" height="16"
              rx="4" ry="4"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            {icon && (
              <text
                x="12" y="13"
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
                fontFamily="Inter, sans-serif"
              >
                {icon}
              </text>
            )}
          </svg>
          <span style={{ fontSize: 12, color: '#5F6368', fontFamily: 'Inter, sans-serif' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
