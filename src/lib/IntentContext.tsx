'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { RideType, GroupType, GroupAction, GeoLocation } from '@/types/shared';

// Kept for backward-compat (map page join-group prefill flow)
export interface RouteData {
  origin:          GeoLocation;
  destination:     GeoLocation;
  viaStops?:       GeoLocation[];
  departureTimes?: string[];
  selectedDays?:   string[];
  rideType?:       RideType;
}

export interface Intent {
  ride_type:       RideType | null;
  group_type:      GroupType | null;
  group_action:    GroupAction | null;
  group_code:      string | null;
  passenger_count: number;
  /** Maximum number of stops allowed in FloatingSearchBar. Default 2. */
  maxStops:        number;
  /** Legacy prefill used by join-group flow */
  prefillRoute:    RouteData | null;
}

interface IntentContextValue {
  intent:      Intent;
  setIntent:   (partial: Partial<Intent>) => void;
  resetIntent: () => void;
}

const defaultIntent: Intent = {
  ride_type:       null,
  group_type:      null,
  group_action:    null,
  group_code:      null,
  passenger_count: 1,
  maxStops:        2,
  prefillRoute:    null,
};

const IntentContext = createContext<IntentContextValue | null>(null);

export function IntentProvider({ children }: { children: ReactNode }) {
  const [intent, setIntentState] = useState<Intent>(defaultIntent);

  function setIntent(partial: Partial<Intent>) {
    setIntentState((prev) => ({ ...prev, ...partial }));
  }

  function resetIntent() {
    setIntentState(defaultIntent);
  }

  return (
    <IntentContext.Provider value={{ intent, setIntent, resetIntent }}>
      {children}
    </IntentContext.Provider>
  );
}

export function useIntent() {
  const ctx = useContext(IntentContext);
  if (!ctx) throw new Error('useIntent must be used inside IntentProvider');
  return ctx;
}
