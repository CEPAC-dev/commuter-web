'use client';

import { useMemo } from 'react';
import type { TimeSlot, WeekDay, GeoLocation, PrivateSeatPosition } from '@/types/shared';
import {
  addMinutes,
  formatTime12h,
  getHalfHourOptions,
  timeDiffMinutes,
  ALL_DAYS_SUN_FIRST,
} from '@/lib/timeUtils';
import SeatLayoutPicker, { type SeatPassenger } from './SeatLayoutPicker';

const ALL_OPTIONS = getHalfHourOptions();

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

  // ── Pickup-time helpers (window 30..120 min) ────────────────────────────────
  const pickupGap = timeDiffMinutes(slot.pickup_from, slot.pickup_to);
  const validPickupToOptions = useMemo(
    () => ALL_OPTIONS.filter(opt => {
      const d = timeDiffMinutes(slot.pickup_from, opt);
      return d >= 30 && d <= 120;
    }),
    [slot.pickup_from],
  );

  // ── Arrival options ─────────────────────────────────────────────────────────
  // arrival_from must start AFTER pickup_to (≥ +30 min boundary aligned to half hour).
  const arrivalFromMin = addMinutes(slot.pickup_to, 30);
  const validArrivalFromOptions = useMemo(
    () => ALL_OPTIONS.filter(opt => timeDiffMinutes(arrivalFromMin, opt) >= 0),
    [arrivalFromMin],
  );
  const validArrivalToOptions = useMemo(
    () => ALL_OPTIONS.filter(opt => {
      const d = timeDiffMinutes(slot.arrival_from || arrivalFromMin, opt);
      return d >= 30 && d <= 120;
    }),
    [slot.arrival_from, arrivalFromMin],
  );

  // Days for slot includes current selection (so user can deselect).

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#0B1E3D]">
          Time slot {slotNumber}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-[#5A6A7A] hover:underline"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ✕ Remove
          </button>
        )}
      </div>

      {/* ── Pickup time ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">Pickup time</label>
        <div className="grid grid-cols-2 gap-3">
          <SelectBox
            label="From"
            value={slot.pickup_from}
            options={ALL_OPTIONS}
            onChange={(v) => onPickupTimeChange(v, addMinutes(v, 30))}
          />
          <SelectBox
            label="To"
            value={slot.pickup_to}
            options={validPickupToOptions}
            onChange={(v) => onPickupTimeChange(slot.pickup_from, v)}
          />
        </div>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {pickupGap} min window · Min 30 min, Max 2 hours
        </p>
      </div>

      {/* ── Arrival time ────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">Arrival time</label>
        <div className="grid grid-cols-2 gap-3">
          <SelectBox
            label="From"
            value={slot.arrival_from || arrivalFromMin}
            options={validArrivalFromOptions}
            onChange={(v) => onArrivalChange(v, addMinutes(v, 30))}
          />
          <SelectBox
            label="To"
            value={slot.arrival_to || addMinutes(slot.arrival_from || arrivalFromMin, 30)}
            options={validArrivalToOptions}
            onChange={(v) => onArrivalChange(slot.arrival_from || arrivalFromMin, v)}
          />
        </div>
        <p className="text-xs text-[#9AA0A6] mt-1">
          At least 1 h after pickup ends · 30 min window, max 2 h
        </p>
      </div>

      {/* ── Seat layout ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">Seat layout</label>
        <SeatLayoutPicker
          passengers={passengers}
          assignments={slot.seat_assignments ?? {}}
          onChange={onSeatAssignmentsChange}
        />
      </div>

      {/* ── Days ─────────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">Days for this slot</label>
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
                {day}
              </button>
            );
          })}
        </div>
        {slot.days.length === 0 && (
          <p className="text-xs text-[#E74C3C] mt-1.5">Select at least one day for this slot</p>
        )}
      </div>

      {/* ── Per-day stops ───────────────────────────────────────────────────── */}
      {slot.days.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">
            Stops per day <span className="text-[#9AA0A6] font-normal">(optional · up to 2 each)</span>
          </label>
          <div className="space-y-2">
            {[...slot.days]
              .sort((a, b) => ALL_DAYS_SUN_FIRST.indexOf(a) - ALL_DAYS_SUN_FIRST.indexOf(b))
              .map(day => {
                const dayStops = (slot.day_stops ?? {})[day] ?? [];
                return (
                  <div key={day} className="rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#0B1E3D]">{day}</span>
                      {dayStops.length < 2 && (
                        <button
                          type="button"
                          onClick={() => onAddDayStop(day, dayStops.length)}
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#00C2A8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          + Add stop
                        </button>
                      )}
                    </div>
                    {dayStops.length === 0 ? (
                      <p className="text-xs text-[#9AA0A6] italic">No stops for this day.</p>
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
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => onClearDayStop(day, i)}
                                className="text-[11px] text-[#E74C3C] hover:underline"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                Remove
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
            Return trip
          </p>

          {/* Return route summary */}
          <div className="border border-[#C8E8E4] rounded-xl bg-[#EFF7F6] p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[#00C2A8] text-base">⇄</span>
              <span className="text-sm font-semibold text-[#0B1E3D]">Return route</span>
            </div>
            <p className="text-xs text-[#5A6A7A]">
              From and destination are reversed from your outbound trip. Set the return pickup meeting point only.
            </p>

            <ReturnRow
              index={1}
              title="From"
              hint="Auto — outbound destination"
              value={outboundDestination?.address ?? '—'}
              action={null}
            />
            <ReturnRow
              index={2}
              title="Destination"
              hint="Auto — outbound origin"
              value={outboundOrigin?.address ?? '—'}
              action={null}
            />
            <ReturnRow
              index={3}
              title="Pickup point"
              hint="Meeting point for return pickup"
              value={slot.return_pickup_point?.address ?? null}
              action={
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={onSetReturnPickupPoint}
                    className="px-3 py-1.5 rounded-lg bg-[#0B1E3D] text-white text-xs font-semibold"
                    style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {slot.return_pickup_point ? 'Edit' : 'Set'}
                  </button>
                  {slot.return_pickup_point && (
                    <button
                      type="button"
                      onClick={onClearReturnPickupPoint}
                      className="text-[11px] text-[#E74C3C] hover:underline"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              }
            />
          </div>

          {/* Return pickup time */}
          <ReturnTimeBlock
            title="Pickup time"
            from={slot.return_pickup_from ?? '17:00'}
            to={slot.return_pickup_to ?? '17:30'}
            onChange={onReturnPickupTimeChange}
          />

          {/* Return arrival time */}
          <ReturnArrivalBlock
            pickupTo={slot.return_pickup_to ?? '17:30'}
            from={slot.return_arrival_from ?? ''}
            to={slot.return_arrival_to ?? ''}
            onChange={onReturnArrivalChange}
          />
        </div>
      )}
    </div>
  );
}

// ── Local helpers ───────────────────────────────────────────────────────────

function SelectBox({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-[#9AA0A6] mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 border border-[#E2E8F0] rounded-lg pl-3 pr-9 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:border-[#00C2A8] appearance-none"
        >
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
  index, title, hint, value, action,
}: { index: number; title: string; hint: string; value: string | null; action: React.ReactNode }) {
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
          : <p className="text-[11px] italic text-[#9AA0A6]">Not set</p>}
      </div>
      {action}
    </div>
  );
}

function ReturnTimeBlock({
  title, from, to, onChange,
}: { title: string; from: string; to: string; onChange: (from: string, to: string) => void }) {
  const validTo = ALL_OPTIONS.filter((opt) => {
    const d = timeDiffMinutes(from, opt);
    return d >= 30 && d <= 120;
  });
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">{title}</label>
      <div className="grid grid-cols-2 gap-3">
        <SelectBox label="From" value={from} options={ALL_OPTIONS} onChange={(v) => onChange(v, addMinutes(v, 30))} />
        <SelectBox label="To" value={to} options={validTo} onChange={(v) => onChange(from, v)} />
      </div>
    </div>
  );
}

function ReturnArrivalBlock({
  pickupTo, from, to, onChange,
}: { pickupTo: string; from: string; to: string; onChange: (from: string, to: string) => void }) {
  const min = addMinutes(pickupTo, 30);
  const fromOptions = ALL_OPTIONS.filter((opt) => timeDiffMinutes(min, opt) >= 0);
  const fromVal = from || min;
  const validTo = ALL_OPTIONS.filter((opt) => {
    const d = timeDiffMinutes(fromVal, opt);
    return d >= 30 && d <= 120;
  });
  const toVal = to || addMinutes(fromVal, 30);
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0B1E3D] mb-2">Arrival time</label>
      <div className="grid grid-cols-2 gap-3">
        <SelectBox label="From" value={fromVal} options={fromOptions} onChange={(v) => onChange(v, addMinutes(v, 30))} />
        <SelectBox label="To" value={toVal} options={validTo} onChange={(v) => onChange(fromVal, v)} />
      </div>
      <p className="text-xs text-[#9AA0A6] mt-1">
        At least 1 h after pickup ends · 30 min window, max 2 h
      </p>
    </div>
  );
}
