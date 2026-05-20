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
import { getPassengers, type ApiPassenger } from '@/lib/api/passengers';
import { getName } from '@/lib/auth';
// Mock data removed

// ── Group code display card ────────────────────────────────────────────────────

function GroupCodeCard({ code }: { code: string }) {
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
        <p className="text-xs font-semibold text-[#5A6A7A] mb-0.5">Your group code</p>
        <p className="text-xl font-bold tracking-[0.18em] text-[#00C2A8]">{display}</p>
        <p className="text-xs text-[#5A6A7A] mt-0.5">Share with friends · expires after 48 hours</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-4 px-3 py-2 rounded-lg border border-[#C8E8E4] bg-white text-sm font-medium text-[#00C2A8] hover:bg-[#EFF7F6] transition-colors"
        style={{ fontFamily: 'inherit' }}
      >
        {copied ? '✓ Copied' : '📋 Copy'}
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

function validateSchedule(slots: WizardTimeSlot[]): string | null {
  if (slots.length === 0) return 'Add at least one time slot';
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const n = i + 1;
    if (!slot.route_set || !slot.origin || !slot.destination)
      return `Set a route for Time slot ${n}`;
    if (slot.days.length === 0)
      return `Select days for Time slot ${n}`;
    const gap = parseInt(slot.pickup_to.split(':')[0]) * 60 +
      parseInt(slot.pickup_to.split(':')[1]) -
      (parseInt(slot.pickup_from.split(':')[0]) * 60 + parseInt(slot.pickup_from.split(':')[1]));
    if (gap < 30 || gap > 120)
      return `Invalid pickup window for Time slot ${n}`;
  }
  const totalDays = new Set(slots.flatMap(s => s.days)).size;
  if (totalDays < 3)
    return `Select at least 3 days in total (currently ${totalDays}/3)`;
  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
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
  const cycleStartLabel = formatCycleStartDate(cycleStartDate, 'en');

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
    // Recompute arrival times if we have a route
    const slot = slots.find(s => s.id === routePickerSlotId);
    if (slot) {
      patch.arrival_from = computeArrivalFrom(slot.pickup_to, result.route.duration_minutes);
      patch.arrival_to   = computeArrivalTo(slot.pickup_from, slot.pickup_to, result.route.duration_minutes);
    }
    updateSlotRoute(routePickerSlotId, patch);
    persist(slots.map(s => s.id === routePickerSlotId ? { ...s, ...patch } : s));
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

  const { min: priceMin, max: priceMax } = calculatePriceRange({
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

  function handleReviewClick() {
    const err = validateSchedule(slots);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    setShowReview(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));

    const firstSlot = slots[0];

    if (firstSlot?.origin && firstSlot?.destination && firstSlot?.route) {
      // TODO: save request to API endpoint when available
    }

    setSubmitting(false);
    wizard.reset();
    router.push('/user/my-requests');
  }

  // ── Derive ride type label ──────────────────────────────────────────────────
  const rideTypeLabel = ride_type === 'private' ? 'Private' : 'Shared';

  // ── Picker slot for pre-fill ────────────────────────────────────────────────
  const pickerSlot = slots.find(s => s.id === routePickerSlotId);
  const pickerSlotNumber = routePickerSlotId
    ? slots.findIndex(s => s.id === routePickerSlotId) + 1
    : 1;

  return (
    <>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <PageHeader
          title="Schedule your ride"
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
              title="Who is riding?"
              rightLabel={`${(include_self ? 1 : 0) + selected_passenger_ids.length}/4 selected`}
            >
              <p className="text-xs text-[#5A6A7A] mb-4">
                Select up to 4 passengers. You can include yourself or book for others only.
              </p>

              {/* Me row */}
              {(() => {
                const myName = getName() ?? 'Me';
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
                      <p className="text-sm font-semibold text-[#0B1E3D]">Me ({myName})</p>
                      <p className="text-xs text-[#8A9AB0]">Account holder</p>
                    </div>
                  </button>
                );
              })()}

              {/* Related passengers */}
              {passengersLoading ? (
                <p className="text-xs text-[#8A9AB0] py-2">Loading passengers…</p>
              ) : ridePassengers.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-[#8A9AB0] uppercase tracking-wide mb-2">
                    Related passengers
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
                              {p.relation ? `${p.relation} · ` : ''}{p.age} yrs · {p.gender === 'male' ? 'Male' : 'Female'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#8A9AB0] py-1">
                  No related passengers saved. Add them in your{' '}
                  <a href="/user/profile" className="text-[#00C2A8] font-medium hover:underline">profile</a>.
                </p>
              )}
            </Section>
          )}

          {/* Schedule */}
          <Section title="Schedule" rightLabel={`${assignedDays.length}/7 days`}>
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
              onReturnChange={handleReturnChange}
              onDayToggle={handleDayToggle}
            />
          </Section>

          {/* Cycle start */}
          <Section title="Cycle start">
            <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-3">
              <p className="text-sm font-semibold text-[#0B1E3D]">{cycleStartLabel}</p>
              <p className="text-xs text-[#5A6A7A] mt-0.5">Requests are grouped every Wednesday</p>
            </div>
          </Section>

          {/* Price estimate */}
          <div className="bg-[#EFF7F6] border border-[#C8E8E4] rounded-xl p-4 flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-[#5A6A7A] mb-0.5">💰 Estimated weekly cost</p>
              <p className="text-sm font-bold text-[#0B1E3D]">EGP {priceMin} – {priceMax} / week</p>
            </div>
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-[#E74C3C] font-medium px-1">{validationError}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleReviewClick}
            className="w-full py-4 bg-[#0B1E3D] text-white font-bold text-sm rounded-xl hover:bg-[#132D52] transition-colors disabled:opacity-40"
            style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Review &amp; submit request
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
          priceMin={priceMin}
          priceMax={priceMax}
        />
      )}
    </>
  );
}
