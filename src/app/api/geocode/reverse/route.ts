import { NextRequest, NextResponse } from 'next/server';

// Prefer a server-only (referrer-unrestricted) key; fall back to the public one.
const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) return NextResponse.json({ error: 'Missing coords' }, { status: 400 });
  if (!isValidCoord(Number(lat), Number(lng)))
    return NextResponse.json({ error: 'Invalid coords' }, { status: 400 });
  if (!API_KEY) return NextResponse.json({ error: 'Maps API key not configured' }, { status: 500 });

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('result_type', 'street_address|route|neighborhood|sublocality|locality');

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ address: `${lat}, ${lng}` });

  const data = await res.json();
  const fallback = `${parseFloat(lat!).toFixed(5)}, ${parseFloat(lng!).toFixed(5)}`;
  const address: string = data.results?.[0]?.formatted_address ?? fallback;

  // Strip ", Egypt" / ", مصر" suffix
  return NextResponse.json({ address: address.replace(/, (Egypt|مصر)$/, '').trim() });
}
