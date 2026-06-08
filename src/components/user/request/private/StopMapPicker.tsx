'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { MapProvider, useMap } from '@/lib/MapContext';
import { IntentProvider } from '@/lib/IntentContext';
import { searchAddress, formatDisplayName, getPlaceDetails, reverseGeocode, type NominatimResult } from '@/lib/nominatim';
import type { GeoLocation } from '@/types/shared';
import { useTranslations } from 'next-intl';

const UserMap = dynamic(
  () => import('@/components/user/map/UserMap'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ width: '100%', height: '100%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}
      >
        Loading map…
      </div>
    ),
  },
);

export interface StopMapPickerProps {
  title:     string;
  initial?:  GeoLocation | null;
  onConfirm: (loc: GeoLocation) => void;
  onCancel:  () => void;
}

// ── Inner component (must be inside MapProvider) ──────────────────────────────

function StopMapPickerInner({ title, initial, onConfirm, onCancel }: StopMapPickerProps) {
  const ts = useTranslations('stop_map_picker');
  const tc = useTranslations('common');
  const tm = useTranslations('map');
  const { setOrigin } = useMap();

  const [selected,  setSelected]  = useState<GeoLocation | null>(initial ?? null);
  const [query,     setQuery]     = useState(initial?.address ?? '');
  const [results,   setResults]   = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Show initial point on map
  useEffect(() => {
    if (initial) setOrigin(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced address search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (selected && selected.address === query) { setResults([]); return; }
    if (query.trim().length < 3) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try { setResults(await searchAddress(query)); } finally { setSearching(false); }
    }, 280);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function pickFromSearch(r: NominatimResult) {
    const { lat, lng } = await getPlaceDetails(r.place_id);
    const address = formatDisplayName(r.display_name);
    const loc: GeoLocation = { address, lat, lng };
    setSelected(loc);
    setOrigin(loc);
    setQuery(address);
    setResults([]);
  }

  async function handleMapPick(lat: number, lng: number) {
    setResolving(true);
    try {
      const address = await reverseGeocode(lat, lng);
      const loc: GeoLocation = { address, lat, lng };
      setSelected(loc);
      setOrigin(loc);
      setQuery(address);
      setResults([]);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[900] bg-white flex flex-col"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[#5A6A7A] hover:text-[#0B1E3D] transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← {tc('cancel')}
        </button>
        <h2 className="text-sm font-semibold text-[#0B1E3D] flex-1">{title}</h2>
      </div>

      {/* ── Map + search overlay ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map */}
        <div className="absolute inset-0 z-0">
          <UserMap
            userLoc={null}
            pickingField="stop"
            onMapPick={handleMapPick}
          />
        </div>

        {/* Search field */}
        <div className="absolute top-3 left-3 right-3 z-[1000]">
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center px-3 py-2 gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA0A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                placeholder={ts('search')}
                className="flex-1 text-sm text-[#0B1E3D] focus:outline-none"
                style={{ border: 'none', background: 'none', fontFamily: 'inherit' }}
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSelected(null); setResults([]); setOrigin(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0A6" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            {searching && (
              <div className="px-3 py-2 border-t border-[#F1F3F4]">
                <p className="text-xs text-[#9AA0A6]">{tm('searching')}</p>
              </div>
            )}

            {results.length > 0 && (
              <ul className="border-t border-[#F1F3F4] divide-y divide-[#F1F3F4] max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onClick={() => pickFromSearch(r)}
                      className="w-full text-left px-3 py-2.5 text-xs text-[#0B1E3D] hover:bg-[#EFF7F6]"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {formatDisplayName(r.display_name)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Resolving overlay */}
        {resolving && (
          <div className="absolute inset-0 z-[800] flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-xl px-4 py-3 text-sm text-[#0B1E3D] font-medium shadow-lg">
              Getting address…
            </div>
          </div>
        )}

        {/* Tap hint — shown until a point is picked */}
        {!selected && !resolving && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
            <div className="bg-[#0B1E3D]/80 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow">
              Tap the map to place stop
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom confirm bar ── */}
      <div
        className="px-4 py-3 border-t border-[#E2E8F0] bg-white flex-shrink-0"
        style={{ minHeight: 64 }}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#5A6A7A] mb-0.5">Selected stop</p>
              <p className="text-sm font-semibold text-[#0B1E3D] truncate">📍 {selected.address}</p>
            </div>
            <button
              type="button"
              onClick={() => onConfirm(selected)}
              className="flex-shrink-0 px-5 py-2.5 bg-[#00C2A8] text-[#0B1E3D] font-semibold rounded-xl text-sm"
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Use this stop ✓
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#5A6A7A] text-center">
            Tap the map or search to select a stop
          </p>
        )}
      </div>
    </div>
  );
}

// ── Public wrapper (provides MapProvider + IntentProvider) ────────────────────

export default function StopMapPicker(props: StopMapPickerProps) {
  return (
    <MapProvider>
      <IntentProvider>
        <StopMapPickerInner {...props} />
      </IntentProvider>
    </MapProvider>
  );
}
