'use client';

import type { TimeSlot, WeekDay } from '@/types/shared';
import {
  addMinutes,
  formatTime12h,
  getQuarterHourOptions,
  timeDiffMinutes,
} from '@/lib/timeUtils';
import { useTranslations } from 'next-intl';

interface TimeSlotCardProps {
  slot:              TimeSlot;
  slotIndex:         number;  // 0-based
  slotNumber:        number;  // 1-based, for display
  assignedDays:      WeekDay[];
  canRemove:         boolean;
  /** Slot 1's origin address — used to detect "custom" route on slot 2+ */
  slot1Origin?:      string | null;
  /** Slot 1's destination address */
  slot1Destination?: string | null;
  onSetRoute:        () => void;
  onEditReturnRoute: () => void;
  onTripTypeChange:  (tripType: 'one_way' | 'round_trip') => void;
  onPickupChange:    (from: string, to: string) => void;
  onArrivalChange:   (from: string, to: string) => void;
  onReturnChange:    (from: string, to: string) => void;
  onReturnArrivalChange: (from: string, to: string) => void;
  onDayToggle:       (day: WeekDay) => void;
  onRemove:          () => void;
}

const ALL_DAYS: WeekDay[] = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ALL_OPTIONS = getQuarterHourOptions();
const SLOT_COLORS = [
  { accent: '#00C2A8', soft: '#EFF7F6', border: '#C8E8E4', deep: '#0B1E3D' },
  { accent: '#0B1E3D', soft: '#EEF1F5', border: '#CBD4E1', deep: '#0B1E3D' },
  { accent: '#F5A623', soft: '#FFF8EB', border: '#FCE2B3', deep: '#0B1E3D' },
  { accent: '#009E8A', soft: '#EAF8F6', border: '#BFE7E1', deep: '#0B1E3D' },
];

export default function TimeSlotCard({
  slot,
  slotIndex,
  slotNumber,
  assignedDays,
  canRemove,
  slot1Origin,
  slot1Destination,
  onSetRoute,
  onEditReturnRoute,
  onTripTypeChange,
  onPickupChange,
  onArrivalChange,
  onReturnChange,
  onReturnArrivalChange,
  onDayToggle,
  onRemove,
}: TimeSlotCardProps) {
  const tsl = useTranslations('time_slot');
  const tf = useTranslations('request_form');
  const tr = useTranslations('request_summary');
  const td = useTranslations('days');
  const to = useTranslations('outbound_route');
  const tc = useTranslations('common');
  const palette = SLOT_COLORS[(slotNumber - 1) % SLOT_COLORS.length];

  const dayLabel = (day: WeekDay) => td(day.toLowerCase() as 'sun');

  const routeLocked = !slot.route_set;
  const routeIsCustom =
    slotIndex === 0 ||
    slot.origin?.address !== slot1Origin ||
    slot.destination?.address !== slot1Destination;

  const pickupGap = timeDiffMinutes(slot.pickup_from, slot.pickup_to);

  // Route-aware arrival constraints:
  //   arrival_from ≥ pickup_to + routeDuration
  //   arrival_to   ≥ pickup_from + routeDuration + 30  (the hard minimum gap)
  const routeDuration = Math.round(slot.route?.duration_minutes ?? 0);
  const BUFFER_MIN    = 30;
  const minTotalGap   = routeDuration + BUFFER_MIN; // e.g. 45+30 = 75 min

  const validPickupToOptions = ALL_OPTIONS.filter((opt) => {
    const diff = timeDiffMinutes(slot.pickup_from, opt);
    return diff >= 15 && diff <= 120;
  });

  // Arrival options — arrival_from must start ≥ pickup_to + routeDuration
  const arrivalFromMin = addMinutes(slot.pickup_to, routeDuration > 0 ? routeDuration : BUFFER_MIN);
  const validArrivalFromOptions = ALL_OPTIONS.filter(opt => timeDiffMinutes(arrivalFromMin, opt) >= 0);
  const validArrivalToOptions = ALL_OPTIONS.filter(opt => {
    const dWindow      = timeDiffMinutes(slot.arrival_from || arrivalFromMin, opt);
    const dFromPickup  = timeDiffMinutes(slot.pickup_from, opt);
    return dWindow >= 15 && dWindow <= 120 && dFromPickup >= minTotalGap;
  });

  const returnFrom = slot.return_pickup_from ?? '17:00';
  const returnTo   = slot.return_pickup_to   ?? '17:30';
  const validReturnToOptions = ALL_OPTIONS.filter((opt) => {
    const diff = timeDiffMinutes(returnFrom, opt);
    return diff >= 15 && diff <= 120;
  });

  // Return arrival options
  const retArrivalFromMin = addMinutes(returnTo, 30);
  const validReturnArrivalFromOptions = ALL_OPTIONS.filter(opt => timeDiffMinutes(retArrivalFromMin, opt) >= 0);
  const validReturnArrivalToOptions = ALL_OPTIONS.filter(opt => {
    const d = timeDiffMinutes(slot.return_arrival_from || retArrivalFromMin, opt);
    return d >= 15 && d <= 120;
  });

  function handleFromChange(newFrom: string) {
    const newTo = addMinutes(newFrom, 15);
    onPickupChange(newFrom, newTo);

    // Auto-correct arrival times if they'd violate the new minimum gap
    const newArrivalFromMin = addMinutes(newTo, routeDuration > 0 ? routeDuration : BUFFER_MIN);
    const newArrivalToMin   = addMinutes(newFrom, minTotalGap);
    const curFrom = slot.arrival_from || newArrivalFromMin;
    const curTo   = slot.arrival_to   || addMinutes(curFrom, 15);
    if (timeDiffMinutes(newArrivalFromMin, curFrom) < 0 || timeDiffMinutes(newArrivalToMin, curTo) < 0) {
      const corrFrom = timeDiffMinutes(newArrivalFromMin, curFrom) < 0 ? newArrivalFromMin : curFrom;
      const corrTo   = timeDiffMinutes(addMinutes(corrFrom, 15), curTo) < 0 ? addMinutes(corrFrom, 15) : curTo;
      onArrivalChange(corrFrom, corrTo);
    }
  }

  function handleReturnFromChange(newFrom: string) {
    onReturnChange(newFrom, addMinutes(newFrom, 30));
  }

  const disabledSection = routeLocked ? 'opacity-40 pointer-events-none select-none' : '';

  return (
    <div
      className="bg-white border rounded-xl p-4 space-y-4"
      style={{ borderColor: palette.border, boxShadow: `0 0 0 1px ${palette.soft} inset` }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-semibold px-2.5 py-1 rounded-full"
          style={{ color: palette.deep, background: palette.soft }}
        >
          Time slot {slotNumber}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs hover:underline"
            style={{ color: palette.deep, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ✕ {tc('delete')}
          </button>
        )}
      </div>

      {/* ── Route section ── */}
      <div>
        <label className="block text-xs font-medium text-[#5A6A7A] mb-2">{tr('route')}</label>

        {slot.route_set && slot.origin && slot.destination ? (
          <div className="bg-[#EFF7F6] border border-[#C8E8E4] rounded-xl p-3">
            <div className="flex items-start gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#0B1E3D] mt-1 flex-shrink-0" />
              <span className="text-sm font-medium text-[#0B1E3D] leading-snug">{slot.origin.address}</span>
            </div>
            {slot.stops.map((stop, i) => (
              <div key={i} className="flex items-start gap-2 mb-1 pl-0.5">
                <div className="w-5 h-5 rounded-full bg-[#5A6A7A] flex items-center justify-center text-white flex-shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>{i + 1}</div>
                <span className="text-xs text-[#5A6A7A] leading-snug">{stop.address}</span>
              </div>
            ))}
            <div className="flex items-start gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#00C2A8] mt-1 flex-shrink-0" />
              <span className="text-sm font-medium text-[#0B1E3D] leading-snug">{slot.destination.address}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#5A6A7A]">
                {slot.route
                  ? `${slot.route.distance_km.toFixed(1)} km · ~${Math.round(slot.route.duration_minutes)} min`
                  : ''}
              </span>
              {/* Slot 1 is always editable. Slots 2+ are locked (they inherit slot 1's route). */}
              {slotIndex === 0 ? (
                <button
                  type="button"
                  onClick={onSetRoute}
                  className="text-xs font-medium hover:underline"
                  style={{ color: palette.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ✏ {to('edit_route')}
                </button>
              ) : (
                <span className="text-[10px] text-[#9AA0A6] italic">Locked · route from Time slot 1</span>
              )}
            </div>

            {/* "Same as slot 1" note */}
            {slotIndex > 0 && !routeIsCustom && (
              <p className="text-xs text-[#5A6A7A] mt-1.5 flex items-center gap-1">
                <span className="text-[#00C2A8]">↑</span>
                Same route as Time slot 1.{' '}
                <button
                  type="button"
                  onClick={onSetRoute}
                  className="text-[#00C2A8] underline"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  Change route
                </button>
              </p>
            )}
          </div>
        ) : slotIndex === 0 ? (
          <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-4 flex flex-col items-center gap-2 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <p className="text-sm text-[#5A6A7A]">No route selected</p>
            <button
              type="button"
              onClick={onSetRoute}
              className="mt-1 px-4 py-2 bg-[#0B1E3D] text-white text-sm font-semibold rounded-xl"
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {to('set_route')}
            </button>
          </div>
        ) : (
          <div className="border border-[#E2E8F0] rounded-xl p-4 text-center bg-[#F8F9FA]">
            <p className="text-sm text-[#9AA0A6]">Route will be set from Time slot 1</p>
          </div>
        )}
      </div>

      {/* ── Rest of card — disabled until route is set ── */}
      <div className={`space-y-4 ${disabledSection}`}>

        {/* Trip type */}
        <div>
          <label className="block text-xs font-medium text-[#5A6A7A] mb-2">{tf('trip_type_label')}</label>
          <div className="grid grid-cols-2 gap-2">
            {(['one_way', 'round_trip'] as const).map((tripType) => (
              <button
                key={tripType}
                type="button"
                disabled={routeLocked}
                onClick={() => onTripTypeChange(tripType)}
                className="h-10 rounded-lg border text-sm font-medium transition-colors"
                style={slot.trip_type === tripType
                  ? { borderColor: palette.accent, background: palette.soft, color: palette.deep }
                  : { borderColor: '#E2E8F0', background: '#fff', color: '#5A6A7A' }}
              >
                {tripType === 'one_way' ? tsl('one_way') : tsl('round_trip')}
              </button>
            ))}
          </div>
        </div>

        {/* Pickup time */}
        <div>
          <label className="block text-xs font-medium text-[#5A6A7A] mb-2">Pickup time</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_from')}</label>
              <select
                value={slot.pickup_from}
                disabled={routeLocked}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                style={{ outlineColor: palette.accent }}
              >
                {ALL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_to')}</label>
              <select
                value={slot.pickup_to}
                disabled={routeLocked}
                onChange={(e) => onPickupChange(slot.pickup_from, e.target.value)}
                className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                style={{ outlineColor: palette.accent }}
              >
                {validPickupToOptions.map((opt) => (
                  <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-[#9AA0A6] mt-1">
            {pickupGap} min window · Min 30 min, Max 2 hours
          </p>
        </div>

        {/* Estimated arrival — editable selects */}
        {!routeLocked && (
          <div>
            <label className="block text-xs font-medium text-[#5A6A7A] mb-2">Arrival time</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_from')}</label>
                <select
                  value={slot.arrival_from || arrivalFromMin}
                  onChange={(e) => onArrivalChange(e.target.value, addMinutes(e.target.value, 15))}
                  className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                  style={{ outlineColor: palette.accent }}
                >
                  {validArrivalFromOptions.map((opt) => (
                    <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_to')}</label>
                <select
                  value={slot.arrival_to || addMinutes(slot.arrival_from || arrivalFromMin, 30)}
                  onChange={(e) => onArrivalChange(slot.arrival_from || arrivalFromMin, e.target.value)}
                  className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                  style={{ outlineColor: palette.accent }}
                >
                  {validArrivalToOptions.map((opt) => (
                    <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-[#9AA0A6] mt-1">
              {routeDuration > 0
                ? tsl('route_buffer', { route: routeDuration, buffer: BUFFER_MIN, min: minTotalGap })
                : tsl('min_after_pickup')}
            </p>
          </div>
        )}

        {/* Round trip return section */}
        {slot.trip_type === 'round_trip' && !routeLocked && (
          <div className="pt-3 border-t border-[#F1F3F4] space-y-3">
            {/* Return route summary */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#0B1E3D]">↩ Return route</span>
                <button
                  type="button"
                  onClick={onEditReturnRoute}
                  className="text-xs font-medium hover:underline"
                  style={{ color: palette.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ✏ Edit
                </button>
              </div>
              {slot.return_origin && slot.return_destination ? (
                <div className="text-xs text-[#5A6A7A]">
                  <span className="text-[#0B1E3D] font-medium">{slot.return_origin.address}</span>
                  <span className="mx-1 text-[#00C2A8]">→</span>
                  <span className="text-[#0B1E3D] font-medium">{slot.return_destination.address}</span>
                  {slot.return_route && (
                    <span className="ml-1 text-[#9AA0A6]">· {slot.return_route.distance_km.toFixed(1)} km</span>
                  )}
                  {slot.return_customized && (
                    <span className="ml-1 text-[#00C2A8] text-[10px]">(edited)</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#9AA0A6] italic">Click &quot;Edit&quot; to confirm return route</p>
              )}
            </div>

            {/* Return pickup time */}
            <div>
              <label className="block text-xs font-medium text-[#5A6A7A] mb-2">Return pickup time</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_from')}</label>
                  <select
                    value={returnFrom}
                    onChange={(e) => handleReturnFromChange(e.target.value)}
                    className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                    style={{ outlineColor: palette.accent }}
                  >
                    {ALL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_to')}</label>
                  <select
                    value={returnTo}
                    onChange={(e) => onReturnChange(returnFrom, e.target.value)}
                    className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                    style={{ outlineColor: palette.accent }}
                  >
                    {validReturnToOptions.map((opt) => (
                      <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Return arrival — editable selects */}
            <div>
              <label className="block text-xs font-medium text-[#5A6A7A] mb-2">Return arrival time</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_from')}</label>
                  <select
                    value={slot.return_arrival_from || retArrivalFromMin}
                    onChange={(e) => onReturnArrivalChange(e.target.value, addMinutes(e.target.value, 30))}
                    className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                    style={{ outlineColor: palette.accent }}
                  >
                    {validReturnArrivalFromOptions.map((opt) => (
                      <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#9AA0A6] mb-1">{tf('arrival_to')}</label>
                  <select
                    value={slot.return_arrival_to || addMinutes(slot.return_arrival_from || retArrivalFromMin, 30)}
                    onChange={(e) => onReturnArrivalChange(slot.return_arrival_from || retArrivalFromMin, e.target.value)}
                    className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0B1E3D] bg-white focus:outline-none"
                    style={{ outlineColor: palette.accent }}
                  >
                    {validReturnArrivalToOptions.map((opt) => (
                      <option key={opt} value={opt}>{formatTime12h(opt)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-[#9AA0A6] mt-1">{tsl('min_after_pickup')}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Days — locked until route is set ── */}
      <div className={routeLocked ? 'opacity-40 pointer-events-none select-none' : ''}>
        <label className="block text-xs font-medium text-[#5A6A7A] mb-2">{tf('days_label')}</label>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_DAYS.map((day) => {
            const isSelected   = slot.days.includes(day);
            const takenByOther = !isSelected && assignedDays.includes(day);
            const isDisabled   = routeLocked || takenByOther;
            return (
              <button
                key={day}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onDayToggle(day)}
                className={`w-10 h-10 rounded-full text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'text-white'
                    : isDisabled
                      ? 'bg-[#F1F3F4] border-[#E2E8F0] text-[#C5CDD6] cursor-not-allowed'
                      : 'bg-white border-[#E2E8F0] text-[#5A6A7A]'
                }`}
                style={isSelected
                  ? { background: palette.accent, borderColor: palette.accent }
                  : !isDisabled
                    ? { borderColor: palette.border, color: palette.deep }
                    : undefined}
              >
                {dayLabel(day)}
              </button>
            );
          })}
        </div>
        {routeLocked ? (
          <p className="text-xs text-[#9AA0A6] mt-1.5">Set a route above to choose days for this slot.</p>
        ) : slot.days.length === 0 && (
          <p className="text-xs text-[#E74C3C] mt-1.5">Select at least one day for this slot</p>
        )}
      </div>
    </div>
  );
}
