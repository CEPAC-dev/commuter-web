'use client';

import { useState } from 'react';

import type { TimeSlot, GeoLocation, WeekDay } from '@/types/shared';
import type { ApiPassenger } from '@/lib/api/passengers';
import { ALL_DAYS_SUN_FIRST, formatTime12h } from '@/lib/timeUtils';
import { useTranslations } from 'next-intl';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  origin:          GeoLocation;
  destination:     GeoLocation;
  routeStop:       GeoLocation | null;
  pickupPoint:     GeoLocation | null;
  tripType:        'one_way' | 'round_trip';
  slots:           TimeSlot[];
  passengers:      ApiPassenger[];
  priceMax:        number;
  cycleStartLabel: string;
  notes:           string;
  submitting:      boolean;
  error:           string | null;
  onConfirm:       (price: number) => void;
  onCancel:        () => void;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function tw(t: string) { return formatTime12h(t); }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F8F9FA] border-b border-[#E2E8F0]">
        <p className="text-xs font-bold text-[#5A6A7A] uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#00C2A8] text-sm w-4 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[#0B1E3D] leading-snug">{value}</p>
      </div>
    </div>
  );
}

function DayChip({ day, label }: { day: WeekDay; label: string }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-[#EFF7F6] text-[#00C2A8] text-xs font-bold border border-[#C8E8E4]">
      {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReviewModal({
  origin, destination, routeStop, pickupPoint,
  tripType, slots, passengers,
  priceMax, cycleStartLabel,
  notes, submitting, error,
  onConfirm, onCancel,
}: Props) {
  const trm = useTranslations('review_modal');
  const trs = useTranslations('request_summary');
  const trf = useTranslations('ride_form');
  const to = useTranslations('outbound_route');
  const tsl = useTranslations('time_slot');
  const tseat = useTranslations('seat_layout');
  const trsch = useTranslations('request_schedule');
  const td = useTranslations('days');
  const tcommon = useTranslations('common');
  const [adjMax, setAdjMax] = useState(priceMax);
  const [rawMax, setRawMax] = useState(String(priceMax));

  function commitMax(raw: string) {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) || n < priceMax ? priceMax : n;
    setAdjMax(clamped);
    setRawMax(String(clamped));
  }
  const passengerMap = new Map(passengers.map(p => [p.id, p.name]));

  return (
    <div
      className="fixed inset-0 z-[800] bg-white flex flex-col"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-sm text-[#5A6A7A] hover:text-[#0B1E3D] transition-colors disabled:opacity-40"
          style={{ background: 'none', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {tcommon('back')}
        </button>
        <h2 className="text-base font-bold text-[#0B1E3D] flex-1">{trs('title')}</h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFF7F6] text-[#00C2A8] border border-[#C8E8E4]">
          {trf('private')}
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Route */}
        <Section title={trs('route')}>
          <Row icon="📍" label={to('from')}        value={origin.address} />
          {routeStop  && <Row icon="🔵" label={to('pickup')}   value={routeStop.address} />}
          <Row icon="🏁" label={to('destination')} value={destination.address} />
          {pickupPoint && <Row icon="🤝" label={to('pickup')} value={pickupPoint.address} />}
          <div className="flex items-center gap-2 pt-1">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: tripType === 'round_trip' ? '#EFF7F6' : '#F1F3F4',
                color:      tripType === 'round_trip' ? '#00C2A8' : '#5A6A7A',
              }}
            >
              {tripType === 'round_trip' ? `↕ ${tsl('round_trip')}` : `→ ${tsl('one_way')}`}
            </span>
          </div>
        </Section>

        {/* Schedule — one card per time slot */}
        {slots.map((slot, i) => {
          const sortedDays = ALL_DAYS_SUN_FIRST.filter(d => slot.days.includes(d));
          const hasAnyDayStop = Object.values(slot.day_stops ?? {}).some(arr => arr && arr.length > 0);

          return (
            <Section key={slot.id} title={tsl('label', { n: i + 1 })}>
              {/* Days */}
              <div>
                <p className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wide mb-1.5">{trs('days')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sortedDays.map(d => (
                    <DayChip key={d} day={d} label={td(d.toLowerCase() as 'sun')} />
                  ))}
                </div>
              </div>

              {/* Pickup & Arrival */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wide mb-0.5">{trs('pickup_window')}</p>
                  <p className="text-sm font-semibold text-[#0B1E3D]">
                    {tw(slot.pickup_from)} – {tw(slot.pickup_to)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wide mb-0.5">{trs('arrival_window')}</p>
                  <p className="text-sm font-semibold text-[#0B1E3D]">
                    {tw(slot.arrival_from)} – {tw(slot.arrival_to)}
                  </p>
                </div>
              </div>

              {/* Passengers */}
              {slot.seat_assignments && Object.keys(slot.seat_assignments).length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wide mb-1.5">{trs('passengers')}</p>
                  <div className="space-y-1">
                    {Object.entries(slot.seat_assignments).map(([key, seat]) => {
                      const name = key === 'me'
                        ? trsch('me')
                        : passengerMap.get(Number(key)) ?? trs('passenger_fallback', { id: key });
                      return (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-[#0B1E3D] font-medium">{name}</span>
                          <span className="text-xs text-[#5A6A7A] bg-[#F1F3F4] px-2 py-0.5 rounded-full">
                            {tseat(seat)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Per-day stops */}
              {hasAnyDayStop && (
                <div className="pt-1">
                  <p className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wide mb-1.5">{trs('stops_by_day')}</p>
                  <div className="space-y-1.5">
                    {sortedDays.map(day => {
                      const dayStops = slot.day_stops?.[day] ?? [];
                      if (dayStops.length === 0) return null;
                      return (
                        <div key={day}>
                          <span className="text-xs font-bold text-[#0B1E3D]">{td(day.toLowerCase() as 'sun')}:</span>
                          <div className="ml-2 mt-0.5 space-y-0.5">
                            {dayStops.map((s, si) => (
                              <p key={si} className="text-xs text-[#5A6A7A]">📍 {s.address}</p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Return (if round trip) */}
              {tripType === 'round_trip' && slot.return_pickup_from && (
                <div className="border-t border-[#F1F3F4] pt-2 mt-1">
                  <p className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wide mb-1">{trs('return_trip')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-[#9AA0A6] mb-0.5">{trs('pickup')}</p>
                      <p className="text-sm font-semibold text-[#0B1E3D]">
                        {tw(slot.return_pickup_from!)} – {tw(slot.return_pickup_to!)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9AA0A6] mb-0.5">{trs('arrival')}</p>
                      <p className="text-sm font-semibold text-[#0B1E3D]">
                        {tw(slot.return_arrival_from!)} – {tw(slot.return_arrival_to!)}
                      </p>
                    </div>
                  </div>
                  {slot.return_pickup_point && (
                    <p className="text-xs text-[#5A6A7A] mt-1">
                      🤝 {slot.return_pickup_point.address}
                    </p>
                  )}
                </div>
              )}
            </Section>
          );
        })}

        {/* Price */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #E2E8F0' }}>
          {/* Live price display */}
          <div style={{
            background: '#0B1E3D', padding: '18px 20px 14px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -28, right: -18, width: 90, height: 90, borderRadius: '50%', background: '#00C2A8', opacity: 0.08, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 60, width: 60, height: 60, borderRadius: '50%', background: '#00C2A8', opacity: 0.05, pointerEvents: 'none' }} />
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>💰 {trs('estimated_price')}</p>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
              EGP {adjMax}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
              {trs('estimated_price_note')}
            </p>
          </div>

          {/* Stepper controls */}
          <div style={{ background: '#fff', padding: '16px 20px 20px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{trs('estimated_price_label')}</p>
              <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #E2E8F0', overflow: 'hidden', background: '#FAFAFA' }}>
                <button
                  type="button"
                  onClick={() => { const v = Math.max(priceMax, adjMax - 1); setAdjMax(v); setRawMax(String(v)); }}
                  style={{ width: 48, height: 48, background: 'none', border: 'none', borderRight: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 22, color: '#94A3B8', fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rawMax}
                  onChange={e => setRawMax(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => commitMax(rawMax)}
                  style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#0B1E3D', fontFamily: 'inherit', background: 'transparent', minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={() => { const v = adjMax + 1; setAdjMax(v); setRawMax(String(v)); }}
                  style={{ width: 48, height: 48, background: '#00C2A8', border: 'none', borderLeft: '1px solid #00C2A8', cursor: 'pointer', fontSize: 22, color: '#fff', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Cycle start */}
        <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📅</span>
          <div>
            <p className="text-xs font-semibold text-[#5A6A7A]">{trs('cycle_start')}</p>
            <p className="text-sm font-bold text-[#0B1E3D]">{cycleStartLabel}</p>
          </div>
        </div>

        {/* Notes */}
        {notes.trim().length > 0 && (
          <Section title={trs('notes_for_driver')}>
            <p className="text-sm text-[#0B1E3D] leading-relaxed">{notes}</p>
          </Section>
        )}

        {error && (
          <p className="text-sm text-[#E74C3C] font-medium px-1">{error}</p>
        )}

        <div className="h-4" />
      </div>

      {/* ── Footer: Confirm button ── */}
      <div className="px-4 py-3 border-t border-[#E2E8F0] bg-white flex-shrink-0">
        <button
          type="button"
          onClick={() => onConfirm(adjMax)}
          disabled={submitting}
          className="w-full py-4 rounded-xl text-white font-bold text-sm transition-colors"
          style={{
            background: submitting ? '#7C8794' : '#0B1E3D',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? trm('submitting') : trm('confirm_submit')}
        </button>
      </div>
    </div>
  );
}
