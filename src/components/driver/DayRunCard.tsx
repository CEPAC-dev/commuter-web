'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import type { DayRun } from '@/types/cycle';
import { timeUntilUnlock, formatTime12h } from '@/lib/tripUtils';

export interface DayRunCardProps {
  run:     DayRun;
  dayDate: string;
  isToday: boolean;
  onStart: (runId: string) => void;
}

const RUN_STATUS_STYLE: Record<string, string> = {
  upcoming:  'bg-[#F1F3F4] text-[#5A6A7A]',
  locked:    'bg-[#FFF8E1] text-[#F57F17]',
  unlocked:  'bg-[#F0FDF4] text-[#166534]',
  active:    'bg-[#EFF7F6] text-[#00C2A8]',
  completed: 'bg-[#F1F3F4] text-[#5A6A7A]',
  cancelled: 'bg-[#FDECEA] text-[#C62828]',
};

export default function DayRunCard({ run, isToday, onStart }: DayRunCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(isToday && run.status === 'unlocked');
  const [, setTick] = useState(0);

  // Re-render every second for live countdown
  useEffect(() => {
    if (run.status === 'locked') {
      const i = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(i);
    }
  }, [run.status]);

  const { minutes, seconds } = timeUntilUnlock(run.unlock_at);

  const statusLabel =
    run.status === 'active'    ? '● Live'             :
    run.status === 'unlocked'  ? '● Ready to start'   :
    run.status === 'locked'    ? `Unlocks in ${minutes}:${String(seconds).padStart(2, '0')}` :
    run.status === 'completed' ? 'Completed'           :
    run.status === 'cancelled' ? 'Cancelled'           :
    'Upcoming';

  const cardBorder =
    run.status === 'unlocked' ? 'border-[#00C2A8] shadow-sm' :
    run.status === 'active'   ? 'border-[#00C2A8] shadow-md' :
                                'border-[#E2E8F0]';

  return (
    <div className={`bg-white border rounded-xl overflow-hidden mb-3 ${cardBorder}`}>

      {/* Run header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base font-bold text-[#0B1E3D]">
              {formatTime12h(run.first_pickup_time)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RUN_STATUS_STYLE[run.status] ?? RUN_STATUS_STYLE.upcoming}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-[#5A6A7A]">
            {run.passengers.length} passenger{run.passengers.length !== 1 ? 's' : ''} ·{' '}
            {run.passengers.map(p => p.dropoff_area).join(' → ')} ·{' '}
            {run.total_distance_km} km · est. done by {formatTime12h(run.estimated_end_time)}
          </p>
        </div>
        <span className="text-[#9AA0A6] text-lg ml-3 flex-shrink-0">{expanded ? '▴' : '▾'}</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#F1F3F4] px-4 pb-4">

          <p className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wide mt-3 mb-2">
            Pickups in order
          </p>

          {run.passengers.map((p, i) => {
            const stopBg =
              p.pickup_status === 'picked_up' ? 'bg-[#27AE60] text-white' :
              p.pickup_status === 'no_show'   ? 'bg-[#E74C3C] text-white' :
                                               'bg-[#0B1E3D] border-2 border-[#00C2A8] text-white';

            const stopLabel =
              p.pickup_status === 'picked_up' ? '✓' :
              p.pickup_status === 'no_show'   ? '✕' : String(i + 1);

            return (
              <div key={p.passenger_id} className="flex items-start gap-3 mb-3 last:mb-0">

                {/* Stop number */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-xs font-bold flex-shrink-0 mt-0.5 ${stopBg}`}>
                  {stopLabel}
                </div>

                {/* Stop detail */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-[#0B1E3D]">
                      {p.scheduled_pickup} · {p.passenger_name}
                    </span>
                    {run.status === 'active' && p.chat_unlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/driver/trip/${run.run_id}/chat/${p.passenger_id}`);
                        }}
                        className="text-xs text-[#00C2A8] font-medium ml-2 flex-shrink-0"
                      >
                        💬
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#5A6A7A] truncate">
                    📍 {p.pickup_address}
                  </p>
                  <p className="text-xs text-[#9AA0A6] truncate">
                    🏁 Drop at {p.dropoff_area} · {p.scheduled_dropoff}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Action buttons — today only */}
          {isToday && (
            <div className="mt-4">
              {run.status === 'unlocked' && (
                <button
                  onClick={() => onStart(run.run_id)}
                  className="w-full h-12 bg-[#00C2A8] text-[#0B1E3D]
                    font-bold rounded-xl text-base"
                >
                  🚗 Start run
                </button>
              )}
              {run.status === 'locked' && (
                <div className="w-full h-12 bg-[#F1F3F4] rounded-xl
                  flex items-center justify-center">
                  <span className="text-sm text-[#5A6A7A]">
                    🔒 Unlocks at{' '}
                    {formatTime12h(format(parseISO(run.unlock_at), 'HH:mm'))}
                  </span>
                </div>
              )}
              {run.status === 'active' && (
                <button
                  onClick={() => router.push(`/driver/trip/${run.run_id}`)}
                  className="w-full h-12 bg-[#0B1E3D] text-white
                    font-bold rounded-xl text-base flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00C2A8] animate-pulse" />
                  Continue live run
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
