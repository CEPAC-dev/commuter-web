'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DailyTrip, TripStop, StopStatus } from '@/types/trip';
// Mock data removed - API endpoints should provide trip data
import {
  isStartUnlocked,
  timeUntilUnlock,
  formatTripDate,
  formatTime12h,
} from '@/lib/tripUtils';
import { format, parseISO } from 'date-fns';

// ── Stop number badge ─────────────────────────────────────────────────────────

function StopNumberBadge({ number, locked }: { number: number; active?: boolean; locked?: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
      ${locked
        ? 'bg-[#E2E8F0] text-[#9AA0A6] border-2 border-[#E2E8F0]'
        : 'bg-[#0B1E3D] text-white border-2 border-[#00C2A8]'
      }`}>
      {locked ? '🔒' : number}
    </div>
  );
}

// ── Wait timer ────────────────────────────────────────────────────────────────

function WaitTimer({ startedAt, maxSeconds, onExpire }: {
  startedAt: string;
  maxSeconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, maxSeconds - elapsed);
  });

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const urgent = remaining < 60;

  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full
      ${urgent ? 'bg-[#FDECEA] text-[#E74C3C]' : 'bg-[#FFF8EB] text-[#F5A623]'}`}>
      {m}:{String(s).padStart(2, '0')}
    </span>
  );
}

// ── Active stop card ──────────────────────────────────────────────────────────

interface ActiveStopCardProps {
  stop: TripStop;
  tripId: string;
  onConfirmPickup: (stopId: string, code: string, onError: () => void) => void;
  onNoShow: (stopId: string) => void;
}

function ActiveStopCard({ stop, tripId, onConfirmPickup, onNoShow }: ActiveStopCardProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [waitExpired, setWaitExpired] = useState(false);

  return (
    <div className="bg-white border-2 border-[#00C2A8] rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StopNumberBadge number={stop.stop_number} active />
          <div>
            <p className="text-sm font-semibold text-[#0B1E3D]">{stop.passenger_name}</p>
            <p className="text-xs text-[#5A6A7A]">{stop.pickup_address}</p>
          </div>
        </div>
        {stop.status === 'waiting' && stop.wait_started_at && (
          <WaitTimer
            startedAt={stop.wait_started_at}
            maxSeconds={180}
            onExpire={() => setWaitExpired(true)}
          />
        )}
      </div>

      {stop.status === 'arriving' && (
        <div className="text-xs text-[#00C2A8] mb-3">
          📍 You are close — enter code when passenger is in front of you
        </div>
      )}

      {(stop.status === 'arriving' || stop.status === 'waiting') && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#5A6A7A]">
            Ask passenger for their 4-digit code
          </label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => {
                setCodeError(false);
                setCode(e.target.value.replace(/\D/g, '').slice(0, 4));
              }}
              inputMode="numeric"
              maxLength={4}
              placeholder="_ _ _ _"
              className={`flex-1 h-12 text-center text-2xl font-bold tracking-[0.3em]
                border-2 rounded-xl focus:outline-none transition-colors
                ${codeError
                  ? 'border-[#E74C3C] bg-[#FDECEA]'
                  : 'border-[#E2E8F0] focus:border-[#00C2A8]'
                }`}
            />
            <button
              onClick={() => onConfirmPickup(stop.stop_id, code, () => setCodeError(true))}
              disabled={code.length !== 4}
              className="px-4 bg-[#00C2A8] text-[#0B1E3D] font-semibold rounded-xl disabled:opacity-40"
            >
              ✓
            </button>
          </div>
          {codeError && (
            <p className="text-xs text-[#E74C3C]">
              Wrong code. Ask the passenger to open their app.
            </p>
          )}
        </div>
      )}

      {stop.status === 'picked_up' && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#27AE60] font-medium">
            ✅ Picked up at {stop.actual_pickup}
          </span>
          <button
            onClick={() => router.push(`/driver/trip/${tripId}/chat/${stop.passenger_id}`)}
            className="flex items-center gap-1.5 text-xs text-[#00C2A8] border border-[#00C2A8] rounded-lg px-3 py-1.5 font-medium"
          >
            💬 Chat
          </button>
        </div>
      )}

      {waitExpired && stop.status === 'waiting' && (
        <button
          onClick={() => onNoShow(stop.stop_id)}
          className="mt-3 w-full py-2.5 border border-[#E74C3C] text-[#E74C3C] rounded-lg text-sm font-medium hover:bg-[#FDECEA] transition-colors"
        >
          Passenger didn&#39;t show — continue route
        </button>
      )}
    </div>
  );
}

// ── Locked stop card ──────────────────────────────────────────────────────────

function LockedStopCard({ stop }: { stop: TripStop }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-3 flex items-center gap-3 opacity-50">
      <StopNumberBadge number={stop.stop_number} locked />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#0B1E3D]">
          Stop {stop.stop_number} — {stop.scheduled_pickup}
        </p>
        <p className="text-xs text-[#9AA0A6]">
          Unlocks after previous passenger is picked up
        </p>
      </div>
      <span className="text-[#C5CDD6] text-lg">🔒</span>
    </div>
  );
}

// ── Trip start screen (locked / unlocked states) ──────────────────────────────

function TripStartScreen({ trip, onStartTrip }: { trip: DailyTrip; onStartTrip: () => void }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const unlocked = isStartUnlocked(trip.unlock_at);
  const { minutes, seconds } = timeUntilUnlock(trip.unlock_at);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <div className="bg-[#0B1E3D] text-white px-6 py-5">
        <p className="text-xs text-white/60 mb-1">Today&apos;s trip · {formatTripDate(trip.date)}</p>
        <p className="text-base font-semibold">
          {trip.stops.length} pickup{trip.stops.length > 1 ? 's' : ''}
        </p>
        <p className="text-xs text-white/60 mt-1">First pickup at {trip.first_pickup_time}</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {trip.stops.map((stop, i) => (
          <div key={stop.stop_id}
            className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0B1E3D] border-2 border-[#00C2A8]
              flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0B1E3D]">{stop.passenger_name}</p>
              <p className="text-xs text-[#5A6A7A]">{stop.pickup_address}</p>
              <p className="text-xs text-[#00C2A8] mt-0.5">Pickup at {stop.scheduled_pickup}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 bg-white border-t border-[#E2E8F0]">
        {unlocked ? (
          <button
            onClick={onStartTrip}
            className="w-full h-14 bg-[#00C2A8] text-[#0B1E3D] font-bold text-lg rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            🚗 Start trip
          </button>
        ) : (
          <div className="w-full h-14 bg-[#F1F3F4] rounded-xl flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-[#5A6A7A]">
              Trip starts in {minutes}:{String(seconds).padStart(2, '0')}
            </p>
            <p className="text-xs text-[#9AA0A6]">
              Button unlocks at {formatTime12h(format(parseISO(trip.unlock_at), 'HH:mm'))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Active trip view ──────────────────────────────────────────────────────────

function ActiveTripView({ trip, tripId, onConfirmPickup, onNoShow, onDropOff }: {
  trip: DailyTrip;
  tripId: string;
  onConfirmPickup: (stopId: string, code: string, onError: () => void) => void;
  onNoShow: (stopId: string) => void;
  onDropOff: (stopId: string) => void;
}) {
  const activeStop = trip.stops[trip.current_stop_index] ?? null;
  const pickedUpStops = trip.stops.filter(s => s.status === 'picked_up' || s.status === 'dropped_off');

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs text-[#5A6A7A] mb-1">{formatTripDate(trip.date)}</p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-[#E8F8EF] text-[#27AE60] text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#27AE60] inline-block" />
            ACTIVE
          </span>
          <span className="text-sm text-[#5A6A7A]">
            Stop {trip.current_stop_index + 1} of {trip.stops.length}
          </span>
        </div>
      </div>

      {/* Map placeholder — swap in real Leaflet map here */}
      <div className="mx-4 mb-5 rounded-2xl overflow-hidden border border-[#C8D8E4]"
        style={{ height: 300, background: '#E8F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <p className="text-3xl mb-2">🗺️</p>
          <p className="text-xs text-[#5A6A7A]">Your dot · pickup markers · route to next stop</p>
          {activeStop && (
            <p className="text-xs text-[#00C2A8] mt-1 font-medium">→ {activeStop.pickup_address}</p>
          )}
        </div>
      </div>

      <div className="px-4">
        <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wide mb-3">Pickup stops</p>
        {trip.stops.map((stop, idx) => {
          const isActive = idx === trip.current_stop_index;
          const isLocked = idx > trip.current_stop_index && stop.status === 'pending';
          if (isActive) {
            return (
              <ActiveStopCard
                key={stop.stop_id}
                stop={stop}
                tripId={tripId}
                onConfirmPickup={onConfirmPickup}
                onNoShow={onNoShow}
              />
            );
          }
          if (isLocked) {
            return <LockedStopCard key={stop.stop_id} stop={stop} />;
          }
          return (
            <div key={stop.stop_id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-3 flex items-center gap-3">
              <StopNumberBadge number={stop.stop_number} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0B1E3D]">{stop.passenger_name}</p>
                <p className="text-xs text-[#5A6A7A]">{stop.pickup_address}</p>
              </div>
              <span className="text-xs font-medium">
                {stop.status === 'picked_up' ? (
                  <span className="text-[#27AE60]">✅ {stop.actual_pickup}</span>
                ) : (
                  <span className="text-[#E74C3C]">❌ No-show</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {pickedUpStops.length > 0 && (
        <div className="px-4 mt-6">
          <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wide mb-3">Dropoffs</p>
          {trip.stops
            .filter(s => s.status === 'picked_up' || s.status === 'dropped_off')
            .map(stop => (
              <div key={stop.stop_id}
                className="flex items-center justify-between py-3 border-b border-[#F1F3F4]">
                <div>
                  <p className="text-sm font-medium text-[#0B1E3D]">
                    {stop.scheduled_dropoff} · {stop.passenger_name}
                  </p>
                  <p className="text-xs text-[#5A6A7A]">{stop.dropoff_address}</p>
                </div>
                {stop.status === 'picked_up' ? (
                  <button
                    onClick={() => onDropOff(stop.stop_id)}
                    className="text-xs font-semibold px-3 py-1.5 bg-[#00C2A8] text-[#0B1E3D] rounded-lg"
                  >
                    Drop off
                  </button>
                ) : (
                  <span className="text-xs text-[#27AE60] font-medium">{stop.actual_dropoff}</span>
                )}
              </div>
            ))}
        </div>
      )}

      {trip.status === 'completed' && (
        <div className="mx-4 mt-6 p-5 bg-[#EFF7F6] border border-[#C8E8E4] rounded-2xl text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-base font-bold text-[#0B1E3D] mb-1">Trip completed!</p>
          <p className="text-xs text-[#5A6A7A]">All passengers dropped off</p>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DriverTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<DailyTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const locationWatchRef = useRef<number | null>(null);

  useEffect(() => {
    // TODO: fetch trip state from API endpoint when available
    // fetchTripState(tripId).then(data => {
    //   setTrip(data);
    //   setLoading(false);
    // });
    setLoading(false);
  }, [tripId]);

  const startLocationBroadcast = useCallback((id: string) => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        fetch(`/api/trips/${id}/location`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver_lat:     pos.coords.latitude,
            driver_lng:     pos.coords.longitude,
            driver_heading: pos.coords.heading ?? 0,
          }),
        }).catch(() => {});
        setTrip(prev => prev ? {
          ...prev,
          driver_lat:          pos.coords.latitude,
          driver_lng:          pos.coords.longitude,
          driver_heading:      pos.coords.heading ?? 0,
          location_updated_at: new Date().toISOString(),
        } : prev);
      },
      (err) => console.error('[Location]', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 },
    );
    locationWatchRef.current = watchId;
  }, []);

  const stopLocationBroadcast = useCallback(() => {
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (trip?.status === 'completed' || trip?.status === 'cancelled') {
      stopLocationBroadcast();
    }
  }, [trip?.status, stopLocationBroadcast]);

  useEffect(() => () => stopLocationBroadcast(), [stopLocationBroadcast]);

  const persistTrip = useCallback((next: DailyTrip) => {
    setTrip(next);
    // TODO: save to API endpoint when available
  }, []);

  function handleStartTrip() {
    if (!trip) return;
    const next: DailyTrip = {
      ...trip,
      status: 'active',
      trip_started_at: new Date().toISOString(),
    };
    persistTrip(next);
    startLocationBroadcast(tripId);
  }

  function handleConfirmPickup(stopId: string, enteredCode: string, onError: () => void) {
    if (!trip) return;
    const stop = trip.stops.find(s => s.stop_id === stopId);
    if (!stop) return;
    if (enteredCode !== stop.passenger_code) { onError(); return; }
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const stops = trip.stops.map(s =>
      s.stop_id === stopId
        ? { ...s, status: 'picked_up' as StopStatus, actual_pickup: now, chat_unlocked: true }
        : s,
    );
    persistTrip({ ...trip, stops, current_stop_index: trip.current_stop_index + 1 });
  }

  function handleNoShow(stopId: string) {
    if (!trip) return;
    const stops = trip.stops.map(s =>
      s.stop_id === stopId ? { ...s, status: 'no_show' as StopStatus } : s,
    );
    const nextIndex = trip.current_stop_index + 1;
    const allDone = stops.every(s =>
      s.stop_id === stopId ? true : ['dropped_off', 'no_show', 'picked_up'].includes(s.status),
    );
    persistTrip({
      ...trip,
      stops,
      current_stop_index: nextIndex,
      status: allDone ? 'completed' : trip.status,
    });
  }

  function handleDropOff(stopId: string) {
    if (!trip) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const stops = trip.stops.map(s =>
      s.stop_id === stopId ? { ...s, status: 'dropped_off' as StopStatus, actual_dropoff: now } : s,
    );
    const allDone = stops.every(s => s.status === 'dropped_off' || s.status === 'no_show');
    persistTrip({ ...trip, stops, status: allDone ? 'completed' : trip.status });
  }

  if (loading || !trip) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-[#5A6A7A]">Loading trip…</p>
      </div>
    );
  }

  if (trip.status === 'locked' || trip.status === 'unlocked') {
    return <TripStartScreen trip={trip} onStartTrip={handleStartTrip} />;
  }

  return (
    <ActiveTripView
      trip={trip}
      tripId={tripId}
      onConfirmPickup={handleConfirmPickup}
      onNoShow={handleNoShow}
      onDropOff={handleDropOff}
    />
  );
}
