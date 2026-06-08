'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { WeekDay, RideType } from '@/types/user';
import type { TimeSlot } from '@/types/shared';
import {
  ALL_DAYS,
  timeDiffMinutes,
} from '@/lib/timeUtils';
import { calculatePriceRange } from '@/lib/pricing';
import { getNextAvailableCycleStart, formatCycleStartDate } from '@/lib/cycleUtils';
import ScheduleBuilder from './ScheduleBuilder';

export interface RequestFormData {
  ride_type:            RideType;
  seat_preference:      'any';  // kept for API compat; value always 'any' (set in profile)
  start_date:           string; // auto-computed from cycle utils, read-only
  days:                 WeekDay[];
  time_slots:           TimeSlot[];
}

interface RequestFormProps {
  data: RequestFormData;
  onChange: (data: RequestFormData) => void;
  onReview: () => void;
  showErrors?: boolean;
  distanceKm: number;
  /** When true (via stops added), shared ride button is locked to private */
  lockedToPrivate?: boolean;
  /** Profile-level preferences (read-only, not shown in form) */
  walkMinutes?: 0 | 5 | 10;
}

export default function RequestForm({
  data,
  onChange,
  onReview,
  showErrors = false,
  distanceKm,
  lockedToPrivate = false,
  walkMinutes = 0,
}: RequestFormProps) {
  const [shake, setShake] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const locale     = useLocale();
  const t          = useTranslations('request_form');
  const te         = useTranslations('request_form_errors');
  const cycleStart = getNextAvailableCycleStart();

  function update(partial: Partial<RequestFormData>) {
    const next = { ...data, ...partial };
    if (partial.time_slots) {
      const mergedDays = partial.time_slots.flatMap((slot) => slot.days);
      const uniqueDays = ALL_DAYS.filter((day) => mergedDays.includes(day));
      next.days = uniqueDays;
    }
    onChange(next);
  }

  const assignedDays = useMemo(
    () => data.time_slots.flatMap((slot) => slot.days),
    [data.time_slots]
  );

  const availableDays = useMemo(
    () => ALL_DAYS.filter((day) => !assignedDays.includes(day)),
    [assignedDays]
  );

  const hasRoundTripSlot = useMemo(
    () => data.time_slots.some((slot) => slot.trip_type === 'round_trip'),
    [data.time_slots]
  );

  const allDaysAssigned = availableDays.length === 0;

  function addTimeSlot() {
    if (allDaysAssigned || data.time_slots.length >= 4) return;
    const nextSlots = [
      ...data.time_slots,
      {
        id:                 crypto.randomUUID(),
        trip_type:          'one_way' as const,
        origin:             null,
        stops:              [],
        destination:        null,
        route:              null,
        route_set:          false,
        return_origin:      null,
        return_destination: null,
        return_route:       null,
        return_customized:  false,
        days:               [],
        pickup_from:        '07:00',
        pickup_to:          '07:30',
        arrival_from:       '08:00',
        arrival_to:         '08:30',
      },
    ];
    update({ time_slots: nextSlots });
  }

  function removeTimeSlot(id: string) {
    if (data.time_slots.length <= 1) return;
    update({ time_slots: data.time_slots.filter((slot) => slot.id !== id) });
  }

  function updateSlotPickup(slotId: string, from: string, to: string) {
    const nextSlots = data.time_slots.map((slot) => {
      if (slot.id !== slotId) return slot;
      return {
        ...slot,
        pickup_from: from,
        pickup_to: to,
      };
    });
    update({ time_slots: nextSlots });
  }

  function updateSlotReturn(slotId: string, from: string, to: string) {
    const nextSlots = data.time_slots.map((slot) => {
      if (slot.id !== slotId) return slot;
      return {
        ...slot,
        return_pickup_from: from,
        return_pickup_to: to,
      };
    });
    update({ time_slots: nextSlots });
  }

  function updateSlotTripType(slotId: string, tripType: 'one_way' | 'round_trip') {
    const nextSlots = data.time_slots.map((slot) => {
      if (slot.id !== slotId) return slot;
      if (tripType === 'round_trip') {
        return {
          ...slot,
          trip_type: 'round_trip' as const,
          return_pickup_from: slot.return_pickup_from ?? '17:00',
          return_pickup_to: slot.return_pickup_to ?? '17:30',
          return_arrival_from: slot.return_arrival_from ?? '18:00',
          return_arrival_to: slot.return_arrival_to ?? '18:30',
        };
      }
      return {
        ...slot,
        trip_type: 'one_way' as const,
        return_pickup_from: undefined,
        return_pickup_to: undefined,
        return_arrival_from: undefined,
        return_arrival_to: undefined,
      };
    });

    update({ time_slots: nextSlots });
  }

  function toggleDayForSlot(slotId: string, day: WeekDay) {
    const nextSlots = data.time_slots.map((slot) => {
      if (slot.id !== slotId) return slot;
      const hasDayAlready = slot.days.includes(day);
      if (!hasDayAlready && assignedDays.includes(day)) {
        return slot;
      }
      return {
        ...slot,
        days: hasDayAlready
          ? slot.days.filter((d) => d !== day)
          : [...slot.days, day],
      };
    });

    update({ time_slots: nextSlots });
  }

  function validateSchedule(): string | null {
    if (data.time_slots.length === 0) return te('add_slot');

    for (const slot of data.time_slots) {
      const slotNum = data.time_slots.indexOf(slot) + 1;
      if (slot.days.length === 0) {
        return te('no_days', { n: slotNum });
      }

      const gap = timeDiffMinutes(slot.pickup_from, slot.pickup_to);
      if (gap < 30) return te('pickup_min');
      if (gap > 120) return te('pickup_max');

      const arrivalGap = timeDiffMinutes(slot.arrival_from, slot.arrival_to);
      if (arrivalGap < 30) return te('arrival_min');
      if (arrivalGap > 120) return te('arrival_max');

      const routeDur   = Math.round(slot.route?.duration_minutes ?? 0);
      const minGapReqd = routeDur + 30;
      const totalGap   = timeDiffMinutes(slot.pickup_from, slot.arrival_to);
      if (routeDur > 0 && totalGap < minGapReqd) {
        return te('arrival_route_gap', { min: minGapReqd, route: routeDur });
      }

      if (slot.trip_type === 'round_trip') {
        if (!slot.return_pickup_from || !slot.return_pickup_to) {
          return te('return_pickup_missing', { n: slotNum });
        }
        const returnGap = timeDiffMinutes(slot.return_pickup_from, slot.return_pickup_to);
        if (returnGap < 30) return te('return_pickup_min');
        if (returnGap > 120) return te('return_pickup_max');

        if (!slot.return_arrival_from || !slot.return_arrival_to) {
          return te('return_arrival_missing', { n: slotNum });
        }
        const returnArrivalGap = timeDiffMinutes(slot.return_arrival_from, slot.return_arrival_to);
        if (returnArrivalGap < 30) return te('return_arrival_min');
        if (returnArrivalGap > 120) return te('return_arrival_max');
      }
    }

    const allSlotDays = data.time_slots.flatMap((slot) => slot.days);
    const uniqueDays = new Set(allSlotDays);
    if (allSlotDays.length !== uniqueDays.size) {
      return te('day_duplicate');
    }

    return null;
  }

  const priceRange = useMemo(
    () =>
      calculatePriceRange({
        distanceKm,
        ride_type:   data.ride_type,
        seatCostEGP: 0,
        walkMinutes,
        tripType:   hasRoundTripSlot ? 'round_trip' : 'one_way',
        days:       Math.max(data.days.length, 1),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [distanceKm, data.ride_type, walkMinutes, hasRoundTripSlot, data.days]
  );

  function handleReview() {
    const scheduleValidationError = validateSchedule();
    const hasErrors = !data.start_date || !!scheduleValidationError;

    if (hasErrors) {
      setScheduleError(scheduleValidationError);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      onReview();
      return;
    }
    setScheduleError(null);
    onReview();
  }

  const shouldShowScheduleError = showErrors && !!(scheduleError ?? validateSchedule());
  const effectiveScheduleError = scheduleError ?? validateSchedule();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake { animation: shake 0.4s ease; }
        @keyframes pricePop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .price-pop { animation: pricePop 0.25s ease; display: inline-block; }
        @media (max-width: 480px) {
          .trip-mode-cards { flex-direction: column !important; }
        }
      `}</style>

      {/* 1. Ride type */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
          {t('trip_type_label')}
        </div>
        <RideTypeCards value={data.ride_type} onChange={(v) => update({ ride_type: v })} lockedToPrivate={lockedToPrivate} />
        {lockedToPrivate && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FAEEDA', border: '1px solid #F6D580', borderRadius: 8, padding: '10px 12px' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
            <span style={{ fontSize: 12, color: '#BA7517', lineHeight: 1.4 }}>{te('stops_locked')}</span>
          </div>
        )}
      </div>

      {/* 2. Schedule builder */}
      <div>
        <ScheduleBuilder
          timeSlots={data.time_slots}
          assignedDays={assignedDays}
          allDaysAssigned={allDaysAssigned}
          onAddSlot={addTimeSlot}
          onRemoveSlot={removeTimeSlot}
          onSetRoute={() => { /* route set via map in legacy flow */ }}
          onEditReturnRoute={() => { /* route set via map in legacy flow */ }}
          onTripTypeChange={updateSlotTripType}
          onPickupChange={updateSlotPickup}
          onReturnChange={updateSlotReturn}
          onDayToggle={toggleDayForSlot}
        />
        {shouldShowScheduleError && effectiveScheduleError && (
          <p style={{ marginTop: 8, fontSize: 12, color: '#E74C3C' }}>{effectiveScheduleError}</p>
        )}
      </div>

      {/* 7. Cycle start — auto-computed, read-only */}
      <div style={{ background: '#EFF7F6', border: '1px solid #C8E8E4', borderRadius: 8, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6A7A', marginBottom: 4 }}>{t('cycle_start_label')}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#00C2A8' }}>
          {t('cycle_starts_on', { date: formatCycleStartDate(cycleStart, locale) })}
        </div>
        <div style={{ fontSize: 11, color: '#5A6A7A', marginTop: 4 }}>
          {t('cycle_planning_note')}
        </div>
      </div>

      {/* Live price estimate */}
      <PriceStrip
        min={priceRange.min}
        max={priceRange.max}
        breakdown={priceRange.breakdown}
        distanceKm={distanceKm}
        rideType={data.ride_type}
        selectedSeatLabel="Any"
        walkMinutes={walkMinutes}
        tripType={hasRoundTripSlot ? 'round_trip' : 'one_way'}
        daysCount={Math.max(data.days.length, 1)}
      />

      {/* Submit */}
      <button
        type="button"
        onClick={handleReview}
        className={shake ? 'shake' : ''}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 10,
          background: '#00C2A8',
          color: '#0B1E3D',
          fontWeight: 700,
          fontSize: 15,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          minHeight: 48,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#00A896')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#00C2A8')}
      >
        {t('review_btn')}
      </button>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function RideTypeCards({
  value,
  onChange,
  lockedToPrivate = false,
}: {
  value: RideType;
  onChange: (v: RideType) => void;
  lockedToPrivate?: boolean;
}) {
  const t = useTranslations('request_form');
  const te = useTranslations('request_form_errors');
  const options: Array<{
    key: RideType;
    icon: string;
    label: string;
    sub: string;
    priceHint: string;
  }> = [
    { key: 'shared',  icon: '🧑‍🤝‍🧑', label: t('shared'), sub: te('share_with_others'),      priceHint: te('lower_price') },
    { key: 'private', icon: '🚗',       label: t('private'),     sub: te('alone_in_car'), priceHint: te('higher_price') },
  ];

  return (
    <div className="trip-mode-cards" style={{ display: 'flex', gap: 10 }}>
      {options.map((opt) => {
        const active = value === opt.key;
        const locked = lockedToPrivate && opt.key === 'shared';
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => !locked && onChange(opt.key)}
            style={{
              flex: 1,
              minHeight: 100,
              border: active ? '2px solid #00C2A8' : '1.5px solid #E2E8F0',
              borderRadius: 10,
              background: active ? '#EFF7F6' : '#fff',
              cursor: locked ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              transition: 'all 0.15s',
              opacity: locked ? 0.38 : 1,
              pointerEvents: locked ? 'none' : undefined,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: active ? '#00C2A8' : '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 4,
                transition: 'background 0.15s',
              }}
            >
              {opt.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#0B1E3D' : '#374151' }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 12, color: '#5A6A7A' }}>{opt.sub}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 }}>
              {opt.priceHint}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PriceStrip({
  min,
  max,
  breakdown,
  distanceKm,
  rideType,
  selectedSeatLabel,
  walkMinutes,
  tripType,
  daysCount,
}: {
  min: number;
  max: number;
  breakdown: ReturnType<typeof calculatePriceRange>['breakdown'];
  distanceKm: number;
  rideType: RideType;
  selectedSeatLabel: string;
  walkMinutes: 0 | 5 | 10;
  tripType: 'one_way' | 'round_trip';
  daysCount: number;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('request_form');
  const te = useTranslations('request_form_errors');
  const tCommon = useTranslations('common');

  return (
    <div>
      <div
        style={{
          background: '#0B1E3D',
          borderRadius: 10,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          💰 {t('price_estimate_label')}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            key={min}
            className="price-pop"
            style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1 }}
          >
            EGP {min} – {max}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{tCommon('per_week')}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00C2A8',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
            textAlign: 'left',
            marginTop: 2,
          }}
        >
          {open ? te('hide_breakdown') : t('see_breakdown')}
        </button>
      </div>

      {open && (
        <div
          style={{
            marginTop: 8,
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '16px',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E3D', marginBottom: 10 }}>
            {t('breakdown_title')}
          </div>
          {[
            [
              te('base_distance', { km: distanceKm.toFixed(1) }),
              `${tCommon('egp')} ${Math.round(breakdown.base)}`,
            ],
            [
              te('trip_type_mult', { type: rideType === 'shared' ? te('shared_ride_label') : te('private_label') }),
              `× ${breakdown.rideTypeMultiplier.toFixed(1)}`,
            ],
            [
              te('seat_pref', { seat: selectedSeatLabel }),
              breakdown.seatFee > 0 ? `+ ${tCommon('egp')} ${breakdown.seatFee}` : tCommon('no_extra_cost'),
            ],
            ...(walkMinutes > 0
              ? [
                  [
                    te('walk_discount', { min: walkMinutes }),
                    `- ${Math.abs(breakdown.walkDiscount * 100)}%`,
                  ],
                ]
              : []),
            ...(tripType === 'round_trip'
              ? [[te('round_trip_mult'), `× ${breakdown.roundTripMultiplier}`]]
              : []),
            [daysCount !== 1 ? te('days_per_week', { count: daysCount }) : te('day_per_week', { count: daysCount }), ''],
          ].map(([label, val], i, arr) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>{val}</span>
            </div>
          ))}

          <div style={{ width: '100%', height: 1, background: '#E2E8F0', margin: '8px 0' }} />

          {[
            [t('breakdown_per_trip'), `${tCommon('egp')} ${breakdown.perTrip}`],
            [t('breakdown_per_week'), `${tCommon('egp')} ${breakdown.perWeek}`],
            [te('range_adjust'), '± 15%'],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>{val}</span>
            </div>
          ))}

          <div style={{ width: '100%', height: 1, background: '#E2E8F0', margin: '8px 0' }} />

          <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D', textAlign: 'right' }}>
            {tCommon('egp')} {min} – {max} {tCommon('per_week')}
          </div>
        </div>
      )}
    </div>
  );
}
