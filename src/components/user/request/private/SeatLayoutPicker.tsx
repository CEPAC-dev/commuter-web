'use client';

import { useState } from 'react';
import type { PrivateSeatPosition } from '@/types/shared';
import { useTranslations } from 'next-intl';

export interface SeatPassenger {
  /** Stable key — 'me' for self, or stringified passenger.id */
  key:   string;
  name:  string;
}

interface Props {
  passengers:  SeatPassenger[];
  /** key → seat position */
  assignments: Record<string, PrivateSeatPosition>;
  onChange:    (next: Record<string, PrivateSeatPosition>) => void;
}

function SeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6A7A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 18v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" />
      <path d="M4 21h16" />
      <path d="M9 9V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A6A7A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17h18l-2-7H5l-2 7Z" />
      <path d="M7 17V13" /><path d="M17 17V13" />
      <circle cx="12" cy="7" r="2" />
    </svg>
  );
}

export default function SeatLayoutPicker({ passengers, assignments, onChange }: Props) {
  const t = useTranslations('seat_layout');
  const [activeSeat, setActiveSeat] = useState<PrivateSeatPosition | null>(null);

  const seatLabel = (seat: PrivateSeatPosition) => t(seat);

  const assignedKeyForSeat = (seat: PrivateSeatPosition): string | null => {
    const entry = Object.entries(assignments).find(([, s]) => s === seat);
    return entry ? entry[0] : null;
  };

  const currentSeatOf = (key: string): PrivateSeatPosition | null =>
    assignments[key] ?? null;

  function assign(seat: PrivateSeatPosition, key: string | null) {
    const next: Record<string, PrivateSeatPosition> = { ...assignments };
    for (const [k, s] of Object.entries(next)) if (s === seat) delete next[k];
    if (key) {
      delete next[key];
      next[key] = seat;
    }
    onChange(next);
    setActiveSeat(null);
  }

  function removeSeat(seat: PrivateSeatPosition) {
    const next: Record<string, PrivateSeatPosition> = { ...assignments };
    for (const [k, s] of Object.entries(next)) if (s === seat) delete next[k];
    onChange(next);
  }

  const unassigned = passengers.filter(p => !(p.key in assignments));

  return (
    <div dir="ltr" className="seat-layout-ltr">
      <p className="text-xs text-[#5A6A7A] mb-3">
        {t('hint')}
      </p>

      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8F9FA] p-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="h-20 rounded-xl border-2 border-[#E2E8F0] bg-[#EEF1F5] flex flex-col items-center justify-center text-[#9AA0A6]">
            <DriverIcon />
            <span className="text-[11px] font-semibold mt-1">{t('driver')}</span>
          </div>
          <SeatButton
            _seat="front"
            label={seatLabel('front')}
            assigneeName={
              passengers.find(p => p.key === assignedKeyForSeat('front'))?.name ?? null
            }
            onClick={() => setActiveSeat('front')}
            onRemove={() => removeSeat('front')}
            removeAria={(name) => t('remove_aria', { name })}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['back_left', 'back_center', 'back_right'] as const).map(seat => {
            const k = assignedKeyForSeat(seat);
            const name = passengers.find(p => p.key === k)?.name ?? null;
            return (
              <SeatButton
                key={seat}
                _seat={seat}
                label={seatLabel(seat)}
                assigneeName={name}
                onClick={() => setActiveSeat(seat)}
                onRemove={() => removeSeat(seat)}
                removeAria={(n) => t('remove_aria', { name: n })}
              />
            );
          })}
        </div>
      </div>

      {activeSeat && (
        <div className="mt-3 rounded-xl border border-[#C8E8E4] bg-[#EFF7F6] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#0B1E3D]">
              {t('assign', { seat: seatLabel(activeSeat) })}
            </span>
            <button
              type="button"
              onClick={() => setActiveSeat(null)}
              className="text-xs text-[#5A6A7A] hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t('close')}
            </button>
          </div>

          <p className="text-xs text-[#5A6A7A] mb-2">{t('select_passenger_hint')}</p>

          <div className="flex flex-wrap gap-2">
            {assignedKeyForSeat(activeSeat) && (
              <button
                type="button"
                onClick={() => assign(activeSeat, null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#E74C3C]"
                style={{ cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('clear_seat')}
              </button>
            )}
            {[...passengers].map(p => {
              const isHere = assignments[p.key] === activeSeat;
              const elsewhere = currentSeatOf(p.key);
              const isElsewhere = !!elsewhere && !isHere;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => isHere ? assign(activeSeat, null) : assign(activeSeat, p.key)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex flex-col items-start gap-0.5 ${
                    isHere
                      ? 'bg-[#00C2A8] border-[#00C2A8] text-white'
                      : isElsewhere
                        ? 'bg-white border-[#E2E8F0] text-[#9AA0A6]'
                        : 'bg-white border-[#E2E8F0] text-[#0B1E3D] hover:border-[#00C2A8]'
                  }`}
                  style={{ cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span>{p.name}</span>
                  {isHere && (
                    <span className="text-[9px] opacity-80">{t('tap_to_remove')}</span>
                  )}
                  {isElsewhere && (
                    <span className="text-[9px]">
                      {t('on_seat_tap_move', { seat: seatLabel(elsewhere) })}
                    </span>
                  )}
                </button>
              );
            })}
            {passengers.length === 0 && (
              <p className="text-xs text-[#9AA0A6] italic">{t('add_passengers_first')}</p>
            )}
          </div>
        </div>
      )}

      {unassigned.length > 0 && passengers.length > 0 && (
        <p className="text-[11px] text-[#9AA0A6] mt-2">
          {t('unassigned', { names: unassigned.map(p => p.name).join(', ') })}
        </p>
      )}
    </div>
  );
}

function SeatButton({
  _seat, label, assigneeName, onClick, onRemove, removeAria,
}: {
  _seat: PrivateSeatPosition;
  label: string;
  assigneeName: string | null;
  onClick: () => void;
  onRemove?: () => void;
  removeAria: (name: string) => string;
}) {
  const assigned = !!assigneeName;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={`w-full h-20 rounded-xl border-2 flex flex-col items-center justify-center px-1 text-center transition-colors ${
          assigned
            ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D]'
            : 'border-[#E2E8F0] bg-white text-[#5A6A7A] hover:border-[#C8E8E4]'
        }`}
        style={{ cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <SeatIcon />
        <span className="text-[11px] font-semibold mt-1">{label}</span>
        {assigned && (
          <span className="text-[10px] mt-0.5 truncate max-w-full px-1 text-[#00917D] font-medium">
            {assigneeName}
          </span>
        )}
      </button>
      {assigned && onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={removeAria(assigneeName!)}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#E74C3C] text-white flex items-center justify-center text-[11px] font-bold leading-none"
          style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          ×
        </button>
      )}
    </div>
  );
}
