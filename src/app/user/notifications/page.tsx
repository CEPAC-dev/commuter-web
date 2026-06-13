'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import type { Notification, NotificationType } from '@/types/user';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '@/lib/api/notifications';

// Add global styles for animations
const globalStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spin-icon {
    animation: spin 1s linear infinite;
    display: inline-block;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = globalStyles;
  if (document.head) document.head.appendChild(styleSheet);
}

const TYPE_ICONS: Record<NotificationType, () => JSX.Element> = {
  payment_required: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  driver_assigned: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6-2c1.66 0 3 1.34 3 3v2h-6V9c0-1.66 1.34-3 3-3z"></path>
      <circle cx="12" cy="16" r="2"></circle>
    </svg>
  ),
  wallet_settled: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1"></circle>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      <polyline points="12 7 12 12 16 14"></polyline>
    </svg>
  ),
  request_matched: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  price_raised: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  request_confirmed: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
    </svg>
  ),
  cycle_starting_tomorrow: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  cycle_completed: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
    </svg>
  ),
  payment_deducted: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  refund_issued: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10"></polyline>
      <path d="M3.51 15a9 9 0 0 0 14.85-4M23 20v-6h-6"></path>
      <path d="M20.49 9a9 9 0 0 0-14.85 4"></path>
    </svg>
  ),
  request_cancelled: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
};

type NotificationTranslator = ReturnType<typeof useTranslations<'notifications'>>;

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const LoadingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin-icon">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 6v6l4 2"></path>
  </svg>
);

const ErrorIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const BellIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

function timeAgo(iso: string, t: NotificationTranslator, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('just_now');
  if (minutes < 60) return t('minutes_ago', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hours_ago', { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t('yesterday');
  return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
  t,
  locale,
}: {
  notification: Notification;
  onRead: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  t: NotificationTranslator;
  locale: string;
}) {
  const getActionLabel = (): string => {
    if (notification.type === 'price_raised') return t('action_review') as unknown as string;
    if (notification.type === 'cycle_completed') return t('action_rate') as unknown as string;
    if (notification.type === 'payment_required') return t('action_topup') as unknown as string;
    return t('action_view') as unknown as string;
  };

  const actionLabel = getActionLabel();

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '14px 16px',
        background: notification.is_read ? '#F8F9FA' : '#fff',
        borderLeft: notification.is_read ? '3px solid transparent' : '3px solid #00C2A8',
        borderBottom: '1px solid #F0F0F0',
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        boxShadow: notification.is_read ? 'none' : '0 1px 4px rgba(0,194,168,0.08)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
      onMouseLeave={(e) => (e.currentTarget.style.background = notification.is_read ? '#F8F9FA' : '#fff')}
    >
      <div style={{ fontSize: 20, flexShrink: 0, lineHeight: 1, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C2A8' }}>
        {TYPE_ICONS[notification.type] ? TYPE_ICONS[notification.type]() : <BellIcon />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#0B1E3D',
            }}
          >
            {notification.title}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#5A6A7A', marginTop: 1 }}>
              {timeAgo(notification.created_at, t, locale)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#C5CDD6',
                padding: '4px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E74C3C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#C5CDD6')}
              title="Delete notification"
            >
              <DeleteIcon />
            </button>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#5A6A7A', marginTop: 3, lineHeight: 1.4 }}>
          {notification.body}
        </div>

        {notification.type === 'payment_required' && notification.data?.payment_url ? (
          <a
            href={notification.data.payment_url as string}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontSize: 13,
              color: '#00C2A8',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {actionLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        setError(null);
        const response = await getNotifications(page);
        setNotifications(response.data);
        setTotalPages(response.meta.last_page);
        setTotal(response.meta.total);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [page]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markRead(id: string | number) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }

  async function handleDelete(id: string | number) {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }

  const unread = notifications.filter((n) => !n.is_read);
  const read = notifications.filter((n) => n.is_read);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#0B1E3D' }}>
            {t('page_title')}
          </h1>
          {total > 0 && (
            <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A' }}>
              {t('total_count', { count: total })}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={loading}
            style={{
              padding: '8px 16px',
              border: '1.5px solid #00C2A8',
              borderRadius: 8,
              background: '#fff',
              color: '#00C2A8',
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              minHeight: 40,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {t('mark_all_read')}
          </button>
        )}
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#5A6A7A', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <LoadingIcon />
            </div>
            {t('loading')}
          </div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#E74C3C', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#E74C3C' }}>
              <ErrorIcon />
            </div>
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#5A6A7A', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#5A6A7A' }}>
              <BellIcon />
            </div>
            {t('empty')}
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  {t('new_label')} ({unread.length})
                </div>
                {unread.map((n) => (
                  <NotificationItem key={n.id} notification={n} onRead={markRead} onDelete={handleDelete} t={t} locale={locale} />
                ))}
              </>
            )}

            {read.length > 0 && (
              <>
                <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  {t('older_label')} ({read.length})
                </div>
                {read.map((n) => (
                  <NotificationItem key={n.id} notification={n} onRead={markRead} onDelete={handleDelete} t={t} locale={locale} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            style={{
              padding: '8px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              background: page === 1 ? '#F8F9FA' : '#fff',
              color: page === 1 ? '#C5CDD6' : '#0B1E3D',
              cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            {t('previous')}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={loading}
              style={{
                padding: '8px 12px',
                border: p === page ? '1px solid #00C2A8' : '1px solid #E2E8F0',
                borderRadius: 6,
                background: p === page ? '#EFF7F6' : '#fff',
                color: p === page ? '#00C2A8' : '#5A6A7A',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: p === page ? 600 : 500,
                fontSize: 12,
                fontFamily: 'inherit',
                minWidth: 32,
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            style={{
              padding: '8px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              background: page === totalPages ? '#F8F9FA' : '#fff',
              color: page === totalPages ? '#C5CDD6' : '#0B1E3D',
              cursor: page === totalPages || loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
