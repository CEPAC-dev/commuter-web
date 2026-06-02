'use client';

import React from 'react';
import type { WizardTimeSlot } from '@/lib/RequestWizardContext';
import type { ReturnRoute } from '@/lib/RequestWizardContext';
import type { GeoLocation, SelectedSeat, WeekDay } from '@/types/shared';
import { formatTime12h } from '@/lib/timeUtils';

interface ReviewModalProps {
  onClose:   () => void;
  onSubmit:  (min: number, max: number) => void;
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
  priceMin:        number;
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
  priceMin,
  priceMax,
}: ReviewModalProps) {
  const [adjMin, setAdjMin] = React.useState(priceMin);
  const [adjMax, setAdjMax] = React.useState(priceMax);
  const [rawMin, setRawMin] = React.useState(String(priceMin));
  const [rawMax, setRawMax] = React.useState(String(priceMax));

  function commitMin(raw: string) {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? priceMin : Math.max(priceMin, Math.min(n, adjMax - 1));
    setAdjMin(clamped);
    setRawMin(String(clamped));
  }

  function commitMax(raw: string) {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? adjMin + 1 : Math.max(adjMin + 1, n);
    setAdjMax(clamped);
    setRawMax(String(clamped));
  }

  const rideLabel = rideType === 'private'
    ? `Private ride · ${passengerCount + 1} passengers`
    : groupType === 'friends'
      ? 'Shared ride · Friends group'
      : 'Shared ride · Open match';

  const seatLabel = seatPreference === 'any'
    ? 'Any available seat'
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
          <h3 className="text-base font-bold text-[#0B1E3D]">Review your request</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6A7A', fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">

          {/* Ride details */}
          <ReviewSection title="Ride details">
            <ReviewRow label="Type" value={rideLabel} />
            <ReviewRow label="Seat" value={seatLabel} />
          </ReviewSection>

          {/* Schedule — each slot shows its own route */}
          <ReviewSection title="Schedule">
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
                    <span className="text-xs font-semibold text-[#0B1E3D]">Time slot {i + 1}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${slot.trip_type === 'round_trip' ? 'bg-[#EFF7F6] text-[#00C2A8]' : 'bg-[#F1F3F4] text-[#5A6A7A]'}`}>
                      {slot.trip_type === 'round_trip' ? 'Round trip' : 'One way'}
                    </span>
                  </div>

                  {/* Outbound route */}
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-[#00C2A8] uppercase tracking-wide mb-1">
                      {slot.trip_type === 'round_trip' ? '↗ Outbound' : 'Route'}
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
                      <p>Pickup: {formatTime12h(slot.pickup_from)} – {formatTime12h(slot.pickup_to)}</p>
                      <p>Arrival: {formatTime12h(slot.arrival_from)} – {formatTime12h(slot.arrival_to)}</p>
                    </div>
                  </div>

                  {/* Return route */}
                  {slot.trip_type === 'round_trip' && (
                    <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                      <p className="text-[10px] font-semibold text-[#00C2A8] uppercase tracking-wide mb-1">↩ Return</p>
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
                        <p className="text-xs text-[#9AA0A6] italic">Same as outbound (reversed)</p>
                      )}
                      {slot.return_pickup_from && (
                        <div className="mt-1.5 text-xs text-[#5A6A7A] space-y-0.5">
                          <p>Pickup: {formatTime12h(slot.return_pickup_from)} – {formatTime12h(slot.return_pickup_to ?? '')}</p>
                          {slot.return_arrival_from && (
                            <p>Arrival: {formatTime12h(slot.return_arrival_from)} – {formatTime12h(slot.return_arrival_to ?? '')}</p>
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
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </ReviewSection>

          {/* Cycle */}
          <ReviewSection title="Cycle">
            <ReviewRow label="Starts" value={cycleStartDate} />
          </ReviewSection>

          {/* Cost */}
          <ReviewSection title="Price range">
            {/* Live price display */}
            <div style={{
              background: '#0B1E3D', borderRadius: 14, padding: '18px 20px 14px',
              position: 'relative', overflow: 'hidden', marginBottom: 14,
            }}>
              <div style={{ position: 'absolute', top: -28, right: -18, width: 90, height: 90, borderRadius: '50%', background: '#00C2A8', opacity: 0.08, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -20, right: 60, width: 60, height: 60, borderRadius: '50%', background: '#00C2A8', opacity: 0.05, pointerEvents: 'none' }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>💰 Weekly price range</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
                EGP {adjMin} <span style={{ color: '#00C2A8', fontWeight: 400 }}>—</span> {adjMax}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                Base estimate: EGP {priceMin} – {priceMax} · Final confirmed after match
              </p>
            </div>

            {/* Stepper controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', gap: 8, alignItems: 'start', minWidth: 0 }}>
              {/* Min */}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Minimum</p>
                <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #E2E8F0', overflow: 'hidden', background: '#FAFAFA' }}>
                  <button
                    type="button"
                    onClick={() => { const v = Math.max(priceMin, adjMin - 1); setAdjMin(v); setRawMin(String(v)); }}
                    style={{ width: 38, height: 44, background: 'none', border: 'none', borderRight: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 20, color: '#94A3B8', fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rawMin}
                    onChange={e => setRawMin(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => commitMin(rawMin)}
                    style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#0B1E3D', fontFamily: 'inherit', background: 'transparent', minWidth: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => { const v = Math.min(adjMin + 1, adjMax - 1); setAdjMin(v); setRawMin(String(v)); }}
                    style={{ width: 38, height: 44, background: '#00C2A8', border: 'none', borderLeft: '1px solid #00C2A8', cursor: 'pointer', fontSize: 20, color: '#fff', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
                <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Floor: EGP {priceMin}</p>
              </div>

              {/* Divider */}
              <div style={{ paddingTop: 24, textAlign: 'center', color: '#CBD4E1', fontSize: 16, fontWeight: 300 }}>—</div>

              {/* Max */}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Maximum</p>
                <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #E2E8F0', overflow: 'hidden', background: '#FAFAFA' }}>
                  <button
                    type="button"
                    onClick={() => { const v = Math.max(adjMin + 1, adjMax - 1); setAdjMax(v); setRawMax(String(v)); }}
                    style={{ width: 38, height: 44, background: 'none', border: 'none', borderRight: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 20, color: '#94A3B8', fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rawMax}
                    onChange={e => setRawMax(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => commitMax(rawMax)}
                    style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#0B1E3D', fontFamily: 'inherit', background: 'transparent', minWidth: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => { const v = adjMax + 1; setAdjMax(v); setRawMax(String(v)); }}
                    style={{ width: 38, height: 44, background: '#00C2A8', border: 'none', borderLeft: '1px solid #00C2A8', cursor: 'pointer', fontSize: 20, color: '#fff', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
                <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Must be &gt; min</p>
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
            ← Edit
          </button>
          <button
            onClick={() => onSubmit(adjMin, adjMax)}
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
            {submitting ? 'Submitting…' : 'Submit request ✓'}
          </button>
        </div>
      </div>
    </>
  );
}
