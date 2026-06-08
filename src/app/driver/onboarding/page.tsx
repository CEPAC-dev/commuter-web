'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Car, Layers, Palette, Hash, MapPin, CreditCard, Shield,
  Loader2, Info, CheckCircle, Upload, X, FileText, LogOut, Sliders, Camera,
} from 'lucide-react';
import driverApi from '@/lib/api/driver';
import authApi from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import LocationPickerMap from '@/components/map/LocationPickerMap';



// ─── UI helpers ──────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
        <span style={{ color: '#5A6A7A', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D' }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

const COLORS: { label: string; value: string; hex: string }[] = [
  { label: 'White',  value: 'white',  hex: '#F5F5F5' },
  { label: 'Silver', value: 'silver', hex: '#C0C0C0' },
  { label: 'Grey',   value: 'grey',   hex: '#6B7280' },
  { label: 'Black',  value: 'black',  hex: '#1F2937' },
  { label: 'Red',    value: 'red',    hex: '#EF4444' },
  { label: 'Maroon', value: 'maroon', hex: '#7F1D1D' },
  { label: 'Blue',   value: 'blue',   hex: '#3B82F6' },
  { label: 'Navy',   value: 'navy',   hex: '#1E3A5F' },
  { label: 'Green',  value: 'green',  hex: '#22C55E' },
  { label: 'Brown',  value: 'brown',  hex: '#92400E' },
  { label: 'Beige',  value: 'beige',  hex: '#D4B896' },
  { label: 'Yellow', value: 'yellow', hex: '#FACC15' },
  { label: 'Orange', value: 'orange', hex: '#F97316' },
  { label: 'Other',  value: 'other',  hex: '' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2005 + 1 }, (_, i) => CURRENT_YEAR - i);

const inputCls = (err?: string) => [
  'w-full h-[52px] border rounded-lg text-sm text-[#0B1E3D] bg-white px-4',
  'focus:outline-none transition-all placeholder:text-[#9CA3AF]',
  err
    ? 'border-[#E74C3C] focus:border-[#E74C3C] focus:ring-2 focus:ring-[#E74C3C]/15'
    : 'border-[#D1D5DB] focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/15',
].join(' ');

const selectCls = (err?: string) => inputCls(err) + ' appearance-none';

// ─── File field ──────────────────────────────────────────────────────────────

function FileField({ label, value, onChange, error }: {
  label: string;
  value: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const isImage = value && value.type.startsWith('image/');
  const preview = isImage ? URL.createObjectURL(value) : null;

  return (
    <div className="flex flex-col">
      <div
        onClick={() => !value && ref.current?.click()}
        className={[
          'relative border-2 border-dashed rounded-xl transition-all min-h-[110px] flex flex-col items-center justify-center p-3',
          value ? 'border-[#22C55E] bg-[#F0FDF4]' : error ? 'border-[#E74C3C]' : 'border-[#D1D5DB] hover:border-[#00C2A8] cursor-pointer',
        ].join(' ')}
      >
        {!value && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold text-[#E74C3C] bg-[#E74C3C]/10 px-1.5 py-0.5 rounded">
            Required
          </span>
        )}
        {value ? (
          <>
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <CheckCircle size={16} className="text-[#22C55E]" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
                className="p-0.5 rounded hover:bg-black/5"
                aria-label="Remove"
              >
                <X size={14} className="text-[#5A6A7A]" />
              </button>
            </div>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={label} className="max-h-20 max-w-full object-contain rounded" />
            ) : (
              <FileText size={28} className="text-[#5A6A7A]" />
            )}
            <p className="text-xs text-[#5A6A7A] mt-2 truncate max-w-full text-center" title={value.name}>
              {value.name}
            </p>
          </>
        ) : (
          <>
            <Upload size={22} className="text-[#9CA3AF] mb-1" />
            <p className="text-[13px] font-semibold text-[#0B1E3D] text-center">{label}</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">JPEG, PNG — max 3MB</p>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (!['image/jpeg', 'image/png'].includes(f.type)) {
              toast.error('Only JPEG or PNG allowed.');
              return;
            }
            if (f.size > 3 * 1024 * 1024) {
              toast.error('File must be 3MB or smaller.');
              return;
            }
            onChange(f);
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-[#E74C3C]">{error}</p>}
    </div>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

interface FormState {
  national_id:               string;
  license_expiry:            string;
  car_type:                  'private' | 'taxi';
  car_brand:                 string;
  car_model:                 string;
  car_year:                  number | '';
  car_color:                 string;
  car_color_custom:          string;
  plateL1:                   string;
  plateL2:                   string;
  plateL3:                   string;
  plate_number:              string;
  location_name:             string;
  default_lat:               string;
  default_lng:               string;
  price_per_km:              string;
  waiting_price_per_hour:    string;
  car_capacity:              string;
  passenger_type:            string;
  profile_photo:             File | null;
  national_id_image_front:   File | null;
  national_id_image_back:    File | null;
  driving_license:           File | null;
  vehicle_license_front:     File | null;
  vehicle_license_back:      File | null;
  criminal_record_certificate: File | null;
}

export default function DriverOnboardingPage() {
  const router = useRouter();
  const { logout, name } = useAuth();

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.replace('/');
  }

  const [form, setForm] = useState<FormState>({
    national_id:               '',
    license_expiry:            '',
    car_type:                  'private',
    car_brand:                 '',
    car_model:                 '',
    car_year:                  '',
    car_color:                 '',
    car_color_custom:          '',
    plateL1: '', plateL2: '', plateL3: '',
    plate_number:              '',
    location_name:             '',
    default_lat:               '',
    default_lng:               '',
    price_per_km:              '',
    waiting_price_per_hour:    '',
    car_capacity:              '',
    passenger_type:            '',
    profile_photo:             null,
    national_id_image_front:   null,
    national_id_image_back:    null,
    driving_license:           null,
    vehicle_license_front:     null,
    vehicle_license_back:      null,
    criminal_record_certificate: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoHov, setPhotoHov] = useState(false);

  const plateL1Ref = useRef<HTMLInputElement>(null);
  const plateL2Ref = useRef<HTMLInputElement>(null);
  const plateL3Ref = useRef<HTMLInputElement>(null);
  const numRef            = useRef<HTMLInputElement>(null);
  const profilePhotoRef  = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!/^\d{14}$/.test(form.national_id)) e.national_id = 'Enter a valid 14-digit National ID.';
    if (!form.license_expiry) e.license_expiry = 'Select the license expiry date.';
    if (!form.car_brand.trim()) e.car_brand = 'Enter the car brand.';
    if (!form.car_model.trim()) e.car_model = 'Enter the car model.';
    if (!form.car_year) e.car_year = 'Select a year.';
    if (!form.car_color) e.car_color = 'Pick a color.';
    if (form.car_color === 'other' && !form.car_color_custom.trim()) e.car_color_custom = 'Specify the color.';
    if (!form.plateL1 || !form.plateL2 || !form.plateL3) e.plate = 'Enter all 3 Arabic letters.';
    else if (!form.plate_number) e.plate = 'Enter the plate number.';
    if (!form.default_lat || !form.default_lng) e.default_location = 'Pick a location on the map or search for one.';
    if (!form.car_capacity || isNaN(Number(form.car_capacity)) || Number(form.car_capacity) < 1) e.car_capacity = 'Enter the number of seats.';
    if (!form.price_per_km || isNaN(Number(form.price_per_km)) || Number(form.price_per_km) <= 0) e.price_per_km = 'Enter a valid price per km.';
    if (!form.waiting_price_per_hour || isNaN(Number(form.waiting_price_per_hour)) || Number(form.waiting_price_per_hour) <= 0) e.waiting_price_per_hour = 'Enter a valid waiting price per hour.';
    if (!form.passenger_type) e.passenger_type = 'Select accepted passengers.';
    if (!form.profile_photo)             e.profile_photo             = 'Upload your profile photo.';
    if (!form.national_id_image_front)   e.national_id_image_front   = 'Upload the front of your National ID.';
    if (!form.national_id_image_back)    e.national_id_image_back    = 'Upload the back of your National ID.';
    if (!form.driving_license)           e.driving_license           = 'Upload your driving license.';
    if (!form.vehicle_license_front)     e.vehicle_license_front     = 'Upload the front of your vehicle license.';
    if (!form.vehicle_license_back)      e.vehicle_license_back      = 'Upload the back of your vehicle license.';
    if (!form.criminal_record_certificate) e.criminal_record_certificate = 'Upload your criminal record certificate.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const licensePlate = `${form.plateL1}${form.plateL2}${form.plateL3} ${form.plate_number}`;
      const carColor     = form.car_color === 'other' ? form.car_color_custom.trim() : form.car_color;

      const fd = new FormData();
      fd.append('national_id',             form.national_id);
      fd.append('license_expiry',          form.license_expiry);
      fd.append('car_type',                form.car_type);
      fd.append('car_brand',               form.car_brand.trim());
      fd.append('car_model',               form.car_model.trim());
      fd.append('car_year',                String(form.car_year));
      fd.append('car_color',               carColor);
      fd.append('license_plate',           licensePlate);
      fd.append('location_name',           form.location_name.trim());
      fd.append('default_lat',             form.default_lat);
      fd.append('default_lng',             form.default_lng);
      fd.append('car_capacity',            form.car_capacity);
      fd.append('price_per_km',            form.price_per_km);
      fd.append('waiting_price_per_hour',  form.waiting_price_per_hour);
      fd.append('passenger_type',          form.passenger_type);
      if (form.profile_photo)               fd.append('profile_photo',               form.profile_photo);
      if (form.national_id_image_front)     fd.append('national_id_image_front',     form.national_id_image_front);
      if (form.national_id_image_back)      fd.append('national_id_image_back',      form.national_id_image_back);
      if (form.driving_license)             fd.append('driving_license',             form.driving_license);
      if (form.vehicle_license_front)       fd.append('vehicle_license_front',       form.vehicle_license_front);
      if (form.vehicle_license_back)        fd.append('vehicle_license_back',        form.vehicle_license_back);
      if (form.criminal_record_certificate) fd.append('criminal_record_certificate', form.criminal_record_certificate);

      await driverApi.submitProfile(fd);
      setSuccess(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1E3D' }}>
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <CheckCircle size={64} className="text-[#00C2A8] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0B1E3D] mb-3">Application submitted!</h2>
          <p className="text-[#5A6A7A] text-sm leading-relaxed mb-6">
            We&apos;ve received your driver details. Our team will review your application within
            <strong className="text-[#0B1E3D]"> 24–48 hours</strong>.
          </p>
          <button
            onClick={() => router.replace('/driver/my-requests')}
            className="w-full h-[52px] rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#00C2A8', color: '#fff' }}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <main className="max-w-2xl mx-auto px-5 pt-6 pb-10">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-[#0B1E3D]">Driver details</h1>
            <p className="text-sm text-[#5A6A7A]">Complete your driver registration</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#E74C3C', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.borderColor = '#E74C3C'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>

        {/* Notice */}
        <div className="mb-6 flex items-start gap-2 p-3 rounded-lg" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <Info size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#EA580C' }} />
          <p className="text-[13px]" style={{ color: '#9A3412' }}>
            Your account is ready. Submit your vehicle details and documents to finish registration.
          </p>
        </div>

        <h2 className="text-xl font-bold text-[#0B1E3D] mb-1">Complete registration</h2>
        <p className="text-sm text-[#5A6A7A] mb-5">Step 4 of 4 · Finish your vehicle &amp; documents</p>

        <form onSubmit={handleSubmit} noValidate>

          {/* Profile card */}
          <div style={{ background: '#EFF7F5', border: '1.5px solid #C8E6E2', borderRadius: 16, padding: '18px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Clickable avatar */}
              <div
                style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => profilePhotoRef.current?.click()}
                onMouseEnter={() => setPhotoHov(true)}
                onMouseLeave={() => setPhotoHov(false)}
                title="Upload profile photo"
              >
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#C8E6E2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #fff', boxShadow: '0 2px 10px rgba(0,194,168,0.2)' }}>
                  {form.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(form.profile_photo)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#00C2A8' }}>{(name ?? 'D').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: photoHov ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}>
                  <Camera size={22} color="#fff" />
                </div>
                <input
                  ref={profilePhotoRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (!['image/jpeg', 'image/png'].includes(f.type)) { toast.error('Only JPEG or PNG allowed.'); return; }
                    if (f.size > 3 * 1024 * 1024) { toast.error('File must be 3MB or smaller.'); return; }
                    set('profile_photo', f);
                    e.target.value = '';
                  }}
                />
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D', lineHeight: 1.2 }}>{name ?? 'Driver'}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '3px 10px', borderRadius: 20, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316' }} />
                  <span style={{ fontSize: 11, color: '#F97316', fontWeight: 700 }}>Pending verification</span>
                </div>
                <p style={{ fontSize: 11, color: form.profile_photo ? '#00C2A8' : '#9CA3AF', margin: '8px 0 0' }}>
                  {form.profile_photo ? '✓ Profile photo ready' : 'Tap to upload your profile photo'}
                </p>
              </div>
            </div>
            {errors.profile_photo && <p className="mt-2 text-xs text-[#E74C3C]">{errors.profile_photo}</p>}
          </div>

          {/* Identity */}
          <SectionCard icon={<CreditCard size={14} />} title="Identity">
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">National ID</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={form.national_id}
                onChange={(e) => set('national_id', e.target.value.replace(/\D/g, ''))}
                placeholder="14-digit National ID"
                className={inputCls(errors.national_id)}
              />
              {errors.national_id && <p className="mt-1 text-xs text-[#E74C3C]">{errors.national_id}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Driving license expiry</label>
              <input
                type="date"
                value={form.license_expiry}
                onChange={(e) => set('license_expiry', e.target.value)}
                className={inputCls(errors.license_expiry)}
                style={{ maxWidth: '50%' }}
              />
              {errors.license_expiry && <p className="mt-1 text-xs text-[#E74C3C]">{errors.license_expiry}</p>}
            </div>
          </SectionCard>

          {/* Car type */}
          <SectionCard icon={<Car size={14} />} title="Car type">
            <div className="grid grid-cols-2 gap-3">
              {(['private', 'taxi'] as const).map((type) => {
                const active = form.car_type === type;
                return (
                  <button key={type} type="button" onClick={() => set('car_type', type)}
                    style={{ padding: '14px 16px', borderRadius: 12, border: active ? '2px solid #00C2A8' : '2px solid #E2E8F0', background: active ? '#EFF7F6' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit', transition: 'all 0.15s' }}
                  >
                    <Car size={26} color={active ? '#00C2A8' : '#9CA3AF'} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: active ? '#00C2A8' : '#0B1E3D' }}>
                      {type === 'private' ? 'Private car' : 'Taxi'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {type === 'private' ? 'Personal vehicle' : 'Licensed taxi'}
                    </span>
                    {active && <CheckCircle size={14} color="#00C2A8" />}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Vehicle details */}
          <SectionCard icon={<Layers size={14} />} title="Vehicle details">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Brand</label>
                <input
                  type="text"
                  value={form.car_brand}
                  onChange={(e) => set('car_brand', e.target.value)}
                  placeholder="e.g. Toyota"
                  className={inputCls(errors.car_brand)}
                />
                {errors.car_brand && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_brand}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Model</label>
                <input
                  type="text"
                  value={form.car_model}
                  onChange={(e) => set('car_model', e.target.value)}
                  placeholder="e.g. Corolla"
                  className={inputCls(errors.car_model)}
                />
                {errors.car_model && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_model}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Year</label>
              <div className="relative" style={{ maxWidth: '50%' }}>
                <select
                  value={form.car_year}
                  onChange={(e) => set('car_year', e.target.value ? Number(e.target.value) : '')}
                  className={selectCls(errors.car_year)}
                >
                  <option value="">Select year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">▾</span>
              </div>
              {errors.car_year && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_year}</p>}
            </div>
          </SectionCard>

          {/* Car color */}
          <SectionCard icon={<Palette size={14} />} title="Car color">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, padding: 12, background: '#F8F9FA', border: `1.5px solid ${errors.car_color ? '#E74C3C' : '#E2E8F0'}`, borderRadius: 12 }}>
              {COLORS.map((c) => {
                const active = form.car_color === c.value;
                return (
                  <button key={c.value} type="button" title={c.label}
                    onClick={() => { set('car_color', c.value); set('car_color_custom', ''); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 4px', border: active ? '2px solid #00C2A8' : '2px solid transparent', borderRadius: 8, background: active ? '#EFF7F6' : 'transparent', cursor: 'pointer', transition: 'all 0.12s' }}
                  >
                    {c.hex ? (
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: c.hex, border: c.value === 'white' ? '1px solid #D1D5DB' : '1px solid rgba(0,0,0,0.08)', boxShadow: active ? '0 0 0 2px #00C2A8' : 'none' }} />
                    ) : (
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', border: '1px solid #D1D5DB', boxShadow: active ? '0 0 0 2px #00C2A8' : 'none' }} />
                    )}
                    <span style={{ fontSize: 9, color: active ? '#00C2A8' : '#6B7280', fontWeight: active ? 600 : 400, lineHeight: 1, textAlign: 'center' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.car_color && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_color}</p>}
            {form.car_color === 'other' && (
              <input
                value={form.car_color_custom}
                onChange={(e) => set('car_color_custom', e.target.value)}
                placeholder="Specify color…"
                className={inputCls(errors.car_color_custom) + ' mt-3'}
              />
            )}
            {errors.car_color_custom && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_color_custom}</p>}
          </SectionCard>

          {/* License plate */}
          <SectionCard icon={<Hash size={14} />} title="License plate">
            <p className="text-[11px] text-[#9CA3AF] mb-2">Arabic letters first, then numbers (e.g. 1234 ا ب ج)</p>
            <div
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F1F5F9', border: `1px solid ${errors.plate ? '#E74C3C' : '#E2E8F0'}`, borderRadius: 14, padding: '12px 16px', direction: 'rtl' }}
            >
              {[
                { ref: plateL1Ref, val: form.plateL1, key: 'plateL1' as const, next: plateL2Ref, prev: null, ph: 'أ' },
                { ref: plateL2Ref, val: form.plateL2, key: 'plateL2' as const, next: plateL3Ref, prev: plateL1Ref, ph: 'ب' },
                { ref: plateL3Ref, val: form.plateL3, key: 'plateL3' as const, next: numRef,     prev: plateL2Ref, ph: 'ج' },
              ].map(({ ref, val, key, next, prev, ph }) => (
                <input
                  key={key}
                  ref={ref}
                  type="text"
                  value={val}
                  dir="rtl" lang="ar"
                  inputMode="text" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                  maxLength={2}
                  placeholder={ph}
                  onChange={(e) => {
                    const arabic = e.target.value.replace(/[^\u0600-\u06FF]/g, '').slice(-1);
                    set(key, arabic);
                    if (arabic && next?.current) next.current.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !val && prev?.current) prev.current.focus();
                  }}
                  style={{ width: 52, height: 52, textAlign: 'center', fontFamily: 'inherit', border: `1.5px solid ${errors.plate && !val ? '#E74C3C' : val ? '#00C2A8' : '#D1D5DB'}`, borderRadius: 10, fontSize: val ? 22 : 15, fontWeight: 700, color: val ? '#0B1E3D' : '#9CA3AF', background: '#fff', outline: 'none', boxShadow: val ? '0 0 0 3px #00C2A833' : 'none', transition: 'all 0.15s' }}
                />
              ))}
              <span style={{ color: '#CBD5E1', fontSize: 22, fontWeight: 700, userSelect: 'none', lineHeight: 1 }}>·</span>
              <input
                ref={numRef}
                type="text" inputMode="numeric" placeholder="1234"
                value={form.plate_number} maxLength={4} autoComplete="off"
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); set('plate_number', v); }}
                onKeyDown={(e) => { if (e.key === 'Backspace' && !form.plate_number) plateL3Ref.current?.focus(); }}
                style={{ width: 80, height: 52, textAlign: 'center', border: `1.5px solid ${errors.plate ? '#E74C3C' : form.plate_number ? '#00C2A8' : '#D1D5DB'}`, borderRadius: 10, fontSize: 18, fontWeight: 700, color: '#0B1E3D', background: '#fff', outline: 'none', fontFamily: 'inherit', letterSpacing: '0.12em', boxShadow: form.plate_number ? '0 0 0 3px #00C2A833' : 'none' }}
              />
            </div>
            {errors.plate && <p className="mt-2 text-xs text-[#E74C3C]">{errors.plate}</p>}
          </SectionCard>

          {/* Default location */}
          <SectionCard icon={<MapPin size={14} />} title="Default location">
            <LocationPickerMap
              lat={form.default_lat}
              lng={form.default_lng}
              name={form.location_name}
              onChange={(newLat, newLng, newName) => {
                setForm((f) => ({ ...f, default_lat: newLat, default_lng: newLng, location_name: newName }));
                if (newLat && newLng) setErrors((e) => { const { default_location: _, ...rest } = e; return rest; });
              }}
              error={errors.default_location}
            />
          </SectionCard>

          {/* Ride preferences */}
          <SectionCard icon={<Sliders size={14} />} title="Ride preferences">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Price per km</label>
                <div className="relative">
                  <input
                    type="number" min={0} step={0.01}
                    value={form.price_per_km}
                    onChange={(e) => set('price_per_km', e.target.value)}
                    placeholder="e.g. 5.00"
                    className={inputCls(errors.price_per_km)}
                    style={{ paddingRight: 48 }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9CA3AF]">EGP</span>
                </div>
                {errors.price_per_km && <p className="mt-1 text-xs text-[#E74C3C]">{errors.price_per_km}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Waiting price / hour</label>
                <div className="relative">
                  <input
                    type="number" min={0} step={0.01}
                    value={form.waiting_price_per_hour}
                    onChange={(e) => set('waiting_price_per_hour', e.target.value)}
                    placeholder="e.g. 30.00"
                    className={inputCls(errors.waiting_price_per_hour)}
                    style={{ paddingRight: 48 }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9CA3AF]">EGP</span>
                </div>
                {errors.waiting_price_per_hour && <p className="mt-1 text-xs text-[#E74C3C]">{errors.waiting_price_per_hour}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Car capacity (seats)</label>
                <input
                  type="number" min={1} max={20}
                  value={form.car_capacity}
                  onChange={(e) => set('car_capacity', e.target.value)}
                  placeholder="e.g. 4"
                  className={inputCls(errors.car_capacity)}
                />
                {errors.car_capacity && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_capacity}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Accepted passengers</label>
                <div className="relative">
                  <select
                    value={form.passenger_type}
                    onChange={(e) => set('passenger_type', e.target.value)}
                    className={selectCls(errors.passenger_type)}
                  >
                    <option value="">Select</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                    <option value="mixed">Mixed</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">▾</span>
                </div>
                {errors.passenger_type && <p className="mt-1 text-xs text-[#E74C3C]">{errors.passenger_type}</p>}
              </div>
            </div>
          </SectionCard>

          {/* Upload documents */}
          <SectionCard icon={<Shield size={14} />} title="Upload documents">
            <p className="text-[11px] text-[#9CA3AF] mb-3">All documents must be clear and legible.</p>

            <p className="text-[13px] font-semibold text-[#0B1E3D] mb-1">National ID</p>
            <p className="text-[11px] text-[#9CA3AF] mb-2">Both sides required</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <FileField label="Front" value={form.national_id_image_front}
                onChange={(f) => set('national_id_image_front', f)}
                error={errors.national_id_image_front} />
              <FileField label="Back" value={form.national_id_image_back}
                onChange={(f) => set('national_id_image_back', f)}
                error={errors.national_id_image_back} />
            </div>

            <p className="text-[13px] font-semibold text-[#0B1E3D] mb-1">Driving license</p>
            <p className="text-[11px] text-[#9CA3AF] mb-2">Clear photo of your driving license</p>
            <div className="mb-4">
              <FileField label="Driving license" value={form.driving_license}
                onChange={(f) => set('driving_license', f)}
                error={errors.driving_license} />
            </div>

            <p className="text-[13px] font-semibold text-[#0B1E3D] mb-1">Vehicle license</p>
            <p className="text-[11px] text-[#9CA3AF] mb-2">Both sides required</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <FileField label="Front" value={form.vehicle_license_front}
                onChange={(f) => set('vehicle_license_front', f)}
                error={errors.vehicle_license_front} />
              <FileField label="Back" value={form.vehicle_license_back}
                onChange={(f) => set('vehicle_license_back', f)}
                error={errors.vehicle_license_back} />
            </div>

            <p className="text-[13px] font-semibold text-[#0B1E3D] mb-1">Criminal record certificate</p>
            <p className="text-[11px] text-[#9CA3AF] mb-2">Issued within the last 3 months</p>
            <FileField label="Criminal record certificate" value={form.criminal_record_certificate}
              onChange={(f) => set('criminal_record_certificate', f)}
              error={errors.criminal_record_certificate} />
          </SectionCard>

          {/* Info banner */}
          <div className="mb-4 flex items-start gap-2 p-3 rounded-lg" style={{ background: '#EFF7F6', border: '1px solid #00C2A833' }}>
            <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#00C2A8' }} />
            <p className="text-[12px] text-[#5A6A7A]">
              Your account will be reviewed within <strong className="text-[#0B1E3D]">24–48 hours</strong>.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#00C2A8', color: '#fff' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Submit application
          </button>
        </form>
      </main>
    </div>
  );
}
