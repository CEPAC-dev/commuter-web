'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import driverApi from '@/lib/api/driver';
import type { CourseInstance } from '@/lib/api/courses';
import TripChatButton from '@/components/shared/TripChatButton';

const PickupMap = dynamic(() => import('@/components/map/PickupMap'), { ssr: false });

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  assigned:  { bg: '#E8F5E9', text: '#2E7D32' },
  completed: { bg: '#E3F2FD', text: '#1565C0' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
  pending:   { bg: '#FFF8E1', text: '#F57F17' },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-xs text-[#5A6A7A] flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-[#0B1E3D] text-end">{value}</span>
    </div>
  );
}

function fmt(t: string | null) {
  if (!t) return '—';
  return t.slice(0, 5);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-[#F1F5F9] bg-[#F8F9FA]">
        <h2 className="text-xs font-bold text-[#5A6A7A] uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

export default function DriverTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('my_cycles');
  const [trip, setTrip] = useState<CourseInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTrip, setStartingTrip] = useState(false);
  const [startMessage, setStartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (driverApi.getCycles() as Promise<{ data: CourseInstance[] } | CourseInstance[]>)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { data: CourseInstance[] }).data ?? [];
        const found = list.find((t) => String(t.id) === id);
        if (!found) throw new Error('Trip not found');
        setTrip(found);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStartTrip() {
    if (!trip || !id) return;

    setStartingTrip(true);
    setStartMessage(null);

    try {
      // Get current location
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      // Call the API to start the trip
      const response = await fetch(`/api/driver/trips/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.latitude,
          longitude: position.longitude,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to start trip');
      }

      await response.json();
      
      setStartMessage({
        type: 'success',
        text: 'Trip started successfully! Redirecting...',
      });

      // Update trip status
      setTrip((prev) => prev ? { ...prev, status: 'in_progress' } : null);
      
      // Redirect after a short delay
      setTimeout(() => router.push('/driver/my-cycles'), 1500);
    } catch (err) {
      const message = err instanceof GeolocationPositionError
        ? 'Unable to get your location. Please enable location services.'
        : err instanceof Error
        ? err.message
        : 'Failed to start trip';
      
      setStartMessage({
        type: 'error',
        text: message,
      });
      
      setStartingTrip(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="w-8 h-8 border-2 border-[#00C2A8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-[#E74C3C]">{error ?? t('trip_not_found') ?? 'Trip not found'}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[#00C2A8] font-semibold">← {t('common:back')}</button>
      </div>
    );
  }

  const ss = STATUS_COLOR[trip.status] ?? { bg: '#F1F5F9', text: '#5A6A7A' };

  const pickupPoint = trip.route?.from_latitude && trip.route?.from_longitude
    ? [{
        passenger_id: 'unknown',
        passenger_name: 'Passenger',
        passenger_gender: 'male' as const,
        lat: trip.route.from_latitude,
        lng: trip.route.from_longitude,
        address: trip.route.pickup_point ?? '',
        pickup_time_offset: 0,
      }]
    : [];

  const destination = trip.route?.to_latitude && trip.route?.to_longitude
    ? { lat: trip.route.to_latitude, lng: trip.route.to_longitude, label: trip.route.destination ?? 'Destination' }
    : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      {/* Header */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[#5A6A7A] mb-4 hover:text-[#0B1E3D]">
        ← {t('common:back')}
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-[#0B1E3D]">{`Trip #${trip.id}`}</h1>
          <p className="text-xs text-[#5A6A7A] mt-0.5">{trip.trip_date}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize"
          style={{ background: ss.bg, color: ss.text }}>
          {t(`status_${trip.status}` as const)}
        </span>
      </div>

      {/* Map */}
      {pickupPoint.length > 0 && destination && (
        <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] mb-4">
          <PickupMap
            pickupPoints={pickupPoint}
            destination={destination}
            height={260}
          />
        </div>
      )}

      {/* Route */}
      <Section title={t('route')}>
        <Row label={t('from')} value={trip.route?.pickup_point ?? '—'} />
        <Row label={t('to')} value={trip.route?.destination ?? '—'} />
        <Row label={t('distance')} value={trip.route?.expected_distance ? `${trip.route.expected_distance} km` : '—'} />
        <Row label={t('est_duration')} value={trip.route?.estimated_duration_minutes ? `${trip.route.estimated_duration_minutes} min` : '—'} />
      </Section>

      {/* Schedule */}
      <Section title={t('schedule')}>
        <Row label={t('date')} value={trip.trip_date} />
        <Row label={t('departure_window')} value={`${fmt(trip.start_time_from)} – ${fmt(trip.start_time_to)}`} />
        <Row label={t('arrival_window')} value={`${fmt(trip.end_time_from)} – ${fmt(trip.end_time_to)}`} />
        {trip.actual_start_time && <Row label={t('actual_start')} value={fmt(trip.actual_start_time)} />}
        {trip.actual_end_time && <Row label={t('actual_end')} value={fmt(trip.actual_end_time)} />}
      </Section>

      {/* Matching */}
      {(trip.matching_status || trip.matching_group_code || trip.matching_price) && (
        <Section title={t('matching')}>
          {trip.matching_status && <Row label={t('status')} value={trip.matching_status} />}
          {trip.matching_group_code && <Row label={t('group_code')} value={<span className="font-mono">{trip.matching_group_code}</span>} />}
          {trip.matching_price && <Row label={t('price')} value={`${trip.matching_price} EGP`} />}
          {trip.driver_price && <Row label={t('driver_price')} value={`${trip.driver_price} EGP`} />}
        </Section>
      )}

      {/* Participants */}
      {trip.participants && trip.participants.length > 0 && (
        <Section title={`${t('participants')} (${trip.participants.length})`}>
          {trip.participants.map((p, i) => (
            <Row
              key={i}
              label={`${p.type === 'user' ? `👤 ${t('user')}` : `👥 ${t('passenger')}`} #${p.user_id ?? p.passenger_id}`}
              value={p.seat_position ?? '—'}
            />
          ))}
        </Section>
      )}

      {/* Chat */}
      <div className="mb-4">
        <TripChatButton tripInstanceId={trip.id} role="driver" courseId={Number(id)} />
      </div>

      {/* Start Trip Button */}
      {(trip.status === 'assigned' || trip.status === 'pending') && (
        <>
          {startMessage && (
            <div
              className="mb-4 p-4 rounded-lg text-sm font-medium"
              style={{
                background: startMessage.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                color: startMessage.type === 'success' ? '#2E7D32' : '#C62828',
                border: `1px solid ${startMessage.type === 'success' ? '#C8E6C9' : '#FFCDD2'}`,
              }}
            >
              {startMessage.text}
            </div>
          )}
          <button
            onClick={handleStartTrip}
            disabled={startingTrip}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white mb-4"
            style={{
              background: startingTrip ? '#D0D5DD' : 'linear-gradient(135deg, #00C2A8 0%, #00A896 100%)',
              cursor: startingTrip ? 'not-allowed' : 'pointer',
              opacity: startingTrip ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {startingTrip ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                Starting trip…
              </span>
            ) : (
              '▶ Start Trip'
            )}
          </button>
        </>
      )}

      {/* Execution Timeline */}
      {trip.execution_timeline && trip.execution_timeline.length > 0 && (
        <Section title={t('execution_timeline')}>
          {trip.execution_timeline.map((ev) => (
            <Row
              key={ev.order}
              label={`${ev.order}. ${ev.type === 'pickup' ? 'Pickup' : 'Dropoff'}`}
              value={ev.user_id ? `${t('user')} #${ev.user_id}` : ev.passenger_id ? `${t('passenger')} #${ev.passenger_id}` : '—'}
            />
          ))}
        </Section>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
