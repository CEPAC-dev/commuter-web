'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Loader2, CalendarCheck, Clock, MapPin, X,
} from 'lucide-react';
import driverApi from '@/lib/api/driver';
import LocationPickerMap from '@/components/map/LocationPickerMap';
import { reverseGeocode, formatDisplayName } from '@/lib/nominatim';

// ─── Types ────────────────────────────────────────────────────────────────────

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof ALL_DAYS[number];

interface AvailabilityItem {
  id: number;
  location_name: string;
  lat: string | number;
  lng: string | number;
  days: Day[];
  start_time: string;
  end_time: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LABEL: Record<Day, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

function dayPills(days: Day[]) {
  return days.map((d) => (
    <span
      key={d}
      style={{
        display: 'inline-flex', padding: '3px 10px', borderRadius: 20,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
        background: '#EFF7F5', color: '#00C2A8', border: '1px solid #C8E6E2',
      }}
    >
      {DAY_LABEL[d]}
    </span>
  ));
}

function fmtTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

interface AddModalProps {
  onClose: () => void;
  onAdded: (item: AvailabilityItem) => void;
}

function AddModal({ onClose, onAdded }: AddModalProps) {
  const [lat,       setLat]       = useState('');
  const [lng,       setLng]       = useState('');
  const [locName,   setLocName]   = useState('');
  const [days,      setDays]      = useState<Day[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime,   setEndTime]   = useState('17:00');
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  function toggleDay(d: Day) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!lat || !lng) e.location = 'Pick a location on the map or search for one.';
    if (days.length === 0) e.days = 'Select at least one day.';
    if (!startTime) e.start = 'Start time is required.';
    if (!endTime)   e.end   = 'End time is required.';
    if (startTime && endTime && startTime >= endTime) e.end = 'End time must be after start time.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await driverApi.addAvailability({
        location_name: locName || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`,
        lat:  parseFloat(lat),
        lng:  parseFloat(lng),
        days,
        start_time: startTime,
        end_time:   endTime,
      });
      const raw = res as Record<string, unknown>;
      const item = ((raw.data ?? raw) as AvailabilityItem);
      toast.success('Availability added!');
      onAdded(item);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add availability');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 12px',
    border: '1.5px solid #E2E8F0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', color: '#0B1E3D',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
    transition: 'border-color .15s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#5A6A7A', marginBottom: 6, letterSpacing: '0.01em',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(11,30,61,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20,
          width: '100%', maxWidth: 560,
          maxHeight: '94vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0B1E3D', letterSpacing: '-0.2px' }}>
                Add availability
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
                Set your working area, days and hours
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 6 }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Days */}
          <div>
            <label style={labelStyle}>
              <CalendarCheck size={13} style={{ display: 'inline', marginRight: 5, color: '#00C2A8', verticalAlign: 'middle' }} />
              Available days
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_DAYS.map((d) => {
                const sel = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    style={{
                      padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer',
                      border: `1.5px solid ${sel ? '#00C2A8' : '#E2E8F0'}`,
                      background: sel ? '#00C2A8' : '#fff',
                      color: sel ? '#0B1E3D' : '#5A6A7A',
                      transition: 'all .15s',
                      textTransform: 'capitalize',
                    }}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                );
              })}
            </div>
            {errors.days && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C' }}>{errors.days}</p>
            )}
          </div>

          {/* Location map */}
          <div>
            <label style={{ ...labelStyle, marginBottom: 8 }}>
              <MapPin size={13} style={{ display: 'inline', marginRight: 5, color: '#00C2A8', verticalAlign: 'middle' }} />
              Pickup area
            </label>
            <LocationPickerMap
              lat={lat} lng={lng} name={locName}
              onChange={(newLat, newLng, newName) => {
                setLat(newLat); setLng(newLng); setLocName(newName);
                if (newLat && newLng) setErrors((e) => { const { location: _, ...rest } = e; return rest; });
              }}
              error={errors.location}
            />
            {errors.location && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C' }}>{errors.location}</p>
            )}
          </div>

          {/* Time range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>
                <Clock size={13} style={{ display: 'inline', marginRight: 5, color: '#00C2A8', verticalAlign: 'middle' }} />
                Start time
              </label>
              <input
                type="time" value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setErrors((prev) => { const { start: _, ...rest } = prev; return rest; });
                }}
                style={{ ...inputStyle, borderColor: errors.start ? '#E74C3C' : '#E2E8F0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.start ? '#E74C3C' : '#E2E8F0'; }}
              />
              {errors.start && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#E74C3C' }}>{errors.start}</p>}
            </div>
            <div>
              <label style={labelStyle}>
                <Clock size={13} style={{ display: 'inline', marginRight: 5, color: '#00C2A8', verticalAlign: 'middle' }} />
                End time
              </label>
              <input
                type="time" value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setErrors((prev) => { const { end: _, ...rest } = prev; return rest; });
                }}
                style={{ ...inputStyle, borderColor: errors.end ? '#E74C3C' : '#E2E8F0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.end ? '#E74C3C' : '#E2E8F0'; }}
              />
              {errors.end && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#E74C3C' }}>{errors.end}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, background: '#FAFBFC' }}>
          <button
            type="button" onClick={onClose} disabled={saving}
            style={{
              flex: 1, height: 46, borderRadius: 11, border: '1.5px solid #D1D5DB',
              background: '#fff', color: '#5A6A7A', fontWeight: 700, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleSave} disabled={saving}
            style={{
              flex: 1.4, height: 46, borderRadius: 11, border: 'none',
              background: '#00C2A8', color: '#0B1E3D', fontWeight: 800, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(0,194,168,0.3)',
            }}
          >
            {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Saving…' : 'Add availability'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Availability Card ────────────────────────────────────────────────────────

const COORD_PATTERN = /^-?\d+\.\d+[,\s]+-?\d+\.\d+/;

function AvailabilityCard({ item, onDelete }: { item: AvailabilityItem; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [displayName, setDisplayName] = useState<string>(
    item.location_name && !COORD_PATTERN.test(item.location_name)
      ? item.location_name
      : '',
  );

  useEffect(() => {
    if (!displayName) {
      reverseGeocode(Number(item.lat), Number(item.lng)).then((addr) => {
        const name = formatDisplayName(addr);
        if (name && !COORD_PATTERN.test(name)) setDisplayName(name);
        else setDisplayName(`${Number(item.lat).toFixed(5)}, ${Number(item.lng).toFixed(5)}`);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      await driverApi.deleteAvailability(item.id);
      toast.success('Availability removed');
      onDelete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  }

  return (
    <div
      style={{
        background: '#fff', border: '1.5px solid #F1F5F9', borderRadius: 18,
        padding: '20px 22px', fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 2px 12px rgba(11,30,61,0.05)',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'box-shadow .2s, border-color .2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#C8E6E2';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,194,168,0.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#F1F5F9';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(11,30,61,0.05)';
      }}
    >
      {/* Top row: location + delete */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: '#EFF7F5', border: '1px solid #C8E6E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={17} color="#00C2A8" strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName || <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite', color: '#94A3B8' }} />}
            </div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 9,
            border: '1.5px solid #FEE2E2', background: '#FFF5F5',
            color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
            transition: 'background .15s',
          }}
          onMouseEnter={(e) => { if (!deleting) (e.currentTarget as HTMLElement).style.background = '#FEE2E2'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFF5F5'; }}
        >
          {deleting
            ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite', color: '#EF4444' }} />
            : <Trash2 size={14} />}
        </button>
      </div>

      {/* Time row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={14} color="#00C2A8" strokeWidth={2} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D' }}>
          {fmtTime(item.start_time)} – {fmtTime(item.end_time)}
        </span>
      </div>

      {/* Days */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {dayPills(item.days)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const [items,   setItems]   = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    driverApi.getAvailability()
      .then((res) => {
        const raw = res as Record<string, unknown>;
        const list = (raw.data ?? res) as AvailabilityItem[];
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  function handleAdded(item: AvailabilityItem) {
    setItems((prev) => [item, ...prev]);
  }

  function handleDeleted(id: number) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B1E3D', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
            Availability
          </h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
            Manage the areas, days and hours you&apos;re available to drive
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            padding: '11px 18px', borderRadius: 12,
            background: '#00C2A8', border: 'none',
            color: '#0B1E3D', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(0,194,168,0.3)',
            transition: 'opacity .15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          <Plus size={17} strokeWidth={2.5} />
          Add availability
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Loader2 size={32} style={{ color: '#00C2A8', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '60px 24px',
            background: '#EFF7F5', borderRadius: 20,
            border: '2px dashed #C8E6E2',
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#fff',
            border: '2px solid #C8E6E2', margin: '0 auto 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarCheck size={30} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#0B1E3D', margin: '0 0 8px' }}>
            No availability set
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.6 }}>
            Add your working areas, days and hours so passengers can find you.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 12,
              background: '#00C2A8', border: 'none',
              color: '#0B1E3D', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(0,194,168,0.3)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> Add availability
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {items.map((item) => (
            <AvailabilityCard
              key={item.id}
              item={item}
              onDelete={() => handleDeleted(item.id)}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <AddModal
          onClose={() => setAddOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
