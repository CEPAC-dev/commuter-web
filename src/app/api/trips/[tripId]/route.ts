import type { DailyTrip } from '@/types/trip';
import { getTrip, setTrip } from '@/lib/tripStore';
// Mock data removed

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;
  const trip = getTrip(tripId);
  if (!trip) {
    // TODO: fetch trip from API backend when endpoint available
    return Response.json({ error: 'Trip not found' }, { status: 404 });
  }
  return Response.json(trip);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;
  const body = (await req.json()) as Partial<DailyTrip>;

  const trip = getTrip(tripId);
  if (!trip) {
    // TODO: fetch trip from API backend when endpoint available
    return Response.json({ error: 'Trip not found' }, { status: 404 });
  }

  const next: DailyTrip = { ...trip, ...body, trip_id: tripId };
  if (body.stops) next.stops = body.stops;
  setTrip(next);
  return Response.json(next);
}
