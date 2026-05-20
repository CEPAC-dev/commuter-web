'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { GeoLocation, TimeSlot } from '@/types/shared';
import type { ORSRoute } from '@/lib/openrouteservice';

// ── Types ─────────────────────────────────────────────────────────────────────

/** @deprecated Use per-slot return route fields on TimeSlot instead */
export interface ReturnRoute {
  origin:      GeoLocation;
  destination: GeoLocation;
  route:       ORSRoute | null;
  customized:  boolean;
}

/** WizardTimeSlot is now an alias for the full TimeSlot type */
export type WizardTimeSlot = TimeSlot;

interface WizardState {
  // Step 1 — ride type
  ride_type:       'private' | 'shared' | null;
  group_type:      'friends' | 'open' | null;
  group_action:    'create' | 'join' | null;
  group_code:      string | null;
  passenger_count: number;
  include_self:    boolean;
  selected_passenger_ids: number[];

  // Step 2 — outbound route
  origin:      GeoLocation | null;
  stops:       (GeoLocation | null)[];
  destination: GeoLocation | null;
  route:       ORSRoute | null;

  // Step 3 — per-slot return routes
  return_routes: Record<string, ReturnRoute>;

  // Step 4 — schedule
  time_slots: WizardTimeSlot[];

  // Seat
  seat_preference: 'any' | import('@/types/shared').SelectedSeat;

  // Meta
  cycle_start_date: string;
}

interface WizardActions {
  setRideType:       (type: 'private' | 'shared') => void;
  setGroupType:      (type: 'friends' | 'open') => void;
  setGroupAction:    (action: 'create' | 'join') => void;
  setGroupCode:      (code: string) => void;
  setPassengerCount: (n: number) => void;
  setIncludeSelf:    (v: boolean) => void;
  setSelectedPassengerIds: (ids: number[]) => void;
  setRoute:          (
    origin:      GeoLocation,
    destination: GeoLocation,
    stops:       GeoLocation[],
    route:       ORSRoute,
  ) => void;
  setReturnRoute:    (slotId: string, r: ReturnRoute) => void;
  clearReturnRoute:  (slotId: string) => void;
  setTimeSlots:      (slots: WizardTimeSlot[]) => void;
  updateSlotRoute:   (slotId: string, patch: Partial<WizardTimeSlot>) => void;
  updateSlotReturnRoute: (slotId: string, patch: Partial<WizardTimeSlot>) => void;
  setSeatPreference: (seat: WizardState['seat_preference']) => void;
  setCycleStartDate: (date: string) => void;
  reset:             () => void;
}

type WizardContextValue = WizardState & WizardActions;

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultState: WizardState = {
  ride_type:        null,
  group_type:       null,
  group_action:     null,
  group_code:       null,
  passenger_count:  1,
  include_self:     false,
  selected_passenger_ids: [],
  origin:           null,
  stops:            [],
  destination:      null,
  route:            null,
  return_routes:    {},
  time_slots:       [],
  seat_preference:  'any',
  cycle_start_date: '',
};

// ── Context ───────────────────────────────────────────────────────────────────

const WizardContext = createContext<WizardContextValue | null>(null);

export function RequestWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState);

  const actions: WizardActions = {
    setRideType(type) {
      setState(prev => ({ ...prev, ride_type: type }));
    },
    setGroupType(type) {
      setState(prev => ({ ...prev, group_type: type }));
    },
    setGroupAction(action) {
      setState(prev => ({ ...prev, group_action: action }));
    },
    setGroupCode(code) {
      setState(prev => ({ ...prev, group_code: code }));
    },
    setPassengerCount(n) {
      setState(prev => ({ ...prev, passenger_count: n }));
    },
    setIncludeSelf(v) {
      setState(prev => ({ ...prev, include_self: v }));
    },
    setSelectedPassengerIds(ids) {
      setState(prev => ({ ...prev, selected_passenger_ids: ids }));
    },
    setRoute(origin, destination, stops, route) {
      setState(prev => ({
        ...prev,
        origin,
        destination,
        stops,
        route,
        // Reset return routes if route changed
        return_routes: {},
      }));
    },
    setReturnRoute(slotId, returnRoute) {
      setState(prev => ({
        ...prev,
        return_routes: { ...prev.return_routes, [slotId]: returnRoute },
      }));
    },
    clearReturnRoute(slotId) {
      setState(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [slotId]: _removed, ...remaining } = prev.return_routes;
        return { ...prev, return_routes: remaining };
      });
    },
    setTimeSlots(slots) {
      setState(prev => ({ ...prev, time_slots: slots }));
    },
    updateSlotRoute(slotId, patch) {
      setState(prev => ({
        ...prev,
        time_slots: prev.time_slots.map(s =>
          s.id === slotId ? { ...s, ...patch } : s
        ),
      }));
    },
    updateSlotReturnRoute(slotId, patch) {
      setState(prev => ({
        ...prev,
        time_slots: prev.time_slots.map(s =>
          s.id === slotId ? { ...s, ...patch } : s
        ),
      }));
    },
    setSeatPreference(seat) {
      setState(prev => ({ ...prev, seat_preference: seat }));
    },
    setCycleStartDate(date) {
      setState(prev => ({ ...prev, cycle_start_date: date }));
    },
    reset() {
      setState(defaultState);
    },
  };

  return (
    <WizardContext.Provider value={{ ...state, ...actions }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside RequestWizardProvider');
  return ctx;
}
