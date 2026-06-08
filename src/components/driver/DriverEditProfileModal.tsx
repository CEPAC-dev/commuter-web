'use client';

import { useState, useEffect } from 'react';
import { X, User, Car, Settings, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import driverApi from '@/lib/api/driver';
import { DriverProfileMeData } from '@/types/driver';

export interface PersonalData {
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  gender: string;
  birthdate: string;
  province: string;
  district: string;
  sub_district: string;
  building: string;
  street: string;
  landmark: string;
}

export interface DriverEditValues {
  // personal info
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  gender: string;
  birthdate: string;
  // address
  province: string;
  district: string;
  sub_district: string;
  building: string;
  street: string;
  landmark: string;
  // driver profile
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
  initialPersonal: Partial<PersonalData>;
  driverProfile: DriverProfileMeData | null;
  onSaved: (next: { personal: Partial<PersonalData>; driver: Partial<DriverProfileMeData> }) => void;
}

type Tab = 'personal' | 'vehicle' | 'prefs';
type PersonalSubTab = 'info' | 'address';

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
  isOpen, onClose, initialPersonal, driverProfile, onSaved,
}: Props) {
  const [tab, setTab] = useState<Tab>('personal');
  const [personalSubTab, setPersonalSubTab] = useState<PersonalSubTab>('info');
  const [saving, setSaving] = useState(false);
  const [waitingCustom, setWaitingCustom] = useState(false);

  const [values, setValues] = useState<DriverEditValues>({
    name: '', email: '', phone: '', whatsapp_number: '', gender: '', birthdate: '',
    province: '', district: '', sub_district: '', building: '', street: '', landmark: '',
    national_id: '', license_expiry: '', car_type: '',
    car_brand: '', car_model: '', car_year: '', car_color: '',
    license_plate: '', location_name: '', default_lat: '', default_lng: '',
    price_per_km: '', waiting_time: '', seats: '', passenger_gender: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setTab('personal');
    setPersonalSubTab('info');
    setValues({
      name:            initialPersonal.name            ?? '',
      email:           initialPersonal.email           ?? '',
      phone:           initialPersonal.phone           ?? '',
      whatsapp_number: initialPersonal.whatsapp_number ?? '',
      gender:          initialPersonal.gender          ?? '',
      birthdate:       initialPersonal.birthdate       ?? '',
      province:        initialPersonal.province        ?? '',
      district:        initialPersonal.district        ?? '',
      sub_district:    initialPersonal.sub_district    ?? '',
      building:        initialPersonal.building        ?? '',
      street:          initialPersonal.street          ?? '',
      landmark:        initialPersonal.landmark        ?? '',
      national_id:    driverProfile?.national_id    ?? '',
      license_expiry: driverProfile?.license_expiry ?? '',
      car_type:       driverProfile?.car_type       ?? '',
      car_brand:      driverProfile?.car_brand      ?? '',
      car_model:      driverProfile?.car_model      ?? '',
      car_year:       driverProfile?.car_year != null ? String(driverProfile.car_year) : '',
      car_color:      driverProfile?.car_color      ?? '',
      license_plate:  driverProfile?.license_plate  ?? '',
      location_name:  driverProfile?.location_name  ?? '',
      default_lat:    driverProfile?.default_lat    != null ? String(driverProfile.default_lat)    : '',
      default_lng:    driverProfile?.default_lng    != null ? String(driverProfile.default_lng)    : '',
      price_per_km:      driverProfile?.price_per_km != null ? String(driverProfile.price_per_km) : '',
      waiting_time:      driverProfile?.waiting_time  != null ? String(driverProfile.waiting_time)  : '',
      seats:             driverProfile?.seats          != null ? String(driverProfile.seats)          : '',
      passenger_gender:  driverProfile?.passenger_gender ?? '',
    });
    const initWaiting = driverProfile?.waiting_time != null ? String(driverProfile.waiting_time) : '';
    setWaitingCustom(initWaiting !== '' && !['5', '10', '15', '20', '30'].includes(initWaiting));
  }, [isOpen, initialPersonal, driverProfile]);

  const setVal = (k: keyof DriverEditValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues(v => ({ ...v, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    try {
      // 1) Personal info — PATCH /profile
      const personalPayload: Record<string, unknown> = {};
      if (values.name.trim())            personalPayload.name             = values.name.trim();
      if (values.email.trim())           personalPayload.email            = values.email.trim();
      if (values.phone.trim())           personalPayload.phone_number     = values.phone.trim();
      if (values.whatsapp_number.trim()) personalPayload.whatsapp_number  = values.whatsapp_number.trim();
      if (values.gender)                 personalPayload.gender           = values.gender;
      if (values.birthdate)              personalPayload.birthdate        = values.birthdate;
      if (values.province.trim())        personalPayload.province         = values.province.trim();
      if (values.district.trim())        personalPayload.district         = values.district.trim();
      if (values.sub_district.trim())    personalPayload.sub_district     = values.sub_district.trim();
      if (values.building.trim())        personalPayload.building         = values.building.trim();
      if (values.street.trim())          personalPayload.street           = values.street.trim();
      if (values.landmark.trim())        personalPayload.landmark         = values.landmark.trim();
      if (Object.keys(personalPayload).length) {
        await driverApi.updatePersonalInfo(personalPayload);
      }

      // 2) Driver profile — PUT /driver/profile
      const driverPayload: Record<string, unknown> = {
        national_id:    values.national_id    || null,
        license_expiry: values.license_expiry || null,
        car_type:       values.car_type       || null,
        car_brand:      values.car_brand      || null,
        car_model:      values.car_model      || null,
        car_year:       values.car_year ? Number(values.car_year) : null,
        car_color:      values.car_color      || null,
        license_plate:  values.license_plate  || null,
        location_name:  values.location_name  || null,
        default_lat:    values.default_lat ? Number(values.default_lat) : null,
        default_lng:    values.default_lng ? Number(values.default_lng) : null,
        price_per_km:      values.price_per_km      ? Number(values.price_per_km) : null,
        waiting_time:      values.waiting_time      ? Number(values.waiting_time) : null,
        seats:             values.seats             ? Number(values.seats)         : null,
        passenger_gender:  values.passenger_gender  || null,
      };
      await driverApi.updateDriverProfile(driverPayload);

      toast.success('Profile updated');
      onSaved({
        personal: {
          name:            values.name.trim()            || initialPersonal.name,
          email:           values.email.trim()           || initialPersonal.email,
          phone:           values.phone.trim()           || initialPersonal.phone,
          whatsapp_number: values.whatsapp_number.trim() || initialPersonal.whatsapp_number,
          gender:          values.gender                 || initialPersonal.gender,
          birthdate:       values.birthdate              || initialPersonal.birthdate,
          province:        values.province.trim()        || initialPersonal.province,
          district:        values.district.trim()        || initialPersonal.district,
          sub_district:    values.sub_district.trim()    || initialPersonal.sub_district,
          building:        values.building.trim()        || initialPersonal.building,
          street:          values.street.trim()          || initialPersonal.street,
          landmark:        values.landmark.trim()        || initialPersonal.landmark,
        },
        driver: {
          national_id:    values.national_id    || null,
          license_expiry: values.license_expiry || null,
          car_type:       values.car_type       || null,
          car_brand:      values.car_brand      || null,
          car_model:      values.car_model      || null,
          car_year:       values.car_year ? Number(values.car_year) : null,
          car_color:      values.car_color      || null,
          license_plate:  values.license_plate  || null,
          location_name:  values.location_name  || null,
          default_lat:    values.default_lat ? Number(values.default_lat) : null,
          default_lng:    values.default_lng ? Number(values.default_lng) : null,
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
              {/* Personal sub-tabs */}
              <div style={{ display: 'flex', gap: 4, padding: 4, background: '#F1F5F9', borderRadius: 10 }}>
                {(['info', 'address'] as PersonalSubTab[]).map((st) => {
                  const active = personalSubTab === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPersonalSubTab(st)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                        background: active ? '#fff' : 'transparent',
                        color: active ? '#0B1E3D' : '#6B7280',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: active ? '0 2px 6px rgba(11,30,61,0.08)' : 'none',
                        transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      {st === 'info'
                        ? <User size={13} color={active ? '#00C2A8' : '#94A3B8'} strokeWidth={2} />
                        : <MapPin size={13} color={active ? '#00C2A8' : '#94A3B8'} strokeWidth={2} />}
                      {st === 'info' ? 'Personal info' : 'Address'}
                    </button>
                  );
                })}
              </div>

              {personalSubTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Full name">
                    <input type="text" value={values.name} onChange={setVal('name')}
                      placeholder="Your full name" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={values.email} onChange={setVal('email')}
                      placeholder="your@email.com" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Phone number">
                      <input type="tel" value={values.phone} onChange={setVal('phone')}
                        placeholder="+20 1xx xxx xxxx" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                    <Field label="WhatsApp number">
                      <input type="tel" value={values.whatsapp_number} onChange={setVal('whatsapp_number')}
                        placeholder="+20 1xx xxx xxxx" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Gender">
                      <select value={values.gender} onChange={setVal('gender')}
                        style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </Field>
                    <Field label="Date of birth">
                      <input type="date" value={values.birthdate} onChange={setVal('birthdate')}
                        style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                  </div>
                </div>
              )}

              {personalSubTab === 'address' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Province">
                      <input type="text" value={values.province} onChange={setVal('province')}
                        placeholder="e.g. Cairo" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                    <Field label="District">
                      <input type="text" value={values.district} onChange={setVal('district')}
                        placeholder="e.g. Nasr City" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                  </div>
                  <Field label="Sub-district">
                    <input type="text" value={values.sub_district} onChange={setVal('sub_district')}
                      placeholder="e.g. Zone 7" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Building">
                      <input type="text" value={values.building} onChange={setVal('building')}
                        placeholder="Building name / no." style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                    <Field label="Street">
                      <input type="text" value={values.street} onChange={setVal('street')}
                        placeholder="Street name" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                  </div>
                  <Field label="Landmark">
                    <input type="text" value={values.landmark} onChange={setVal('landmark')}
                      placeholder="Nearby landmark" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {tab === 'vehicle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="National ID">
                  <input
                    type="text" value={values.national_id} onChange={setVal('national_id')}
                    placeholder="14-digit ID" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
                <Field label="License expiry">
                  <input
                    type="date" value={values.license_expiry} onChange={setVal('license_expiry')}
                    style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
              </div>

              <Field label="Car type">
                <select
                  value={values.car_type} onChange={setVal('car_type')}
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                >
                  <option value="">Select car type</option>
                  <option value="private">Private</option>
                  <option value="taxi">Taxi</option>
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

              <Field label="License plate">
                <input
                  type="text" value={values.license_plate} onChange={setVal('license_plate')}
                  placeholder="e.g. أ ب ج 1234" style={inputStyle}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
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

              <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

              <Field label="Default pickup area">
                <input
                  type="text" value={values.location_name} onChange={setVal('location_name')}
                  placeholder="e.g. Nasr City, Cairo" style={inputStyle}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Default latitude">
                  <input
                    type="text" value={values.default_lat} onChange={setVal('default_lat')}
                    placeholder="e.g. 30.0444" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
                <Field label="Default longitude">
                  <input
                    type="text" value={values.default_lng} onChange={setVal('default_lng')}
                    placeholder="e.g. 31.2357" style={inputStyle}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </Field>
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
