'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import {
  getFavouritePlaces, createFavouritePlace, deleteFavouritePlace,
  type FavouritePlace,
} from '@/lib/api/savedLocations';
import { reverseGeocode } from '@/lib/nominatim';
import { useTranslations } from 'next-intl';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const CAIRO   = { lat: 30.0444, lng: 31.2357 };

const CAIRO_BOUNDS = { north: 30.35, south: 29.75, east: 31.90, west: 30.75 };
function isInCairo(lat: number, lng: number) {
  return lat >= CAIRO_BOUNDS.south && lat <= CAIRO_BOUNDS.north &&
         lng >= CAIRO_BOUNDS.west  && lng <= CAIRO_BOUNDS.east;
}

const NICK_ICONS: Record<string, string> = {
  home:  '🏠',
  work:  '🏢',
};
function nickIcon(nickname: string) {
  return NICK_ICONS[nickname.toLowerCase()] ?? '📍';
}

// ─── Location Picker Map ──────────────────────────────────────────────────────

interface MapPickerProps {
  initial: { lat: number; lng: number } | null;
  onConfirm: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

function LocationPickerMap({ initial, onConfirm, onClose }: MapPickerProps) {
  const tc = useTranslations('common');
  const ts = useTranslations('saved_locations');
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: API_KEY });
  const mapRef    = useRef<google.maps.Map | null>(null);
  const [marker,  setMarker]  = useState<{ lat: number; lng: number } | null>(initial ?? null);
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [outOfBounds, setOutOfBounds] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);

  async function handleMapClick(e: google.maps.MapMouseEvent) {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (!lat || !lng) return;
    if (!isInCairo(lat, lng)) { setOutOfBounds(true); return; }
    setOutOfBounds(false);
    setMarker({ lat, lng });
    setResolving(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setResolving(false);
    }
  }

  const pinIcon = typeof window !== 'undefined' && isLoaded
    ? {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52">` +
          `<path d="M20 0C8.95 0 0 8.95 0 20c0 14.5 20 36 20 36S40 34.5 40 20C40 8.95 31.05 0 20 0z" fill="#00C2A8"/>` +
          `<circle cx="20" cy="20" r="9" fill="white"/>` +
          `<circle cx="20" cy="20" r="5" fill="#0B1E3D"/>` +
          `</svg>`
        )}`,
        scaledSize: new window.google.maps.Size(40, 52),
        anchor: new window.google.maps.Point(20, 52),
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-[900] flex flex-col bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] flex-shrink-0 bg-white">
        <button
          onClick={onClose}
          className="text-sm text-[#5A6A7A] hover:text-[#0B1E3D]"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← {tc('back')}
        </button>
        <h2 className="text-sm font-semibold text-[#0B1E3D] flex-1">{ts('open_map')}</h2>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#5A6A7A]">{tc('loading')}</div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={marker ?? initial ?? CAIRO}
            zoom={marker ? 15 : 12}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
              restriction: {
                latLngBounds: CAIRO_BOUNDS,
                strictBounds: false,
              },
              minZoom: 9,
            }}
            onLoad={onLoad}
            onClick={handleMapClick}
          >
            {marker && (
              <Marker position={marker} icon={pinIcon} />
            )}
          </GoogleMap>
        )}

        {/* Out-of-bounds warning */}
        {outOfBounds && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(231,76,60,0.92)', color: '#fff',
            fontSize: 12, fontWeight: 600, padding: '7px 16px',
            borderRadius: 20, whiteSpace: 'nowrap', pointerEvents: 'none',
            backdropFilter: 'blur(4px)', zIndex: 20,
          }}>
            Only locations within Greater Cairo are allowed
          </div>
        )}

        {/* Hint overlay */}
        {!marker && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0B1E3D]/90 text-white text-xs font-medium px-4 py-2.5 rounded-full pointer-events-none">
            Tap anywhere on the map
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-[#E2E8F0]">
        {marker ? (
          <>
            <p className="text-xs text-[#5A6A7A] mb-3 line-clamp-2">
              {resolving ? ts('resolving') : (address || `${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`)}
            </p>
            <button
              onClick={() => onConfirm(marker.lat, marker.lng, address)}
              disabled={resolving}
              className="w-full h-12 bg-[#00C2A8] text-[#0B1E3D] font-semibold rounded-xl text-sm disabled:opacity-50"
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {tc('confirm')}
            </button>
          </>
        ) : (
          <p className="text-sm text-[#8A9AB0] text-center">{ts('open_map')}</p>
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit Form Modal ────────────────────────────────────────────────────

const QUICK_NICK_KEYS = ['home', 'work'] as const;

interface FormModalProps {
  onClose: () => void;
  onSaved: (place: FavouritePlace) => void;
}

function AddLocationModal({ onClose, onSaved }: FormModalProps) {
  const tc = useTranslations('common');
  const ts = useTranslations('saved_locations');
  const tu = useTranslations('profile_user');
  const [nickname,      setNickname]      = useState('');
  const [locationName,  setLocationName]  = useState('');
  const [lat,           setLat]           = useState<number | null>(null);
  const [lng,           setLng]           = useState<number | null>(null);
  const [pickerOpen,    setPickerOpen]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!nickname.trim()) e.nickname = ts('name_required');
    if (!locationName.trim()) e.locationName = ts('address_required');
    if (lat === null || lng === null) e.location = ts('open_map');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate() || lat === null || lng === null) return;
    setSaving(true);
    try {
      const place = await createFavouritePlace({
        nickname:      nickname.trim(),
        location_name: locationName.trim(),
        latitude:      lat,
        longitude:     lng,
      });
      onSaved(place);
      toast.success(ts('save_place'));
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (pickerOpen) {
    return (
      <LocationPickerMap
        initial={lat !== null && lng !== null ? { lat, lng } : null}
        onClose={() => setPickerOpen(false)}
        onConfirm={(pickedLat, pickedLng, addr) => {
          setLat(pickedLat);
          setLng(pickedLng);
          if (!locationName) setLocationName(addr.split(',')[0] ?? addr);
          setPickerOpen(false);
          setErrors((prev) => ({ ...prev, location: '' }));
        }}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[600]" onClick={onClose} />
      <div className="fixed z-[700] bg-white md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:rounded-2xl md:shadow-2xl bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl md:bottom-auto max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#0B1E3D]">{ts('save_place')}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F3F4] text-[#5A6A7A]">✕</button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Nickname quick picks */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-2">
              Nickname <span className="text-[#E74C3C]">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              {QUICK_NICK_KEYS.map((key) => {
                const label = tu(`location_${key}`);
                return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setNickname(label); setErrors((p) => ({ ...p, nickname: '' })); }}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    nickname === label
                      ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D]'
                      : 'border-[#E2E8F0] bg-white text-[#5A6A7A]'
                  }`}
                >
                  {nickIcon(key)} {label}
                </button>
              );})}
            </div>
            <input
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setErrors((p) => ({ ...p, nickname: '' })); }}
              placeholder="Or type a custom nickname…"
              className={`w-full h-11 border rounded-lg px-3 text-sm focus:outline-none focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/20 ${errors.nickname ? 'border-[#E74C3C]' : 'border-[#E2E8F0]'}`}
            />
            {errors.nickname && <p className="text-xs text-[#E74C3C] mt-1">{errors.nickname}</p>}
          </div>

          {/* Location name */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-1">
              Location name <span className="text-[#E74C3C]">*</span>
            </label>
            <input
              value={locationName}
              onChange={(e) => { setLocationName(e.target.value); setErrors((p) => ({ ...p, locationName: '' })); }}
              placeholder="e.g. Dad's house, Main office"
              className={`w-full h-11 border rounded-lg px-3 text-sm focus:outline-none focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/20 ${errors.locationName ? 'border-[#E74C3C]' : 'border-[#E2E8F0]'}`}
            />
            {errors.locationName && <p className="text-xs text-[#E74C3C] mt-1">{errors.locationName}</p>}
          </div>

          {/* Location pick */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-1">
              Location address 
            </label>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className={`w-full h-12 border-2 rounded-xl flex items-center gap-3 px-4 text-sm transition-colors ${
                lat !== null
                  ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D]'
                  : errors.location
                  ? 'border-[#E74C3C] bg-white text-[#5A6A7A]'
                  : 'border-dashed border-[#C0CBD5] bg-white text-[#5A6A7A] hover:border-[#00C2A8]'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {lat !== null
                ? `${lat.toFixed(5)}, ${lng?.toFixed(5)}`
                : ts('open_map')}
            </button>
            {errors.location && <p className="text-xs text-[#E74C3C] mt-1">{errors.location}</p>}
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#5A6A7A] hover:bg-[#F8F9FA]"
          >
            {tc('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 bg-[#0B1E3D] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {saving ? tc('loading') : ts('save_place')}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function SavedLocationsSection() {
  const tp = useTranslations('profile_mobile');
  const tu = useTranslations('profile_user');
  const tc = useTranslations('common');
  const [places,           setPlaces]           = useState<FavouritePlace[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [addOpen,          setAddOpen]          = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);

  useEffect(() => {
    getFavouritePlaces()
      .then(setPlaces)
      .catch(() => toast.error('Failed to load favourite places'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    try {
      await deleteFavouritePlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setConfirmingDelete(null);
      toast.success('Place removed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#0B1E3D]">{tp('favorite_places')}</h3>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#00C2A8] hover:text-[#009e88]"
        >
          <span className="text-lg leading-none">+</span> {tu('add_location_btn')}
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-[#8A9AB0]">{tc('loading')}</div>
      ) : places.length === 0 ? (
        <div className="py-6 text-center text-sm text-[#5A6A7A]">{tp('locations_empty')}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {places.map((place) => (
            <div
              key={place.id}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl"
            >
              <span className="text-xl flex-shrink-0">{nickIcon(place.nickname)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0B1E3D] capitalize">{place.nickname}</p>
                <p className="text-xs text-[#5A6A7A] truncate">{place.location_name}</p>
              </div>
              {confirmingDelete === place.id ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[#E74C3C]">Remove?</span>
                  <button onClick={() => handleDelete(place.id)} className="text-xs font-semibold text-[#E74C3C] hover:underline">Yes</button>
                  <button onClick={() => setConfirmingDelete(null)} className="text-xs text-[#5A6A7A] hover:underline">No</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(place.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FFEBEE] text-[#CBD5E0] hover:text-[#E74C3C] flex-shrink-0 transition-colors"
                  aria-label="Remove place"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <AddLocationModal
          onClose={() => setAddOpen(false)}
          onSaved={(place) => setPlaces((prev) => [...prev, place])}
        />
      )}
    </div>
  );
}
