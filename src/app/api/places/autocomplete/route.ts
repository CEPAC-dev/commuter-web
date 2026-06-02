import { NextRequest, NextResponse } from 'next/server';

// Prefer a server-only (referrer-unrestricted) key; fall back to the public one.
const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('q');
  if (!raw || raw.length < 2) return NextResponse.json([]);
  // Cap input length to bound upstream cost and reject oversized abuse.
  const q = raw.slice(0, 200);
  if (!API_KEY) return NextResponse.json({ error: 'Maps API key not configured' }, { status: 500 });

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', q);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('components', 'country:eg');
  url.searchParams.set('types', 'geocode|establishment');
  // Restrict results to Greater Cairo area
  url.searchParams.set('location', '30.0614,31.2497');
  url.searchParams.set('radius', '40000');
  url.searchParams.set('strictbounds', 'true');

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json([]);

  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return NextResponse.json([]);

  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.predictions ?? []).map((p: any) => ({
      place_id: p.place_id as string,
      display_name: p.description as string,
    }))
  );
}
