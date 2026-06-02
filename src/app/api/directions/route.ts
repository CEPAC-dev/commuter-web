import { NextRequest, NextResponse } from 'next/server';

// Prefer a server-only (referrer-unrestricted) key; fall back to the public one.
const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Accepts a single "lat,lng" pair with in-range numeric values. */
function isLatLng(s: string): boolean {
  const parts = s.split(',');
  if (parts.length !== 2) return false;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.searchParams.get('origin');       // "lat,lng"
  const destination = req.nextUrl.searchParams.get('dest');    // "lat,lng"
  // Optional pipe-separated middle waypoints: "lat,lng|lat,lng|lat,lng"
  const waypointsParam = req.nextUrl.searchParams.get('waypoints');

  if (!origin || !destination)
    return NextResponse.json({ error: 'Missing origin/dest' }, { status: 400 });
  if (!isLatLng(origin) || !isLatLng(destination))
    return NextResponse.json({ error: 'Invalid origin/dest' }, { status: 400 });
  if (!API_KEY)
    return NextResponse.json({ error: 'Maps API key not configured' }, { status: 500 });

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  if (waypointsParam) {
    // Google expects "via:lat,lng|via:lat,lng" for intermediate stops
    const parts = waypointsParam.split('|');
    if (parts.length > 25 || !parts.every(isLatLng))
      return NextResponse.json({ error: 'Invalid waypoints' }, { status: 400 });
    const encoded = parts.map((w) => `via:${w}`).join('|');
    url.searchParams.set('waypoints', encoded);
  }
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('alternatives', 'true');
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ error: 'Google API error' }, { status: 502 });

  const data = await res.json();
  if (data.status !== 'OK')
    return NextResponse.json({ error: data.status }, { status: 422 });

  interface GDirectionsLeg { distance: { value: number }; duration: { value: number } }
  interface GDirectionsRoute { legs: GDirectionsLeg[]; overview_polyline: { points: string } }
  const routes = (data.routes as GDirectionsRoute[]).map((r) => {
    // Sum all legs (multi-stop routes have multiple legs)
    const totalDistM  = r.legs.reduce((s: number, l) => s + l.distance.value, 0);
    const totalDurS   = r.legs.reduce((s: number, l) => s + l.duration.value, 0);
    const points = decodePolyline(r.overview_polyline.points);
    return {
      coordinates: points,                                           // [lat, lng][]
      distance_km: Math.round((totalDistM / 1000) * 10) / 10,
      duration_minutes: Math.round(totalDurS / 60),
    };
  });

  return NextResponse.json(routes);
}

/** Google's encoded polyline → [lat, lng][] */
function decodePolyline(encoded: string): [number, number][] {
  const result: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0, b: number, result_val = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result_val |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result_val & 1 ? ~(result_val >> 1) : result_val >> 1;

    shift = 0; result_val = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result_val |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result_val & 1 ? ~(result_val >> 1) : result_val >> 1;

    result.push([lat / 1e5, lng / 1e5]);
  }

  return result;
}
