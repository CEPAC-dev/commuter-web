'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCourse, confirmCoursePayment, updateCourseStatus,
  getCourseInstances, getCourseInstance,
  type ApiCourse, type CourseStatus,
  type CourseInstance,
} from '@/lib/api/courses';
import { getLastBalance } from '@/lib/api/wallet';
import PageHeader from '@/components/shared/PageHeader';
import BottomSheet from '@/components/shared/BottomSheet';

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

function IcRoute() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

// ── Matching status helpers ───────────────────────────────────────────────────

const MATCHING_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING:   { label: 'Pending',   bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
  MATCHED:   { label: 'Matched',   bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
  CONFIRMED: { label: 'Confirmed', bg: '#E8F5E9', color: '#27AE60', border: '#A8D5B5' },
  CANCELLED: { label: 'Cancelled', bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
};

const INSTANCE_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:   { label: 'Pending',   bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
  matched:   { label: 'Matched',   bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
  ongoing:   { label: 'Ongoing',   bg: '#E8F0FE', color: '#1A73E8', border: '#93B4F5' },
  completed: { label: 'Completed', bg: '#F1F3F4', color: '#5A6A7A', border: '#E2E8F0' },
  cancelled: { label: 'Cancelled', bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
};

// ── Instance card ─────────────────────────────────────────────────────────────

function InstanceCard({ instance, onViewDetails }: { instance: CourseInstance; onViewDetails: () => void }) {
  const iCfg = INSTANCE_STATUS_CONFIG[instance.status] ?? INSTANCE_STATUS_CONFIG.pending;
  const mCfg = MATCHING_CONFIG[instance.matching_status] ?? MATCHING_CONFIG.PENDING;
  const isGo = instance.trip_direction === 'go';

  const dateLabel = new Date(instance.trip_date).toLocaleDateString('en-EG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 4px rgba(11,30,61,0.05)' }}>
      {/* Top row: date + direction + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1E3D' }}>{dateLabel}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px',
            background: isGo ? '#E0FAF6' : '#F3F0FF', color: isGo ? '#00A896' : '#7C3AED',
            border: `1px solid ${isGo ? '#B2DDD8' : '#C4B5FD'}`,
          }}>
            {isGo ? '↑ Go' : '↓ Return'}
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, background: iCfg.bg, color: iCfg.color,
          border: `1px solid ${iCfg.border}`, borderRadius: 20, padding: '2px 9px',
        }}>
          {iCfg.label}
        </span>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid #00C2A8', background: '#fff' }} />
          <div style={{ width: 0, flex: 1, borderLeft: '2px dashed #B2DDD8', minHeight: 18, margin: '3px 0' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C2A8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5A6A7A', lineHeight: 1.35 }}>{instance.route.pickup_point}</p>
          <p style={{ margin: 0, fontSize: 12, color: '#0B1E3D', fontWeight: 700, lineHeight: 1.35 }}>{instance.route.destination}</p>
        </div>
      </div>

      {/* Time + distance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9AA0A6', marginBottom: 12 }}>
        <span>🕐 {fmtTime(instance.start_time_from)} – {fmtTime(instance.start_time_to)}</span>
        <span>{instance.route.expected_distance.toFixed(0)} km · ~{instance.route.estimated_duration_minutes} min</span>
      </div>

      {/* Matching row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 600 }}>Matching</span>
          <span style={{
            fontSize: 11, fontWeight: 700, background: mCfg.bg, color: mCfg.color,
            border: `1px solid ${mCfg.border}`, borderRadius: 20, padding: '2px 8px',
          }}>
            {mCfg.label}
          </span>
          {instance.matching_price && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0B1E3D' }}>
              EGP {parseFloat(instance.matching_price).toLocaleString()}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          style={{
            fontSize: 12, fontWeight: 700, color: '#00C2A8', background: 'none',
            border: '1px solid #B2DDD8', borderRadius: 20, padding: '4px 12px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          View details →
        </button>
      </div>
    </div>
  );
}

// ── Instance detail sheet ─────────────────────────────────────────────────────

function InstanceDetailSheet({ instance }: { instance: CourseInstance | null }) {
  if (!instance) return null;
  const iCfg    = INSTANCE_STATUS_CONFIG[instance.status]          ?? INSTANCE_STATUS_CONFIG.pending;
  const mCfg    = MATCHING_CONFIG[instance.matching_status]        ?? MATCHING_CONFIG.PENDING;
  const isGo    = instance.trip_direction === 'go';
  const dateStr = new Date(instance.trip_date).toLocaleDateString('en-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={{ padding: '0 16px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0B1E3D' }}>{dateStr}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
            background: isGo ? '#E0FAF6' : '#F3F0FF', color: isGo ? '#00A896' : '#7C3AED',
            border: `1px solid ${isGo ? '#B2DDD8' : '#C4B5FD'}`,
          }}>
            {isGo ? '↑ Go' : '↓ Return'}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, background: iCfg.bg, color: iCfg.color,
            border: `1px solid ${iCfg.border}`, borderRadius: 20, padding: '3px 10px',
          }}>
            {iCfg.label}
          </span>
        </div>
      </div>
      <p style={{ margin: '0 0 20px', fontSize: 12, color: '#9AA0A6' }}>Trip #{instance.id} · Course #{instance.course_id}</p>

      {/* Route card */}
      <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Route</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, flexShrink: 0 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid #00C2A8', background: '#fff' }} />
            <div style={{ width: 0, flex: 1, borderLeft: '2px dashed #B2DDD8', minHeight: 24, margin: '3px 0' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#00C2A8' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#5A6A7A' }}>{instance.route.pickup_point}</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0B1E3D' }}>{instance.route.destination}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#5A6A7A' }}>
          <span>📏 {instance.route.expected_distance.toFixed(1)} km</span>
          <span>⏱ ~{instance.route.estimated_duration_minutes} min</span>
        </div>
      </div>

      {/* Time window */}
      <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time window</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#5A6A7A' }}>Pickup</span>
            <span style={{ fontWeight: 700, color: '#0B1E3D' }}>{fmtTime(instance.start_time_from)} – {fmtTime(instance.start_time_to)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#5A6A7A' }}>Arrival</span>
            <span style={{ fontWeight: 700, color: '#0B1E3D' }}>{fmtTime(instance.end_time_from)} – {fmtTime(instance.end_time_to)}</span>
          </div>
          {instance.actual_start_time && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>Actual start</span>
              <span style={{ fontWeight: 700, color: '#27AE60' }}>{fmtTime(instance.actual_start_time)}</span>
            </div>
          )}
          {instance.actual_end_time && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>Actual end</span>
              <span style={{ fontWeight: 700, color: '#27AE60' }}>{fmtTime(instance.actual_end_time)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Matching */}
      <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Matching</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: '#5A6A7A' }}>Status</span>
            <span style={{
              fontSize: 11, fontWeight: 700, background: mCfg.bg, color: mCfg.color,
              border: `1px solid ${mCfg.border}`, borderRadius: 20, padding: '3px 10px',
            }}>
              {mCfg.label}
            </span>
          </div>
          {instance.matching_price && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>Matched price</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D' }}>EGP {parseFloat(instance.matching_price).toLocaleString()}</span>
            </div>
          )}
          {instance.matching_group_code && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>Group code</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D', letterSpacing: '0.08em' }}>{instance.matching_group_code}</span>
            </div>
          )}
          {instance.driver_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>Driver ID</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D' }}>#{instance.driver_id}</span>
            </div>
          )}
          {instance.driver_price && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>Driver price</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D' }}>EGP {parseFloat(instance.driver_price).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      {instance.participants.length > 0 && (
        <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Passengers ({instance.participants.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {instance.participants.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#E0FAF6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>
                    {p.type === 'passenger' ? '👤' : '🙋'}
                  </span>
                  <span style={{ color: '#0B1E3D', fontWeight: 600 }}>
                    {p.type === 'passenger' ? `Passenger #${p.passenger_id}` : `User #${p.user_id}`}
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#5A6A7A',
                  background: '#E2E8F0', borderRadius: 20, padding: '2px 8px',
                }}>
                  {p.seat_position.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

  // Instances
  const [instances, setInstances]           = useState<CourseInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<CourseInstance | null>(null);
  const [sheetOpen, setSheetOpen]           = useState(false);
  const [instanceLoading, setInstanceLoading] = useState(false);

  const openInstanceDetail = useCallback(async (instanceId: number) => {
    setSheetOpen(true);
    setInstanceLoading(true);
    try {
      const res = await getCourseInstance(id, instanceId);
      setSelectedInstance(res.data);
    } catch {
      // fall back to the already-fetched data from the list
      setSelectedInstance(instances.find(i => i.id === instanceId) ?? null);
    } finally {
      setInstanceLoading(false);
    }
  }, [id, instances]);

  useEffect(() => {
    if (!id) return;
    getCourse(id)
      .then(res => setCourse(res.data))
      .catch(() => setError('Failed to load trip details.'))
      .finally(() => setLoading(false));

    setInstancesLoading(true);
    getCourseInstances(id)
      .then(res => setInstances(res.data))
      .catch(() => {})
      .finally(() => setInstancesLoading(false));
  }, [id]);

  useEffect(() => {
    getLastBalance().then(res => setBalance(res.data.last_balance)).catch(() => {});
  }, []);

  async function handleConfirmPay() {
    if (!course) return;
    setPayError(null);
    const cost = Math.round(parseFloat(course.estimated_total_price));
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

  const estimatedTotalPrice = Math.round(parseFloat(course.estimated_total_price));

  // First "go" schedule for top-level pickup window
  const firstGo = course.weekly_trip_schedules.find(s => s.trip_direction === 'go');

  return (
    <>
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
            <OverviewRow icon={<IcPrice />}    label="Price"  value={`EGP ${estimatedTotalPrice.toLocaleString()}`} />
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

        {/* ── Weekly schedule (instances) ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Weekly schedule {instances.length > 0 && <span style={{ color: '#00C2A8', fontWeight: 800 }}>({instances.length})</span>}
            </p>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IcRoute /></span>
          </div>

          {instancesLoading ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#9AA0A6', fontSize: 13 }}>
              Loading trips…
            </div>
          ) : instances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#9AA0A6', fontSize: 13, background: '#F8F9FA', borderRadius: 12 }}>
              No trips scheduled yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {instances.map(inst => (
                <InstanceCard
                  key={inst.id}
                  instance={inst}
                  onViewDetails={() => openInstanceDetail(inst.id)}
                />
              ))}
            </div>
          )}
        </div>

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
              <span style={{ fontSize: 14, fontWeight: 700, color: balance !== null && balance < estimatedTotalPrice ? '#E74C3C' : '#27AE60' }}>
                {balance !== null ? `EGP ${balance.toLocaleString()}` : '…'}
              </span>
            </div>

            {/* Cost row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #F1F3F4', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>Trip cost</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>EGP {estimatedTotalPrice.toLocaleString()}</span>
            </div>

            {/* Insufficient balance warning */}
            {balance !== null && balance < estimatedTotalPrice && (
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

    {/* ── Instance detail bottom sheet ── */}
    <BottomSheet
      isOpen={sheetOpen}
      onClose={() => { setSheetOpen(false); setSelectedInstance(null); }}
      title="Trip details"
    >
      {instanceLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9AA0A6', fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Loading…
        </div>
      ) : (
        <InstanceDetailSheet
          instance={selectedInstance}
        />
      )}
    </BottomSheet>
    </>
  );
}
