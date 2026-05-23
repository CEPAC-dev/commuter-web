'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourses, type ApiCourse } from '@/lib/api/courses';
import { getLastBalance } from '@/lib/api/wallet';
import CourseCard from '@/components/user/my-requests/CourseCard';
import EmptyState from '@/components/shared/EmptyState';
import { useTranslations } from 'next-intl';

type Filter = 'all' | 'group' | 'individual';

function filterByType(courses: ApiCourse[], f: Filter): ApiCourse[] {
  if (f === 'all')        return courses;
  if (f === 'individual') return courses.filter(c => c.trip_type === 'individual');
  if (f === 'group')      return courses.filter(c => c.trip_type !== 'individual');
  return courses;
}

// Wallet banner — gradient card matching the screenshot
function WalletBanner({ balance, onClick }: { balance: number; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        background: 'linear-gradient(135deg, #0B1E3D 0%, #00C2A8 100%)',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        marginBottom: 20,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          💳
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Available balance</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            EGP {balance.toFixed(2)}
          </p>
        </div>
      </div>
      <span style={{ fontSize: 20, opacity: 0.7 }}>›</span>
    </div>
  );
}

export default function MyRequestsPage() {
  const t = useTranslations('my_requests');
  const router = useRouter();
  const [courses,  setCourses]  = useState<ApiCourse[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [balance, setBalance] = useState<number>(0);

  function loadData() {
    setLoading(true);
    Promise.all([
      getCourses(),
      getLastBalance().catch(() => null),
    ]).then(([coursesRes, balanceRes]) => {
      setCourses(coursesRes.data);
      if (balanceRes) setBalance(balanceRes.data.last_balance);
    }).catch(() => setFetchErr('Failed to load requests.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = filterByType(courses, activeFilter);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'group',      label: 'Group' },
    { key: 'individual', label: 'Individual' },
  ];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 2px', fontSize: 26, fontWeight: 800, color: '#0B1E3D' }}>
          {t('page_title')}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#5A6A7A' }}>
          {t('page_subtitle')}
        </p>
      </div>

      {/* Wallet banner */}
      <WalletBanner balance={balance} onClick={() => router.push('/user/wallet')} />

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
        {FILTERS.map(({ key, label }) => {
          const active = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              style={{
                padding: '7px 18px',
                borderRadius: 50,
                border: active ? '2px solid #00C2A8' : '1.5px solid #E2E8F0',
                background: active ? '#00C2A8' : '#fff',
                color: active ? '#0B1E3D' : '#5A6A7A',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9AA0A6', fontSize: 14 }}>
            Loading…
          </div>
        ) : fetchErr ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#E74C3C', fontSize: 14 }}>
            {fetchErr}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon="📋"
            title={t('empty_pending')}
            description={t('empty_active_desc')}
          />
        ) : (
          displayed.map(c => <CourseCard key={c.id} course={c} onPaid={loadData} />)
        )}
      </div>
    </div>
  );
}

