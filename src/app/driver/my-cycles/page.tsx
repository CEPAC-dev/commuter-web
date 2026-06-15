'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import driverApi from '@/lib/api/driver';
import type { CourseInstance } from '@/lib/api/courses';

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  assigned:   { bg: '#E8F5E9', text: '#2E7D32' },
  completed:  { bg: '#E3F2FD', text: '#1565C0' },
  cancelled:  { bg: '#FFEBEE', text: '#C62828' },
  pending:    { bg: '#FFF8E1', text: '#F57F17' },
};

function statusStyle(s: string) {
  return STATUS_COLOR[s] ?? { bg: '#F1F5F9', text: '#5A6A7A' };
}

function fmt(time: string | null) {
  if (!time) return '—';
  return time.slice(0, 5); // "HH:MM"
}

export default function MyCyclesPage() {
  const t = useTranslations('my_cycles');
  const router = useRouter();
  const [trips, setTrips] = useState<CourseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (driverApi.getCycles() as Promise<{ data: CourseInstance[] } | CourseInstance[]>)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { data: CourseInstance[] }).data ?? [];
        setTrips(list);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#0B1E3D] mb-1">{t('page_title')}</h1>
      <p className="text-sm text-[#5A6A7A] mb-5">
        {trips.length > 0 ? `${trips.length} ${trips.length === 1 ? t('trip') : t('trips')}` : ''}
      </p>

      {loading && (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-[#00C2A8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="py-8 text-center text-sm text-[#E74C3C]">{error}</div>
      )}

      {!loading && !error && trips.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-5xl">🚗</span>
          <p className="text-sm font-semibold text-[#0B1E3D] mt-2">{t('empty_active_runs')}</p>
          <p className="text-xs text-[#5A6A7A] max-w-[240px]">{t('empty_active_runs_desc')}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {trips.map((trip) => {
          const ss = statusStyle(trip.status);
          return (
            <button
              key={trip.id}
              onClick={() => router.push(`/driver/my-cycles/${trip.id}`)}
              className="w-full text-start bg-white border border-[#E2E8F0] rounded-2xl p-4 hover:border-[#00C2A8] hover:shadow-sm transition-all"
            >
              {/* Top row: date + direction + status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#0B1E3D]">
                    {trip.trip_date}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: ss.bg, color: ss.text }}>
                  {t(`status_${trip.status}` as const)}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-start gap-2 mb-3">
                <div className="flex flex-col items-center pt-1 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#00C2A8]" />
                  <div className="w-px h-6 bg-[#CBD5E0]" />
                  <div className="w-2 h-2 rounded-full bg-[#0B1E3D]" />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <p className="text-xs text-[#5A6A7A] leading-snug truncate">{trip.route?.pickup_point ?? '—'}</p>
                  <p className="text-xs font-semibold text-[#0B1E3D] leading-snug truncate">{trip.route?.destination ?? '—'}</p>
                </div>
              </div>

              {/* Time + price row */}
              <div className="flex items-center justify-between text-xs text-[#5A6A7A]">
                <span>🕐 {fmt(trip.start_time_from)} – {fmt(trip.start_time_to)}</span>
                {trip.matching_price && (
                  <span className="font-bold text-[#0B1E3D]">{trip.matching_price} EGP</span>
                )}
              </div>

              {/* Group code */}
              {trip.matching_group_code && (
                <div className="mt-2 text-xs text-[#8A9AB0]">
                  {t('group')}: <span className="font-mono font-semibold text-[#0B1E3D]">{trip.matching_group_code}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


