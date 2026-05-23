'use client';

import { useMemo, useState } from 'react';
import type { ApiPassenger } from '@/lib/api/passengers';

interface Props {
  meName:          string;
  includeSelf:     boolean;
  onToggleSelf:    (v: boolean) => void;

  passengers:       ApiPassenger[];
  loading:          boolean;
  selectedIds:      number[];
  onToggle:         (id: number) => void;
  maxSelections:    number; // default 4 (passenger seats only — driver excluded)
}

export default function PassengerPicker({
  meName,
  includeSelf,
  onToggleSelf,
  passengers,
  loading,
  selectedIds,
  onToggle,
  maxSelections,
}: Props) {
  const [search, setSearch] = useState('');

  const total = (includeSelf ? 1 : 0) + selectedIds.length;
  const remaining = Math.max(0, maxSelections - total);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return passengers;
    return passengers.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.relation?.toLowerCase().includes(q) ||
      p.phone?.includes(q),
    );
  }, [passengers, search]);

  return (
    <div>
      <p className="text-xs text-[#5A6A7A] mb-3">
        Select up to {maxSelections} passengers. You can include yourself or book for others only.
      </p>

      {/* Me row */}
      <button
        type="button"
        disabled={!includeSelf && remaining === 0}
        onClick={() => onToggleSelf(!includeSelf)}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 mb-4 text-left transition-colors ${
          includeSelf
            ? 'border-[#00C2A8] bg-[#EFF7F6]'
            : !includeSelf && remaining === 0
              ? 'border-[#E2E8F0] bg-[#F8F9FA] opacity-50'
              : 'border-[#E2E8F0] bg-white hover:border-[#C8E8E4]'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            includeSelf ? 'border-[#00C2A8] bg-[#00C2A8]' : 'border-[#C0CBD5]'
          }`}
        >
          {includeSelf && <span className="w-2 h-2 rounded-full bg-white" />}
        </span>
        <span className="w-8 h-8 rounded-full bg-[#0B1E3D] text-[#00C2A8] flex items-center justify-center text-xs font-bold flex-shrink-0">
          {meName.charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-[#0B1E3D]">Me ({meName})</span>
          <span className="block text-xs text-[#8A9AB0]">Your account</span>
        </span>
      </button>

      {/* Related passengers heading */}
      <p className="text-xs font-semibold text-[#5A6A7A] mb-2">Related passengers</p>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search passengers…"
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F1F3F4] border border-transparent text-sm text-[#0B1E3D] placeholder:text-[#9AA0A6] focus:outline-none focus:bg-white focus:border-[#C8E8E4]"
        />
      </div>

      {/* Horizontal slider of passenger chips */}
      {loading ? (
        <p className="text-xs text-[#8A9AB0] py-2">Loading passengers…</p>
      ) : filtered.length === 0 ? (
        passengers.length === 0 ? (
          <p className="text-xs text-[#8A9AB0] py-1">
            No related passengers saved. Add them in your{' '}
            <a href="/user/profile" className="text-[#00C2A8] font-medium hover:underline">profile</a>.
          </p>
        ) : (
          <p className="text-xs text-[#8A9AB0] py-1">No matches.</p>
        )
      ) : (
        <div
          className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'thin' }}
        >
          {filtered.map((p) => {
            const checked  = selectedIds.includes(p.id);
            const disabled = !checked && remaining === 0;
            const initials = p.name.split(' ').slice(0, 2)
              .map(n => n[0]?.toUpperCase() ?? '').join('');
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(p.id)}
                className={`flex-shrink-0 snap-start w-44 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-colors ${
                  checked
                    ? 'border-[#00C2A8] bg-[#EFF7F6]'
                    : disabled
                      ? 'border-[#E2E8F0] bg-[#F8F9FA] opacity-50'
                      : 'border-[#E2E8F0] bg-white hover:border-[#C8E8E4]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    checked ? 'border-[#00C2A8] bg-[#00C2A8]' : 'border-[#C0CBD5]'
                  }`}
                >
                  {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span className="w-8 h-8 rounded-full bg-[#E0F7F4] text-[#00917D] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {initials || '?'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#0B1E3D] truncate">{p.name}</span>
                  <span className="block text-[11px] text-[#8A9AB0] truncate">
                    {p.relation || '—'} · {p.age} yrs
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
