'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizard } from '@/lib/RequestWizardContext';
import { MapProvider, useMap } from '@/lib/MapContext';
import { searchAddress, formatDisplayName, getPlaceDetails } from '@/lib/nominatim';
import type { GeoLocation } from '@/types/shared';
import type { NominatimResult } from '@/lib/nominatim';
import { useTranslations } from 'next-intl';

function ReturnMapLoading() {
  const t = useTranslations('return_map');
  return (
    <div style={{ width: '100%', height: '100%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}>
      {t('loading')}
    </div>
  );
}

const UserMap = dynamic(() => import('@/components/user/map/UserMap'), {
  ssr: false,
  loading: () => <ReturnMapLoading />,
});

// ── Minimal location field ────────────────────────────────────────────────────

interface LocFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onSelect: (r: NominatimResult) => void;
  onClear: () => void;
  results: NominatimResult[];
  loading: boolean;
  placeholder: string;
}

function LocField({ label, icon, value, onChange, onSelect, onClear, results, loading, placeholder }: LocFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F8F9FA', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9AA0A6', width: 28, flexShrink: 0 }}>{label}</span>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#0B1E3D', fontFamily: 'inherit' }}
        />
        {loading && <span style={{ fontSize: 12, color: '#9AA0A6' }}>…</span>}
        {value && !loading && (
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9AA0A6', fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0 }}>
            ✕
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 600, maxHeight: 200, overflowY: 'auto' }}>
          {results.map(r => (
            <button
              key={r.place_id}
              onClick={() => { onSelect(r); setOpen(false); }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', fontSize: 13, color: '#0B1E3D', cursor: 'pointer', fontFamily: 'inherit', borderBottom: '1px solid #F1F3F4' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8F9FA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              📍 {formatDisplayName(r.display_name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────

function ReturnMapInner() {
  const t = useTranslations('return_map');
  const tLive = useTranslations('trip_live');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slotId') ?? '';

  const wizard = useWizard();
  const { setOrigin, setDestination, routes, loading: routeLoading } = useMap();

  // Pre-fill from wizard: swapped origin/destination
  const prefillOrigin = wizard.return_routes[slotId]?.origin ?? wizard.destination;
  const prefillDest   = wizard.return_routes[slotId]?.destination ?? wizard.origin;

  const [fromText, setFromText] = useState(prefillOrigin?.address ?? '');
  const [toText, setToText]     = useState(prefillDest?.address ?? '');
  const [fromResults, setFromResults] = useState<NominatimResult[]>([]);
  const [toResults, setToResults]     = useState<NominatimResult[]>([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading]     = useState(false);
  const [localOrigin, setLocalOrigin] = useState<GeoLocation | null>(prefillOrigin ?? null);
  const [localDest, setLocalDest]     = useState<GeoLocation | null>(prefillDest ?? null);

  const timers = useRef<{ [k: string]: ReturnType<typeof setTimeout> }>({});

  // Apply pre-fill to map context
  useEffect(() => {
    if (prefillOrigin) setOrigin(prefillOrigin);
    if (prefillDest)   setDestination(prefillDest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function debounce(key: string, query: string, setResults: (r: NominatimResult[]) => void, setLoad: (b: boolean) => void) {
    clearTimeout(timers.current[key]);
    if (query.length < 3) { setResults([]); return; }
    timers.current[key] = setTimeout(async () => {
      setLoad(true);
      try { setResults(await searchAddress(query)); } catch { setResults([]); } finally { setLoad(false); }
    }, 450);
  }

  function handleFromInput(v: string) { setFromText(v); setLocalOrigin(null); debounce('from', v, setFromResults, setFromLoading); }
  async function selectFrom(r: NominatimResult) {
    const addr = formatDisplayName(r.display_name); setFromText(addr); setFromResults([]);
    setFromLoading(true);
    try { const d = await getPlaceDetails(r.place_id); const loc = { address: addr, lat: d.lat, lng: d.lng }; setLocalOrigin(loc); setOrigin(loc); } finally { setFromLoading(false); }
  }
  function clearFrom() { setFromText(''); setFromResults([]); setLocalOrigin(null); setOrigin(null); }

  function handleToInput(v: string) { setToText(v); setLocalDest(null); debounce('to', v, setToResults, setToLoading); }
  async function selectTo(r: NominatimResult) {
    const addr = formatDisplayName(r.display_name); setToText(addr); setToResults([]);
    setToLoading(true);
    try { const d = await getPlaceDetails(r.place_id); const loc = { address: addr, lat: d.lat, lng: d.lng }; setLocalDest(loc); setDestination(loc); } finally { setToLoading(false); }
  }
  function clearTo() { setToText(''); setToResults([]); setLocalDest(null); setDestination(null); }

  const route = routes[0] ?? null;
  const canSave = !!localOrigin && !!localDest && route !== null && !routeLoading;

  function handleSave() {
    if (!localOrigin || !localDest || !route || !slotId) return;
    const isCustomized =
      localOrigin.address !== wizard.destination?.address ||
      localDest.address   !== wizard.origin?.address;
    wizard.setReturnRoute(slotId, {
      origin:      localOrigin,
      destination: localDest,
      route,
      customized:  isCustomized,
    });
    router.push('/user/request/schedule');
  }

  // Slot number from wizard
  const slotIndex = wizard.time_slots.findIndex(s => s.id === slotId);
  const slotLabel = slotIndex >= 0 ? tLive('time_slot', { n: slotIndex + 1 }) : tLive('this_time_slot');

  return (
    <div dir="ltr" style={{ width: '100vw', height: 'calc(100dvh - 64px)', overflow: 'hidden', position: 'relative' }}>

      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <UserMap userLoc={null} />
      </div>

      {/* Floating panel */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 500, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', padding: 12, maxWidth: 440 }}>

        {/* Info bar */}
        <div style={{ background: '#EFF7F6', borderLeft: '3px solid #00C2A8', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D', marginBottom: 2 }}>
            ↩ {t('title', { slot: slotLabel })}
          </p>
          <p style={{ fontSize: 11, color: '#5A6A7A' }}>
            {t('swapped_note')}
          </p>
        </div>

        {/* FROM */}
        <LocField
          label={t('from')}
          icon={<div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0B1E3D', border: '2.5px solid #00C2A8' }} />}
          value={fromText}
          onChange={handleFromInput}
          onSelect={selectFrom}
          onClear={clearFrom}
          results={fromResults}
          loading={fromLoading}
          placeholder={t('origin_placeholder')}
        />

        <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />

        {/* TO */}
        <LocField
          label={t('to')}
          icon={<div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C2A8' }} />}
          value={toText}
          onChange={handleToInput}
          onSelect={selectTo}
          onClear={clearTo}
          results={toResults}
          loading={toLoading}
          placeholder={t('dest_placeholder')}
        />
      </div>

      {/* Bottom bar */}
      {route && (
        <div
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500, background: '#fff', borderTop: '1px solid #E2E8F0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          className="sm:bottom-0 bottom-16"
        >
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D' }}>{route.distance_km.toFixed(1)} {tCommon('km')}</span>
            <span style={{ fontSize: 14, color: '#5A6A7A', marginLeft: 8 }}>· ~{Math.round(route.duration_minutes)} {tCommon('min')}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ padding: '10px 24px', background: '#00C2A8', color: '#0B1E3D', fontWeight: 700, borderRadius: 12, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('use_route')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function ReturnMapPage() {
  return (
    <MapProvider>
      <Suspense>
        <ReturnMapInner />
      </Suspense>
    </MapProvider>
  );
}
