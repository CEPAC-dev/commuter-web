'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizard } from '@/lib/RequestWizardContext';
import { MapProvider, useMap } from '@/lib/MapContext';
import { IntentProvider, useIntent } from '@/lib/IntentContext';
import { useUserLocation } from '@/lib/useUserLocation';
import { reverseGeocode } from '@/lib/nominatim';
import FloatingSearchBar from '@/components/user/map/FloatingSearchBar';
import type { GeoLocation } from '@/types/shared';
import { useTranslations } from 'next-intl';

function MapLoading() {
  const t = useTranslations('request_map');
  return (
    <div style={{ width: '100%', height: '100%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}>
      {t('loading')}
    </div>
  );
}

const UserMap = dynamic(() => import('@/components/user/map/UserMap'), {
  ssr: false,
  loading: () => <MapLoading />,
});

// ── Inner map page — must be inside MapProvider + IntentProvider ─────────────

function MapPageInner() {
  const t = useTranslations('request_map');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideType = (searchParams.get('type') as 'private' | 'shared') ?? 'shared';
  const isEdit = searchParams.get('edit') === 'true';

  const wizard = useWizard();
  const { setRoute: saveToWizard } = wizard;
  const { origin, destination, stops, setOrigin, setDestination, routes, loading: routeLoading, error: routeError } = useMap();
  const { setIntent } = useIntent();
  const { lat: userLat, lng: userLng, locate } = useUserLocation();
  const [pendingLocField, setPendingLocField] = useState<'from' | 'to' | null>(null);

  // Set ride type in intent so FloatingSearchBar shows stops for private only
  useEffect(() => {
    setIntent({ ride_type: rideType });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideType]);

  // Pre-fill when editing existing route
  useEffect(() => {
    if (isEdit && wizard.origin) setOrigin(wizard.origin);
    if (isEdit && wizard.destination) setDestination(wizard.destination);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve pending GPS field
  useEffect(() => {
    if (pendingLocField && userLat && userLng) {
      reverseGeocode(userLat, userLng).then(address => {
        const loc = { address, lat: userLat, lng: userLng };
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
      const loc = { address, lat: userLat, lng: userLng };
      if (field === 'from') setOrigin(loc);
      else setDestination(loc);
    } else {
      setPendingLocField(field);
      locate();
    }
  }

  function handleContinue() {
    if (!origin || !destination || routes.length === 0) return;
    const filledStops = stops.filter((s): s is GeoLocation => s !== null && (s as GeoLocation).lat !== 0);
    saveToWizard(origin as GeoLocation, destination as GeoLocation, filledStops, routes[0]);
    router.push('/user/request/schedule');
  }

  const route = routes[0] ?? null;
  const canContinue = !!origin && !!destination && route !== null && !routeLoading;

  return (
    <div dir="ltr" style={{ width: '100vw', height: 'calc(100dvh - 64px)', overflow: 'hidden', position: 'relative' }}>
      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <UserMap userLoc={userLat && userLng ? { lat: userLat, lng: userLng } : null} />
      </div>

      {/* Floating search bar — handles From / stops (private only) / To + suggestions */}
      <FloatingSearchBar onCurrentLocation={handleCurrentLocation} />

      {/* Bottom bar — shown when a route is calculated or an error occurred */}
      {(route || routeError) && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 500,
            background: '#fff',
            borderTop: '1px solid #E2E8F0',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className="sm:bottom-0 bottom-16"
        >
          {route ? (
            <>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D' }}>
                  {route.distance_km.toFixed(1)} {tCommon('km')}
                </span>
                <span style={{ fontSize: 14, color: '#5A6A7A', marginLeft: 8 }}>
                  · ~{Math.round(route.duration_minutes)} {tCommon('min')}
                </span>
              </div>
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                style={{
                  padding: '10px 24px',
                  background: '#00C2A8',
                  color: '#0B1E3D',
                  fontWeight: 700,
                  borderRadius: 12,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t('continue')}
              </button>
            </>
          ) : (
            <p style={{ fontSize: 14, color: '#EF4444' }}>{routeError}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page — wraps with IntentProvider + MapProvider ────────────────────────────

export default function RequestMapPage() {
  return (
    <IntentProvider>
      <MapProvider>
        <Suspense>
          <MapPageInner />
        </Suspense>
      </MapProvider>
    </IntentProvider>
  );
}

