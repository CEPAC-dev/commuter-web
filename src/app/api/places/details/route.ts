import { NextRequest, NextResponse } from 'next/server';

// Prefer a server-only (referrer-unrestricted) key; fall back to the public one.
const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing place id' }, { status: 400 });
  // Google place_ids are short URL-safe tokens; reject anything else to avoid abuse.
  if (id.length > 512 || !/^[A-Za-z0-9_-]+$/.test(id))
    return NextResponse.json({ error: 'Invalid place id' }, { status: 400 });
  if (!API_KEY) return NextResponse.json({ error: 'Maps API key not configured' }, { status: 500 });

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', id);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('fields', 'geometry');

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ error: 'Google API error' }, { status: 502 });

  const data = await res.json();
  const loc = data.result?.geometry?.location;
  if (!loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 });

  return NextResponse.json({ lat: loc.lat as number, lng: loc.lng as number });
}
