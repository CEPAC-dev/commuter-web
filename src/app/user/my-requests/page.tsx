'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { UserRequest, RequestStatus } from '@/types/user';
import { mockRequests } from '@/lib/mockUser';
import RequestStatusCard from '@/components/user/my-requests/RequestStatusCard';
import EmptyState from '@/components/shared/EmptyState';
import { useTranslations } from 'next-intl';

type Tab = 'pending' | 'active' | 'completed';

const PENDING_STATUSES: RequestStatus[] = [
  'submitted', 'matching', 'finding_driver', 'driver_offered', 'price_raised', 'confirmed',
];

function filterByTab(requests: UserRequest[], tab: Tab): UserRequest[] {
  switch (tab) {
    case 'pending':   return requests.filter((r) => PENDING_STATUSES.includes(r.status));
    case 'active':    return requests.filter((r) => r.status === 'active');
    case 'completed': return requests.filter((r) => r.status === 'completed');
  }
}

export default function MyRequestsPage() {
  const t = useTranslations('my_requests');
  const [requests, setRequests] = useState<UserRequest[]>(mockRequests);
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const filtered = filterByTab(requests, activeTab);

  const tabCounts: Record<Tab, number> = {
    pending:   filterByTab(requests, 'pending').length,
    active:    filterByTab(requests, 'active').length,
    completed: filterByTab(requests, 'completed').length,
  };

  function handleCancel(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' as RequestStatus } : r))
    );
    toast.success(t('toast_cancelled'));
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'pending',   label: t('tab_pending') },
    { key: 'active',    label: t('tab_active') },
    { key: 'completed', label: t('tab_completed') },
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <style>{`
        .req-tab { padding: 8px 14px; border: none; background: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 500; color: #5A6A7A; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; min-height: 44px; }
        .req-tab.active { color: #00C2A8; border-bottom-color: #00C2A8; font-weight: 700; }
        .req-tab:hover:not(.active) { color: #0B1E3D; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#0B1E3D' }}>
          {t('page_title')}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A' }}>
          {t('page_subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          overflowX: 'auto',
          marginBottom: 20,
          gap: 0,
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`req-tab${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
            {tabCounts[key] > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: activeTab === key ? '#00C2A8' : '#E2E8F0',
                  color: activeTab === key ? '#0B1E3D' : '#5A6A7A',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 6px',
                }}
              >
                {tabCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={activeTab === 'completed' ? '🏁' : '📋'}
            title={
              activeTab === 'pending'
                ? t('empty_pending')
                : activeTab === 'active'
                ? t('empty_active')
                : t('empty_completed')
            }
            description={
              activeTab === 'pending' || activeTab === 'active'
                ? t('empty_active_desc')
                : undefined
            }
          />
        ) : (
          filtered.map((r) => (
            <RequestStatusCard
              key={r.id}
              request={r}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>
    </div>
  );
}
