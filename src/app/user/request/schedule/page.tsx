'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/lib/RequestWizardContext';
import type { WizardTimeSlot } from '@/lib/RequestWizardContext';
import type { WeekDay, SelectedSeat, TimeSlot } from '@/types/shared';
import ScheduleBuilder from '@/components/user/request/ScheduleBuilder';
import RoutePicker, { type RoutePickerResult } from '@/components/user/request/RoutePicker';
import ReviewModal from '@/components/user/request/ReviewModal';
import PageHeader from '@/components/shared/PageHeader';
import Section from '@/components/shared/Section';
import { getNextAvailableCycleStart, formatCycleStartDate } from '@/lib/cycleUtils';
import { calculatePriceRange } from '@/lib/pricing';
import { computeArrivalFrom, computeArrivalTo } from '@/lib/timeUtils';
import { WEEKDAY_INDEX } from '@/lib/timeUtils';
import { cycleDateForDayOfWeek, toApiDate } from '@/lib/cycleUtils';
import { createCourse, type WeeklyTripSchedule } from '@/lib/api/courses';
import { ApiError } from '@/lib/api/client';
import { getPassengers, type ApiPassenger } from '@/lib/api/passengers';
import { getName, getUserId } from '@/lib/auth';
import PrivateSchedulePage from '@/components/user/request/private/PrivateSchedulePage';
import { useLocale, useTranslations } from 'next-intl';
// Mock data removed

// ── Group code display card ────────────────────────────────────────────────────

function GroupCodeCard({ code }: { code: string }) {
  const t = useTranslations('request_schedule');
  const [copied, setCopied] = React.useState(false);
  const display = code.replace('-', ' – ');

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-[#EFF7F6] border border-[#C8E8E4] rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-[#5A6A7A] mb-0.5">{t('group_code')}</p>
        <p className="text-xl font-bold tracking-[0.18em] text-[#00C2A8]">{display}</p>
        <p className="text-xs text-[#5A6A7A] mt-0.5">{t('share_friends')}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-4 px-3 py-2 rounded-lg border border-[#C8E8E4] bg-white text-sm font-medium text-[#00C2A8] hover:bg-[#EFF7F6] transition-colors"
        style={{ fontFamily: 'inherit' }}
      >
        {copied ? t('copied') : t('copy')}
      </button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeDefaultSlot(usedDays: WeekDay[], inheritFrom?: WizardTimeSlot): WizardTimeSlot {
  return {
    id:                 crypto.randomUUID(),
    trip_type:          'one_way',
    origin:             inheritFrom?.origin ?? null,
    stops:              inheritFrom?.stops ?? [],
    destination:        inheritFrom?.destination ?? null,
    route:              inheritFrom?.route ?? null,
    route_set:          inheritFrom?.route_set ?? false,
    return_origin:      inheritFrom?.destination ?? null,
    return_destination: inheritFrom?.origin ?? null,
    return_route:       null,
    return_customized:  false,
    pickup_from:        '07:00',
    pickup_to:          '07:30',
    arrival_from:       '',
    arrival_to:         '',
    days:               [],
  };
}

function validateSchedule(slots: WizardTimeSlot[], t: ReturnType<typeof useTranslations<'request_schedule'>>): string[] {
  const errors: string[] = [];
  if (slots.length === 0) {
    errors.push(t('add_slot'));
    return errors;
  }
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const n = i + 1;
    if (!slot.route_set || !slot.origin || !slot.destination)
      errors.push(t('set_route', { n }));
    if (slot.days.length === 0)
      errors.push(t('select_days', { n }));
    const gap = parseInt(slot.pickup_to.split(':')[0]) * 60 +
      parseInt(slot.pickup_to.split(':')[1]) -
      (parseInt(slot.pickup_from.split(':')[0]) * 60 + parseInt(slot.pickup_from.split(':')[1]));
    if (gap < 15 || gap > 120)
      errors.push(t('invalid_pickup', { n }));
  }
  return errors;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const t = useTranslations('request_schedule');
  const tForm = useTranslations('request_form');
  const tCo = useTranslations('co_passenger');
  const locale = useLocale();
  const router = useRouter();
  const wizard = useWizard();
  const {
    ride_type, group_type, group_code,
    passenger_count, seat_preference,
    include_self, selected_passenger_ids,
    setTimeSlots, setPassengerCount, setIncludeSelf, setSelectedPassengerIds,
    updateSlotRoute, updateSlotReturnRoute,
  } = wizard;

  // ── Passenger picker state (private rides) ──────────────────────────────────
  const [ridePassengers,    setRidePassengers]    = useState<ApiPassenger[]>([]);
  const [passengersLoading, setPassengersLoading] = useState(false);

  useEffect(() => {
    if (ride_type !== 'private') return;
    setPassengersLoading(true);
    getPassengers()
      .then(setRidePassengers)
      .catch(() => {})
      .finally(() => setPassengersLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride_type]);

  // Keep passenger_count in sync whenever selections change
  useEffect(() => {
    const total = (include_self ? 1 : 0) + selected_passenger_ids.length;
    setPassengerCount(total > 0 ? total : 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [include_self, selected_passenger_ids]);

  const cycleStartDate  = getNextAvailableCycleStart();
  const cycleStartLabel = formatCycleStartDate(cycleStartDate, locale);

  // ── Local slots state ───────────────────────────────────────────────────────
  const [slots, setSlotsLocal] = useState<WizardTimeSlot[]>(() => {
    if (wizard.time_slots.length > 0) return wizard.time_slots;
    return [makeDefaultSlot([])];
  });

  function persist(next: WizardTimeSlot[]) {
    setSlotsLocal(next);
    setTimeSlots(next as TimeSlot[]);
  }

  // ── Route picker state ──────────────────────────────────────────────────────
  const [showRoutePicker, setShowRoutePicker]     = useState(false);
  const [routePickerSlotId, setRoutePickerSlotId] = useState<string | null>(null);
  const [routePickerMode, setRoutePickerMode]     = useState<'outbound' | 'return'>('outbound');

  function openRoutePicker(slotId: string, mode: 'outbound' | 'return') {
    setRoutePickerSlotId(slotId);
    setRoutePickerMode(mode);
    setShowRoutePicker(true);
  }

  function handleConfirmRoute(result: RoutePickerResult) {
    if (!routePickerSlotId) return;
    const patch: Partial<WizardTimeSlot> = {
      origin:             result.origin,
      destination:        result.destination,
      stops:              result.stops,
      route:              result.route,
      route_set:          true,
      return_origin:      result.destination,
      return_destination: result.origin,
      return_customized:  false,
    };
    const slot = slots.find(s => s.id === routePickerSlotId);
    if (slot) {
      patch.arrival_from = computeArrivalFrom(slot.pickup_to, result.route.duration_minutes);
      patch.arrival_to   = computeArrivalTo(slot.pickup_from, slot.pickup_to, result.route.duration_minutes);
    }
    // When slot 1's outbound route changes, propagate it to all other slots.
    const isFirstSlot = slots[0]?.id === routePickerSlotId;
    if (isFirstSlot) {
      const updated = slots.map(s => {
        if (s.id === routePickerSlotId) return { ...s, ...patch };
        // Other slots inherit origin/destination/route from slot 1.
        return {
          ...s,
          origin:             result.origin,
          destination:        result.destination,
          route:              result.route,
          route_set:          true,
          return_origin:      result.destination,
          return_destination: result.origin,
          return_customized:  false,
        };
      });
      persist(updated);
    } else {
      updateSlotRoute(routePickerSlotId, patch);
      persist(slots.map(s => s.id === routePickerSlotId ? { ...s, ...patch } : s));
    }
    setShowRoutePicker(false);
  }

  function handleConfirmReturnRoute(result: RoutePickerResult) {
    if (!routePickerSlotId) return;
    const slot = slots.find(s => s.id === routePickerSlotId);
    const patch: Partial<WizardTimeSlot> = {
      return_origin:      result.origin,
      return_destination: result.destination,
      return_route:       result.route,
      return_customized:
        result.origin.address    !== slot?.destination?.address ||
        result.destination.address !== slot?.origin?.address,
    };
    updateSlotReturnRoute(routePickerSlotId, patch);
    persist(slots.map(s => s.id === routePickerSlotId ? { ...s, ...patch } : s));
    setShowRoutePicker(false);
  }

  // ── Slot mutations ──────────────────────────────────────────────────────────

  const assignedDays: WeekDay[] = Array.from(new Set(slots.flatMap(s => s.days)));
  const allDaysAssigned = assignedDays.length >= 7;

  function handleAddSlot() {
    if (allDaysAssigned || slots.length >= 4) return;
    const lastSlot = slots[slots.length - 1];
    if (lastSlot && lastSlot.days.length === 0) return;
    persist([...slots, makeDefaultSlot(assignedDays, slots[0])]);
  }

  function handleRemoveSlot(slotId: string) {
    persist(slots.filter(s => s.id !== slotId));
  }

  function handleTripTypeChange(slotId: string, tripType: 'one_way' | 'round_trip') {
    persist(slots.map(s => {
      if (s.id !== slotId) return s;
      if (tripType === 'round_trip') {
        return {
          ...s,
          trip_type:          'round_trip' as const,
          return_pickup_from: s.return_pickup_from ?? '17:00',
          return_pickup_to:   s.return_pickup_to   ?? '17:30',
          return_arrival_from: s.return_origin && s.return_destination
            ? computeArrivalFrom('17:30', s.return_route?.duration_minutes ?? 45)
            : '',
          return_arrival_to: s.return_origin && s.return_destination
            ? computeArrivalTo('17:00', '17:30', s.return_route?.duration_minutes ?? 45)
            : '',
        };
      }
      return { ...s, trip_type: 'one_way' as const };
    }));
  }

  function handlePickupChange(slotId: string, from: string, to: string) {
    persist(slots.map(s => {
      if (s.id !== slotId) return s;
      const dur = s.route?.duration_minutes ?? 45;
      return {
        ...s,
        pickup_from:  from,
        pickup_to:    to,
        arrival_from: computeArrivalFrom(to, dur),
        arrival_to:   computeArrivalTo(from, to, dur),
      };
    }));
  }

  function handleArrivalChange(slotId: string, from: string, to: string) {
    persist(slots.map(s => s.id === slotId ? { ...s, arrival_from: from, arrival_to: to } : s));
  }

  function handleReturnChange(slotId: string, from: string, to: string) {
    persist(slots.map(s => {
      if (s.id !== slotId) return s;
      const dur = s.return_route?.duration_minutes ?? s.route?.duration_minutes ?? 45;
      return {
        ...s,
        return_pickup_from:  from,
        return_pickup_to:    to,
        return_arrival_from: computeArrivalFrom(to, dur),
        return_arrival_to:   computeArrivalTo(from, to, dur),
      };
    }));
  }

  function handleReturnArrivalChange(slotId: string, from: string, to: string) {
    persist(slots.map(s => s.id === slotId ? { ...s, return_arrival_from: from, return_arrival_to: to } : s));
  }

  function handleDayToggle(slotId: string, day: WeekDay) {
    persist(slots.map(s => {
      if (s.id !== slotId) return s;
      return { ...s, days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day] };
    }));
  }

  // ── Price estimate ──────────────────────────────────────────────────────────

  const seatCostEGP = seat_preference === 'any' ? 0 : (seat_preference as SelectedSeat).extra_cost_egp;
  const totalDays   = assignedDays.length;
  const hasRoundTrip = slots.some(s => s.trip_type === 'round_trip');
  const firstRouteKm = slots.find(s => s.route)?.route?.distance_km ?? 20;

  const { max: priceMax } = calculatePriceRange({
    distanceKm:  firstRouteKm,
    ride_type:   ride_type ?? 'shared',
    seatCostEGP,
    walkMinutes: 0,
    tripType:    hasRoundTrip ? 'round_trip' : 'one_way',
    days:        Math.max(1, totalDays),
  });

  // ── Review / submit ─────────────────────────────────────────────────────────

  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Private rides use a dedicated UI flow — early return after all hooks.
  if ((ride_type as string | null) === 'private') {
    return <PrivateSchedulePage />;
  }

  function handleReviewClick() {
    const errs = validateSchedule(slots, t);
    if (errs.length > 0) {
      setValidationError(errs.join('\n'));
      return;
    }
    setValidationError(null);
    setShowReview(true);
  }

  async function handleSubmit(submittedMax: number) {
    setSubmitting(true);
    setValidationError(null);

    try {
      // Build per-day schedules for the API. For shared rides each slot's
      // own route is used (no per-day stops, no related passengers).
      const schedules: WeeklyTripSchedule[] = [];

      for (const slot of slots) {
        if (!slot.origin || !slot.destination || !slot.route) continue;

        const distance = slot.route.distance_km;
        const duration = Math.round(slot.route.duration_minutes);

        for (const day of slot.days) {
          const dow = WEEKDAY_INDEX[day];

          // The API requires exactly one participant per schedule for group rides.
          // We send the current user identified by their numeric ID from session.
          const userId = getUserId();
          const participant = userId !== null
            ? [{ type: 'user' as const, user_id: userId, seat_position: 'front' as const }]
            : [];

          // Outbound ("go")
          schedules.push({
            day_of_week:    dow,
            trip_direction: 'go',
            start_time_from: `${slot.pickup_from}:00`,
            start_time_to:   `${slot.pickup_to}:00`,
            end_time_from:   `${slot.arrival_from || slot.pickup_to}:00`,
            end_time_to:     `${slot.arrival_to   || slot.pickup_to}:00`,
            from_province:   '', from_district: '', from_sub_district: '',
            pickup_point:    slot.origin.address,
            from_latitude:   slot.origin.lat,
            from_longitude:  slot.origin.lng,
            to_province:     '', to_district: '', to_sub_district: '',
            destination:     slot.destination.address,
            to_latitude:     slot.destination.lat,
            to_longitude:    slot.destination.lng,
            expected_distance:          distance,
            estimated_duration_minutes: duration,
            participants:    participant,
          });

          // Return ("return") — only when this slot opted into round_trip
          if (slot.trip_type === 'round_trip') {
            const ro = slot.return_origin      ?? slot.destination;
            const rd = slot.return_destination ?? slot.origin;
            const rDist = slot.return_route?.distance_km          ?? distance;
            const rDur  = Math.round(slot.return_route?.duration_minutes ?? duration);

            schedules.push({
              day_of_week:    dow,
              trip_direction: 'return',
              start_time_from: `${slot.return_pickup_from ?? '17:00'}:00`,
              start_time_to:   `${slot.return_pickup_to   ?? '17:30'}:00`,
              end_time_from:   `${slot.return_arrival_from ?? '18:00'}:00`,
              end_time_to:     `${slot.return_arrival_to   ?? '18:30'}:00`,
              from_province:   '', from_district: '', from_sub_district: '',
              pickup_point:    ro.address,
              from_latitude:   ro.lat,
              from_longitude:  ro.lng,
              to_province:     '', to_district: '', to_sub_district: '',
              destination:     rd.address,
              to_latitude:     rd.lat,
              to_longitude:    rd.lng,
              expected_distance:          rDist,
              estimated_duration_minutes: rDur,
              participants:    participant,
            });
          }
        }
      }

      // Derive start/end dates from the chosen days within the cycle.
      // Sort the actual calendar dates (not day indexes) so start_date is always ≤ end_date.
      // Sorting day indexes numerically is wrong: Saturday=6 is the cycle start (earliest date)
      // but sorts last, causing end_date < start_date when Saturday is selected.
      const dayIndexes = Array.from(new Set(schedules.map(s => s.day_of_week)));
      const dates      = dayIndexes
        .map(d => cycleDateForDayOfWeek(cycleStartDate, d))
        .sort((a, b) => a.getTime() - b.getTime());
      const start_date = toApiDate(dates[0] ?? cycleStartDate);
      const end_date   = toApiDate(dates[dates.length - 1] ?? cycleStartDate);

      const directionType: 'one_way' | 'round_trip' = hasRoundTrip ? 'round_trip' : 'one_way';
      const isFriends = ride_type === 'shared' && group_type === 'friends';

      await createCourse({
        trip_type:      'group',
        group_type:     isFriends ? 'friends' : 'public',
        ...(isFriends && group_code ? { code_group: group_code } : {}),
        direction_type: directionType,
        start_date,
        end_date,
        estimated_total_price: submittedMax,
        notes:          wizard.notes ?? '',
        weekly_trip_schedules: schedules,
      });

      wizard.reset();
      router.push('/user/my-requests');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('submit_failed');
      setValidationError(msg);
      setSubmitting(false);
      setShowReview(false);
    }
  }

  // ── Derive ride type label ──────────────────────────────────────────────────
  const rideTypeLabel = ride_type === 'private' ? t('private') : t('shared');

  // ── Picker slot for pre-fill ────────────────────────────────────────────────
  const pickerSlot = slots.find(s => s.id === routePickerSlotId);
  const pickerSlotNumber = routePickerSlotId
    ? slots.findIndex(s => s.id === routePickerSlotId) + 1
    : 1;

  return (
    <>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <PageHeader
          title={t('schedule_title')}
          onBack={() => router.back()}
          rightElement={
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFF7F6] text-[#00C2A8] border border-[#C8E8E4]">
              {rideTypeLabel}
            </span>
          }
        />

        <div className="px-4 py-4 space-y-2">

          {/* Group code card — shared friends flow only */}
          {ride_type === 'shared' && group_type === 'friends' && group_code && (
            <GroupCodeCard code={group_code} />
          )}

          {/* Who is riding — private only */}
          {ride_type === 'private' && (
            <Section
              title={t('who_riding')}
              rightLabel={t('selected_label', { count: (include_self ? 1 : 0) + selected_passenger_ids.length })}
            >
              <p className="text-xs text-[#5A6A7A] mb-4">
                {t('who_riding_desc')}
              </p>

              {/* Me row */}
              {(() => {
                const myName = getName() ?? t('me');
                const checked = include_self;
                const total = (include_self ? 1 : 0) + selected_passenger_ids.length;
                const disabled = !checked && total >= 4;
                return (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIncludeSelf(!include_self)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 mb-3 text-left transition-colors ${
                      checked
                        ? 'border-[#00C2A8] bg-[#EFF7F6]'
                        : disabled
                        ? 'border-[#E2E8F0] bg-[#F8F9FA] opacity-50'
                        : 'border-[#E2E8F0] bg-white hover:border-[#C8E8E4]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-[#00C2A8] bg-[#00C2A8]' : 'border-[#C0CBD5]'}`}>
                      {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#0B1E3D] text-[#00C2A8] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {myName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0B1E3D]">{t('me_with_name', { name: myName })}</p>
                      <p className="text-xs text-[#8A9AB0]">{t('account_holder')}</p>
                    </div>
                  </button>
                );
              })()}

              {/* Related passengers */}
              {passengersLoading ? (
                <p className="text-xs text-[#8A9AB0] py-2">{t('loading_passengers')}</p>
              ) : ridePassengers.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-[#8A9AB0] uppercase tracking-wide mb-2">
                    {t('related_passengers')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {ridePassengers.map((p) => {
                      const checked = selected_passenger_ids.includes(p.id);
                      const total = (include_self ? 1 : 0) + selected_passenger_ids.length;
                      const disabled = !checked && total >= 4;
                      const initials = p.name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');

                      function toggle() {
                        if (checked) {
                          setSelectedPassengerIds(selected_passenger_ids.filter((id) => id !== p.id));
                        } else if (!disabled) {
                          setSelectedPassengerIds([...selected_passenger_ids, p.id]);
                        }
                      }

                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={disabled}
                          onClick={toggle}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-colors ${
                            checked
                              ? 'border-[#00C2A8] bg-[#EFF7F6]'
                              : disabled
                              ? 'border-[#E2E8F0] bg-[#F8F9FA] opacity-50'
                              : 'border-[#E2E8F0] bg-white hover:border-[#C8E8E4]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-[#00C2A8] bg-[#00C2A8]' : 'border-[#C0CBD5]'}`}>
                            {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#E0F7F4] text-[#00917D] flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0B1E3D]">{p.name}</p>
                            <p className="text-xs text-[#8A9AB0]">
                              {p.relation ? `${p.relation} · ` : ''}{p.age} yrs · {p.gender === 'male' ? tCo('male') : tCo('female')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#8A9AB0] py-1">
                  {t('no_passengers_profile')}{' '}
                  <a href="/user/profile" className="text-[#00C2A8] font-medium hover:underline">{t('profile_link')}</a>.
                </p>
              )}
            </Section>
          )}

          {/* Schedule */}
          <Section title={t('schedule')} rightLabel={t('days_label', { count: assignedDays.length })}>
            <ScheduleBuilder
              timeSlots={slots as TimeSlot[]}
              assignedDays={assignedDays}
              allDaysAssigned={allDaysAssigned}
              onAddSlot={handleAddSlot}
              onRemoveSlot={handleRemoveSlot}
              onSetRoute={(slotId) => openRoutePicker(slotId, 'outbound')}
              onEditReturnRoute={(slotId) => openRoutePicker(slotId, 'return')}
              onTripTypeChange={handleTripTypeChange}
              onPickupChange={handlePickupChange}
              onArrivalChange={handleArrivalChange}
              onReturnChange={handleReturnChange}
              onReturnArrivalChange={handleReturnArrivalChange}
              onDayToggle={handleDayToggle}
            />
          </Section>

          {/* Cycle start */}
          <Section title={t('cycle_start')}>
            <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-3">
              <p className="text-sm font-semibold text-[#0B1E3D]">{cycleStartLabel}</p>
              <p className="text-xs text-[#5A6A7A] mt-0.5">{t('cycle_note')}</p>
            </div>
          </Section>

          {/* Notes */}
          <Section title={t('notes')}>
            <p className="text-xs text-[#5A6A7A] mb-2">
              {t('notes_desc')}
            </p>
            <div className="relative">
              <textarea
                rows={4}
                maxLength={500}
                value={wizard.notes ?? ''}
                onChange={(e) => wizard.setNotes(e.target.value)}
                placeholder={t('notes_placeholder')}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0B1E3D] resize-none focus:outline-none focus:border-[#00C2A8]"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-[#9AA0A6]">
                {(wizard.notes ?? '').length}/500
              </span>
            </div>
          </Section>

          {/* Validation errors */}
          {validationError && (
            <div className="rounded-xl border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3">
              {validationError.split('\n').map((line, i) => (
                <p key={i} className="text-sm text-[#E74C3C] font-medium flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠️</span> {line}
                </p>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleReviewClick}
            className="w-full py-4 bg-[#0B1E3D] text-white font-bold text-sm rounded-xl hover:bg-[#132D52] transition-colors disabled:opacity-40"
            style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('review_submit')}
          </button>

          <div className="h-8" />
        </div>
      </div>

      {/* ── Route Picker overlay ── */}
      {showRoutePicker && routePickerSlotId && (
        <RoutePicker
          mode={routePickerMode}
          slotNumber={pickerSlotNumber}
          rideType={ride_type ?? 'shared'}
          initialOrigin={
            routePickerMode === 'return'
              ? (pickerSlot?.return_origin ?? pickerSlot?.destination)
              : pickerSlot?.origin
          }
          initialDestination={
            routePickerMode === 'return'
              ? (pickerSlot?.return_destination ?? pickerSlot?.origin)
              : pickerSlot?.destination
          }
          initialStops={routePickerMode === 'return' ? [] : (pickerSlot?.stops ?? [])}
          onConfirm={routePickerMode === 'return' ? handleConfirmReturnRoute : handleConfirmRoute}
          onCancel={() => setShowRoutePicker(false)}
        />
      )}

      {/* ── Review modal ── */}
      {showReview && (
        <ReviewModal
          onClose={() => setShowReview(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
          rideType={ride_type}
          groupType={group_type}
          passengerCount={passenger_count}
          seatPreference={seat_preference}
          origin={slots[0]?.origin ?? null}
          destination={slots[0]?.destination ?? null}
          route={slots[0]?.route ?? null}
          timeSlots={slots}
          returnRoutes={{}}
          cycleStartDate={cycleStartLabel}
          priceMax={priceMax}
        />
      )}
    </>
  );
}
