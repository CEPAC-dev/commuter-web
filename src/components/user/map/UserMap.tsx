'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, OverlayView } from '@react-google-maps/api';
import { MAP_STYLE } from '@/lib/googleMapsStyle';
import { useMap } from '@/lib/MapContext';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const CAIRO = { lat: 30.0444, lng: 31.2357 };

const CAIRO_BOUNDS = { north: 30.35, south: 29.75, east: 31.90, west: 30.75 };
function isInCairo(lat: number, lng: number) {
  return lat >= CAIRO_BOUNDS.south && lat <= CAIRO_BOUNDS.north &&
         lng >= CAIRO_BOUNDS.west  && lng <= CAIRO_BOUNDS.east;
}

// ── SVG marker icons ──────────────────────────────────────────────────────────

// Origin: green circle + thick white ring  → clearly visible on any background
const originIconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">` +
  `<circle cx="22" cy="22" r="21" fill="white"/>` +
  `<circle cx="22" cy="22" r="17" fill="#22C55E"/>` +
  `<circle cx="22" cy="22" r="7.5" fill="white"/>` +
  `<circle cx="22" cy="22" r="4.5" fill="#14532D"/>` +
  `</svg>`
)}`;

// Destination: red teardrop + thick white outer path  → unmistakable pin shape
const destinationIconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="50">` +
  `<path d="M18 0C8.06 0 0 8.06 0 18c0 13.05 18 32 18 32S36 31.05 36 18C36 8.06 27.94 0 18 0z" fill="white"/>` +
  `<path d="M18 4C10.27 4 4 10.27 4 18c0 11.04 14 28 14 28S32 29.04 32 18C32 10.27 25.73 4 18 4z" fill="#EF4444"/>` +
  `<circle cx="18" cy="18" r="6.5" fill="white"/>` +
  `<circle cx="18" cy="18" r="3.5" fill="#7F1D1D"/>` +
  `</svg>`
)}`;

// Via-stop: amber circle + thick white ring + bold number
function makeStopIcon(n: number) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34">` +
    `<circle cx="17" cy="17" r="16" fill="white"/>` +
    `<circle cx="17" cy="17" r="13" fill="#F59E0B"/>` +
    `<text x="17" y="22" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800" fill="white">${n}</text>` +
    `</svg>`
  )}`;
}

interface UserMapProps {
  userLoc: { lat: number; lng: number } | null;
  userHeading?: number | null;
  userAccuracy?: number | null;
  liveTracking?: boolean;
  onLocateMe?: () => void;
  pickingField?: 'from' | 'to' | 'stop' | null;
  onMapPick?: (lat: number, lng: number) => void;
  walk_minutes?: 0 | 5 | 10;
}

export default function UserMap({
  userLoc,
  userHeading = null,
  userAccuracy = null,
  liveTracking = false,
  pickingField = null,
  onMapPick,
  walk_minutes = 0,
}: UserMapProps) {
  const t = useTranslations('map');
  const { origin: from, destination: to, routes, stops } = useMap();
  const viaStops = stops.filter((s): s is NonNullable<typeof s> => s !== null);
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: API_KEY });
  const mapRef      = useRef<google.maps.Map | null>(null);
  const prevFrom    = useRef<typeof from>(null);
  const prevTo      = useRef<typeof to>(null);
  // Tracks all live Polyline instances so we can call .setMap(null) imperatively
  const polyRefs    = useRef<google.maps.Polyline[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(13);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.addListener('zoom_changed', () => setZoom(map.getZoom() ?? 13));
    setMapReady(true);
  }, []);

  // Smooth pan when origin changes
  useEffect(() => {
    if (from && from !== prevFrom.current && mapRef.current) {
      mapRef.current.panTo({ lat: from.lat, lng: from.lng });
      if ((mapRef.current.getZoom() ?? 0) < 14) mapRef.current.setZoom(14);
    }
    prevFrom.current = from;
  }, [from]);

  // Smooth pan when destination changes
  useEffect(() => {
    if (to && to !== prevTo.current && mapRef.current) {
      mapRef.current.panTo({ lat: to.lat, lng: to.lng });
      if ((mapRef.current.getZoom() ?? 0) < 14) mapRef.current.setZoom(14);
    }
    prevTo.current = to;
  }, [to]);

  // ── Imperative Polyline management ─────────────────────────────────────────
  // We intentionally avoid <Polyline> JSX because @react-google-maps/api does
  // NOT reliably call setMap(null) on unmount, leaving stale overlays on canvas.
  // Instead we create/destroy google.maps.Polyline instances directly so that
  // the overlay is ALWAYS removed when routes becomes empty.
  useEffect(() => {
    // Destroy every existing overlay unconditionally
    polyRefs.current.forEach(p => p.setMap(null));
    polyRefs.current = [];

    if (!mapReady || !mapRef.current || routes.length === 0) return;

    const map = mapRef.current;
    const newLines: google.maps.Polyline[] = [];
    const route = routes[0];

    if (route && route.coordinates.length > 1) {
      const path = route.coordinates.map(([lat, lng]) => ({ lat, lng }));

      // Outer glow halo
      newLines.push(new google.maps.Polyline({
        map, path, zIndex: 1,
        strokeColor: '#4361EE', strokeWeight: 16, strokeOpacity: 0.12,
      }));
      // Inner glow
      newLines.push(new google.maps.Polyline({
        map, path, zIndex: 2,
        strokeColor: '#4361EE', strokeWeight: 9, strokeOpacity: 0.2,
      }));
      // Solid line
      newLines.push(new google.maps.Polyline({
        map, path, zIndex: 3,
        strokeColor: '#4361EE', strokeWeight: 5, strokeOpacity: 1,
      }));
    }

    polyRefs.current = newLines;

    return () => {
      newLines.forEach(p => p.setMap(null));
      polyRefs.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, mapReady]);

  // ── Fit viewport to primary route ──────────────────────────────────────────
  const primaryRoute = routes[0] ?? null;
  const primaryLen   = primaryRoute?.coordinates.length ?? 0;
  useEffect(() => {
    if (!mapRef.current || primaryLen === 0) return;
    const bounds = new google.maps.LatLngBounds();
    primaryRoute.coordinates.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    mapRef.current.fitBounds(bounds, 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryLen]);

  const handleClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (pickingField && onMapPick && e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (!isInCairo(lat, lng)) {
        toast.error(t('cairo_only'));
        return;
      }
      onMapPick(lat, lng);
    }
  }, [pickingField, onMapPick]);

  // Midpoint of primary route for the distance/time badge
  const midCoord = primaryRoute && primaryRoute.coordinates.length > 0
    ? primaryRoute.coordinates[Math.floor(primaryRoute.coordinates.length / 2)]
    : null;

  if (!isLoaded) {
    return (
      <div className="map-container" style={{ background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}>
        Loading map…
      </div>
    );
  }

  // Linear scale: zoom 9 → 0.60×  |  zoom 13 → 1.00×  |  zoom 18 → 1.50×
  const zf     = Math.max(0.60, Math.min(1.50, 0.60 + (zoom - 9) / 10));
  const origS  = Math.round(44 * zf);   // circle  44 px base
  const stopS  = Math.round(34 * zf);   // circle  34 px base
  const destW  = Math.round(36 * zf);   // teardrop 36×50 base
  const destH  = Math.round(50 * zf);

  // Custom pin cursor SVG — 32×44px teardrop, hotspot at tip (16, 44)
  const PIN_CURSOR = `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44">'
    + '<path d="M16 0C7.16 0 0 7.16 0 16c0 11.6 16 28 16 28S32 27.6 32 16C32 7.16 24.84 0 16 0z" fill="%2300C2A8"/>'
    + '<circle cx="16" cy="16" r="7" fill="white"/>'
    + '<circle cx="16" cy="16" r="4" fill="%230B1E3D"/>'
    + '</svg>'
  )}") 16 44, crosshair`;

  return (
    <div
      className="map-container"
      style={{ cursor: pickingField ? PIN_CURSOR : undefined }}
      data-picking={pickingField ? 'true' : undefined}
    >
      {/* Inject a style override so Google Maps' inner divs/canvas inherit our cursor */}
      {pickingField && (
        <style>{`
          .map-container[data-picking] div,
          .map-container[data-picking] canvas {
            cursor: inherit !important;
          }
        `}</style>
      )}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={CAIRO}
        zoom={13}
        onLoad={onLoad}
        onClick={handleClick}
        options={{
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          scrollwheel: true,
          zoomControl: false,       // use our custom controls
          gestureHandling: 'greedy',
          restriction: {
            latLngBounds: CAIRO_BOUNDS,
            strictBounds: false,
          },
          minZoom: 9,
        }}
      >
        {/* ── Alternative routes & primary route are rendered imperatively ── */}
        {/* (via useEffect + google.maps.Polyline above; no JSX Polylines here) */}

        {/* ── Walk-radius circle around origin ────────────────── */}
        {from && walk_minutes > 0 && (
          <Circle
            center={{ lat: from.lat, lng: from.lng }}
            radius={walk_minutes === 10 ? 800 : 400}
            options={{
              strokeColor: '#4361EE', strokeOpacity: 0.55, strokeWeight: 1.5,
              fillColor: '#4361EE', fillOpacity: 0.07,
            }}
          />
        )}

        {/* ── Origin marker ────────────────────────────────────── */}
        {from && (
          <Marker
            position={{ lat: from.lat, lng: from.lng }}
            icon={{ url: originIconUrl, scaledSize: new google.maps.Size(origS, origS), anchor: new google.maps.Point(origS / 2, origS / 2) }}
            zIndex={20}
          />
        )}

        {/* ── Via stop markers (amber numbered) ─────────────── */}
        {viaStops.map((s, i) => (
          <Marker
            key={`stop-${i}`}
            position={{ lat: s.lat, lng: s.lng }}
            icon={{
              url: makeStopIcon(i + 1),
              scaledSize: new google.maps.Size(stopS, stopS),
              anchor: new google.maps.Point(stopS / 2, stopS / 2),
            }}
            zIndex={15}
          />
        ))}

        {/* ── Destination marker ───────────────────────────────── */}
        {to && (
          <Marker
            position={{ lat: to.lat, lng: to.lng }}
            icon={{ url: destinationIconUrl, scaledSize: new google.maps.Size(destW, destH), anchor: new google.maps.Point(destW / 2, destH) }}
            zIndex={20}
          />
        )}

        {/* ── Accuracy circle ──────────────────────────────────── */}
        {userLoc && userAccuracy != null && userAccuracy < 500 && (
          <Circle
            center={{ lat: userLoc.lat, lng: userLoc.lng }}
            radius={userAccuracy}
            options={{
              strokeColor: '#4361EE', strokeOpacity: 0.35, strokeWeight: 1,
              fillColor: '#4361EE', fillOpacity: 0.06,
            }}
          />
        )}

        {/* ── Live GPS dot with optional heading cone ───────────── */}
        {userLoc && (
          <OverlayView
            position={{ lat: userLoc.lat, lng: userLoc.lng }}
            mapPaneName="floatPane"
            getPixelPositionOffset={() => ({ x: -20, y: -20 })}
          >
            <div className="gps-overlay">
              {/* Heading cone — only show when heading is available */}
              {userHeading != null && (
                <div
                  className="gps-heading-cone"
                  style={{ transform: `rotate(${userHeading}deg)` }}
                />
              )}
              {liveTracking && <div className="gps-ring" />}
              {liveTracking && <div className="gps-ring gps-ring-delay" />}
              <div className="gps-core" />
            </div>
          </OverlayView>
        )}

        {/* ── Route distance/time badge at midpoint ────────────── */}
        {midCoord && primaryRoute && (
          <OverlayView
            position={{ lat: midCoord[0], lng: midCoord[1] }}
            mapPaneName="overlayMouseTarget"
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h + 10) })}
          >
            <div className="route-badge">
              <span className="route-badge-km">{primaryRoute.distance_km} km</span>
              <span className="route-badge-sep">·</span>
              <span>{primaryRoute.duration_minutes} min</span>
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* ── Custom brand-styled zoom controls ───────────────────── */}
      <div className="map-zoom-controls">
        <button
          className="map-zoom-btn"
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) + 1)}
          aria-label="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="map-zoom-divider" />
        <button
          className="map-zoom-btn"
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) - 1)}
          aria-label="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

