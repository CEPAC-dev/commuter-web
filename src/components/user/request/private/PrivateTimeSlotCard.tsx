'use client';

import { useMemo } from 'react';
import type { TimeSlot, WeekDay, GeoLocation, PrivateSeatPosition } from '@/types/shared';
import {
  addMinutes,
  formatTime12h,
  getQuarterHourOptions,
  timeDiffMinutes,
  ALL_DAYS_SUN_FIRST,
} from '@/lib/timeUtils';
import SeatLayoutPicker, { type SeatPassenger } from './SeatLayoutPicker';
import { useTranslations } from 'next-intl';

const ALL_OPTIONS = getQuarterHourOptions();

interface Props {
  slot:           TimeSlot;
  slotNumber:     number;
  canRemove:      boolean;
  assignedDays:   WeekDay[];
  /** Trip type (locked to wizard-global for private). */
  tripType:       'one_way' | 'round_trip';

  /** Outbound destination/origin for the "auto" labels on return route. */
  outboundOrigin?:      GeoLocation | null;
  outboundDestination?: GeoLocation | null;

  passengers: SeatPassenger[];

  onPickupTimeChange: (from: string, to: string) => void;
  onArrivalChange:    (from: string, to: string) => void;
  onSeatAssignmentsChange: (next: Record<string, PrivateSeatPosition>) => void;
  onDayToggle:        (day: WeekDay) => void;
  /** Open the point-picker for a specific day's stop (index = position 0 or 1). */
  onAddDayStop:    (day: WeekDay, index: number) => void;
  onClearDayStop:  (day: WeekDay, index: number) => void;

  onSetReturnPickupPoint:    () => void;
  onClearReturnPickupPoint:  () => void;
  onReturnPickupTimeChange:  (from: string, to: string) => void;
  onReturnArrivalChange:     (from: string, to: string) => void;

  onRemove: () => void;
}

export default function PrivateTimeSlotCard({
  slot, slotNumber, canRemove, assignedDays, tripType,
  outboundOrigin, outboundDestination,
  passengers,
  onPickupTimeChange, onArrivalChange, onSeatAssignmentsChange,
  onDayToggle, onAddDayStop, onClearDayStop,
  onSetReturnPickupPoint, onClearReturnPickupPoint,
  onReturnPickupTimeChange, onReturnArrivalChange,
  onRemove,
}: Props) {
  const tsl = useTranslations('time_slot');
  const tf = useTranslations('request_form');
  const tc = useTranslations('common');
  const td = useTranslations('days');
  const to = useTranslations('outbound_route');
  const dayLabel = (day: WeekDay) => td(day.toLowerCase() as 'sun');

  // ── Pickup-time helpers (window 30..120 min) ────────────────────────────────
  const pickupGap = timeDiffMinutes(slot.pickup_from, slot.pickup_to);
  const validPickupToOptions = useMemo(
    () => ALL_OPTIONS.filter(opt => {
      const d = timeDiffMinutes(slot.pickup_from, opt);
      return d >= 15 && d <= 120;
    }),
    [slot.pickup_from],
  );

  // ── Arrival options — route-aware ───────────────────────────────────────────
  const routeDuration = Math.round(slot.route?.duration_minutes ?? 0);
  const returnRouteDuration = Math.round(slot.return_route?.duration_minutes ?? 0);
  const BUFFER_MIN    = 30;
  const minTotalGap   = routeDuration + BUFFER_MIN;
  const arrivalFromMin = addMinutes(slot.pickup_to, routeDuration > 0 ? routeDuration : BUFFER_MIN);
  const validArrivalFromOptions = useMemo(
    () => ALL_OPTIONS.filter(opt => timeDiffMinutes(arrivalFromMin, opt) >= 0),
    [arrivalFromMin],
  );
  const validArrivalToOptions = useMemo(
    () => ALL_OPTIONS.filter(opt => {
      const dWindow     = timeDiffMinutes(slot.arrival_from || arrivalFromMin, opt);
      const dFromPickup = timeDiffMinutes(slot.pickup_from, opt);
      return dWindow >= 15 && dWindow <= 120 && dFromPickup >= minTotalGap;
    }),
    [slot.arrival_from, arrivalFromMin, slot.pickup_from, minTotalGap],
  );

  // Days for slot includes current selection (so user can deselect).

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#0B1E3D]">
          {tsl('label', { n: slotNumber })}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-[#5A6A7A] hover:underline"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ✕ {tc('delete')}
          </button>
        )}
      </div>

      {/* ── Pickup time ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">{tsl('pickup_time')}</label>
        <div className="grid grid-cols-2 gap-3">
          <SelectBox
            label={tf('arrival_from')}
            value={slot.pickup_from}
            options={ALL_OPTIONS}
            pickTimePlaceholder={tsl('pick_time')}
            onChange={(v) => onPickupTimeChange(v, addMinutes(v, 15))}
          />
          <SelectBox
            label={tf('arrival_to')}
            value={slot.pickup_to}
            options={validPickupToOptions}
            pickTimePlaceholder={tsl('pick_time')}
            onChange={(v) => onPickupTimeChange(slot.pickup_from, v)}
          />
        </div>
        {pickupGap !== null && (
          <p className="text-xs text-[#9AA0A6] mt-1">
            {tsl('pickup_window_note', { gap: pickupGap })}
          </p>
        )}
      </div>

      {/* ── Arrival time ────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">{tsl('arrival_time')}</label>
        <div className="grid grid-cols-2 gap-3">
          <SelectBox
            label={tf('arrival_from')}
            value={slot.arrival_from}
            options={validArrivalFromOptions}
            pickTimePlaceholder={tsl('pick_time')}
          onChange={(v) => onArrivalChange(v, slot.arrival_to || addMinutes(v, 15))}
          />
          <SelectBox
            label={tf('arrival_to')}
            value={slot.arrival_to}
            options={validArrivalToOptions}
            pickTimePlaceholder={tsl('pick_time')}
            onChange={(v) => onArrivalChange(slot.arrival_from, v)}
          />
        </div>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {routeDuration > 0
            ? tsl('route_buffer', { route: routeDuration, buffer: BUFFER_MIN, min: minTotalGap })
            : tsl('min_after_pickup')}
        </p>
      </div>

      {/* ── Seat layout ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">{tsl('seat_layout_label')}</label>
        <SeatLayoutPicker
          passengers={passengers}
          assignments={slot.seat_assignments ?? {}}
          onChange={onSeatAssignmentsChange}
        />
      </div>

      {/* ── Days ─────────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">{tf('days_label')}</label>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_DAYS_SUN_FIRST.map((day) => {
            const isSelected = slot.days.includes(day);
            const takenByOther = !isSelected && assignedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                disabled={takenByOther}
                onClick={() => !takenByOther && onDayToggle(day)}
                className={`w-10 h-10 rounded-full text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-[#00C2A8] border-[#00C2A8] text-white'
                    : takenByOther
                      ? 'bg-[#F1F3F4] border-[#E2E8F0] text-[#C5CDD6] cursor-not-allowed'
                      : 'bg-white border-[#E2E8F0] text-[#5A6A7A] hover:border-[#C8E8E4]'
                }`}
              >
                {dayLabel(day)}
              </button>
            );
          })}
        </div>
        {slot.days.length === 0 && (
          <p className="text-xs text-[#E74C3C] mt-1.5">{tf('days_label')}</p>
        )}
      </div>

      {/* ── Per-day stops ───────────────────────────────────────────────────── */}
      {slot.days.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">
            {tsl('stops_per_day')} <span className="text-[#9AA0A6] font-normal">{tsl('stops_optional')}</span>
          </label>
          <div className="space-y-2">
            {[...slot.days]
              .sort((a, b) => ALL_DAYS_SUN_FIRST.indexOf(a) - ALL_DAYS_SUN_FIRST.indexOf(b))
              .map(day => {
                const dayStops = (slot.day_stops ?? {})[day] ?? [];
                return (
                  <div key={day} className="rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#0B1E3D]">{dayLabel(day)}</span>
                      {dayStops.length < 2 && (
                        <button
                          type="button"
                          onClick={() => onAddDayStop(day, dayStops.length)}
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#00C2A8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          {tsl('add_stop')}
                        </button>
                      )}
                    </div>
                    {dayStops.length === 0 ? (
                      <p className="text-xs text-[#9AA0A6] italic">{tsl('no_stops_day')}</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {dayStops.map((s, i) => (
                          <li
                            key={`${i}-${s.lat}`}
                            className="flex items-start justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2"
                          >
                            <span className="text-xs text-[#0B1E3D] leading-snug">
                              <span className="font-semibold mr-1">{i + 1}.</span>{s.address}
                            </span>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => onAddDayStop(day, i)}
                                className="text-[11px] text-[#00C2A8] hover:underline"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                {tc('edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => onClearDayStop(day, i)}
                                className="text-[11px] text-[#E74C3C] hover:underline"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                {tc('remove')}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Return trip — only when global trip type is round_trip ──────────── */}
      {tripType === 'round_trip' && (
        <div className="pt-3 border-t border-[#F1F3F4] space-y-4">
          <p className="text-center text-xs font-semibold text-[#00C2A8] uppercase tracking-wide">
            {tsl('return_trip')}
          </p>

          {/* Return route summary */}
          <div className="border border-[#C8E8E4] rounded-xl bg-[#EFF7F6] p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[#00C2A8] text-base">⇄</span>
              <span className="text-sm font-semibold text-[#0B1E3D]">{tsl('return_route')}</span>
            </div>
            <p className="text-xs text-[#5A6A7A]">
              {tsl('return_route_desc')}
            </p>

            <ReturnRow
              index={1}
              title={to('from')}
              hint={tsl('auto_outbound_destination')}
              value={outboundDestination?.address ?? '—'}
              action={null}
              notSetLabel={to('not_set')}
            />
            <ReturnRow
              index={2}
              title={to('destination')}
              hint={tsl('auto_outbound_origin')}
              value={outboundOrigin?.address ?? '—'}
              action={null}
              notSetLabel={to('not_set')}
            />
            <ReturnRow
              index={3}
              title={to('pickup')}
              hint={tsl('return_pickup_hint')}
              value={slot.return_pickup_point?.address ?? null}
              notSetLabel={to('not_set')}
              action={
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={onSetReturnPickupPoint}
                    className="px-3 py-1.5 rounded-lg bg-[#0B1E3D] text-white text-xs font-semibold"
                    style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {slot.return_pickup_point ? tc('edit') : tc('set')}
                  </button>
                  {slot.return_pickup_point && (
                    <button
                      type="button"
                      onClick={onClearReturnPickupPoint}
                      className="text-[11px] text-[#E74C3C] hover:underline"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {tc('remove')}
                    </button>
                  )}
                </div>
              }
            />
          </div>

          {/* Return pickup time */}
          <ReturnTimeBlock
            title={tsl('pickup_time')}
            from={slot.return_pickup_from ?? ''}
            to={slot.return_pickup_to ?? ''}
            fromLabel={tf('arrival_from')}
            toLabel={tf('arrival_to')}
            pickTimePlaceholder={tsl('pick_time')}
            onChange={onReturnPickupTimeChange}
          />

          {/* Return arrival time */}
          <ReturnArrivalBlock
            pickupTo={slot.return_pickup_to ?? ''}
            returnRouteDuration={returnRouteDuration}
            from={slot.return_arrival_from ?? ''}
            to={slot.return_arrival_to ?? ''}
            onChange={onReturnArrivalChange}
            arrivalLabel={tsl('arrival_time')}
            fromLabel={tf('arrival_from')}
            toLabel={tf('arrival_to')}
            note={tsl('return_arrival_note')}
            pickTimePlaceholder={tsl('pick_time')}
          />
        </div>
      )}
    </div>
  );
}

// ── Local helpers ───────────────────────────────────────────────────────────

function SelectBox({
  label, value, options, onChange, pickTimePlaceholder,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void; pickTimePlaceholder: string }) {
  return (
    <div>
      <label className="block text-xs text-[#9AA0A6] mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 border border-[#E2E8F0] rounded-lg pl-3 pr-9 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:border-[#00C2A8] appearance-none"
        >
          <option value="" disabled hidden>{pickTimePlaceholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{formatTime12h(o)}</option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00C2A8] pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function ReturnRow({
  index, title, hint, value, action, notSetLabel,
}: { index: number; title: string; hint: string; value: string | null; action: React.ReactNode; notSetLabel: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-white border border-[#E2E8F0] p-2.5">
      <span className="w-6 h-6 rounded-full bg-[#EFF7F6] text-[#00C2A8] flex items-center justify-center text-[11px] font-bold flex-shrink-0">
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#0B1E3D]">{title}</p>
        <p className="text-[11px] text-[#8A9AB0] mb-0.5">{hint}</p>
        {value
          ? <p className="text-xs text-[#0B1E3D] leading-snug flex items-start gap-1.5">
              <span className="text-[#00C2A8] mt-0.5">📍</span>
              <span>{value}</span>
            </p>
          : <p className="text-[11px] italic text-[#9AA0A6]">{notSetLabel}</p>}
      </div>
      {action}
    </div>
  );
}

function ReturnTimeBlock({
  title, from, to, onChange, fromLabel, toLabel, pickTimePlaceholder,
}: { title: string; from: string; to: string; onChange: (from: string, to: string) => void; fromLabel: string; toLabel: string; pickTimePlaceholder: string }) {
  const validTo = from ? ALL_OPTIONS.filter((opt) => {
    const d = timeDiffMinutes(from, opt);
    return d >= 15 && d <= 120;
  }) : [];
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">{title}</label>
      <div className="grid grid-cols-2 gap-3">
        <SelectBox label={fromLabel} value={from} options={ALL_OPTIONS} pickTimePlaceholder={pickTimePlaceholder} onChange={(v) => onChange(v, addMinutes(v, 15))} />
        <SelectBox label={toLabel} value={to} options={validTo} pickTimePlaceholder={pickTimePlaceholder} onChange={(v) => onChange(from, v)} />
      </div>
    </div>
  );
}

function ReturnArrivalBlock({
  pickupTo, returnRouteDuration, from, to, onChange, arrivalLabel, fromLabel, toLabel, note, pickTimePlaceholder,
}: {
  pickupTo: string;
  returnRouteDuration: number;
  from: string; to: string;
  onChange: (from: string, to: string) => void;
  arrivalLabel: string; fromLabel: string; toLabel: string; note: string; pickTimePlaceholder: string;
}) {
  const BUFFER_MIN = 30;
  const minBufferTime = returnRouteDuration > 0 ? returnRouteDuration : BUFFER_MIN;
  const fromOptions = pickupTo
    ? ALL_OPTIONS.filter((opt) => timeDiffMinutes(addMinutes(pickupTo, minBufferTime), opt) >= 0)
    : ALL_OPTIONS;
  const validTo = from ? ALL_OPTIONS.filter((opt) => {
    const d = timeDiffMinutes(from, opt);
    return d >= 15 && d <= 120;
  }) : [];
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">{arrivalLabel}</label>
      <div className="grid grid-cols-2 gap-3">
        <SelectBox label={fromLabel} value={from} options={fromOptions} pickTimePlaceholder={pickTimePlaceholder} onChange={(v) => onChange(v, addMinutes(v, 15))} />
        <SelectBox label={toLabel} value={to} options={validTo} pickTimePlaceholder={pickTimePlaceholder} onChange={(v) => onChange(from, v)} />
      </div>
      <p className="text-xs text-[#9AA0A6] mt-1">
        {note}
      </p>
    </div>
  );
}
