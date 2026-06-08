'use client';

import type { ApiCourse, CourseStatus } from '@/lib/api/courses';
import { confirmCoursePayment } from '@/lib/api/courses';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<CourseStatus, { bg: string; color: string; border: string }> = {
  draft:     { bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
  active:    { bg: '#E8F5E9', color: '#27AE60', border: '#A8D5B5' },
  completed: { bg: '#F1F3F4', color: '#5A6A7A', border: '#E2E8F0' },
  cancelled: { bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(hms: string) {
  const [hh, mm] = hms.split(':').map(Number);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h = hh % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ampm}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-EG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  course: ApiCourse;
  onPaid?: () => void;
}

export default function CourseCard({ course, onPaid }: Props) {
  const t = useTranslations('course_card');
  const tc = useTranslations('common');
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const style = STATUS_STYLE[course.status] ?? STATUS_STYLE.draft;
  const statusLabel = t(`status_${course.status}` as 'status_draft');

  async function handleConfirmPayment() {
    setPaying(true);
    setPayError(null);
    setPaymentUrl(null);
    try {
      const res = await confirmCoursePayment(course.id);
      const fallback = res as unknown as Record<string, unknown>;
      const nested = fallback['data'] as Record<string, unknown> | undefined;
      const url: string | undefined =
        res.payment_url ||
        (nested?.['payment_url'] as string | undefined) ||
        (fallback['url'] as string | undefined);
      if (url) {
        setPaymentUrl(url);
        // Try direct navigation first
        window.location.href = url;
        return;
      }
      // no payment URL → treat as already paid, refresh
      onPaid?.();
      setPaying(false);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : t('payment_failed'));
      setPaying(false);
    }
  }

  // Use first "go" schedule for top-level display
  const goSchedules = course.weekly_trip_schedules.filter(s => s.trip_direction === 'go');
  const first = goSchedules[0];

  // Unique days (count for subtitle display)
  const uniqueDays = Array.from(new Set(goSchedules.map(s => s.day_of_week))).length;

  const estimatedTotalPrice = Math.round(parseFloat(course.estimated_total_price));

  const needsPayment = course.wallet_status === 'waiting' && course.status === 'draft';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 1px 4px rgba(11,30,61,0.06)',
      }}
    >
      {/* ── Top content ── */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* Route header: pickup → destination + status badge + arrow */}
        {first && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/user/my-requests/${course.id}`)}
            onKeyDown={e => e.key === 'Enter' && router.push(`/user/my-requests/${course.id}`)}
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4, cursor: 'pointer' }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0B1E3D', lineHeight: 1.35, flex: 1 }}>
              {first.pickup_point}
              <span style={{ margin: '0 6px', color: '#00C2A8' }}>→</span>
              {first.destination}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                  borderRadius: 20,
                  padding: '3px 10px',
                }}
              >
                {statusLabel}
              </span>
              <span style={{ color: '#9AA0A6', fontSize: 16 }}>›</span>
            </div>
          </div>
        )}

        {/* Distance + duration */}
        {first && (
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9AA0A6' }}>
            {first.expected_distance.toFixed(0)} km · ~{first.estimated_duration_minutes} min
          </p>
        )}

        {/* Info block */}
        <div
          style={{
            background: '#F8F9FA',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          {/* Dates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>
            <span style={{ fontSize: 15 }}>🗓</span>
            {fmtDate(course.start_date)} – {fmtDate(course.end_date)}
          </div>
          {/* Time */}
          {first && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>
              <span style={{ fontSize: 15 }}>🕐</span>
              {fmtTime(first.start_time_from)} – {fmtTime(first.start_time_to)}
            </div>
          )}
          {/* Days */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>
            <span style={{ fontSize: 15 }}>📅</span>
            {uniqueDays} {tc('per_week').replace('/', '').trim()}
          </div>
        </div>

        {/* Bottom row: trip type pill + price */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 500,
              color: '#5A6A7A',
              background: '#F1F3F4',
              border: '1px solid #E2E8F0',
              borderRadius: 20,
              padding: '4px 10px',
            }}
          >
            👤 {course.trip_type}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#0B1E3D' }}>
            {tc('egp')} {estimatedTotalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Confirm payment CTA (wallet_status === 'waiting') ── */}
      {needsPayment && (
        <div style={{ padding: '0 16px 16px' }}>
          {payError && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#E74C3C', textAlign: 'center' }}>
              {payError}
            </p>
          )}
          {paymentUrl ? (
            /* Fallback: if window.location.href was blocked, show a real link */
            <a
              href={paymentUrl}
              style={{
                display: 'flex',
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px',
                borderRadius: 12,
                background: '#0B1E3D',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              💳 Tap here to complete payment
            </a>
          ) : (
            <button
              type="button"
              disabled={paying}
              onClick={handleConfirmPayment}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                background: paying ? '#5A6A7A' : '#0B1E3D',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: paying ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: paying ? 0.7 : 1,
              }}
            >
              {paying ? t('redirecting') : `💳 ${t('confirm_payment')}`}
            </button>
          )}
        </div>
      )}

      {/* ── View details link ── */}
      <button
        type="button"
        onClick={() => router.push(`/user/my-requests/${course.id}`)}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderTop: '1px solid #F1F3F4',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 12,
          color: '#00C2A8',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {t('view_details')} →
      </button>
    </div>
  );
}
