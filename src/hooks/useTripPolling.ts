import { useState, useEffect, useCallback } from 'react';
import type { DailyTrip } from '@/types/trip';
import { fetchTripState } from '@/lib/mockTrip';

/**
 * Polls trip state at a fixed interval.
 * Returns the latest trip snapshot and a manual refresh function.
 */
export function useTripPolling(
  tripId: string,
  intervalMs: number = 10_000,
) {
  const [trip, setTrip] = useState<DailyTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchTripState(tripId);
      setTrip(data);
      setError(null);
    } catch {
      setError('Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling interval
  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { trip, loading, error, refresh };
}
