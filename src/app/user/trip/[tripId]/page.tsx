'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { DailyTrip, TripStop } from '@/types/trip';
// Mock data removed - API endpoints should provide trip data
import { computeETA, formatTripDate } from '@/lib/tripUtils';

const MY_PASSENGER_ID = ''; // TODO: get from current user context

// ── Live driver location hook ─────────────────────────────────────────────────

function useLiveDriverLocation(tripId: string) {
  const [location, setLocation] = useState<{
    lat: number; lng: number; heading: number;
  } | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/location`);
        const data = await res.json() as { driver_lat?: number; driver_lng?: number; driver_heading?: number };
        if (data.driver_lat && data.driver_lng) {
          setLocation({
            lat:     data.driver_lat,
            lng:     data.driver_lng,
            heading: data.driver_heading ?? 0,
          });
        }
      } catch {
        // silently ignore in dev
      }
    };

    poll();
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, [tripId]);

  return location;
}

// ── Driver info card ──────────────────────────────────────────────────────────

function DriverCard({ trip, onChat }: { trip: DailyTrip; onChat: () => void }) {
  const t = useTranslations('trip_live');
  return (
    <div style={{
      margin: '0 16px 20px', padding: 16,
      background: '#fff', borderRadius: 16,
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div className="flex items-center gap-3 mb-3">
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#E8F4F8', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>🧑‍✈️</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0B1E3D]">{trip.driver_name}</p>
          <p className="text-xs text-[#5A6A7A]">★ {trip.driver_rating.toFixed(1)}</p>
        </div>
      </div>
      <p className="text-xs text-[#5A6A7A] mb-3">
        {trip.driver_car_model} · {trip.driver_plate}
      </p>
      <button
        onClick={onChat}
        className="w-full h-9 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#0B1E3D] flex items-center justify-center gap-1"
      >
        💬 {t('chat_driver')}
      </button>
    </div>
  );
}

// ── Passenger code card ───────────────────────────────────────────────────────

function PassengerCodeCard({ code, status }: { code: string; status: TripStop['status'] }) {
  const t = useTranslations('trip_live');
  if (status === 'picked_up' || status === 'dropped_off') return null;

  return (
    <div className="bg-[#0B1E3D] rounded-2xl px-6 py-5 text-center mx-4 mb-5">
      <p className="text-xs text-white/60 mb-2">{t('pickup_code')}</p>
      <p className="text-5xl font-bold tracking-[0.4em] text-white mb-3">{code}</p>
      <p className="text-xs text-white/50">{t('pickup_code_desc')}</p>
    </div>
  );
}

// ── ETA chip ──────────────────────────────────────────────────────────────────

function ETAChip({ driverLat, driverLng, pickupLat, pickupLng }: {
  driverLat: number; driverLng: number;
  pickupLat: number; pickupLng: number;
}) {
  const t = useTranslations('trip_live');
  const eta = computeETA(driverLat, driverLng, pickupLat, pickupLng);
  return (
    <div className="inline-flex items-center gap-1.5 bg-[#EFF7F6] border border-[#C8E8E4] rounded-full px-3 py-1 text-xs font-semibold text-[#00C2A8]">
      🚗 {t('driver_eta', { eta })}
    </div>
  );
}

// ── Status timeline ───────────────────────────────────────────────────────────

function StatusTimeline({ myStop }: { myStop: TripStop }) {
  const t = useTranslations('trip_live');
  const steps = [
    { key: 'on_way',   label: t('driver_on_way'),          done: true },
    { key: 'arriving', label: t('driver_approaching'),         done: myStop.status !== 'pending' },
    { key: 'pickup',   label: t('pickup_confirmed'),           done: ['picked_up', 'dropped_off'].includes(myStop.status) },
    { key: 'in_car',   label: t('on_way_dest'),  done: myStop.status === 'dropped_off' },
    { key: 'arrived',  label: t('driver_arrived'),                    done: myStop.status === 'dropped_off' },
  ];
  return (
    <div className="px-4 mb-5">
      <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wide mb-3">{t('status')}</p>
      {steps.map(step => (
        <div key={step.key} className="flex items-center gap-3 py-2">
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: step.done ? '#00C2A8' : '#E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {step.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <p className={`text-sm ${step.done ? 'font-medium text-[#0B1E3D]' : 'text-[#9AA0A6]'}`}>
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Live map placeholder ──────────────────────────────────────────────────────

function LiveMap({ driverLocation }: {
  driverLocation: { lat: number; lng: number; heading: number } | null;
  myStop: TripStop;
}) {
  const t = useTranslations('trip_live');
  return (
    <div style={{
      height: 240, background: '#E8F4F8', margin: '0 16px 20px',
      borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid #C8D8E4',
    }}>
      <div className="text-center">
        <p className="text-2xl mb-1">🗺️</p>
        <p className="text-xs text-[#5A6A7A]">{t('map_placeholder')}</p>
        {driverLocation ? (
          <p className="text-xs text-[#00C2A8] mt-0.5 font-medium">
            {t('driver_at', { lat: driverLocation.lat.toFixed(4), lng: driverLocation.lng.toFixed(4) })}
          </p>
        ) : (
          <p className="text-xs text-[#9AA0A6] mt-0.5">{t('waiting_location')}</p>
        )}
      </div>
    </div>
  );
}

// ── In-car view ───────────────────────────────────────────────────────────────

function InCarView({ myStop, driverLocation, onChat }: {
  trip: DailyTrip;
  myStop: TripStop;
  driverLocation: { lat: number; lng: number; heading: number } | null;
  onChat: () => void;
}) {
  const t = useTranslations('trip_live');
  return (
    <div>
      <LiveMap driverLocation={driverLocation} myStop={myStop} />
      <div className="px-4">
        <div className="bg-[#EFF7F6] rounded-2xl p-5 mb-4">
          <p className="text-base font-bold text-[#0B1E3D] mb-1">{t('on_way')} 🎉</p>
          <p className="text-xs text-[#5A6A7A] mb-2">{t('destination', { address: myStop.dropoff_address })}</p>
          <p className="text-xs text-[#00C2A8] font-medium">{t('eta_estimated', { time: myStop.scheduled_dropoff })}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onChat}
            className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#0B1E3D] flex items-center justify-center gap-1"
          >
            💬 {t('chat')}
          </button>
          <button className="h-10 px-4 rounded-xl border border-[#E74C3C] text-sm font-medium text-[#E74C3C] flex items-center justify-center gap-1">
            🚨 {t('sos')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Completed view ────────────────────────────────────────────────────────────

function TripCompletedView({ trip, myStop, onRate }: {
  trip: DailyTrip; myStop: TripStop; onRate: () => void;
}) {
  const t = useTranslations('trip_live');
  const [rated, setRated] = useState<'up' | 'down' | null>(null);

  return (
    <div className="px-4">
      <div style={{
        background: '#EFF7F6', border: '1px solid #C8E8E4', borderRadius: 20,
        padding: '28px 20px', textAlign: 'center', marginBottom: 16,
      }}>
        <p className="text-4xl mb-3">✅</p>
        <p className="text-lg font-bold text-[#0B1E3D] mb-1">{t('arrived')}</p>
        <p className="text-sm text-[#5A6A7A] mb-4">
          {myStop.dropoff_address} · {myStop.actual_dropoff ?? 'Now'}
        </p>
        <p className="text-sm font-semibold text-[#0B1E3D] mb-3">
          {t('rate_prompt', { driver: trip.driver_name })}
        </p>
        <div className="flex justify-center gap-6 mb-4">
          <button
            onClick={() => setRated('up')}
            className={`text-3xl transition-transform ${rated === 'up' ? 'scale-125' : 'hover:scale-110'}`}
          >👍</button>
          <button
            onClick={() => setRated('down')}
            className={`text-3xl transition-transform ${rated === 'down' ? 'scale-125' : 'hover:scale-110'}`}
          >👎</button>
        </div>
        {rated && <p className="text-xs text-[#5A6A7A] mb-3">{t('thanks_feedback')}</p>}
        <button
          onClick={onRate}
          className="text-sm font-semibold text-[#00C2A8] underline underline-offset-2"
        >
          {t('rate_detail')}
        </button>
      </div>
    </div>
  );
}

// ── No-show view ──────────────────────────────────────────────────────────────

function NoShowView() {
  const t = useTranslations('trip_live');
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-4xl mb-3">😔</p>
      <p className="text-base font-bold text-[#0B1E3D] mb-2">{t('missed')}</p>
      <p className="text-sm text-[#5A6A7A]">
        {t('no_show_support')}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PassengerTripPage() {
  const t = useTranslations('trip_live');
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<DailyTrip | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const driverLocation = useLiveDriverLocation(tripId);

  useEffect(() => {
    // TODO: fetch trip state from API endpoint when available
    // fetchTripState(tripId).then(data => {
    //   setTrip(data);
    //   setLoading(false);
    // });
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    if (!trip || trip.status === 'completed' || trip.status === 'cancelled') return;
    // TODO: poll trip state from API endpoint when available
    const interval = setInterval(() => {
      // fetchTripState API call removed - needs backend implementation
    }, 10_000);
    return () => clearInterval(interval);
  }, [trip]);

  if (loading || !trip) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-[#5A6A7A]">{t('loading')}</p>
      </div>
    );
  }

  const myStop = trip.stops.find(s => s.passenger_id === MY_PASSENGER_ID);

  if (!myStop) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-[#5A6A7A]">{t('not_part')}</p>
      </div>
    );
  }

  function handleChat() {
    router.push(`/user/trip/${tripId}/chat`);
  }

  function handleRate() {
    router.push(`/user/rate/${tripId}`);
  }

  const statusLabel: Record<typeof trip.status, string> = {
    locked:    t('status_scheduled'),
    unlocked:  t('status_starting'),
    active:    t('driver_on_way'),
    completed: t('status_completed'),
    cancelled: t('status_cancelled'),
  };

  const statusColors: Record<typeof trip.status, { bg: string; color: string }> = {
    locked:    { bg: '#F1F3F4', color: '#5A6A7A' },
    unlocked:  { bg: '#FFF8EB', color: '#F5A623' },
    active:    { bg: '#E8F8EF', color: '#27AE60' },
    completed: { bg: '#EFF7F6', color: '#00C2A8' },
    cancelled: { bg: '#FDECEA', color: '#E74C3C' },
  };
  const sc = statusColors[trip.status];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs text-[#5A6A7A] mb-1">{t('your_ride', { date: formatTripDate(trip.date) })}</p>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: sc.bg, color: sc.color,
          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
          {statusLabel[trip.status]}
        </span>
      </div>

      {/* Driver card */}
      {(trip.status === 'active' || trip.status === 'completed') && (
        <DriverCard trip={trip} onChat={handleChat} />
      )}

      {/* ETA chip — shown before pickup when driver location is known */}
      {trip.status === 'active' && driverLocation &&
        (myStop.status === 'pending' || myStop.status === 'arriving') && (
        <div className="px-4 mb-4">
          <ETAChip
            driverLat={driverLocation.lat}
            driverLng={driverLocation.lng}
            pickupLat={myStop.pickup_lat}
            pickupLng={myStop.pickup_lng}
          />
        </div>
      )}

      {/* Live map — shown before pickup */}
      {trip.status === 'active' && (myStop.status === 'pending' || myStop.status === 'arriving' || myStop.status === 'waiting') && (
        <LiveMap driverLocation={driverLocation} myStop={myStop} />
      )}

      {/* Passenger code */}
      {trip.status === 'active' && (
        <PassengerCodeCard code={myStop.passenger_code} status={myStop.status} />
      )}

      {/* Status timeline */}
      {trip.status === 'active' && <StatusTimeline myStop={myStop} />}

      {/* In-car view — after pickup, before dropoff */}
      {trip.status === 'active' && myStop.status === 'picked_up' && (
        <InCarView
          trip={trip}
          myStop={myStop}
          driverLocation={driverLocation}
          onChat={handleChat}
        />
      )}

      {/* No-show */}
      {myStop.status === 'no_show' && <NoShowView />}

      {/* Completed */}
      {(trip.status === 'completed' || myStop.status === 'dropped_off') && (
        <TripCompletedView trip={trip} myStop={myStop} onRate={handleRate} />
      )}

      {/* Pre-trip: locked / unlocked */}
      {(trip.status === 'locked' || trip.status === 'unlocked') && (
        <div className="px-4 py-10 text-center">
          <p className="text-4xl mb-3">🕐</p>
          <p className="text-base font-bold text-[#0B1E3D] mb-2">{t('trip_scheduled')}</p>
          <p className="text-sm text-[#5A6A7A]">
            {t('driver_start_at', { time: trip.first_pickup_time })}
          </p>
          <div className="mt-4 bg-white border border-[#E2E8F0] rounded-xl p-4 text-left">
            <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wide mb-2">{t('your_stop')}</p>
            <p className="text-sm font-medium text-[#0B1E3D]">{myStop.pickup_address}</p>
            <p className="text-xs text-[#00C2A8] mt-1">{t('pickup_at', { time: myStop.scheduled_pickup })}</p>
          </div>
        </div>
      )}
    </div>
  );
}
