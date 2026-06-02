'use client';

import { useState, useEffect } from 'react';
import { X, User, Car, Settings, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import driverApi from '@/lib/api/driver';

interface DriverProfileMeData {
  national_id: string | null;
  license_expiry: string | null;
  car_type: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_year: number | null;
  car_color: string | null;
  license_plate: string | null;
  location_name: string | null;
  default_lat: string | null;
  default_lng: string | null;
  price_per_km: number | null;
  waiting_time: number | null;
  seats: number | null;
  passenger_gender: string | null;
}

export interface DriverEditValues {
  // personal
  name: string;
  phone: string;
  // driver
  national_id: string;
  license_expiry: string;
  car_type: string;
  car_brand: string;
  car_model: string;
  car_year: string;
  car_color: string;
  license_plate: string;
  location_name: string;
  default_lat: string;
  default_lng: string;
  price_per_km: string;
  waiting_time: string;
  seats: string;
  passenger_gender: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialPhone: string;
  driverProfile: DriverProfileMeData | null;
  onSaved: (next: { name: string; phone: string; driver: Partial<DriverProfileMeData> }) => void;
}

type Tab = 'personal' | 'vehicle' | 'prefs';

// ─── Style helpers ─────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#5A6A7A', marginBottom: 6, letterSpacing: '0.01em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0',
  borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#0B1E3D',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
  transition: 'border-color .15s, background .15s',
};
function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#00C2A8';
  e.currentTarget.style.background = '#EFF7F6';
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#E2E8F0';
  e.currentTarget.style.background = '#fff';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function DriverEditProfileModal({
  isOpen, onClose, initialName, initialPhone, driverProfile, onSaved,
}: Props) {
  const [tab, setTab] = useState<Tab>('personal');
  const [saving, setSaving] = useState(false);
  const [waitingCustom, setWaitingCustom] = useState(false);

  const [values, setValues] = useState<DriverEditValues>({
    name: '', phone: '',
    national_id: '', license_expiry: '', car_type: '',
    car_brand: '', car_model: '', car_year: '', car_color: '',
    license_plate: '', location_name: '', default_lat: '', default_lng: '',
    price_per_km: '', waiting_time: '', seats: '', passenger_gender: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setTab('personal');
    setValues({
      name:  initialName  === '—' ? '' : initialName,
      phone: initialPhone === '—' ? '' : initialPhone,
      national_id:    driverProfile?.national_id    ?? '',
      license_expiry: driverProfile?.license_expiry ?? '',
      car_type:       driverProfile?.car_type       ?? '',
      car_brand:      driverProfile?.car_brand      ?? '',
      car_model:      driverProfile?.car_model      ?? '',
      car_year:       driverProfile?.car_year != null ? String(driverProfile.car_year) : '',
      car_color:      driverProfile?.car_color      ?? '',
      license_plate:  driverProfile?.license_plate  ?? '',
      location_name:  driverProfile?.location_name  ?? '',
      default_lat:    driverProfile?.default_lat    ?? '',
      default_lng:    driverProfile?.default_lng    ?? '',
      price_per_km:      driverProfile?.price_per_km != null ? String(driverProfile.price_per_km) : '',
      waiting_time:      driverProfile?.waiting_time  != null ? String(driverProfile.waiting_time)  : '',
      seats:             driverProfile?.seats          != null ? String(driverProfile.seats)          : '',
      passenger_gender:  driverProfile?.passenger_gender ?? '',
    });
    const initWaiting = driverProfile?.waiting_time != null ? String(driverProfile.waiting_time) : '';
    setWaitingCustom(initWaiting !== '' && !['5', '10', '15', '20', '30'].includes(initWaiting));
  }, [isOpen, initialName, initialPhone, driverProfile]);

  const setVal = (k: keyof DriverEditValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues(v => ({ ...v, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    try {
      // 1) Personal info — PATCH /profile
      const personalPayload: Record<string, unknown> = {};
      if (values.name.trim())  personalPayload.name = values.name.trim();
      if (values.phone.trim()) personalPayload.phone_number = values.phone.trim();
      if (Object.keys(personalPayload).length) {
        await driverApi.updatePersonalInfo(personalPayload);
      }

      // 2) Driver profile — PUT /driver/profile
      const driverPayload: Record<string, unknown> = {
        car_type:     values.car_type  || null,
        car_brand:    values.car_brand || null,
        car_model:    values.car_model || null,
        car_year:     values.car_year ? Number(values.car_year) : null,
        car_color:    values.car_color || null,
        price_per_km:      values.price_per_km      ? Number(values.price_per_km) : null,
        waiting_time:      values.waiting_time      ? Number(values.waiting_time) : null,
        seats:             values.seats             ? Number(values.seats)         : null,
        passenger_gender:  values.passenger_gender  || null,
      };
      await driverApi.updateDriverProfile(driverPayload);

      toast.success('Profile updated');
      onSaved({
        name:  values.name.trim() || initialName,
        phone: values.phone.trim() || initialPhone,
        driver: {
          car_type:     values.car_type  || null,
          car_brand:    values.car_brand || null,
          car_model:    values.car_model || null,
          car_year:     values.car_year ? Number(values.car_year) : null,
          car_color:    values.car_color || null,
          price_per_km:      values.price_per_km      ? Number(values.price_per_km) : null,
          waiting_time:      values.waiting_time      ? Number(values.waiting_time) : null,
          seats:             values.seats             ? Number(values.seats)         : null,
          passenger_gender:  values.passenger_gender  || null,
        },
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const TabBtn = ({ id, icon: Icon, label }: { id: Tab; icon: React.ElementType; label: string }) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 14px', borderRadius: 10, border: 'none',
          background: active ? '#fff' : 'transparent',
          color: active ? '#0B1E3D' : '#6B7280',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: active ? '0 2px 8px rgba(11,30,61,0.08)' : 'none',
          transition: 'all .15s',
        }}
      >
        <Icon size={15} color={active ? '#00C2A8' : '#94A3B8'} strokeWidth={2} />
        {label}
      </button>
    );
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
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0B1E3D', letterSpacing: '-0.2px' }}>Edit profile</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>Update your personal and vehicle details</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 6 }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 4, background: '#F1F5F9', borderRadius: 12 }}>
            <TabBtn id="personal" icon={User}     label="Personal info" />
            <TabBtn id="vehicle"  icon={Car}      label="Vehicle & ID" />
            <TabBtn id="prefs"    icon={Settings} label="Preferences"  />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
          {tab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Full name">
                <input
                  type="text" value={values.name} onChange={setVal('name')}
                  placeholder="Your full name" style={inputStyle}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
              <Field label="Phone number">
                <input
                  type="tel" value={values.phone} onChange={setVal('phone')}
                  placeholder="+20 1xx xxx xxxx" style={inputStyle}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
              <div style={{ padding: '10px 12px', background: '#EFF7F6', border: '1px solid #C0E6E1', borderRadius: 10, fontSize: 12, color: '#0B5A52' }}>
                Email and date of birth cannot be changed after registration.
              </div>
            </div>
          )}

          {tab === 'vehicle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Car type">
                <select
                  value={values.car_type} onChange={setVal('car_type')}
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                >
                  <option value="">Select car type</option>
                  <option value="private">Private</option>
                  <option value="taxi">Taxi</option>
                  <option value="microbus">Microbus</option>
                  <option value="van">Van</option>
                </select>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Car brand">
                  <input
                    type="text" value={values.car_brand} onChange={setVal('car_brand')}
                    placeholder="Toyota" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
                <Field label="Car model">
                  <input
                    type="text" value={values.car_model} onChange={setVal('car_model')}
                    placeholder="Corolla" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Car year">
                  <input
                    type="number" min={1980} max={2030} value={values.car_year} onChange={setVal('car_year')}
                    placeholder="2020" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
                <Field label="Car color">
                  <input
                    type="text" value={values.car_color} onChange={setVal('car_color')}
                    placeholder="White" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
              </div>
            </div>
          )}

          {tab === 'prefs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Price per km (EGP)">
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min={0} step={0.5} value={values.price_per_km} onChange={setVal('price_per_km')}
                    placeholder="e.g. 5" style={{ ...inputStyle, paddingRight: 56 }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                  <span style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 12, fontWeight: 700, color: '#94A3B8', pointerEvents: 'none',
                  }}>EGP</span>
                </div>
              </Field>
              <Field label="Waiting time for passenger">
                <select
                  value={waitingCustom ? 'other' : (values.waiting_time || '')}
                  onChange={(e) => {
                    if (e.target.value === 'other') {
                      setWaitingCustom(true);
                      setValues(v => ({ ...v, waiting_time: '' }));
                    } else {
                      setWaitingCustom(false);
                      setValues(v => ({ ...v, waiting_time: e.target.value }));
                    }
                  }}
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                >
                  <option value="">Select waiting time</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="other">Custom…</option>
                </select>
                {waitingCustom && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <input
                      type="number" min={1} max={120} value={values.waiting_time} onChange={setVal('waiting_time')}
                      placeholder="Enter minutes" style={{ ...inputStyle, flex: 1 }}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', flexShrink: 0 }}>min</span>
                  </div>
                )}
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Available seats">
                  <input
                    type="number" min={1} max={20} value={values.seats} onChange={setVal('seats')}
                    placeholder="e.g. 4" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
                <Field label="Accepted passengers">
                  <select
                    value={values.passenger_gender} onChange={setVal('passenger_gender')}
                    style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                  >
                    <option value="">Select type</option>
                    <option value="any">Any</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                  </select>
                </Field>
              </div>
              <div style={{ padding: '10px 12px', background: '#EFF7F6', border: '1px solid #C0E6E1', borderRadius: 10, fontSize: 12, color: '#0B5A52' }}>
                These preferences help passengers know your rates and availability.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, background: '#FAFBFC' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, height: 46, borderRadius: 11, border: '1.5px solid #D1D5DB',
              background: '#fff', color: '#5A6A7A', fontWeight: 700, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1.4, height: 46, borderRadius: 11, border: 'none',
              background: '#00C2A8', color: '#0B1E3D', fontWeight: 800, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(0,194,168,0.3)',
            }}
          >
            {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
