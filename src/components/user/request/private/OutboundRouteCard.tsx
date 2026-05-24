'use client';

import type { GeoLocation } from '@/types/shared';
import type { ORSRoute } from '@/lib/openrouteservice';

interface Props {
  origin:       GeoLocation | null;
  destination:  GeoLocation | null;
  /** Intermediate route stop (added via RoutePicker for routing). */
  routeStop:    GeoLocation | null;
  pickupPoint:  GeoLocation | null;
  route:        ORSRoute | null;
  hasPickupPoint: boolean;
  onAddPickupPoint:    () => void;
  onRemovePickupPoint: () => void;
  onSetRoute:          () => void;
  onSetPickupPoint:    () => void;
  /** Clear the intermediate route stop without reopening the picker. */
  onRemoveRouteStop:   () => void;
}

function Row({
  index, title, hint, value, action,
}: { index: number; title: string; hint: string; value: string | null; action: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3">
      <span className="w-7 h-7 rounded-full bg-[#F1F3F4] text-[#0B1E3D] flex items-center justify-center text-xs font-bold flex-shrink-0">
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0B1E3D]">{title}</p>
        <p className="text-xs text-[#8A9AB0] mb-1">{hint}</p>
        {value
          ? <p className="text-xs text-[#0B1E3D] flex items-start gap-1.5">
              <span className="text-[#00C2A8] mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <span className="leading-snug">{value}</span>
            </p>
          : <p className="text-xs italic text-[#9AA0A6]">Not set</p>}
      </div>
      {action}
    </div>
  );
}

export default function OutboundRouteCard({
  origin, destination, routeStop, pickupPoint, route,
  hasPickupPoint,
  onRemovePickupPoint,
  onSetRoute, onRemoveRouteStop,
}: Props) {
  const routeReady = !!origin && !!destination;

  // Dynamic row indices so numbering stays consecutive
  let idx = 1;

  return (
    <div className="border border-[#E2E8F0] rounded-2xl bg-white p-3 space-y-3">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span className="text-sm font-semibold text-[#0B1E3D]">Route</span>
      </div>

      <Row
        index={idx++}
        title="From"
        hint="Trip start area"
        value={origin?.address ?? null}
        action={null}
      />

      {routeStop && (
        <Row
          index={idx++}
          title="Stop"
          hint="Intermediate stop along route"
          value={routeStop.address}
          action={
            <button
              type="button"
              onClick={onRemoveRouteStop}
              className="text-[11px] text-[#E74C3C] font-medium hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Remove
            </button>
          }
        />
      )}

      <Row
        index={idx++}
        title="Destination"
        hint="Final drop-off"
        value={destination?.address ?? null}
        action={null}
      />

      {hasPickupPoint && (
        <Row
          index={idx++}
          title="Pickup point"
          hint="Meeting point for pickup"
          value={pickupPoint?.address ?? null}
          action={
            <button
              type="button"
              onClick={onRemovePickupPoint}
              className="text-[11px] text-[#E74C3C] font-medium hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Remove
            </button>
          }
        />
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {!routeStop && (
            <button
              type="button"
              onClick={onSetRoute}
              className="text-xs font-medium text-[#5A6A7A] hover:text-[#0B1E3D] hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Add stop (optional)
            </button>
          )}

        </div>

        <button
          type="button"
          onClick={onSetRoute}
          className="ml-auto px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{
            background: '#0B1E3D',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {routeReady ? '✏ Edit route' : 'Set route'}
        </button>
      </div>

      {route && routeReady && (
        <p className="text-xs text-[#5A6A7A] text-right">
          {route.distance_km.toFixed(1)} km · ~{Math.round(route.duration_minutes)} min
        </p>
      )}
    </div>
  );
}
