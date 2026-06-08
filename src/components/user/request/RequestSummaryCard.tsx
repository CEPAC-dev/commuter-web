'use client';

import type { ORSRoute } from '@/lib/openrouteservice';
import type { RequestFormData } from './RequestForm';
import { formatTime12h } from '@/lib/timeUtils';
import { calculatePriceRange } from '@/lib/pricing';
import { getNextAvailableCycleStart, formatCycleStartDate, getCycleEndDate } from '@/lib/cycleUtils';
import { useTranslations } from 'next-intl';

interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

interface RequestSummaryCardProps {
  from: LocationValue;
  to: LocationValue;
  route: ORSRoute;
  formData: RequestFormData;
  onEdit: () => void;
  onSubmit: () => void;
}

function formatDays(days: string[]) {
  return days.join(', ');
}

export default function RequestSummaryCard({
  from,
  to,
  route,
  formData,
  onEdit,
  onSubmit,
}: RequestSummaryCardProps) {
  const trsc = useTranslations('request_summary_card');
  const trs = useTranslations('request_summary');
  const tf = useTranslations('request_form');
  const tsl = useTranslations('time_slot');
  const hasRoundTripSlot = formData.time_slots.some((slot) => slot.trip_type === 'round_trip');

  const priceRange = calculatePriceRange({
    distanceKm: route.distance_km,
    ride_type:  formData.ride_type,
    seatCostEGP: 0,
    walkMinutes: 0,
    tripType:   hasRoundTripSlot ? 'round_trip' : 'one_way',
    days:       Math.max(formData.days.length, 1),
  });

  const seatLabel = trsc('any_seat_free');


  const cycleStart = getNextAvailableCycleStart();
  const cycleEnd   = getCycleEndDate(cycleStart);
  const cycleStartStr = formatCycleStartDate(cycleStart, 'en');
  const cycleEndStr   = formatCycleStartDate(cycleEnd, 'en');

  const topRows: Array<[string, string]> = [
    [trsc('ride_type'), formData.ride_type === 'shared' ? tf('shared') : tf('private')],
    [trsc('seat_pref'), seatLabel],
    [trs('trip_type'), hasRoundTripSlot ? tsl('round_trip') : tsl('one_way')],
    [trs('days'), formatDays(formData.days)],
    [trs('cycle_start'), `${cycleStartStr} – ${cycleEndStr}`],
  ];
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0B1E3D' }}>
        {trs('title')}
      </h2>

      {/* Route */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0B1E3D' }}>{from.address}</span>
        </div>
        <div style={{ paddingLeft: 12, color: '#5A6A7A', fontSize: 20, lineHeight: 1 }}>↓</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0B1E3D' }}>{to.address}</span>
        </div>
      </div>

      <div style={{ fontSize: 14, color: '#5A6A7A', fontWeight: 500 }}>
        {route.distance_km} km &nbsp;·&nbsp; ~{route.duration_minutes} min
      </div>

      {/* Details table */}
      <div
        style={{
          background: '#F8F9FA',
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {topRows.map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: i < topRows.length - 1 ? '1px solid #E2E8F0' : 'none',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: '#5A6A7A', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600, textAlign: 'right' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Schedule section */}
      <div style={{ background: '#F8F9FA', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#EFF7F6', borderBottom: '1px solid #C8E8E4', fontSize: 13, fontWeight: 700, color: '#0B1E3D' }}>{trs('schedule_title')}</div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {formData.time_slots.map((slot, index) => (
            <div
              key={slot.id}
              style={{
                borderBottom: index < formData.time_slots.length - 1 ? '1px solid #E2E8F0' : 'none',
                paddingBottom: index < formData.time_slots.length - 1 ? 12 : 0,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {slot.days.map((day) => (
                  <span
                    key={`${slot.id}-${day}`}
                    style={{
                      fontSize: 11,
                      background: '#EFF7F6',
                      border: '1px solid #C8E8E4',
                      color: '#00A896',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontWeight: 600,
                    }}
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5A6A7A', marginBottom: 4 }}>
                <span>Pickup</span>
                <span style={{ color: '#0B1E3D', fontWeight: 600 }}>
                  {formatTime12h(slot.pickup_from)} - {formatTime12h(slot.pickup_to)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5A6A7A' }}>
                <span>Arrival</span>
                <span style={{ color: '#0B1E3D', fontWeight: 600 }}>
                  {formatTime12h(slot.arrival_from)} - {formatTime12h(slot.arrival_to)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5A6A7A', marginTop: 4 }}>
                <span>Trip type</span>
                <span style={{ color: '#0B1E3D', fontWeight: 600 }}>
                  {slot.trip_type === 'round_trip' ? trsc('round_trip') : trsc('one_way')}
                </span>
              </div>

              {slot.trip_type === 'round_trip' && slot.return_pickup_from && slot.return_pickup_to && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5A6A7A', marginTop: 8 }}>
                    <span>Return pickup</span>
                    <span style={{ color: '#0B1E3D', fontWeight: 600 }}>
                      {formatTime12h(slot.return_pickup_from)} - {formatTime12h(slot.return_pickup_to)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5A6A7A' }}>
                    <span>Return arrival</span>
                    <span style={{ color: '#0B1E3D', fontWeight: 600 }}>
                      {formatTime12h(slot.return_arrival_from || '')} - {formatTime12h(slot.return_arrival_to || '')}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price estimate */}
      <div
        style={{
          background: '#0B1E3D',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          💰 {trs('price_estimate')}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
          EGP {priceRange.min} – {priceRange.max} / week
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
          Confirmed after driver matches
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '12px',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            background: '#fff',
            color: '#0B1E3D',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          ← Edit
        </button>
        <button
          type="button"
          onClick={onSubmit}
          style={{
            flex: 2,
            padding: '12px',
            border: 'none',
            borderRadius: 10,
            background: '#00C2A8',
            color: '#0B1E3D',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#00A896')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#00C2A8')}
        >
          {trs('submit_btn')}
        </button>
      </div>
    </div>
  );
}
