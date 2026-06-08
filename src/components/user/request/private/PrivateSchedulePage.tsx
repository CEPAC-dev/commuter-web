'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import Section from '@/components/shared/Section';
import { useWizard } from '@/lib/RequestWizardContext';
import type { TimeSlot, WeekDay, GeoLocation, PrivateSeatPosition } from '@/types/shared';
import {
  addMinutes,
  WEEKDAY_INDEX,
} from '@/lib/timeUtils';
import { getNextAvailableCycleStart, formatCycleStartDate, cycleDateForDayOfWeek, toApiDate } from '@/lib/cycleUtils';
import { calculatePriceRange } from '@/lib/pricing';
import { getPassengers, type ApiPassenger } from '@/lib/api/passengers';
import { getName } from '@/lib/auth';
import { createCourse, type WeeklyTripSchedule, type CourseStop } from '@/lib/api/courses';
import { ApiError } from '@/lib/api/client';

import PassengerPicker from './PassengerPicker';
import OutboundRouteCard from './OutboundRouteCard';
import PrivateTimeSlotCard from './PrivateTimeSlotCard';
import PointPicker from './PointPicker';
import StopMapPicker from './StopMapPicker';
import ReviewModal from './ReviewModal';
import RoutePicker, { type RoutePickerResult } from '@/components/user/request/RoutePicker';
import { useTranslations } from 'next-intl';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeSlot(): TimeSlot {
  return {
    id:                 crypto.randomUUID(),
    trip_type:          'one_way',
    origin:             null,
    stops:              [],
    day_stops:          {},
    destination:        null,
    route:              null,
    route_set:          false,
    return_origin:      null,
    return_destination: null,
    return_route:       null,
    return_customized:  false,
    pickup_from:        '',
    pickup_to:          '',
    arrival_from:       '',
    arrival_to:         '',
    days:               [],
    seat_assignments:   {},
    return_pickup_point: null,
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PrivateSchedulePage() {
  const tps = useTranslations('private_schedule');
  const trs = useTranslations('request_schedule');
  const tf = useTranslations('request_form');
  const tsb = useTranslations('schedule_builder');
  const tsl = useTranslations('time_slot');
  const trf = useTranslations('ride_form');
  const router = useRouter();
  const wizard = useWizard();

  // ── Passengers (related) ────────────────────────────────────────────────
  const [passengers, setPassengers]       = useState<ApiPassenger[]>([]);
  const [passengersLoading, setLoadingPx] = useState(false);
  useEffect(() => {
    setLoadingPx(true);
    getPassengers().then(setPassengers).catch(() => {}).finally(() => setLoadingPx(false));
  }, []);

  const myName = getName() ?? 'Me';

  // Keep passenger_count in sync
  useEffect(() => {
    const total = (wizard.include_self ? 1 : 0) + wizard.selected_passenger_ids.length;
    wizard.setPassengerCount(total > 0 ? total : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.include_self, wizard.selected_passenger_ids]);

  // ── Slots (locally mirrored in wizard) ──────────────────────────────────
  const [slots, setSlots] = useState<TimeSlot[]>(() => {
    if (wizard.time_slots.length > 0) return wizard.time_slots;
    return [makeSlot()];
  });

  function persistSlots(next: TimeSlot[]) {
    setSlots(next);
    wizard.setTimeSlots(next);
  }

  // ── Cycle start ─────────────────────────────────────────────────────────
  const cycleStart      = getNextAvailableCycleStart();
  const cycleStartLabel = formatCycleStartDate(cycleStart, 'en');

  // ── Modals ──────────────────────────────────────────────────────────────
  const [pointPicker, setPointPicker] = useState<
    | { kind: 'outbound-pickup' }
    | { kind: 'return-pickup'; slotId: string }
    | { kind: 'stop'; slotId: string; day: WeekDay; index: number }
    | null
  >(null);

  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // ── Derived passenger list for seat layout ──────────────────────────────
  const seatPassengers = useMemo(() => {
    const list: { key: string; name: string }[] = [];
    if (wizard.include_self) list.push({ key: 'me', name: `Me (${myName})` });
    for (const id of wizard.selected_passenger_ids) {
      const p = passengers.find(p => p.id === id);
      if (p) list.push({ key: String(id), name: p.name });
    }
    return list;
  }, [wizard.include_self, wizard.selected_passenger_ids, passengers, myName]);

  // ── Outbound route handlers ─────────────────────────────────────────────
  function handleRouteConfirm(r: RoutePickerResult) {
    wizard.setPrivateOutbound({
      private_outbound_origin:      r.origin,
      private_outbound_destination: r.destination,
      private_outbound_route:       r.route,
      private_outbound_stop:        r.stops[0] ?? null,
    });
    setShowRoutePicker(false);
  }

  function handleOutboundPickupConfirm(loc: GeoLocation) {
    wizard.setPrivateOutbound({ private_outbound_pickup_point: loc });
    setPointPicker(null);
  }

  // ── Per-slot mutations ──────────────────────────────────────────────────
  function patchSlot(slotId: string, patch: Partial<TimeSlot>) {
    persistSlots(slots.map(s => s.id === slotId ? { ...s, ...patch } : s));
  }

  function handlePickupChange(slotId: string, from: string, to: string) {
    persistSlots(slots.map(s => {
      if (s.id !== slotId) return s;
      // Only adjust arrival if the user has already explicitly set it
      if (!s.arrival_from) return { ...s, pickup_from: from, pickup_to: to };
      const minArrivalFrom = addMinutes(to, 30);
      const arrival_from = s.arrival_from >= minArrivalFrom ? s.arrival_from : minArrivalFrom;
      const arrival_to = s.arrival_to && s.arrival_to >= addMinutes(arrival_from, 30) ? s.arrival_to : addMinutes(arrival_from, 30);
      return { ...s, pickup_from: from, pickup_to: to, arrival_from, arrival_to };
    }));
  }

  function handleArrivalChange(slotId: string, from: string, to: string) {
    patchSlot(slotId, { arrival_from: from, arrival_to: to });
  }

  function handleReturnPickupChange(slotId: string, from: string, to: string) {
    persistSlots(slots.map(s => {
      if (s.id !== slotId) return s;
      // Only adjust return arrival if the user has already explicitly set it
      if (!s.return_arrival_from) return { ...s, return_pickup_from: from, return_pickup_to: to };
      const minArr = addMinutes(to, 30);
      const ra_from = s.return_arrival_from >= minArr ? s.return_arrival_from : minArr;
      const ra_to   = s.return_arrival_to && s.return_arrival_to >= addMinutes(ra_from, 30) ? s.return_arrival_to : addMinutes(ra_from, 30);
      return { ...s, return_pickup_from: from, return_pickup_to: to, return_arrival_from: ra_from, return_arrival_to: ra_to };
    }));
  }

  function handleReturnArrivalChange(slotId: string, from: string, to: string) {
    patchSlot(slotId, { return_arrival_from: from, return_arrival_to: to });
  }

  function handleDayToggle(slotId: string, day: WeekDay) {
    persistSlots(slots.map(s => {
      if (s.id !== slotId) return s;
      const has = s.days.includes(day);
      return { ...s, days: has ? s.days.filter(d => d !== day) : [...s.days, day] };
    }));
  }

  function handleSeatAssign(slotId: string, next: Record<string, PrivateSeatPosition>) {
    patchSlot(slotId, { seat_assignments: next });
  }

  function handleAddDayStop(slotId: string, day: WeekDay, loc: GeoLocation, index: number) {
    persistSlots(slots.map(s => {
      if (s.id !== slotId) return s;
      const existing = [...(s.day_stops?.[day] ?? [])];
      existing[index] = loc;
      return { ...s, day_stops: { ...s.day_stops, [day]: existing.slice(0, 2) } };
    }));
  }

  function handleClearDayStop(slotId: string, day: WeekDay, index: number) {
    persistSlots(slots.map(s => {
      if (s.id !== slotId) return s;
      const remaining = (s.day_stops?.[day] ?? []).filter((_, i) => i !== index);
      return { ...s, day_stops: { ...s.day_stops, [day]: remaining } };
    }));
  }

  function handleAddSlot() {
    const last = slots[slots.length - 1];
    if (last && last.days.length === 0) return;
    if (slots.length >= 7) return;
    persistSlots([...slots, makeSlot()]);
  }

  function handleRemoveSlot(slotId: string) {
    persistSlots(slots.filter(s => s.id !== slotId));
  }

  // ── Trip type (global) ──────────────────────────────────────────────────
  const tripType = wizard.private_trip_type;
  function setTripType(t: 'one_way' | 'round_trip') {
    wizard.setPrivateTripType(t);
  }

  // ── Validation ──────────────────────────────────────────────────────────
  const allDays = Array.from(new Set(slots.flatMap(s => s.days)));
  const lastSlotNoDay = !!slots[slots.length - 1] && slots[slots.length - 1].days.length === 0;
  const routeReady = !!wizard.private_outbound_origin && !!wizard.private_outbound_destination;

  function validate(): string[] {
    const errors: string[] = [];
    if (!routeReady) errors.push(trf('set_route_first'));
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (s.days.length === 0) errors.push(`Select days for Time slot ${i + 1}`);
      if (!s.pickup_from || !s.pickup_to) errors.push(`Set pickup time for Time slot ${i + 1}`);
      if (!s.arrival_from || !s.arrival_to) errors.push(`Set arrival time for Time slot ${i + 1}`);
      if (tripType === 'round_trip' && (!s.return_pickup_from || !s.return_arrival_from)) {
        errors.push(`Set return times for Time slot ${i + 1}`);
      }
    }
    return errors;
  }

  // ── Price estimate ──────────────────────────────────────────────────────
  const distanceKm = wizard.private_outbound_route?.distance_km ?? 20;
  const { max: priceMax } = calculatePriceRange({
    distanceKm,
    ride_type:   'private',
    seatCostEGP: 0,
    walkMinutes: 0,
    tripType,
    days:        Math.max(1, allDays.length),
  });

  // ── Submit ──────────────────────────────────────────────────────────────
  async function buildAndSubmit(submittedMax: number) {
    const errs = validate();
    if (errs.length > 0) { setError(errs.join('\n')); return; }
    setError(null);
    setSubmitting(true);

    const origin      = wizard.private_outbound_origin!;
    const destination = wizard.private_outbound_destination!;
    const pickupPoint = wizard.private_outbound_pickup_point;
    const globalStop  = wizard.private_outbound_stop;
    const route       = wizard.private_outbound_route;

    const distance = route?.distance_km ?? 0;
    const duration = Math.round(route?.duration_minutes ?? 0);

    const schedules: WeeklyTripSchedule[] = [];

    for (const slot of slots) {
      const participants = Object.entries(slot.seat_assignments ?? {})
        .filter(([k]) => k !== 'me') // 'me' is the account holder; assume the API derives it from token
        .map(([k, seat]) => ({
          type: 'passenger' as const,
          passenger_id: Number(k),
          seat_position: seat,
        }));

      for (const day of slot.days) {
        const dow = WEEKDAY_INDEX[day];
        const dayStopsList = slot.day_stops?.[day] ?? [];
        const allStops = globalStop ? [globalStop, ...dayStopsList] : dayStopsList;
        const stopsApi: CourseStop[] = allStops.map((s, i) => ({
          stop_order: i + 1,
          name:       s.address,
          province:   '',
          district:   '',
          sub_district: '',
          latitude:   s.lat,
          longitude:  s.lng,
        }));

        // Outbound ("go")
        schedules.push({
          day_of_week:    dow,
          trip_direction: 'go',
          start_time_from: `${slot.pickup_from}:00`,
          start_time_to:   `${slot.pickup_to}:00`,
          end_time_from:   `${slot.arrival_from}:00`,
          end_time_to:     `${slot.arrival_to}:00`,
          from_province:   '', from_district: '', from_sub_district: '',
          pickup_point:    pickupPoint?.address ?? origin.address,
          from_latitude:   pickupPoint?.lat ?? origin.lat,
          from_longitude:  pickupPoint?.lng ?? origin.lng,
          to_province:     '', to_district: '', to_sub_district: '',
          destination:     destination.address,
          to_latitude:     destination.lat,
          to_longitude:    destination.lng,
          expected_distance:           distance,
          estimated_duration_minutes:  duration,
          participants,
          stops: stopsApi.length > 0 ? stopsApi : undefined,
        });

        // Return ("return") — reversed; pickup is return_pickup_point or outbound destination.
        if (tripType === 'round_trip') {
          const rp = slot.return_pickup_point;
          schedules.push({
            day_of_week:    dow,
            trip_direction: 'return',
            start_time_from: `${slot.return_pickup_from ?? '17:00'}:00`,
            start_time_to:   `${slot.return_pickup_to   ?? '17:30'}:00`,
            end_time_from:   `${slot.return_arrival_from ?? '18:00'}:00`,
            end_time_to:     `${slot.return_arrival_to   ?? '18:30'}:00`,
            from_province:   '', from_district: '', from_sub_district: '',
            pickup_point:    rp?.address ?? destination.address,
            from_latitude:   rp?.lat ?? destination.lat,
            from_longitude:  rp?.lng ?? destination.lng,
            to_province:     '', to_district: '', to_sub_district: '',
            destination:     origin.address,
            to_latitude:     origin.lat,
            to_longitude:    origin.lng,
            expected_distance:           distance,
            estimated_duration_minutes:  duration,
            participants,
          });
        }
      }
    }

    // start_date / end_date — earliest & latest day-of-week chosen, mapped to cycle dates.
    const dayIndexes = Array.from(new Set(schedules.map(s => s.day_of_week))).sort((a, b) => a - b);
    const dates      = dayIndexes.map(d => cycleDateForDayOfWeek(cycleStart, d));
    const start_date = toApiDate(dates[0] ?? cycleStart);
    const end_date   = toApiDate(dates[dates.length - 1] ?? cycleStart);

    try {
      await createCourse({
        trip_type:      'individual',
        direction_type: tripType,
        start_date,
        end_date,
        estimated_total_price: submittedMax,
        notes:          wizard.notes ?? '',
        weekly_trip_schedules: schedules,
      });
      wizard.reset();
      router.push('/user/my-requests');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : trs('submit_failed');
      setError(msg);
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <PageHeader
          title={tps('title')}
          onBack={() => router.back()}
          rightElement={
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFF7F6] text-[#00C2A8] border border-[#C8E8E4]">
              {trs('private')}
            </span>
          }
        />

        <div className="px-4 py-4 space-y-3">

          {/* Who is riding */}
          <Section
            title={trs('who_riding')}
            rightLabel={`${(wizard.include_self ? 1 : 0) + wizard.selected_passenger_ids.length}/4 selected`}
          >
            <PassengerPicker
              meName={myName}
              includeSelf={wizard.include_self}
              onToggleSelf={wizard.setIncludeSelf}
              passengers={passengers}
              loading={passengersLoading}
              selectedIds={wizard.selected_passenger_ids}
              onToggle={(id) => {
                const cur = wizard.selected_passenger_ids;
                if (cur.includes(id)) {
                  wizard.setSelectedPassengerIds(cur.filter(x => x !== id));
                } else {
                  const total = (wizard.include_self ? 1 : 0) + cur.length;
                  if (total >= 4) return;
                  wizard.setSelectedPassengerIds([...cur, id]);
                }
              }}
              maxSelections={4}
            />
          </Section>

          {/* Schedule */}
          <Section
            title={trs('schedule')}
            rightLabel={`${allDays.length}/7 days`}
          >
            <div className="space-y-3">
              {/* Time slot 1 always has the route + trip type controls above */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-4">
                <span className="text-sm font-semibold text-[#0B1E3D]">Time slot 1</span>

                {/* Global route card */}
                <OutboundRouteCard
                  origin={wizard.private_outbound_origin}
                  destination={wizard.private_outbound_destination}
                  routeStop={wizard.private_outbound_stop}
                  pickupPoint={wizard.private_outbound_pickup_point}
                  route={wizard.private_outbound_route}
                  hasPickupPoint={!!wizard.private_outbound_pickup_point}
                  onAddPickupPoint={() => setPointPicker({ kind: 'outbound-pickup' })}
                  onSetPickupPoint={() => setPointPicker({ kind: 'outbound-pickup' })}
                  onRemovePickupPoint={() => wizard.setPrivateOutbound({ private_outbound_pickup_point: null })}
                  onRemoveRouteStop={() => wizard.setPrivateOutbound({ private_outbound_stop: null })}
                  onSetRoute={() => setShowRoutePicker(true)}
                />

                {/* Global trip type */}
                {/* Trip type + slot 1 — locked until route is set */}
                <div className="relative space-y-4">
                  {!routeReady && (
                    <div className="absolute inset-0 z-10 rounded-xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 pointer-events-auto">
                      <span className="text-xl">🗺️</span>
                      <p className="text-sm font-semibold text-[#0B1E3D]">Set a route first</p>
                      <p className="text-xs text-[#5A6A7A]">Choose origin & destination above to unlock this section.</p>
                    </div>
                  )}

                <div>
                  <label className="block text-xs font-medium text-[#5A6A7A] mb-2">{tf('trip_type_label')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['one_way', 'round_trip'] as const).map(tt => (
                      <button
                        key={tt}
                        type="button"
                        onClick={() => setTripType(tt)}
                        className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                          tripType === tt
                            ? 'bg-[#A8EAE0] border-[#A8EAE0] text-[#0B1E3D]'
                            : 'bg-white border-[#E2E8F0] text-[#5A6A7A]'
                        }`}
                      >
                        {tt === 'one_way' ? tsl('one_way') : tsl('round_trip')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot 1 — pickup, arrival, seats, days, stops, return */}
                <PrivateTimeSlotCard
                  slot={slots[0]}
                  slotNumber={1}
                  canRemove={false}
                  assignedDays={allDays.filter(d => !slots[0].days.includes(d))}
                  tripType={tripType}
                  outboundOrigin={wizard.private_outbound_origin}
                  outboundDestination={wizard.private_outbound_destination}
                  passengers={seatPassengers}
                  onPickupTimeChange={(f, t) => handlePickupChange(slots[0].id, f, t)}
                  onArrivalChange={(f, t) => handleArrivalChange(slots[0].id, f, t)}
                  onSeatAssignmentsChange={(n) => handleSeatAssign(slots[0].id, n)}
                  onDayToggle={(d) => handleDayToggle(slots[0].id, d)}
                  onAddDayStop={(day, index) => setPointPicker({ kind: 'stop', slotId: slots[0].id, day, index })}
                  onClearDayStop={(day, index) => handleClearDayStop(slots[0].id, day, index)}
                  onSetReturnPickupPoint={() => setPointPicker({ kind: 'return-pickup', slotId: slots[0].id })}
                  onClearReturnPickupPoint={() => patchSlot(slots[0].id, { return_pickup_point: null })}
                  onReturnPickupTimeChange={(f, t) => handleReturnPickupChange(slots[0].id, f, t)}
                  onReturnArrivalChange={(f, t) => handleReturnArrivalChange(slots[0].id, f, t)}
                  onRemove={() => {}}
                />
                </div>
              </div>

              {/* Additional slots */}
              {slots.slice(1).map((s, i) => (
                <PrivateTimeSlotCard
                  key={s.id}
                  slot={s}
                  slotNumber={i + 2}
                  canRemove
                  assignedDays={allDays.filter(d => !s.days.includes(d))}
                  tripType={tripType}
                  outboundOrigin={wizard.private_outbound_origin}
                  outboundDestination={wizard.private_outbound_destination}
                  passengers={seatPassengers}
                  onPickupTimeChange={(f, t) => handlePickupChange(s.id, f, t)}
                  onArrivalChange={(f, t) => handleArrivalChange(s.id, f, t)}
                  onSeatAssignmentsChange={(n) => handleSeatAssign(s.id, n)}
                  onDayToggle={(d) => handleDayToggle(s.id, d)}
                  onAddDayStop={(day, index) => setPointPicker({ kind: 'stop', slotId: s.id, day, index })}
                  onClearDayStop={(day, index) => handleClearDayStop(s.id, day, index)}
                  onSetReturnPickupPoint={() => setPointPicker({ kind: 'return-pickup', slotId: s.id })}
                  onClearReturnPickupPoint={() => patchSlot(s.id, { return_pickup_point: null })}
                  onReturnPickupTimeChange={(f, t) => handleReturnPickupChange(s.id, f, t)}
                  onReturnArrivalChange={(f, t) => handleReturnArrivalChange(s.id, f, t)}
                  onRemove={() => handleRemoveSlot(s.id)}
                />
              ))}

              {/* Add slot */}
              <button
                type="button"
                onClick={handleAddSlot}
                disabled={lastSlotNoDay || allDays.length >= 7}
                className={`w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors ${
                  lastSlotNoDay || allDays.length >= 7
                    ? 'border-[#E2E8F0] text-[#C5CDD6] cursor-not-allowed'
                    : 'border-[#00C2A8] text-[#00C2A8] hover:bg-[#EFF7F6]'
                }`}
              >
                {allDays.length >= 7
                  ? tsb('all_days')
                  : lastSlotNoDay
                    ? tsb('select_days_first')
                    : `+ ${trs('add_slot')}`}
              </button>
            </div>
          </Section>

          {/* Notes */}
          <Section title={tps('notes')}>
            <p className="text-xs text-[#5A6A7A] mb-2">
              Optional details for the driver (e.g. luggage, pickup instructions).
            </p>
            <div className="relative">
              <textarea
                rows={4}
                maxLength={500}
                value={wizard.notes ?? ''}
                onChange={(e) => wizard.setNotes(e.target.value)}
                placeholder={tps('notes_placeholder')}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0B1E3D] resize-none focus:outline-none focus:border-[#00C2A8]"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-[#9AA0A6]">
                {(wizard.notes ?? '').length}/500
              </span>
            </div>
          </Section>

          {/* Cycle start */}
          <Section title={trs('cycle_start')}>
            <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-3">
              <p className="text-sm font-semibold text-[#0B1E3D]">{cycleStartLabel}</p>
              <p className="text-xs text-[#5A6A7A] mt-0.5">{trs('cycle_note')}</p>
            </div>
          </Section>

          {error && (
            <div className="rounded-xl border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3">
              {error.split('\n').map((line, i) => (
                <p key={i} className="text-sm text-[#E74C3C] font-medium flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠️</span> {line}
                </p>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={() => {
              const errs = validate();
              if (errs.length > 0) { setError(errs.join('\n')); return; }
              setError(null);
              setShowReview(true);
            }}
            disabled={submitting}
            className="w-full py-4 rounded-xl text-white font-bold text-sm transition-colors bg-[#0B1E3D] hover:bg-[#132D52] disabled:opacity-60"
            style={{ border: 'none', fontFamily: 'inherit' }}
          >
            {trs('review_submit')}
          </button>

          <div className="h-8" />
        </div>
      </div>

      {/* ── Review Modal ── */}
      {showReview && wizard.private_outbound_origin && wizard.private_outbound_destination && (
        <ReviewModal
          origin={wizard.private_outbound_origin}
          destination={wizard.private_outbound_destination}
          routeStop={wizard.private_outbound_stop}
          pickupPoint={wizard.private_outbound_pickup_point}
          tripType={tripType}
          slots={slots}
          passengers={passengers}
          priceMax={priceMax}
          cycleStartLabel={cycleStartLabel}
          notes={wizard.notes ?? ''}
          submitting={submitting}
          error={error}
          onConfirm={buildAndSubmit}
          onCancel={() => { setShowReview(false); setError(null); }}
        />
      )}

      {/* ── Route Picker for the global outbound route ── */}
      {showRoutePicker && (
        <RoutePicker
          mode="outbound"
          slotNumber={1}
          rideType="private"
          maxStops={1}
          initialOrigin={wizard.private_outbound_origin}
          initialDestination={wizard.private_outbound_destination}
          initialStops={wizard.private_outbound_stop ? [wizard.private_outbound_stop] : []}
          onConfirm={handleRouteConfirm}
          onCancel={() => setShowRoutePicker(false)}
        />
      )}

      {/* ── Point Picker for pickup-point / return-pickup / stops ── */}
      {pointPicker?.kind === 'outbound-pickup' && (
        <PointPicker
          title="Set outbound pickup point"
          initial={wizard.private_outbound_pickup_point}
          onConfirm={handleOutboundPickupConfirm}
          onCancel={() => setPointPicker(null)}
        />
      )}
      {pointPicker?.kind === 'return-pickup' && (
        <PointPicker
          title="Set return pickup point"
          initial={slots.find(s => s.id === pointPicker.slotId)?.return_pickup_point ?? null}
          onConfirm={(loc) => {
            patchSlot(pointPicker.slotId, { return_pickup_point: loc });
            setPointPicker(null);
          }}
          onCancel={() => setPointPicker(null)}
        />
      )}
      {pointPicker?.kind === 'stop' && (
        <StopMapPicker
          title={`Stop ${pointPicker.index + 1} · ${pointPicker.day}`}
          initial={
            slots.find(s => s.id === pointPicker.slotId)
              ?.day_stops?.[pointPicker.day]?.[pointPicker.index] ?? null
          }
          onConfirm={(loc) => {
            handleAddDayStop(pointPicker.slotId, pointPicker.day, loc, pointPicker.index);
            setPointPicker(null);
          }}
          onCancel={() => setPointPicker(null)}
        />
      )}
    </>
  );
}
