'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DriverCycleRequest } from '@/types/driver';
// Mock data removed
import RequestCard from '@/components/driver/RequestCard';
import RequestDetailModal from '@/components/driver/RequestDetailModal';
import RaisePriceModal from '@/components/driver/RaisePriceModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

type StatusFilter = 'confirmed' | 'active' | 'completed' | 'cancelled';
type SortKey = 'newest' | 'oldest' | 'highest-price' | 'nearest-start';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'active',     label: 'Active' },
  { key: 'completed',  label: 'Completed' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const DRIVER_GENDER = 'male'; // TODO: get from driver profile API

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'highest-price', label: 'Highest price' },
  { key: 'nearest-start', label: 'Nearest start date' },
];

const PAGE_SIZE = 10;

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<DriverCycleRequest[]>([]); // TODO: fetch from API
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('confirmed');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [detailRequest, setDetailRequest] = useState<DriverCycleRequest | null>(null);
  const [raiseRequest, setRaiseRequest] = useState<DriverCycleRequest | null>(null);

  const filtered = useMemo(() => {
    let list = requests.filter((r) => r.status === statusFilter);

    switch (sortKey) {
      case 'newest':
        list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest-price':
        list = [...list].sort((a, b) => (b.offered_price ?? b.base_price) - (a.offered_price ?? a.base_price));
        break;
      case 'nearest-start':
        list = [...list].sort((a, b) => new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime());
        break;
    }

    return list;
  }, [requests, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [statusFilter, sortKey]);

  const handleAccept = useCallback((id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'confirmed' as const } : r));
    setDetailRequest(null);
    toast.success('Request accepted!');
  }, []);

  const handleReject = useCallback((id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' as const } : r));
    setDetailRequest(null);
    toast.success('Request rejected.');
  }, []);

  const handleRaiseOpen = useCallback((id: string) => {
    const req = requests.find((r) => r.id === id) ?? null;
    setRaiseRequest(req);
    setDetailRequest(null);
  }, [requests]);

  const handleRaiseConfirm = useCallback((requestId: string, newPrice: number) => {
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, offered_price: newPrice, status: 'price_raised' as const } : r));
    setRaiseRequest(null);
    toast.success(`Price updated to EGP ${newPrice.toFixed(2)}`);
  }, []);

  const handleSeeDetails = useCallback((id: string) => {
    setDetailRequest(requests.find((r) => r.id === id) ?? null);
  }, [requests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Requests</h1>
        <p className="text-text-muted text-sm mt-1">
          {filtered.length} {statusFilter} request{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filter + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-primary/10 rounded-md p-1 overflow-x-auto" role="tablist" aria-label="Filter requests by status">
          {TABS.map((tab) => {
            const count = requests.filter((r) => r.status === tab.key).length;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.key)}
                className={[
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                  active ? 'bg-secondary text-primary' : 'text-text-muted hover:text-primary',
                ].join(' ')}
              >
                {tab.label} <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="my-sort-select" className="text-xs text-text-muted font-medium whitespace-nowrap">Sort by</label>
          <select
            id="my-sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 text-primary bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {paginated.length === 0 ? (
        <p className="text-text-muted text-sm bg-white rounded-md border border-primary/10 p-8 text-center">
          No {statusFilter} requests at the moment.
        </p>
      ) : (
        <div className="space-y-4" role="list" aria-label="Requests list">
          {paginated.map((req) => (
            <div key={req.id} role="listitem">
              <RequestCard
                request={req}
                driverGender={DRIVER_GENDER}
                onAccept={handleAccept}
                onReject={handleReject}
                onRaise={handleRaiseOpen}
                onSeeDetails={handleSeeDetails}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-md border border-gray-200 text-text-muted hover:text-primary disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={[
                'w-8 h-8 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                p === page
                  ? 'bg-secondary text-primary'
                  : 'border border-gray-200 text-text-muted hover:text-primary',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-md border border-gray-200 text-text-muted hover:text-primary disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      {/* Detail modal */}
      {detailRequest && (
        <RequestDetailModal
          isOpen={true}
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          onRaise={handleRaiseOpen}
        />
      )}

      {/* Raise price modal */}
      {raiseRequest && (
        <RaisePriceModal
          isOpen={true}
          request={raiseRequest}
          onClose={() => setRaiseRequest(null)}
          onConfirm={handleRaiseConfirm}
        />
      )}
    </div>
  );
}
