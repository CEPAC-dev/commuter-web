'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DriverCycleRequest } from '@/types/driver';
// Mock data removed
import RequestCard from '@/components/driver/RequestCard';
import RequestDetailDrawer from '@/components/driver/RequestDetailDrawer';
import RaisePriceModal from '@/components/driver/RaisePriceModal';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

type SortKey     = 'nearest-start' | 'farthest-start' | 'shortest-distance' | 'longest-distance' | 'most-passengers' | 'highest-price';
type RideTypeFlt = 'any' | 'shared' | 'private';
type GenderFlt   = 'any' | 'mixed' | 'same';
type WalkFlt     = 'any' | '0' | '5' | '10';

const DRIVER_GENDER = 'male'; // TODO: get from driver profile API
const PAGE_SIZE = 10;

export default function RequestsPage() {
  const t = useTranslations('driver_requests');

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'nearest-start',     label: t('sort_nearest') },
    { key: 'farthest-start',    label: t('sort_farthest') },
    { key: 'shortest-distance', label: t('sort_shortest') },
    { key: 'longest-distance',  label: t('sort_longest') },
    { key: 'most-passengers',   label: t('sort_most_passengers') },
    { key: 'highest-price',     label: t('sort_highest_price') },
  ];

  const [requests,       setRequests]       = useState<DriverCycleRequest[]>(
    [] // TODO: fetch from API
  );
  const [sortKey,        setSortKey]        = useState<SortKey>('nearest-start');
  const [rideTypeFilter, setRideTypeFilter] = useState<RideTypeFlt>('any');
  const [genderFilter,   setGenderFilter]   = useState<GenderFlt>('any');
  const [walkFilter,     setWalkFilter]     = useState<WalkFlt>('any');
  const [page,           setPage]           = useState(1);
  const [detailRequest,  setDetailRequest]  = useState<DriverCycleRequest | null>(null);
  const [raiseRequest,   setRaiseRequest]   = useState<DriverCycleRequest | null>(null);

  const filtered = useMemo(() => {
    let list = [...requests];
    if (rideTypeFilter !== 'any') list = list.filter((r) => r.ride_type === rideTypeFilter);
    if (genderFilter   !== 'any') list = list.filter((r) => r.gender_pref === genderFilter);
    if (walkFilter     !== 'any') list = list.filter((r) => String(r.walk_minutes) === walkFilter);
    switch (sortKey) {
      case 'nearest-start':     list.sort((a, b) => new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()); break;
      case 'farthest-start':    list.sort((a, b) => new Date(b.cycle_start_date).getTime() - new Date(a.cycle_start_date).getTime()); break;
      case 'shortest-distance': list.sort((a, b) => a.distance_km - b.distance_km); break;
      case 'longest-distance':  list.sort((a, b) => b.distance_km - a.distance_km); break;
      case 'most-passengers':   list.sort((a, b) => b.passenger_count - a.passenger_count); break;
      case 'highest-price':     list.sort((a, b) => b.base_price - a.base_price); break;
    }
    return list;
  }, [requests, sortKey, rideTypeFilter, genderFilter, walkFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [sortKey, rideTypeFilter, genderFilter, walkFilter]);

  const handleAccept = useCallback((id: string) => {
    setRequests((p) => p.filter((r) => r.id !== id));
    setDetailRequest(null);
    toast.success('Request accepted! Added to My Cycles.');
  }, []);

  const handleReject = useCallback((id: string) => {
    setRequests((p) => p.filter((r) => r.id !== id));
    setDetailRequest(null);
    toast.success('Request declined.');
  }, []);

  const handleRaiseOpen = useCallback((id: string) => {
    setRaiseRequest(requests.find((r) => r.id === id) ?? null);
    setDetailRequest(null);
  }, [requests]);

  const handleRaiseConfirm = useCallback((requestId: string, newPrice: number) => {
    setRequests((p) => p.filter((r) => r.id !== requestId));
    setRaiseRequest(null);
    toast.success(`Counter-price of EGP ${newPrice.toFixed(0)} submitted.`);
  }, []);

  const handleSeeDetails = useCallback((id: string) => {
    setDetailRequest(requests.find((r) => r.id === id) ?? null);
  }, [requests]);

  const SELECT_CLS = 'text-[13px] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#0B1E3D] bg-white outline-none cursor-pointer';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1E3D] m-0">{t('page_title')}</h1>
          <p className="text-sm text-[#5A6A7A] mt-1">{t('page_subtitle')}</p>
        </div>
        <span className="bg-[#F0FDF9] border border-[#C8E8E4] rounded-full px-3 py-1.5 text-xs font-medium text-[#0B1E3D] self-start">
          {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-[13px] text-[#5A6A7A] font-medium whitespace-nowrap">
            Sort:
          </label>
          <select id="sort-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={SELECT_CLS}>
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        <select value={rideTypeFilter} onChange={(e) => setRideTypeFilter(e.target.value as RideTypeFlt)} className={SELECT_CLS} aria-label="Filter by ride type">
          <option value="any">Trip type: Any</option>
          <option value="shared">Shared ride</option>
          <option value="private">Private</option>
        </select>

        <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as GenderFlt)} className={SELECT_CLS} aria-label="Filter by gender preference">
          <option value="any">Gender pref: Any</option>
          <option value="mixed">Mixed</option>
          <option value="same">Same gender</option>
        </select>

        <select value={walkFilter} onChange={(e) => setWalkFilter(e.target.value as WalkFlt)} className={SELECT_CLS} aria-label="Filter by walk minutes">
          <option value="any">Walk: Any</option>
          <option value="0">Door pickup</option>
          <option value="5">5 min walk</option>
          <option value="10">10 min walk</option>
        </select>
      </div>

      {/* Request list */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E2E8F0] text-center gap-3">
          <Calendar size={40} className="text-[#00C2A8]" />
          <p className="text-lg font-semibold text-[#0B1E3D] m-0">{t('empty_title')}</p>
          <p className="text-sm text-[#5A6A7A] m-0">{t('empty_subtitle')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3" role="list" aria-label="Available requests">
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
        <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#5A6A7A] disabled:opacity-40 cursor-pointer disabled:cursor-default"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`w-8 h-8 rounded-lg text-[13px] font-medium cursor-pointer ${
                p === page
                  ? 'bg-[#00C2A8] text-white border-none'
                  : 'bg-white text-[#5A6A7A] border border-[#E2E8F0]'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#5A6A7A] disabled:opacity-40 cursor-pointer disabled:cursor-default"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      <RequestDetailDrawer
        request={detailRequest}
        driverGender={DRIVER_GENDER}
        onClose={() => setDetailRequest(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        onRaise={handleRaiseOpen}
        variant="modal"
      />
      <RaisePriceModal
        request={raiseRequest}
        isOpen={!!raiseRequest}
        onClose={() => setRaiseRequest(null)}
        onConfirm={handleRaiseConfirm}
      />
    </div>
  );
}
