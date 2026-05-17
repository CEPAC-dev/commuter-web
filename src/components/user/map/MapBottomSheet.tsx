'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { LocationValue } from './FloatingSearchBar';
import RequestForm, { type RequestFormData } from '@/components/user/request/RequestForm';
import RequestSummaryCard from '@/components/user/request/RequestSummaryCard';
// Mock data removed
import { useMap } from '@/lib/MapContext';
import { useMounted } from '@/lib/useMounted';
import { timeDiffMinutes } from '@/lib/timeUtils';

// ── Quick destination chips ────────────────────────────────────────────────
function QuickChips({ onSelect }: { onSelect: (loc: LocationValue) => void }) {
  const saved: Array<{ id: string; label: string; address: string; lat: number; lng: number; name: string }> = []; // TODO: fetch from user profile when API available
  if (saved.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
      {saved.map((s) => {
        const icon = s.label === 'home' ? '🏠' : s.label === 'work' ? '🏢' : '📍';
        return (
          <button key={s.id} onClick={() => onSelect({ address: s.address, lat: s.lat, lng: s.lng })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF7F6', border: '1px solid #C8E8E4', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: '#0B1E3D', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#00C2A8'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#00C2A8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#EFF7F6'; e.currentTarget.style.color = '#0B1E3D'; e.currentTarget.style.borderColor = '#C8E8E4'; }}>
            <span>{icon}</span> {s.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Main sheet ─────────────────────────────────────────────────────────────
interface MapBottomSheetProps {
  formData: RequestFormData;
  onFormChange: (d: RequestFormData) => void;
  onSubmit: () => void;
  step: 'map' | 'form' | 'review';
  onStepChange: (s: 'map' | 'form' | 'review') => void;
}


export default function MapBottomSheet({
  formData,
  onFormChange,
  onSubmit,
  step,
  onStepChange,
}: MapBottomSheetProps) {
  const { routes, origin: from, destination: to, setDestination, stopsForcedPrivate } = useMap();
  const onSetTo = (loc: LocationValue) => setDestination(loc);
  const hasStops = stopsForcedPrivate;
  const t = useTranslations('map');
  // hidden | half | full
  const [sheetState, setSheetState] = useState<'hidden' | 'half' | 'full'>('hidden');
  const [showErrors, setShowErrors] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);
  const isDragging = useRef(false);

  const route = routes[0] ?? null;

  // Open/close based on route availability
  useEffect(() => {
    if (route) {
      setSheetState('half');
    } else {
      setSheetState('hidden');
    }
  }, [route]);

  // Drag handle logic
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartTranslate.current = sheetState === 'full' ? 0 : 1;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [sheetState]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientY - dragStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.transform = `translateY(${Math.max(0, delta)}px)`;
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = e.clientY - dragStartY.current;
    const vh = window.innerHeight;
    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }
    if (delta > vh * 0.1) {
      // Drag down — close if half, go half if full
      if (sheetState === 'full') setSheetState('half');
      else setSheetState('hidden');
    } else if (delta < -(vh * 0.1)) {
      setSheetState('full');
    }
  }, [sheetState]);

  function handleReview() {
    const hasSlots = formData.time_slots.length > 0;
    const hasEmptySlotDays = formData.time_slots.some((slot) => slot.days.length === 0);
    const hasInvalidPickupWindow = formData.time_slots.some((slot) => {
      const gap = timeDiffMinutes(slot.pickup_from, slot.pickup_to);
      return gap < 30 || gap > 120;
    });
    const hasInvalidArrivalWindow = formData.time_slots.some((slot) => {
      const gap = timeDiffMinutes(slot.arrival_from, slot.arrival_to);
      return gap < 30 || gap > 120;
    });
    const hasInvalidReturnWindow = formData.time_slots.some((slot) => {
      if (slot.trip_type !== 'round_trip') return false;
      if (!slot.return_pickup_from || !slot.return_pickup_to || !slot.return_arrival_from || !slot.return_arrival_to) return true;
      const gap = timeDiffMinutes(slot.return_pickup_from, slot.return_pickup_to);
      const arrivalGap = timeDiffMinutes(slot.return_arrival_from, slot.return_arrival_to);
      if (arrivalGap < 30 || arrivalGap > 120) return true;
      return gap < 30 || gap > 120;
    });

    const assignedDays = formData.time_slots.flatMap((slot) => slot.days);
    const hasDuplicateDay = new Set(assignedDays).size !== assignedDays.length;
    const hasErrors = !formData.start_date || !hasSlots || hasEmptySlotDays || hasInvalidPickupWindow || hasInvalidArrivalWindow || hasInvalidReturnWindow || hasDuplicateDay;

    if (hasErrors) { setShowErrors(true); return; }
    setShowErrors(false);
    onStepChange('review');
    setSheetState('full');
  }

  const mounted = useMounted();
  // Use 0 on server/first render so server and client HTML match (no hydration mismatch).
  // After mount, switch to 64px on mobile to account for the bottom nav.
  const bottomOffset = mounted ? (window.innerWidth < 768 ? 64 : 0) : 0;

  const translateMap: Record<typeof sheetState, string> = {
    hidden: 'translateY(100%)',
    half: 'translateY(0)',
    full: 'translateY(0)',
  };
  const maxHeightMap: Record<typeof sheetState, string> = {
    hidden: '0',
    half: '45vh',
    full: 'calc(100dvh - 232px)',
  };

  return (
    <>
      {/* Reopen tab — shown when sheet is dismissed but a route exists */}
      {sheetState === 'hidden' && route && (
        <button
          onClick={() => setSheetState('half')}
          style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            zIndex: 499, border: 'none', borderRadius: '12px 12px 0 0',
            background: '#00C2A8', padding: '10px 28px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            fontWeight: 700, color: '#0B1E3D',
            boxShadow: '0 -2px 16px rgba(0,194,168,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
          {route.distance_km} km · ~{route.duration_minutes} min · {t('plan_commute_tab')}
        </button>
      )}

      <div
        ref={sheetRef}
        style={{
        position: 'fixed',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        zIndex: 500,
        borderRadius: '20px 20px 0 0',
        background: 'white',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        transform: translateMap[sheetState],
        maxHeight: maxHeightMap[sheetState],
        transition: 'transform 300ms ease-out, max-height 300ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ padding: '12px 0 8px', display: 'flex', justifyContent: 'center', cursor: 'grab', flexShrink: 0, touchAction: 'none' }}
      >
        <div style={{ width: 32, height: 4, background: '#D1D5DB', borderRadius: 2 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 20px' }} className="no-scrollbar">
        {route && (
          <>
            {/* Route summary row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 20 }}>🗺</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D' }}>
                  {route.distance_km} km · ~{route.duration_minutes} min
                </div>
                {from && to && (
                  <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 1 }}>
                    {from.address.split(',')[0]} → {to.address.split(',')[0]}
                  </div>
                )}
              </div>
            </div>

            {step !== 'review' && (
              <>
                {/* Quick chips */}
                {!to && <div style={{ marginBottom: 12 }}><QuickChips onSelect={onSetTo} /></div>}

         

                {/* CTA or form */}
                {step === 'map' && (
                  <button
                    onClick={() => { onStepChange('form'); setSheetState('full'); }}
                    style={{ width: '100%', padding: 14, border: 'none', borderRadius: 12, background: '#00C2A8', color: '#0B1E3D', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
                  >
                    {t('plan_commute_btn')} →
                  </button>
                )}

                {step === 'form' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <RequestForm
                      data={formData}
                      onChange={onFormChange}
                      onReview={handleReview}
                      showErrors={showErrors}
                      distanceKm={route.distance_km}
                      lockedToPrivate={hasStops}
                    />
                  </div>
                )}
              </>
            )}

            {step === 'review' && from && to && (
              <RequestSummaryCard
                from={from}
                to={to}
                route={route}
                formData={formData}
                onEdit={() => { onStepChange('form'); }}
                onSubmit={onSubmit}
              />
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
