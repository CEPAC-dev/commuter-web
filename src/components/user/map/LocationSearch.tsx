'use client';

import { useState, useRef, useCallback } from 'react';
import { searchAddress, formatDisplayName, getPlaceDetails, type NominatimResult } from '@/lib/nominatim';
import type { SavedLocation } from '@/types/user';
import { useTranslations } from 'next-intl';

interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  from: LocationValue | null;
  to: LocationValue | null;
  onFromChange: (v: LocationValue | null) => void;
  onToChange: (v: LocationValue | null) => void;
  savedLocations?: SavedLocation[];
}

export default function LocationSearch({
  from,
  to,
  onFromChange,
  onToChange,
  savedLocations = [],
}: LocationSearchProps) {
  const tls = useTranslations('location_search');
  const tm = useTranslations('map');
  const [fromText, setFromText] = useState(from?.address ?? '');
  const [toText, setToText] = useState(to?.address ?? '');
  const [fromResults, setFromResults] = useState<NominatimResult[]>([]);
  const [toResults, setToResults] = useState<NominatimResult[]>([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);

  const fromTimer = useRef<ReturnType<typeof setTimeout>>();
  const toTimer = useRef<ReturnType<typeof setTimeout>>();

  const debounceSearch = useCallback(
    (
      query: string,
      setResults: (r: NominatimResult[]) => void,
      setLoading: (b: boolean) => void,
      timer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>
    ) => {
      clearTimeout(timer.current);
      if (query.length < 3) {
        setResults([]);
        return;
      }
      timer.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await searchAddress(query);
          setResults(results);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 500);
    },
    []
  );

  function handleFromInput(val: string) {
    setFromText(val);
    onFromChange(null);
    debounceSearch(val, setFromResults, setFromLoading, fromTimer);
  }

  function handleToInput(val: string) {
    setToText(val);
    onToChange(null);
    debounceSearch(val, setToResults, setToLoading, toTimer);
  }

  async function selectFrom(result: NominatimResult) {
    const addr = formatDisplayName(result.display_name);
    setFromText(addr);
    setFromLoading(true);
    try {
      const details = await getPlaceDetails(result.place_id);
      setFromResults([]);
      onFromChange({ address: addr, lat: details.lat, lng: details.lng });
    } catch {
      setFromResults([]);
    } finally {
      setFromLoading(false);
      setActiveField(null);
    }
  }

  async function selectTo(result: NominatimResult) {
    const addr = formatDisplayName(result.display_name);
    setToText(addr);
    setToLoading(true);
    try {
      const details = await getPlaceDetails(result.place_id);
      setToResults([]);
      onToChange({ address: addr, lat: details.lat, lng: details.lng });
    } catch {
      setToResults([]);
    } finally {
      setToLoading(false);
      setActiveField(null);
    }
  }

  function selectSavedFrom(loc: SavedLocation) {
    setFromText(loc.address);
    setFromResults([]);
    onFromChange({ address: loc.address, lat: loc.lat, lng: loc.lng });
    setActiveField(null);
  }

  function selectSavedTo(loc: SavedLocation) {
    setToText(loc.address);
    setToResults([]);
    onToChange({ address: loc.address, lat: loc.lat, lng: loc.lng });
    setActiveField(null);
  }

  function clearFrom() {
    setFromText('');
    setFromResults([]);
    onFromChange(null);
  }

  function clearTo() {
    setToText('');
    setToResults([]);
    onToChange(null);
  }

  function swap() {
    const prevFrom = from;
    const prevTo = to;
    const prevFromText = fromText;
    const prevToText = toText;
    setFromText(prevToText);
    setToText(prevFromText);
    onFromChange(prevTo);
    onToChange(prevFrom);
    setFromResults([]);
    setToResults([]);
  }

  const savedLocationIcons: Record<string, string> = {
    home: '🏠',
    work: '🏢',
    custom: '📍',
  };

  const showFromDropdown =
    activeField === 'from' && (fromResults.length > 0 || (fromText.length === 0 && savedLocations.length > 0));
  const showToDropdown =
    activeField === 'to' && (toResults.length > 0 || (toText.length === 0 && savedLocations.length > 0));

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .lsearch-input { width: 100%; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 10px 36px 10px 12px; font-size: 14px; font-family: inherit; color: #0B1E3D; background: #fff; outline: none; transition: border-color 0.15s, background 0.15s; }
        .lsearch-input:focus { border-color: #00C2A8; background: #EFF7F6; }
        .lsearch-result { padding: 10px 12px; cursor: pointer; font-size: 14px; color: #0B1E3D; border-radius: 6px; }
        .lsearch-result:hover { background: #EFF7F6; }
        .lsearch-saved { padding: 10px 12px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; border-radius: 6px; }
        .lsearch-saved:hover { background: #EFF7F6; }
      `}</style>

      {/* From input */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C2A8', border: '2px solid #0B1E3D', flexShrink: 0 }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tls('from')}</label>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            className="lsearch-input"
            type="text"
            placeholder={tls('pickup_placeholder')}
            value={fromText}
            onChange={(e) => handleFromInput(e.target.value)}
            onFocus={() => setActiveField('from')}
            onBlur={() => setTimeout(() => setActiveField((a) => (a === 'from' ? null : a)), 200)}
            aria-label="From location"
          />
          {fromLoading && (
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            </div>
          )}
          {fromText && !fromLoading && (
            <button
              onClick={clearFrom}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5A6A7A', padding: 4, display: 'flex', minWidth: 28, minHeight: 28, alignItems: 'center', justifyContent: 'center' }}
              aria-label={tls('clear_from')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {showFromDropdown && (
          <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 300, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden' }}>
            {fromText.length === 0 && savedLocations.length > 0 && (
              <>
                <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tm('saved_label')}</div>
                {savedLocations.map((loc) => (
                  <div key={loc.id} className="lsearch-saved" onMouseDown={() => selectSavedFrom(loc)}>
                    <span style={{ fontSize: 16 }}>{savedLocationIcons[loc.label] ?? '📍'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0B1E3D' }}>{loc.name}</div>
                      <div style={{ fontSize: 12, color: '#5A6A7A' }}>{loc.address}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {fromResults.map((r) => (
              <div key={r.place_id} className="lsearch-result" onMouseDown={() => selectFrom(r)}>
                {formatDisplayName(r.display_name)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swap button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={swap}
          title={tm('swap')}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#5A6A7A', display: 'flex', alignItems: 'center', gap: 4, minHeight: 32 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          {tm('swap')}
        </button>
      </div>

      {/* To input */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#0B1E3D', flexShrink: 0 }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tls('to')}</label>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            className="lsearch-input"
            type="text"
            placeholder={tm('to_placeholder')}
            value={toText}
            onChange={(e) => handleToInput(e.target.value)}
            onFocus={() => setActiveField('to')}
            onBlur={() => setTimeout(() => setActiveField((a) => (a === 'to' ? null : a)), 200)}
            aria-label="To location"
          />
          {toLoading && (
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            </div>
          )}
          {toText && !toLoading && (
            <button
              onClick={clearTo}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5A6A7A', padding: 4, display: 'flex', minWidth: 28, minHeight: 28, alignItems: 'center', justifyContent: 'center' }}
              aria-label="Clear to"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {showToDropdown && (
          <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 300, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden' }}>
            {toText.length === 0 && savedLocations.length > 0 && (
              <>
                <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tm('saved_label')}</div>
                {savedLocations.map((loc) => (
                  <div key={loc.id} className="lsearch-saved" onMouseDown={() => selectSavedTo(loc)}>
                    <span style={{ fontSize: 16 }}>{savedLocationIcons[loc.label] ?? '📍'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0B1E3D' }}>{loc.name}</div>
                      <div style={{ fontSize: 12, color: '#5A6A7A' }}>{loc.address}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {toResults.map((r) => (
              <div key={r.place_id} className="lsearch-result" onMouseDown={() => selectTo(r)}>
                {formatDisplayName(r.display_name)}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
