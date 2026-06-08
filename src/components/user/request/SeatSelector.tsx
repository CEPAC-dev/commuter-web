'use client';

import { useState } from 'react';
import SeatSelectorLegend from './SeatSelectorLegend';
import { useTranslations } from 'next-intl';

// ── Types ────────────────────────────────────────────────────────────────────

export type SeatId = 'front-passenger' | 'rear-left' | 'rear-right';

export interface SelectedSeat {
  id: SeatId;
  label: string;
  type: 'front' | 'rear-window';
  extra_cost_egp: number;
}

interface SeatSelectorProps {
  onSeatSelect: (seat: SelectedSeat | 'any') => void;
  selectedSeat: SelectedSeat | 'any';
  takenSeats?: SeatId[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const SEAT_COSTS: Record<'front' | 'rear-window', number> = {
  front: 10,
  'rear-window': 8,
};

const SEAT_POSITIONS: Record<SeatId | 'driver', { cx: number; cy: number }> = {
  driver:             { cx: 76,  cy: 108 },
  'front-passenger':  { cx: 124, cy: 108 },
  'rear-left':        { cx: 76,  cy: 182 },
  'rear-right':       { cx: 124, cy: 182 },
};

type SeatState = 'default' | 'selected' | 'taken' | 'driver';

const COLORS: Record<SeatState, { fill: string; stroke: string }> = {
  default:  { fill: '#E8EAED', stroke: '#9AA0A6' },
  selected: { fill: '#00C2A8', stroke: '#007A6A' },
  taken:    { fill: '#F28B82', stroke: '#C5221F' },
  driver:   { fill: '#CBD2D9', stroke: '#9AA0A6' },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SeatSelector({
  onSeatSelect,
  selectedSeat,
  takenSeats = [],
}: SeatSelectorProps) {
  const ts = useTranslations('seat_selector');
  const tf = useTranslations('request_form');
  const tc = useTranslations('common');
  const [animatingId, setAnimatingId] = useState<SeatId | null>(null);

  const SEAT_LABELS: Record<SeatId, string> = {
    'front-passenger': ts('front'),
    'rear-left':       ts('rear_left'),
    'rear-right':      ts('rear_right'),
  };

  function getSeatState(id: SeatId): SeatState {
    if (takenSeats.includes(id)) return 'taken';
    if (selectedSeat !== 'any' && selectedSeat?.id === id) return 'selected';
    return 'default';
  }

  function handleSeatClick(id: SeatId) {
    // Toggle off if same seat tapped again
    if (selectedSeat !== 'any' && selectedSeat?.id === id) {
      onSeatSelect('any');
      return;
    }
    const type: 'front' | 'rear-window' = id === 'front-passenger' ? 'front' : 'rear-window';
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 250);
    onSeatSelect({
      id,
      label: SEAT_LABELS[id],
      type,
      extra_cost_egp: SEAT_COSTS[type],
    });
  }

  function renderSeat(id: SeatId | 'driver', pos: { cx: number; cy: number }, state: SeatState) {
    const color = COLORS[state];
    const x = pos.cx - 22;
    const y = pos.cy - 24;
    const isDriver = id === 'driver';
    const isInteractive = state !== 'taken' && !isDriver;
    const isAnimating = !isDriver && animatingId === (id as SeatId);

    function handleClick() {
      if (isInteractive) handleSeatClick(id as SeatId);
    }
    function handleKeyDown(e: React.KeyboardEvent) {
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleSeatClick(id as SeatId);
      }
    }

    return (
      <g
        key={id}
        onClick={isInteractive ? handleClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={isDriver ? 'img' : 'button'}
        aria-label={
          isDriver
            ? ts('driver')
            : state === 'taken'
            ? `Seat ${id} — taken`
            : `${SEAT_LABELS[id as SeatId]}${state === 'selected' ? ' — selected' : ''}`
        }
        aria-pressed={state === 'selected' ? true : undefined}
        aria-disabled={state === 'taken' || isDriver ? true : undefined}
        tabIndex={isInteractive ? 0 : -1}
        opacity={isDriver ? 0.6 : 1}
        style={{ cursor: isInteractive ? 'pointer' : isDriver ? 'default' : 'not-allowed' }}
        className={isAnimating ? 'seat-pop' : ''}
      >
        {/* Seat base */}
        <rect
          x={x} y={y}
          width={44} height={48}
          rx={8} ry={8}
          fill={color.fill}
          stroke={color.stroke}
          strokeWidth={state === 'selected' ? 2.5 : 1.5}
          style={{ transition: 'fill 0.2s, stroke 0.2s' }}
          onMouseEnter={(e) => {
            if (state === 'default') {
              (e.target as SVGElement).setAttribute('fill', '#C8E6FA');
            }
          }}
          onMouseLeave={(e) => {
            if (state === 'default') {
              (e.target as SVGElement).setAttribute('fill', '#E8EAED');
            }
          }}
        />

        {/* Headrest */}
        <rect
          x={x + 6} y={y + 3}
          width={32} height={12}
          rx={4} ry={4}
          fill={color.stroke}
          opacity={0.5}
        />

        {/* Driver label */}
        {isDriver && (
          <text
            x={pos.cx} y={pos.cy + 6}
            textAnchor="middle"
            fontSize="9"
            fill="#5F6368"
            fontFamily="Inter, sans-serif"
          >
            {tf('seat_driver')}
          </text>
        )}

        {/* Selected checkmark */}
        {state === 'selected' && (
          <text
            x={pos.cx} y={pos.cy + 7}
            textAnchor="middle"
            fontSize="16"
            fill="white"
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
          >
            ✓
          </text>
        )}

        {/* Taken X */}
        {state === 'taken' && (
          <text
            x={pos.cx} y={pos.cy + 6}
            textAnchor="middle"
            fontSize="14"
            fill="white"
            fontFamily="Inter, sans-serif"
          >
            ✕
          </text>
        )}
      </g>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

      {/* SVG Car diagram */}
      {/* SVG Car diagram */}
      <svg
        viewBox="0 0 200 280"
        width="100%"
        style={{ maxWidth: 200 }}
        role="group"
        aria-label="Car seat layout — click a seat to select it"
      >
        {/* Car body */}
        <rect
          x="25" y="20" width="150" height="240" rx="36" ry="36"
          fill="#F1F3F4" stroke="#9AA0A6" strokeWidth="2"
        />

        {/* Windshield */}
        <rect
          x="48" y="32" width="104" height="48" rx="10" ry="10"
          fill="#C8E6FA" stroke="#9AA0A6" strokeWidth="1.5" opacity="0.75"
        />

        {/* Rear window */}
        <rect
          x="48" y="198" width="104" height="40" rx="8" ry="8"
          fill="#C8E6FA" stroke="#9AA0A6" strokeWidth="1.5" opacity="0.75"
        />

        {/* Steering wheel */}
        <circle cx="76" cy="108" r="11" fill="none" stroke="#9AA0A6" strokeWidth="2" />
        <line x1="76" y1="97" x2="76" y2="119" stroke="#9AA0A6" strokeWidth="1.5" />
        <line x1="65" y1="108" x2="87" y2="108" stroke="#9AA0A6" strokeWidth="1.5" />

        {/* Direction labels */}
        <text
          x="100" y="16" fontSize="9" fill="#9AA0A6"
          textAnchor="middle" fontFamily="Inter, sans-serif"
        >
          ▲ FRONT
        </text>
        <text
          x="100" y="275" fontSize="9" fill="#9AA0A6"
          textAnchor="middle" fontFamily="Inter, sans-serif"
        >
          ▼ BACK
        </text>

        {/* Row labels */}
        <text
          x="14" y="112" fontSize="8" fill="#9AA0A6"
          textAnchor="middle" fontFamily="Inter, sans-serif"
        >
          Front
        </text>
        <text
          x="14" y="186" fontSize="8" fill="#9AA0A6"
          textAnchor="middle" fontFamily="Inter, sans-serif"
        >
          Rear
        </text>

        {/* Driver seat (not selectable) */}
        {renderSeat('driver', SEAT_POSITIONS.driver, 'driver')}

        {/* Selectable seats */}
        {renderSeat('front-passenger', SEAT_POSITIONS['front-passenger'], getSeatState('front-passenger'))}
        {renderSeat('rear-left',       SEAT_POSITIONS['rear-left'],       getSeatState('rear-left'))}
        {renderSeat('rear-right',      SEAT_POSITIONS['rear-right'],      getSeatState('rear-right'))}
      </svg>

      {/* Legend */}
      <SeatSelectorLegend />

      {/* Cost badge */}
      {selectedSeat !== 'any' && selectedSeat && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 14, color: '#0B1E3D' }}>
            Selected: <strong>{selectedSeat.label}</strong>
          </span>
          {selectedSeat.extra_cost_egp > 0 ? (
            <span
              style={{
                fontSize: 12,
                background: '#FFF8E1',
                border: '1px solid #F9C74F',
                color: '#7a4d00',
                borderRadius: 20,
                padding: '2px 10px',
                fontWeight: 600,
              }}
            >
              + EGP {selectedSeat.extra_cost_egp} / trip
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#166534',
                borderRadius: 20,
                padding: '2px 10px',
                fontWeight: 600,
              }}
            >
              {tc('free')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
