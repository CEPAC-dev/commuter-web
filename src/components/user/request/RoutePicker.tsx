'use client';

import React, { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MapProvider, useMap } from '@/lib/MapContext';
import { IntentProvider, useIntent } from '@/lib/IntentContext';
import FloatingSearchBar from '@/components/user/map/FloatingSearchBar';
import type { GeoLocation } from '@/types/shared';
import type { ORSRoute } from '@/lib/openrouteservice';
import { useUserLocation } from '@/lib/useUserLocation';
import { reverseGeocode } from '@/lib/nominatim';
import { useState } from 'react';

const UserMap = dynamic(() => import('@/components/user/map/UserMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}>
      Loading map…
    </div>
  ),
});

// ── Props ──────────────────────────────────────────────────────────────────────

export interface RoutePickerResult {
  origin:      GeoLocation;
  destination: GeoLocation;
  stops:       GeoLocation[];
  route:       ORSRoute;
}

interface RoutePickerProps {
  /** "Set route" or "Edit return route" */
  mode:             'outbound' | 'return';
  slotNumber:       number;
  rideType:         'private' | 'shared';
  /** Pre-fill values */
  initialOrigin?:      GeoLocation | null;
  initialDestination?: GeoLocation | null;
  initialStops?:       GeoLocation[];
  onConfirm: (result: RoutePickerResult) => void;
  onCancel:  () => void;
}

// ── Inner component — must be inside MapProvider + IntentProvider ──────────────

function RoutePickerInner({
  mode,
  slotNumber,
  rideType,
  initialOrigin,
  initialDestination,
  onConfirm,
  onCancel,
}: RoutePickerProps) {
  const { origin, destination, stops, routes, setOrigin, setDestination, loading } = useMap();
  const { setIntent } = useIntent();
  const { lat: userLat, lng: userLng, locate } = useUserLocation();
  const [pendingLocField, setPendingLocField] = useState<'from' | 'to' | null>(null);

  // Push ride_type into intent so FloatingSearchBar shows stops for private only
  useEffect(() => {
    setIntent({ ride_type: rideType });
    // Disable stops for return-route picker
    if (mode === 'return') setIntent({ ride_type: 'shared' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideType, mode]);

  // Pre-fill
  useEffect(() => {
    if (initialOrigin)      setOrigin(initialOrigin);
    if (initialDestination) setDestination(initialDestination);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve pending GPS
  useEffect(() => {
    if (pendingLocField && userLat && userLng) {
      reverseGeocode(userLat, userLng).then(address => {
        const loc: GeoLocation = { address, lat: userLat, lng: userLng };
        if (pendingLocField === 'from') setOrigin(loc);
        else setDestination(loc);
        setPendingLocField(null);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLat, userLng, pendingLocField]);

  async function handleCurrentLocation(field: 'from' | 'to') {
    if (userLat && userLng) {
      const address = await reverseGeocode(userLat, userLng);
      const loc: GeoLocation = { address, lat: userLat, lng: userLng };
      if (field === 'from') setOrigin(loc);
      else setDestination(loc);
    } else {
      setPendingLocField(field);
      locate();
    }
  }

  const route = routes[0] ?? null;
  const canConfirm = !!origin && !!destination && route !== null && !loading;

  function handleConfirm() {
    if (!origin || !destination || !route) return;
    const filledStops = stops.filter((s): s is GeoLocation =>
      s !== null && (s as GeoLocation).lat !== 0
    );
    onConfirm({ origin: origin as GeoLocation, destination: destination as GeoLocation, stops: filledStops, route });
  }

  const headerTitle = mode === 'return'
    ? `Edit return route for Time slot ${slotNumber}`
    : `Set route for Time slot ${slotNumber}`;

  return (
    <div
      className="fixed inset-0 z-[900] bg-white flex flex-col"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] flex-shrink-0">
        <button
          onClick={onCancel}
          className="text-sm text-[#5A6A7A] hover:text-[#0B1E3D] transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← Cancel
        </button>
        <h2 className="text-sm font-semibold text-[#0B1E3D] flex-1">{headerTitle}</h2>
      </div>

      {/* Map area — floating search bar sits absolutely inside */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map fills the space */}
        <div className="absolute inset-0 z-0">
          <UserMap userLoc={userLat && userLng ? { lat: userLat, lng: userLng } : null} />
        </div>

        {/* Floating search bar */}
        <div className="absolute top-0 left-0 right-0 z-[1000]">
          <FloatingSearchBar onCurrentLocation={handleCurrentLocation} />
        </div>
      </div>

      {/* Bottom bar — confirm when route is ready */}
      <div
        className="px-4 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between flex-shrink-0"
        style={{ minHeight: 64 }}
      >
        {route ? (
          <>
            <div className="text-sm">
              <span className="font-semibold text-[#0B1E3D]">{route.distance_km.toFixed(1)} km</span>
              <span className="text-[#5A6A7A] ml-2">· ~{Math.round(route.duration_minutes)} min</span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="px-5 py-2.5 bg-[#00C2A8] text-[#0B1E3D] font-semibold rounded-xl text-sm disabled:opacity-40"
              style={{ border: 'none', cursor: canConfirm ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              Use this route ✓
            </button>
          </>
        ) : (
          <p className="text-sm text-[#5A6A7A]">
            {loading ? 'Calculating route…' : 'Search origin and destination to see route'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Public export — wraps with required providers ─────────────────────────────

export default function RoutePicker(props: RoutePickerProps) {
  return (
    <MapProvider>
      <IntentProvider>
        <Suspense>
          <RoutePickerInner {...props} />
        </Suspense>
      </IntentProvider>
    </MapProvider>
  );
}
