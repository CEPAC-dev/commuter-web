'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCourse, confirmCoursePayment, repeatCourse,
  getCourseInstances, getCourseInstance,
  type ApiCourse, type CourseStatus,
  type CourseInstance,
} from '@/lib/api/courses';
import { getLastBalance } from '@/lib/api/wallet';
import PageHeader from '@/components/shared/PageHeader';
import BottomSheet from '@/components/shared/BottomSheet';
import TripChatButton from '@/components/shared/TripChatButton';
import { useLocale, useTranslations } from 'next-intl';

// ── Status config ─────────────────────────────────────────────────────────────

function useStatusConfig() {
  const t = useTranslations('course_card');
  return {
    draft:              { label: t('status_draft'),              bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
    pending_payment:    { label: t('status_pending_payment'),    bg: '#FFF3CD', color: '#856404', border: '#FFDA6A' },
    matching:           { label: t('status_matching'),           bg: '#E3F2FD', color: '#1976D2', border: '#90CAF9' },
    matching_failed:    { label: t('status_matching_failed'),    bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
    partially_matched:  { label: t('status_partially_matched'),  bg: '#FCE4EC', color: '#C2185B', border: '#F8BBD0' },
    matched:            { label: t('status_matched'),            bg: '#F3E5F5', color: '#7B1FA2', border: '#E1BEE7' },
    payment_required:   { label: t('status_payment_required'),   bg: '#FFF3CD', color: '#856404', border: '#FFDA6A' },
    active:             { label: t('status_active'),             bg: '#E8F5E9', color: '#27AE60', border: '#A8D5B5' },
    completed:          { label: t('status_completed'),          bg: '#F1F3F4', color: '#5A6A7A', border: '#E2E8F0' },
    cancelled:          { label: t('status_cancelled'),          bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
    pending:            { label: t('status_pending'),            bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
    ongoing:            { label: t('status_ongoing'),            bg: '#E8F5E9', color: '#27AE60', border: '#A8D5B5' },
    confirmed:          { label: t('status_confirmed'),          bg: '#E8F5E9', color: '#27AE60', border: '#A8D5B5' },
  } satisfies Record<CourseStatus, { label: string; bg: string; color: string; border: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(hms: string) {
  const [hh, mm] = hms.split(':').map(Number);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h = hh % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ampm}`;
}

function fmtCreatedAt(raw: string, locale: string) {
  const d = new Date(raw.replace(' ', 'T'));
  return d.toLocaleDateString(locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function getNextWeekDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
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

function IcMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IcFlag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 5-1 5.5 1 10.5 1" />
      <path d="M4 22v-7" />
      <path d="M4 3v15" />
    </svg>
  );
}

// ── ExecutionTimeline component ───────────────────────────────────────────────

interface TimelineEvent {
  order: number;
  type: 'pickup' | 'dropoff';
  user_id: number;
  passenger_id: number | null;
  events_logged: unknown[];
}

function ExecutionTimeline({ events }: { events: TimelineEvent[] }) {
  const t = useTranslations('trip_detail');

  if (!events || events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.order - b.order);

  return (
    <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
      <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {t('execution_timeline')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sortedEvents.map((event, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: idx === sortedEvents.length - 1 ? 0 : 14 }}>
            {/* Timeline marker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: event.type === 'pickup' ? '#E0FAF6' : '#FFF3E0',
                border: `2px solid ${event.type === 'pickup' ? '#00C2A8' : '#FF9800'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {event.type === 'pickup' ? (
                  <IcMapPin />
                ) : (
                  <IcFlag />
                )}
              </div>
              {idx < sortedEvents.length - 1 && (
                <div style={{
                  width: '2px',
                  height: 24,
                  background: '#B2DDD8',
                  margin: '6px 0',
                }} />
              )}
            </div>

            {/* Event details */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              <p style={{
                margin: '0 0 6px',
                fontSize: 13,
                fontWeight: 700,
                color: '#0B1E3D',
                textTransform: 'capitalize',
              }}>
                {event.type === 'pickup' ? t('pickup_event') : t('dropoff_event')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#5A6A7A' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#0B1E3D' }}>#{event.order}</span>
                  <span> · </span>
                  <span>ID: {event.user_id}</span>
                  {event.passenger_id && (
                    <>
                      <span> · </span>
                      <span>Passenger: {event.passenger_id}</span>
                    </>
                  )}
                </div>
                {event.events_logged && Array.isArray(event.events_logged) && event.events_logged.length > 0 && (
                  <div style={{ color: '#27AE60', fontSize: 11 }}>
                    ✓ {event.events_logged.length} event(s) logged
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Matching status helpers ───────────────────────────────────────────────────

function useMatchingConfig(): Record<string, { label: string; bg: string; color: string; border: string }> {
  const t = useTranslations('course_card');
  return {
    PENDING:   { label: t('status_pending'),   bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
    MATCHED:   { label: t('status_matched'),   bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
    CONFIRMED: { label: t('status_confirmed'), bg: '#E8F5E9', color: '#27AE60', border: '#A8D5B5' },
    CANCELLED: { label: t('status_cancelled'), bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
  };
}

function useInstanceStatusConfig(): Record<string, { label: string; bg: string; color: string; border: string }> {
  const t = useTranslations('course_card');
  return {
    pending:   { label: t('status_pending'),   bg: '#FFF8E1', color: '#F57F17', border: '#F9C74F' },
    matched:   { label: t('status_matched'),   bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
    ongoing:   { label: t('status_ongoing'),   bg: '#E8F0FE', color: '#1A73E8', border: '#93B4F5' },
    completed: { label: t('status_completed'), bg: '#F1F3F4', color: '#5A6A7A', border: '#E2E8F0' },
    cancelled: { label: t('status_cancelled'), bg: '#FFEBEE', color: '#E74C3C', border: '#FFCDD2' },
  };
}

// ── Instance card ─────────────────────────────────────────────────────────────

function InstanceCard({ instance, onViewDetails }: { instance: CourseInstance; onViewDetails: () => void }) {
  const t = useTranslations('trip_detail');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const instanceStatus = useInstanceStatusConfig();
  const matchingStatus = useMatchingConfig();
  const iCfg = instanceStatus[instance.status] ?? instanceStatus.pending;
  const mCfg = matchingStatus[instance.matching_status] ?? matchingStatus.PENDING;
  const isGo = instance.trip_direction === 'go';

  const dateLabel = new Date(instance.trip_date).toLocaleDateString(locale, {
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
            {isGo ? t('go') : t('return')}
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
        <span>{instance.route.expected_distance.toFixed(0)} {tCommon('km')} · ~{instance.route.estimated_duration_minutes} {tCommon('min')}</span>
      </div>

      {/* Matching row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 600 }}>{t('matching')}</span>
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
          {t('view_details')}
        </button>
      </div>
    </div>
  );
}

// ── Instance detail sheet ─────────────────────────────────────────────────────

function InstanceDetailSheet({ instance, courseId }: { instance: CourseInstance | null; courseId: number }) {
  const t = useTranslations('trip_detail');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const instanceStatus = useInstanceStatusConfig();
  const matchingStatus = useMatchingConfig();
  if (!instance) return null;
  const iCfg    = instanceStatus[instance.status]          ?? instanceStatus.pending;
  const mCfg    = matchingStatus[instance.matching_status]        ?? matchingStatus.PENDING;
  const isGo    = instance.trip_direction === 'go';
  const dateStr = new Date(instance.trip_date).toLocaleDateString(locale, {
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
            {isGo ? t('go') : t('return')}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, background: iCfg.bg, color: iCfg.color,
            border: `1px solid ${iCfg.border}`, borderRadius: 20, padding: '3px 10px',
          }}>
            {iCfg.label}
          </span>
        </div>
      </div>
      <p style={{ margin: '0 0 20px', fontSize: 12, color: '#9AA0A6' }}>{t('trip_ref', { id: instance.id, courseId: instance.course_id })}</p>

      {/* Route card */}
      <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('route')}</p>
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A6A7A" strokeWidth="2">
              <path d="M6 9l6-6 6 6M12 3v12" />
            </svg>
            {instance.route.expected_distance.toFixed(1)} {tCommon('km')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IcClock />
            ~{instance.route.estimated_duration_minutes} {tCommon('min')}
          </span>
        </div>
      </div>

      {/* Time window */}
      <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('time_window')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#5A6A7A' }}>{t('pickup')}</span>
            <span style={{ fontWeight: 700, color: '#0B1E3D' }}>{fmtTime(instance.start_time_from)} – {fmtTime(instance.start_time_to)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#5A6A7A' }}>{t('arrival')}</span>
            <span style={{ fontWeight: 700, color: '#0B1E3D' }}>{fmtTime(instance.end_time_from)} – {fmtTime(instance.end_time_to)}</span>
          </div>
          {instance.actual_start_time && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>{t('actual_start')}</span>
              <span style={{ fontWeight: 700, color: '#27AE60' }}>{fmtTime(instance.actual_start_time)}</span>
            </div>
          )}
          {instance.actual_end_time && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>{t('actual_end')}</span>
              <span style={{ fontWeight: 700, color: '#27AE60' }}>{fmtTime(instance.actual_end_time)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Matching */}
      <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('matching')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: '#5A6A7A' }}>{t('status_label')}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, background: mCfg.bg, color: mCfg.color,
              border: `1px solid ${mCfg.border}`, borderRadius: 20, padding: '3px 10px',
            }}>
              {mCfg.label}
            </span>
          </div>
          {instance.matching_price && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>{t('matched_price')}</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D' }}>EGP {parseFloat(instance.matching_price).toLocaleString()}</span>
            </div>
          )}
          {instance.matching_group_code && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>{t('group_code')}</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D', letterSpacing: '0.08em' }}>{instance.matching_group_code}</span>
            </div>
          )}
          {instance.driver_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>{t('driver')}</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D' }}>{t('driver_name') === 'Driver name' ? `#${instance.driver_id}` : t('driver_name')}</span>
            </div>
          )}
          {instance.driver_price && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#5A6A7A' }}>{t('driver_price')}</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D' }}>EGP {parseFloat(instance.driver_price).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Execution Timeline */}
      {instance.execution_timeline && instance.execution_timeline.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <ExecutionTimeline events={instance.execution_timeline} />
        </div>
      )}

      {/* Participants */}
      {instance.participants.length > 0 && (
        <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('passengers_count', { count: instance.participants.length })}
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span style={{ color: '#0B1E3D', fontWeight: 600 }}>
                    {p.name || (p.type === 'passenger' ? `${t('passenger')} #${p.passenger_id ?? 0}` : `User #${p.user_id ?? 0}`)}
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

      {/* Chat — show once matched / active / ongoing / confirmed / completed */}
      {!['draft', 'pending_payment', 'matching', 'matching_failed', 'partially_matched', 'cancelled'].includes(instance.status) && (
        <div style={{ marginBottom: 16 }}>
          <TripChatButton tripInstanceId={instance.id} role="user" courseId={courseId} />
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
  const t = useTranslations('trip_detail');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const STATUS_CONFIG = useStatusConfig();
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance]   = useState<number | null>(null);
  const [paying, setPaying]     = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [repeating, setRepeating]   = useState(false);
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [repeatDone, setRepeatDone]   = useState(false);
  const [showPayConfirm, setShowPayConfirm]       = useState(false);
  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false);

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
      .catch(() => setError(t('load_error')))
      .finally(() => setLoading(false));

    setInstancesLoading(true);
    getCourseInstances(id)
      .then(res => setInstances(res.data))
      .catch(() => {})
      .finally(() => setInstancesLoading(false));
  }, [id, t]);

  useEffect(() => {
    getLastBalance().then(res => setBalance(res.data.last_balance)).catch(() => {});
  }, []);

  async function handleConfirmPay() {
    if (!course) return;
    setPayError(null);
    setPaying(true);
    try {
      const res = await confirmCoursePayment(course.id);
      // If the API returns a Kashier payment URL, open it in a new tab
      const fallback = res as unknown as Record<string, unknown>;
      const nested = fallback['data'] as Record<string, unknown> | undefined;
      const url: string | undefined =
        res.payment_url ||
        (nested?.['payment_url'] as string | undefined) ||
        (fallback['url'] as string | undefined);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        // Close dialog after opening payment link
        setShowPayConfirm(false);
        setPaying(false);
        return;
      }
      // No payment URL returned — show error, do not auto-pay
      setPayError(t('payment_failed'));
      setPaying(false);
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : t('payment_failed'));
    } finally {
      setPaying(false);
    }
  }

  async function handleRepeat() {
    if (!course) return;
    setRepeatError(null);
    setRepeating(true);
    try {
      const nextWeekDate = getNextWeekDate(course.start_date);
      await repeatCourse(course.id, { start_date: nextWeekDate });
      setRepeatDone(true);
    } catch (e: unknown) {
      setRepeatError(e instanceof Error ? e.message : 'Failed to repeat course');
    } finally {
      setRepeating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <PageHeader title={t('title')} onBack={() => router.back()} />
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9AA0A6', fontSize: 14 }}>
          {t('loading')}
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <PageHeader title={t('title')} onBack={() => router.back()} />
        <div style={{ textAlign: 'center', padding: '64px 16px', color: '#E74C3C', fontSize: 14 }}>
          {error ?? t('not_found')}
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[course.status] ?? {
    label: course.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    bg: '#F1F3F4', color: '#5A6A7A', border: '#E2E8F0',
  };

  const estimatedTotalPrice = Math.round(parseFloat(course.estimated_total_price));

  // First "go" schedule for top-level pickup window
  const firstGo = course.weekly_trip_schedules.find(s => s.trip_direction === 'go');

  return (
    <>
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PageHeader title={t('title')} onBack={() => router.back()} />

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Overview card ── */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 1px 4px rgba(11,30,61,0.06)' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0B1E3D' }}>{t('overview')}</p>
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
            {t('created', { date: fmtCreatedAt(course.created_at, locale) })}
          </p>

          {/* Info rows */}
          <div>
            <OverviewRow icon={<IcCalendar />} label={t('dates')}  value={`${course.start_date} → ${course.end_date}`} />
            <OverviewRow icon={<IcPrice />}    label={t('price')}  value={`${tCommon('egp')} ${estimatedTotalPrice.toLocaleString()}`} />
            <OverviewRow icon={<IcWallet />}   label={t('wallet_label')} value={course.wallet_status} />
            <OverviewRow icon={<IcCar />}      label={t('type_label')}   value={`${course.trip_type === 'individual' ? t('trip_type_individual') : t('trip_type_group')}${course.group_type ? ` · ${course.group_type === 'friends' ? t('group_type_friends') : t('group_type_public')}` : ''}`} />
            {firstGo && (
              <OverviewRow
                icon={<IcClock />}
                label={t('pickup_window')}
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
              {t('weekly_schedule')} {instances.length > 0 && <span style={{ color: '#00C2A8', fontWeight: 800 }}>({instances.length})</span>}
            </p>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IcRoute /></span>
          </div>

          {instancesLoading ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#9AA0A6', fontSize: 13 }}>
              {t('loading_trips')}
            </div>
          ) : instances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#9AA0A6', fontSize: 13, background: '#F8F9FA', borderRadius: 12 }}>
              {t('no_trips')}
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
              {t('notes_label')}
            </p>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#0B1E3D', lineHeight: 1.6, boxShadow: '0 1px 4px rgba(11,30,61,0.04)' }}>
              {course.notes}
            </div>
          </div>
        )}

        {/* ── Payment card (show unless already paid) ── */}
        {/* ── Balance warning for pending_payment ── */}
        {course.status === 'pending_payment' && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 1px 4px rgba(11,30,61,0.06)' }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0B1E3D' }}>{t('payment')}</p>

            {/* Balance row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{t('wallet_balance')}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: balance !== null && balance < estimatedTotalPrice ? '#E74C3C' : '#27AE60' }}>
                {balance !== null ? `EGP ${balance.toLocaleString()}` : '…'}
              </span>
            </div>

            {/* Cost row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #F1F3F4', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{t('trip_cost')}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>EGP {estimatedTotalPrice.toLocaleString()}</span>
            </div>

            {/* Top-up needed message */}
            {balance !== null && balance < estimatedTotalPrice && (
              <div style={{ background: '#FFF3E0', border: '1px solid #FFCCBC', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#BF360C', fontWeight: 600 }}>You should top up EGP {(estimatedTotalPrice - balance).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => router.push('/user/wallet')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#00C2A8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t('top_up')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Confirm pay button for payment_required ── */}
        {course.status === 'payment_required' && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 1px 4px rgba(11,30,61,0.06)' }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0B1E3D' }}>{t('payment')}</p>

            {/* Balance row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{t('wallet_balance')}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: balance !== null && balance < estimatedTotalPrice ? '#E74C3C' : '#27AE60' }}>
                {balance !== null ? `EGP ${balance.toLocaleString()}` : '…'}
              </span>
            </div>

            {/* Cost row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #F1F3F4', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{t('trip_cost')}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>EGP {estimatedTotalPrice.toLocaleString()}</span>
            </div>

            {/* Insufficient balance warning */}
            {balance !== null && balance < estimatedTotalPrice && (
              <div style={{ background: '#FFF3E0', border: '1px solid #FFCCBC', borderRadius: 10, padding: '10px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#BF360C', fontWeight: 600 }}>{t('not_enough')}</span>
                <button
                  type="button"
                  onClick={() => router.push('/user/wallet')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#00C2A8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t('top_up')}
                </button>
              </div>
            )}

            {/* Error */}
            {payError && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#E74C3C', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 12px' }}>
                {payError}
              </p>
            )}

            {/* Pay button */}
            <button
              type="button"
              onClick={() => setShowPayConfirm(true)}
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
              {paying ? t('processing') : t('confirm_pay')}
            </button>
          </div>
        )}

        {/* ── Repeat button (active or completed) ── */}
        {(course.status === 'active' || course.status === 'completed') && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 1px 4px rgba(11,30,61,0.06)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#0B1E3D' }}>Repeat This Course</p>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#9AA0A6' }}>
              Next week from {getNextWeekDate(course.start_date)}
            </p>
            {repeatError && (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#E74C3C', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 12px' }}>
                {repeatError}
              </p>
            )}
            {repeatDone ? (
              <div style={{ background: '#E8F5E9', border: '1px solid #A8D5B5', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#27AE60' }}>✓ Course repeated!</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5A6A7A' }}>Check My Requests for the new course.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRepeatConfirm(true)}
                disabled={repeating}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: '1.5px solid #00C2A8',
                  background: repeating ? '#C5CDD6' : '#F0FFFE',
                  color: repeating ? '#9AA0A6' : '#00C2A8',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: repeating ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2-8.83" />
                </svg>
                {repeating ? 'Creating...' : 'Repeat Next Week'}
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
      title={t('title')}
    >
      {instanceLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9AA0A6', fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
          {t('loading')}
        </div>
      ) : (
        <InstanceDetailSheet
          instance={selectedInstance}
          courseId={id}
        />
      )}
    </BottomSheet>

    {/* ── Pay Confirmation Dialog ── */}
    {showPayConfirm && (
      <>
        <div onClick={() => setShowPayConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400 }} />
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 'min(88vw,340px)', background: '#fff', borderRadius: 20,
          padding: '28px 24px 22px', zIndex: 401, display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0B1E3D' }}>Confirm Payment</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A', lineHeight: 1.6 }}>
            Pay <strong>EGP {estimatedTotalPrice.toLocaleString()}</strong> from your wallet for this course?
          </p>
          {balance !== null && balance < estimatedTotalPrice && (
            <p style={{ margin: 0, fontSize: 13, color: '#BF360C', background: '#FFF3E0', border: '1px solid #FFCCBC', borderRadius: 8, padding: '8px 12px' }}>
              Insufficient balance (EGP {balance.toLocaleString()}). <button type="button" onClick={() => { setShowPayConfirm(false); router.push('/user/wallet'); }} style={{ background: 'none', border: 'none', color: '#00C2A8', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Top up →</button>
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 8 }}>
            <button onClick={() => setShowPayConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#9AA0A6', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleConfirmPay} disabled={paying} style={{ background: 'none', border: 'none', cursor: paying ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, color: paying ? '#B0BEC5' : '#0B1E3D', fontFamily: 'inherit', opacity: paying ? 0.6 : 1 }}>{paying ? 'Processing...' : 'Pay Now'}</button>
          </div>
        </div>
      </>
    )}

    {/* ── Repeat Confirmation Dialog ── */}
    {showRepeatConfirm && (
      <>
        <div onClick={() => setShowRepeatConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400 }} />
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 'min(88vw,340px)', background: '#fff', borderRadius: 20,
          padding: '28px 24px 22px', zIndex: 401, display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0B1E3D' }}>Repeat Course?</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A', lineHeight: 1.6 }}>
            Create the same course starting from <strong>{getNextWeekDate(course.start_date)}</strong> (next week)?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 8 }}>
            <button onClick={() => setShowRepeatConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#9AA0A6', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => { setShowRepeatConfirm(false); handleRepeat(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#00C2A8', fontFamily: 'inherit' }}>Repeat</button>
          </div>
        </div>
      </>
    )}
    </>
  );
}
