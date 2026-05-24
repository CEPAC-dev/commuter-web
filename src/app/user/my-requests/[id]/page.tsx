'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourse, confirmCoursePayment, updateCourseStatus, type ApiCourse, type ApiWeeklyTripSchedule, type CourseStatus } from '@/lib/api/courses';
import { INDEX_WEEKDAY } from '@/lib/timeUtils';
import { getLastBalance } from '@/lib/api/wallet';
import PageHeader from '@/components/shared/PageHeader';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CourseStatus, { label: string; bg: string; color: string; border: string }> = {
  draft:     { label: 'draft',     bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
  active:    { label: 'active',    bg: '#E8F5E9', color: '#27AE60', border: '#A8D5B5' },
  completed: { label: 'completed', bg: '#F1F3F4', color: '#5A6A7A', border: '#E2E8F0' },
  cancelled: { label: 'cancelled', bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(hms: string) {
  const [hh, mm] = hms.split(':').map(Number);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h = hh % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ampm}`;
}

function fmtCreatedAt(raw: string) {
  // "2026-05-24 09:08:54"
  const d = new Date(raw.replace(' ', 'T'));
  return d.toLocaleDateString('en-EG', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IcCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IcPrice() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IcWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}
function IcCar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l2-5h14l2 5" />
      <rect x="1" y="11" width="22" height="7" rx="2" />
      <circle cx="7" cy="21" r="2" />
      <circle cx="17" cy="21" r="2" />
    </svg>
  );
}
function IcClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ── Overview row ──────────────────────────────────────────────────────────────

function OverviewRow({ icon, label, value, noBorder }: { icon: React.ReactNode; label: string; value: string; noBorder?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: noBorder ? 'none' : '1px solid #F1F3F4' }}>
      <span style={{ width: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9AA0A6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: '#0B1E3D', fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}

// ── Trip card ─────────────────────────────────────────────────────────────────

function TripCard({ s }: { s: ApiWeeklyTripSchedule }) {
  const abbr = INDEX_WEEKDAY[s.day_of_week] ?? '?';
  const isGo = s.trip_direction === 'go';
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 4px rgba(11,30,61,0.05)' }}>
      {/* Header: day pill + direction pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ background: '#00C2A8', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 50, padding: '4px 12px' }}>{abbr}</span>
        <span style={{ background: '#F1F3F4', color: '#5A6A7A', fontSize: 12, fontWeight: 600, borderRadius: 50, padding: '3px 10px' }}>
          {isGo ? 'go' : 'return'}
        </span>
      </div>

      {/* ROUTE label */}
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Route</p>

      {/* Route visual */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, flexShrink: 0 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid #00C2A8', background: '#fff' }} />
          <div style={{ width: 0, flex: 1, borderLeft: '2px dashed #B2DDD8', minHeight: 22, margin: '3px 0' }} />
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#00C2A8' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#0B1E3D', fontWeight: 400, lineHeight: 1.4 }}>{s.pickup_point}</p>
          <p style={{ margin: 0, fontSize: 13, color: '#0B1E3D', fontWeight: 700 }}>{s.destination}</p>
        </div>
      </div>

      {/* Distance + duration */}
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9AA0A6' }}>
        {s.expected_distance.toFixed(0)} km · ~{s.estimated_duration_minutes} min
      </p>

      {/* Pickup + Arrival */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#5A6A7A', fontWeight: 500 }}>Pickup</span>
          <span style={{ color: '#0B1E3D', fontWeight: 700 }}>{fmtTime(s.start_time_from)} – {fmtTime(s.start_time_to)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#5A6A7A', fontWeight: 500 }}>Arrival</span>
          <span style={{ color: '#0B1E3D', fontWeight: 700 }}>{fmtTime(s.end_time_from)} – {fmtTime(s.end_time_to)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance]   = useState<number | null>(null);
  const [paying, setPaying]     = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payDone, setPayDone]   = useState(false);

  useEffect(() => {
    if (!id) return;
    getCourse(id)
      .then(res => setCourse(res.data))
      .catch(() => setError('Failed to load trip details.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getLastBalance().then(res => setBalance(res.data.last_balance)).catch(() => {});
  }, []);

  async function handleConfirmPay() {
    if (!course) return;
    setPayError(null);
    const cost = Math.round(parseFloat(course.final_price));
    if (balance !== null && balance < cost) {
      setPayError(`Insufficient balance — wallet has EGP ${balance.toLocaleString()}, but the trip costs EGP ${cost.toLocaleString()}.`);
      return;
    }
    setPaying(true);
    try {
      await confirmCoursePayment(course.id);
      await updateCourseStatus(course.id, { status: 'active', wallet_status: 'success' });
      setCourse(c => c ? { ...c, status: 'active', wallet_status: 'paid' } : c);
      setBalance(b => b !== null ? b - cost : b);
      setPayDone(true);
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <PageHeader title="Trip details" onBack={() => router.back()} />
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9AA0A6', fontSize: 14 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <PageHeader title="Trip details" onBack={() => router.back()} />
        <div style={{ textAlign: 'center', padding: '64px 16px', color: '#E74C3C', fontSize: 14 }}>
          {error ?? 'Trip not found.'}
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG.draft;

  const priceMin = Math.round(parseFloat(course.initial_price));
  const priceMax = Math.round(parseFloat(course.final_price));

  // First "go" schedule for top-level pickup window
  const firstGo = course.weekly_trip_schedules.find(s => s.trip_direction === 'go');

  // Sort schedules: go first, then return; within each direction, sort by day_of_week
  // Group schedules by day_of_week, go first within each day
  const byDay = new Map<number, ApiWeeklyTripSchedule[]>();
  for (const s of course.weekly_trip_schedules) {
    const arr = byDay.get(s.day_of_week) ?? [];
    arr.push(s);
    byDay.set(s.day_of_week, arr);
  }
  const sortedDays = Array.from(byDay.keys()).sort((a, b) => a - b);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PageHeader title="Trip details" onBack={() => router.back()} />

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Overview card ── */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 1px 4px rgba(11,30,61,0.06)' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0B1E3D' }}>Overview</p>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
                borderRadius: 20,
                padding: '3px 10px',
              }}
            >
              {cfg.label}
            </span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#9AA0A6' }}>
            Created {fmtCreatedAt(course.created_at)}
          </p>

          {/* Info rows */}
          <div>
            <OverviewRow icon={<IcCalendar />} label="Dates"  value={`${course.start_date} → ${course.end_date}`} />
            <OverviewRow icon={<IcPrice />}    label="Price"  value={`EGP ${priceMin.toLocaleString()} – ${priceMax.toLocaleString()}`} />
            <OverviewRow icon={<IcWallet />}   label="Wallet" value={course.wallet_status} />
            <OverviewRow icon={<IcCar />}      label="Type"   value={course.trip_type + (course.group_type ? ` · ${course.group_type}` : '')} />
            {firstGo && (
              <OverviewRow
                icon={<IcClock />}
                label="Pickup window"
                value={`${fmtTime(firstGo.start_time_from)} – ${fmtTime(firstGo.start_time_to)}`}
                noBorder
              />
            )}
          </div>
        </div>

        {/* ── Weekly schedule ── */}
        {sortedDays.length > 0 && (
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Weekly schedule
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedDays.flatMap(dayIndex => {
                const go  = byDay.get(dayIndex)!.find(s => s.trip_direction === 'go');
                const ret = byDay.get(dayIndex)!.find(s => s.trip_direction === 'return');
                return [
                  go  ? <TripCard key={`${dayIndex}-go`}     s={go}  /> : null,
                  ret ? <TripCard key={`${dayIndex}-return`} s={ret} /> : null,
                ].filter(Boolean);
              })}
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {course.notes && (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Notes
            </p>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#0B1E3D', lineHeight: 1.6, boxShadow: '0 1px 4px rgba(11,30,61,0.04)' }}>
              {course.notes}
            </div>
          </div>
        )}

        {/* ── Payment card (only for draft + waiting) ── */}
        {course.status === 'draft' && course.wallet_status === 'waiting' && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 1px 4px rgba(11,30,61,0.06)' }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0B1E3D' }}>Payment</p>

            {/* Balance row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>Wallet balance</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: balance !== null && balance < priceMax ? '#E74C3C' : '#27AE60' }}>
                {balance !== null ? `EGP ${balance.toLocaleString()}` : '…'}
              </span>
            </div>

            {/* Cost row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #F1F3F4', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>Trip cost</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>EGP {priceMax.toLocaleString()}</span>
            </div>

            {/* Insufficient balance warning */}
            {balance !== null && balance < priceMax && (
              <div style={{ background: '#FFF3E0', border: '1px solid #FFCCBC', borderRadius: 10, padding: '10px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#BF360C', fontWeight: 600 }}>Not enough balance</span>
                <button
                  type="button"
                  onClick={() => router.push('/user/wallet')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#00C2A8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Top up →
                </button>
              </div>
            )}

            {/* Error */}
            {payError && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#E74C3C', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 12px' }}>
                {payError}
              </p>
            )}

            {/* Success / Pay button */}
            {payDone ? (
              <div style={{ background: '#E8F5E9', border: '1px solid #A8D5B5', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#27AE60' }}>✓ Payment successful</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5A6A7A' }}>Your trip is now active.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirmPay}
                disabled={paying}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: paying ? '#B0BEC5' : '#0B1E3D',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: paying ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {paying ? 'Processing…' : 'Confirm Pay'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
