'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Notification } from '@/types/user';
// Mock data removed

const TYPE_ICONS: Record<Notification['type'], string> = {
  request_matched: '✅',
  price_raised: '⚠️',
  request_confirmed: '🎉',
  cycle_starting_tomorrow: '🗓',
  cycle_completed: '🏁',
  payment_deducted: '💳',
  refund_issued: '💰',
  request_cancelled: '❌',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' });
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onRead(notification.id)}
      style={{
        padding: '14px 16px',
        background: notification.isRead ? '#F8F9FA' : '#fff',
        borderLeft: notification.isRead ? '3px solid transparent' : '3px solid #00C2A8',
        borderBottom: '1px solid #F0F0F0',
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        boxShadow: notification.isRead ? 'none' : '0 1px 4px rgba(0,194,168,0.08)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
      onMouseLeave={(e) => (e.currentTarget.style.background = notification.isRead ? '#F8F9FA' : '#fff')}
    >
      <div style={{ fontSize: 20, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>
        {TYPE_ICONS[notification.type] ?? '🔔'}
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
          <span style={{ fontSize: 12, color: '#5A6A7A', flexShrink: 0, marginTop: 1 }}>
            {timeAgo(notification.createdAt)}
          </span>
        </div>

        <div style={{ fontSize: 13, color: '#5A6A7A', marginTop: 3, lineHeight: 1.4 }}>
          {notification.body}
        </div>

        {notification.actionUrl && (
          <Link
            href={notification.actionUrl}
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
            {notification.type === 'price_raised' ? 'Review offer →' :
             notification.type === 'cycle_completed' ? 'Rate driver →' :
             'View request →'}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]); // TODO: fetch from API

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
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
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A' }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              padding: '8px 16px',
              border: '1.5px solid #00C2A8',
              borderRadius: 8,
              background: '#fff',
              color: '#00C2A8',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 40,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {notifications.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#5A6A7A', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            No notifications yet
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  New
                </div>
                {unread.map((n) => (
                  <NotificationItem key={n.id} notification={n} onRead={markRead} />
                ))}
              </>
            )}

            {read.length > 0 && (
              <>
                <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  Older
                </div>
                {read.map((n) => (
                  <NotificationItem key={n.id} notification={n} onRead={markRead} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
