'use client';

import { useEffect, useState } from 'react';
import type { GeoLocation } from '@/types/shared';
import { searchAddress, getPlaceDetails, type NominatimResult, formatDisplayName } from '@/lib/nominatim';
import { useTranslations } from 'next-intl';

interface Props {
  title:    string;
  initial?: GeoLocation | null;
  onConfirm: (loc: GeoLocation) => void;
  onCancel:  () => void;
}

export default function PointPicker({ title, initial, onConfirm, onCancel }: Props) {
  const tp = useTranslations('point_picker');
  const tc = useTranslations('common');
  const tm = useTranslations('map');
  const [query, setQuery]       = useState(initial?.address ?? '');
  const [results, setResults]   = useState<NominatimResult[]>([]);
  const [selected, setSelected] = useState<GeoLocation | null>(initial ?? null);
  const [loading, setLoading]   = useState(false);
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    if (selected && selected.address === query) return;
    const handle = setTimeout(async () => {
      if (query.trim().length < 3) { setResults([]); return; }
      setLoading(true);
      try { setResults(await searchAddress(query)); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, selected]);

  async function pick(r: NominatimResult) {
    setBusy(true);
    try {
      const { lat, lng } = await getPlaceDetails(r.place_id);
      const address = formatDisplayName(r.display_name);
      setSelected({ address, lat, lng });
      setQuery(address);
      setResults([]);
    } finally { setBusy(false); }
  }

  return (
    <>
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900 }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 901,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <div
          className="w-full max-w-[640px] bg-white rounded-t-2xl"
          style={{
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -16px 48px rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#0B1E3D]">{title}</h3>
            <button
              onClick={onCancel}
              className="text-[#5A6A7A] text-lg"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >✕</button>
          </div>

          <div className="px-5 py-4 flex-1 overflow-y-auto">
            <label className="block text-xs font-medium text-[#5A6A7A] mb-1">Search address</label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              placeholder={tp('search')}
              autoFocus
              className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0B1E3D] focus:outline-none focus:border-[#00C2A8] mb-2"
            />

            {loading && <p className="text-xs text-[#9AA0A6] py-2">{tm('searching')}</p>}

            {results.length > 0 && (
              <ul className="border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F3F4] overflow-hidden">
                {results.map((r) => (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onClick={() => pick(r)}
                      disabled={busy}
                      className="w-full text-left px-3 py-2.5 text-xs text-[#0B1E3D] hover:bg-[#EFF7F6] disabled:opacity-50"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      📍 {formatDisplayName(r.display_name)}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <div className="mt-3 p-3 rounded-xl bg-[#EFF7F6] border border-[#C8E8E4]">
                <p className="text-[11px] font-semibold text-[#5A6A7A]">Selected</p>
                <p className="text-xs text-[#0B1E3D] mt-1 leading-snug">📍 {selected.address}</p>
                <p className="text-[10px] text-[#8A9AB0] mt-0.5">
                  {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                </p>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-[#E2E8F0] flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl bg-[#F1F3F4] text-sm font-semibold text-[#5A6A7A]"
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >{tc('cancel')}</button>
            <button
              onClick={() => selected && onConfirm(selected)}
              disabled={!selected || busy}
              className="flex-[2] h-11 rounded-xl bg-[#00C2A8] text-sm font-bold text-[#0B1E3D] disabled:opacity-40"
              style={{ border: 'none', cursor: selected && !busy ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >{tc('confirm')}</button>
          </div>
        </div>
      </div>
    </>
  );
}
