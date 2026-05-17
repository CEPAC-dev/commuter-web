'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { WeekDay } from '@/types/shared';
import type { RideType } from '@/types/user';
import { MapProvider, useMap } from '@/lib/MapContext';
import { useIntent } from '@/lib/IntentContext';
import { useUserLocation } from '@/lib/useUserLocation';
import { reverseGeocode } from '@/lib/nominatim';
// Mock data removed
import { getNextAvailableCycleStart } from '@/lib/cycleUtils';
import { computeArrivalFrom, computeArrivalTo } from '@/lib/timeUtils';
import RequestForm, { type RequestFormData } from '@/components/user/request/RequestForm';
import FloatingSearchBar, { saveRecentRoute } from '@/components/user/map/FloatingSearchBar';

const UserMap = dynamic(() => import('@/components/user/map/UserMap'), { ssr: false });

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 12px' }}>
      <div style={{ width: 4, height: 20, background: '#00C2A8', borderRadius: 999, flexShrink: 0 }} />
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
    </div>
  );
}

interface RideFormInnerProps {
  rideType: RideType;
  backHref: string;
}

function RideFormInner({ rideType, backHref }: RideFormInnerProps) {
  const router = useRouter();
  const { intent } = useIntent();
  const { origin, destination, routes, setOrigin, setDestination, setStop } = useMap();
  const { lat: userLat, lng: userLng, locate } = useUserLocation();

  const isPrivate  = rideType === 'private';
  const distanceKm = routes[0]?.distance_km ?? 0;

  const [pickingField, setPickingField]     = useState<'from' | 'to' | 'stop' | null>(null);
  const [pickingStopIdx, setPickingStopIdx] = useState(-1);
  const [passengerCount, setPassengerCount] = useState(intent.passenger_count ?? 1);
  const [showErrors, setShowErrors]         = useState(false);

  const [formData, setFormData] = useState<RequestFormData>({
    ride_type:       rideType,
    seat_preference: 'any',
    start_date:      getNextAvailableCycleStart().toISOString().split('T')[0],
    days:            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as WeekDay[],
    time_slots: [
      {
        id: crypto.randomUUID(),
        trip_type: 'one_way' as const,
        origin: null,
        stops: [],
        destination: null,
        route: null,
        route_set: false,
        return_origin: null,
        return_destination: null,
        return_route: null,
        return_customized: false,
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as WeekDay[],
        pickup_from:  '07:00',
        pickup_to:    '07:30',
        arrival_from: computeArrivalFrom('07:30', 45),
        arrival_to:   computeArrivalTo('07:00', '07:30', 45),
      },
    ],
  });

  async function handleMapPick(lat: number, lng: number) {
    const address = await reverseGeocode(lat, lng);
    const loc = { address, lat, lng };
    if (pickingStopIdx >= 0) { setStop(pickingStopIdx, loc); setPickingStopIdx(-1); }
    else if (pickingField === 'from') setOrigin(loc);
    else if (pickingField === 'to') setDestination(loc);
    setPickingField(null);
  }

  async function handleCurrentLocation(field: 'from' | 'to') {
    if (userLat && userLng) {
      const address = await reverseGeocode(userLat, userLng);
      const loc = { address, lat: userLat, lng: userLng };
      if (field === 'from') setOrigin(loc); else setDestination(loc);
    } else {
      locate();
      toast('Getting your location…', { icon: '📡' });
    }
  }

  function handleReview() {
    if (!origin || !destination) {
      setShowErrors(true);
      toast.error('Please set origin and destination.');
      return;
    }
    if (origin && destination) saveRecentRoute(origin, destination);
    toast.success('Ride request submitted!');
    router.push('/user/my-requests');
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          onClick={() => router.push(backHref)}
          style={{ background: 'none', border: 'none', color: '#5A6A7A', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0B1E3D' }}>Plan your ride</h2>
        <span style={{
          background: isPrivate ? '#EFF7F6' : '#FFF8EC',
          color: isPrivate ? '#00C2A8' : '#F5A623',
          border: `1px solid ${isPrivate ? '#C8E8E4' : '#F5E2B0'}`,
          borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
        }}>
          {isPrivate ? 'Private' : 'Shared'}
        </span>
      </div>

      {/* Route section */}
      <SectionDivider title="Route" />

      {/* Map preview — 280px */}
      <div style={{ height: 280, borderRadius: 16, overflow: 'hidden', marginBottom: 16, position: 'relative', border: '1px solid #E2E8F0' }}>
        <UserMap
          userLoc={userLat && userLng ? { lat: userLat, lng: userLng } : null}
          pickingField={pickingField}
          onMapPick={handleMapPick}
          walk_minutes={0}
        />
        {(pickingField || pickingStopIdx >= 0) && (
          <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: '#0B1E3D', color: '#fff', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 10 }}>
            Tap the map to pick a location
            <button
              onClick={() => { setPickingField(null); setPickingStopIdx(-1); }}
              style={{ marginLeft: 10, background: 'none', border: 'none', color: '#A0AEC0', cursor: 'pointer', fontSize: 14 }}
            >✕</button>
          </div>
        )}
      </div>

      {/* Location inputs */}
      <FloatingSearchBar
        savedLocations={[]}
        onPickOnMap={(field) => setPickingField(field)}
        onCurrentLocation={handleCurrentLocation}
        onPickStopOnMap={(idx) => { setPickingStopIdx(idx); setPickingField('stop'); }}
      />

      {distanceKm > 0 && routes[0] && (
        <p style={{ fontSize: 13, color: '#5A6A7A', margin: '8px 0 0', paddingLeft: 4 }}>
          {distanceKm.toFixed(1)} km · ~{routes[0].duration_minutes} min
        </p>
      )}

      {/* Passengers — private only */}
      {isPrivate && (
        <>
          <SectionDivider title="Passengers" />
          <p style={{ fontSize: 14, color: '#0B1E3D', fontWeight: 500, margin: '0 0 4px' }}>
            How many people will ride with you?
          </p>
          <p style={{ fontSize: 12, color: '#5A6A7A', margin: '0 0 12px' }}>
            You + up to 3 others = 4 total max
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setPassengerCount(n)}
                style={{
                  width: 56, height: 56, borderRadius: 12,
                  border: `2px solid ${passengerCount === n ? '#00C2A8' : '#E2E8F0'}`,
                  background: passengerCount === n ? '#EFF7F6' : '#fff',
                  color: passengerCount === n ? '#0B1E3D' : '#5A6A7A',
                  fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#5A6A7A', margin: '8px 0 0' }}>
            + you = {passengerCount + 1} people in total
          </p>
        </>
      )}

      {/* Schedule + pricing via RequestForm */}
      <RequestForm
        data={formData}
        onChange={setFormData}
        onReview={handleReview}
        showErrors={showErrors}
        distanceKm={distanceKm}
        lockedToPrivate={isPrivate}
        walkMinutes={0}
      />
    </div>
  );
}

interface RideFormPageProps {
  rideType: RideType;
  backHref: string;
}

export default function RideFormPage({ rideType, backHref }: RideFormPageProps) {
  return (
    <MapProvider>
      <RideFormInner rideType={rideType} backHref={backHref} />
    </MapProvider>
  );
}
