'use client';

import React from 'react';
import type { WizardTimeSlot } from '@/lib/RequestWizardContext';
import type { ReturnRoute } from '@/lib/RequestWizardContext';
import type { GeoLocation, SelectedSeat, WeekDay } from '@/types/shared';
import { formatTime12h } from '@/lib/timeUtils';
import { useTranslations } from 'next-intl';

interface ReviewModalProps {
  onClose:   () => void;
  onSubmit:  (price: number) => void;
  submitting: boolean;

  rideType:        'private' | 'shared' | null;
  groupType:       'friends' | 'open' | null;
  passengerCount:  number;
  seatPreference:  'any' | SelectedSeat;

  origin:          GeoLocation | null;
  destination:     GeoLocation | null;
  route:           { distance_km: number; duration_minutes: number } | null;

  timeSlots:       WizardTimeSlot[];
  returnRoutes:    Record<string, ReturnRoute>;

  cycleStartDate:  string;
  priceMax:        number;
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#F1F3F4]">
      <span className="text-xs text-[#5A6A7A] flex-shrink-0 w-28">{label}</span>
      <span className="text-xs font-medium text-[#0B1E3D] text-right">{value}</span>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  );
}

const DAY_ABBR = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function ReviewModal({
  onClose,
  onSubmit,
  submitting,
  rideType,
  groupType,
  passengerCount,
  seatPreference,
  origin,
  destination,
  route,
  timeSlots,
  returnRoutes,
  cycleStartDate,
  priceMax,
}: ReviewModalProps) {
  const trm = useTranslations('review_modal');
  const trs = useTranslations('request_summary');
  const tf = useTranslations('request_form');
  const tsl = useTranslations('time_slot');
  const td = useTranslations('days');
  const [adjMax, setAdjMax] = React.useState(priceMax);
  const [rawMax, setRawMax] = React.useState(String(priceMax));

  function commitMax(raw: string) {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) || n < priceMax ? priceMax : n;
    setAdjMax(clamped);
    setRawMax(String(clamped));
  }

  const rideLabel = rideType === 'private'
    ? trm('private_passengers', { count: passengerCount + 1 })
    : groupType === 'friends'
      ? tf('shared')
      : tf('shared');

  const seatLabel = seatPreference === 'any'
    ? tf('seat_any')
    : (seatPreference as SelectedSeat).label + ` (+EGP ${(seatPreference as SelectedSeat).extra_cost_egp}/trip)`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900 }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 20,
          zIndex: 901,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '0 0 env(safe-area-inset-bottom)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] z-10">
          <h3 className="text-base font-bold text-[#0B1E3D]">{trs('title')}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6A7A', fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">

          {/* Ride details */}
          <ReviewSection title={trm('ride_details')}>
            <ReviewRow label={trm('type_label')} value={rideLabel} />
            <ReviewRow label={trs('seat')} value={seatLabel} />
          </ReviewSection>

          {/* Schedule — each slot shows its own route */}
          <ReviewSection title={trs('schedule_title')}>
            {timeSlots.map((slot, i) => {
              const rr = returnRoutes[slot.id];
              const slotOrigin        = slot.origin      ?? origin;
              const slotDestination   = slot.destination ?? destination;
              const slotRoute         = slot.route       ?? route;
              const returnOrigin      = slot.return_origin      ?? rr?.origin      ?? null;
              const returnDestination = slot.return_destination ?? rr?.destination ?? null;
              const returnRoute       = slot.return_route ?? null;

              // Stops label
              const stopsCount = (slot.stops ?? []).length;

              return (
                <div key={slot.id} className="mb-3 p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                  {/* Slot header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-[#0B1E3D]">{tsl('label', { n: i + 1 })}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${slot.trip_type === 'round_trip' ? 'bg-[#EFF7F6] text-[#00C2A8]' : 'bg-[#F1F3F4] text-[#5A6A7A]'}`}>
                      {slot.trip_type === 'round_trip' ? tsl('round_trip') : tsl('one_way')}
                    </span>
                  </div>

                  {/* Outbound route */}
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-[#00C2A8] uppercase tracking-wide mb-1">
                      {slot.trip_type === 'round_trip' ? trm('outbound_label') : trm('route_label')}
                    </p>
                    <div className="flex items-start gap-2 mb-1">
                      <div className="mt-0.5 flex flex-col items-center flex-shrink-0" style={{ gap: 2 }}>
                        <div className="w-2 h-2 rounded-full bg-white border-2 border-[#0B1E3D]" />
                        {stopsCount > 0 && (
                          <div className="w-0.5 bg-[#CBD4E1]" style={{ height: stopsCount * 14 }} />
                        )}
                        <div className="w-2 h-2 rounded-full bg-[#00C2A8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#0B1E3D] font-medium truncate">{slotOrigin?.address ?? '—'}</p>
                        {(slot.stops ?? []).map((stop, si) => (
                          <p key={si} className="text-xs text-[#5A6A7A] truncate mt-0.5">↳ {stop.address}</p>
                        ))}
                        <p className="text-xs text-[#0B1E3D] font-medium truncate mt-0.5">{slotDestination?.address ?? '—'}</p>
                      </div>
                    </div>
                    {slotRoute && (
                      <p className="text-[10px] text-[#9AA0A6] ml-4">
                        {slotRoute.distance_km.toFixed(1)} km · ~{Math.round(slotRoute.duration_minutes)} min
                      </p>
                    )}
                    <div className="mt-1.5 text-xs text-[#5A6A7A] space-y-0.5">
                      <p>{trm('pickup_label')}: {formatTime12h(slot.pickup_from)} – {formatTime12h(slot.pickup_to)}</p>
                      <p>{trm('arrival_label')}: {formatTime12h(slot.arrival_from)} – {formatTime12h(slot.arrival_to)}</p>
                    </div>
                  </div>

                  {/* Return route */}
                  {slot.trip_type === 'round_trip' && (
                    <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                      <p className="text-[10px] font-semibold text-[#00C2A8] uppercase tracking-wide mb-1">{trm('return_label')}</p>
                      {returnOrigin && returnDestination ? (
                        <>
                          <div className="flex items-start gap-2 mb-1">
                            <div className="mt-0.5 flex flex-col items-center flex-shrink-0" style={{ gap: 2 }}>
                              <div className="w-2 h-2 rounded-full bg-white border-2 border-[#0B1E3D]" />
                              <div className="w-2 h-2 rounded-full bg-[#00C2A8]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#0B1E3D] font-medium truncate">{returnOrigin.address}</p>
                              <p className="text-xs text-[#0B1E3D] font-medium truncate mt-0.5">{returnDestination.address}</p>
                            </div>
                          </div>
                          {returnRoute && (
                            <p className="text-[10px] text-[#9AA0A6] ml-4">
                              {returnRoute.distance_km.toFixed(1)} km · ~{Math.round(returnRoute.duration_minutes)} min
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-[#9AA0A6] italic">{trm('same_as_outbound')}</p>
                      )}
                      {slot.return_pickup_from && (
                        <div className="mt-1.5 text-xs text-[#5A6A7A] space-y-0.5">
                          <p>{trm('pickup_label')}: {formatTime12h(slot.return_pickup_from)} – {formatTime12h(slot.return_pickup_to ?? '')}</p>
                          {slot.return_arrival_from && (
                            <p>{trm('arrival_label')}: {formatTime12h(slot.return_arrival_from)} – {formatTime12h(slot.return_arrival_to ?? '')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Day chips */}
                  <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-[#E2E8F0]">
                    {DAY_ABBR.map(d => (
                      <span
                        key={d}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${slot.days.includes(d as WeekDay) ? 'bg-[#0B1E3D] text-white font-semibold' : 'bg-[#E2E8F0] text-[#9AA0A6]'}`}
                      >
                        {td(d.toLowerCase() as 'sun')}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </ReviewSection>

          {/* Cycle */}
          <ReviewSection title={trm('cycle_section')}>
            <ReviewRow label={trm('starts_label')} value={cycleStartDate} />
          </ReviewSection>

          {/* Cost */}
          <ReviewSection title={trm('estimated_price_section')}>
            {/* Live price display */}
            <div style={{
              background: '#0B1E3D', borderRadius: 14, padding: '18px 20px 14px',
              position: 'relative', overflow: 'hidden', marginBottom: 14,
            }}>
              <div style={{ position: 'absolute', top: -28, right: -18, width: 90, height: 90, borderRadius: '50%', background: '#00C2A8', opacity: 0.08, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -20, right: 60, width: 60, height: 60, borderRadius: '50%', background: '#00C2A8', opacity: 0.05, pointerEvents: 'none' }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>💰 {trm('estimated_price_section')}</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
                EGP {adjMax}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                {trm('price_final_note')}
              </p>
            </div>

            {/* Stepper controls */}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{trm('price_label')}</p>
              <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #E2E8F0', overflow: 'hidden', background: '#FAFAFA' }}>
                <button
                  type="button"
                  disabled={adjMax <= priceMax}
                  onClick={() => { const v = Math.max(priceMax, adjMax - 1); setAdjMax(v); setRawMax(String(v)); }}
                  style={{
                    width: 48, height: 48, border: 'none', borderRight: '1px solid #E2E8F0',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700,
                    background: adjMax > priceMax ? '#00C2A8' : 'none',
                    color: adjMax > priceMax ? '#fff' : '#D1D5DB',
                    cursor: adjMax <= priceMax ? 'not-allowed' : 'pointer',
                    opacity: adjMax <= priceMax ? 0.4 : 1,
                    transition: 'background 0.2s, color 0.2s',
                  }}
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
          </ReviewSection>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            style={{ flex: 1, height: 46, background: '#F1F3F4', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#5A6A7A', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {trm('edit_btn')}
          </button>
          <button
            onClick={() => onSubmit(adjMax)}
            disabled={submitting}
            style={{
              flex: 2,
              height: 46,
              background: submitting ? '#9AA0A6' : '#00C2A8',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              color: '#0B1E3D',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {submitting ? trm('submitting') : trm('submit')}
          </button>
        </div>
      </div>
    </>
  );
}
