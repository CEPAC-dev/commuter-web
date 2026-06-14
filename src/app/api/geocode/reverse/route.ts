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
  // No result_type filter — fetch all and pick the best one

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ address: `${lat}, ${lng}` });

  const data = await res.json();
  const fallback = `${parseFloat(lat!).toFixed(5)}, ${parseFloat(lng!).toFixed(5)}`;

  // Plus Code pattern: e.g. "2G89+9CW" or "2G89+9CW, City, Country"
  const plusCodeRe = /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}/;

  // Find the first result whose formatted_address is NOT a Plus Code
  const results: Array<{ formatted_address: string; address_components: Array<{ long_name: string; short_name: string; types: string[] }> }>
    = data.results ?? [];

  const best = results.find(r => !plusCodeRe.test(r.formatted_address));

  let address: string;
  const sourceComps = best
    ? best.address_components
    : results.length > 0 ? results[0].address_components : [];

  if (sourceComps.length > 0) {
    // Build a short address: "67 Dr Hasan El-Shareef, Nasr City"
    const get = (type: string) => sourceComps.find((c: { long_name: string; types: string[] }) => c.types.includes(type))?.long_name ?? '';
    const streetNum = get('street_number');
    const route     = get('route');
    const city      = get('locality') || get('sublocality_level_1') || get('sublocality') || get('administrative_area_level_2');
    const parts = [streetNum, route, city].filter(Boolean);
    address = parts.length > 0 ? parts.join(', ') : fallback;
  } else {
    address = fallback;
  }

  // Strip ", Egypt" / ", مصر" suffix
  return NextResponse.json({ address: address.replace(/, (Egypt|مصر)$/, '').trim() });
}
