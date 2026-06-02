'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Car, Layers, Palette, Hash, MapPin, CreditCard, Shield,
  Loader2, Info, CheckCircle, Upload, X, FileText, LogOut, Sliders,
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
  national_id:    string;
  license_number: string;
  license_expiry: string;
  car_type:       'private' | 'taxi';
  car_brand:      string;
  car_model:      string;
  car_year:       number | '';
  car_color:      string;
  car_color_custom: string;
  plateL1:        string;
  plateL2:        string;
  plateL3:        string;
  plate_number:   string;
  default_location_name: string;
  default_lat:    string;
  default_lng:    string;
  price_per_km:   string;
  waiting_time:   string;
  seats:          string;
  passenger_gender: string;
  national_id_image_front: File | null;
  national_id_image_back:  File | null;
  license_image:           File | null;
}

export default function DriverOnboardingPage() {
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.replace('/');
  }

  const [form, setForm] = useState<FormState>({
    national_id:    '',
    license_number: '',
    license_expiry: '',
    car_type:       'private',
    car_brand:      '',
    car_model:      '',
    car_year:       '',
    car_color:      '',
    car_color_custom: '',
    plateL1: '', plateL2: '', plateL3: '',
    plate_number: '',
    default_location_name: '',
    default_lat: '',
    default_lng: '',
    price_per_km: '',
    waiting_time: '',
    seats: '',
    passenger_gender: '',
    national_id_image_front: null,
    national_id_image_back:  null,
    license_image:           null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const plateL1Ref = useRef<HTMLInputElement>(null);
  const plateL2Ref = useRef<HTMLInputElement>(null);
  const plateL3Ref = useRef<HTMLInputElement>(null);
  const numRef     = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!/^\d{14}$/.test(form.national_id)) e.national_id = 'Enter a valid 14-digit National ID.';
    if (!form.license_number.trim()) e.license_number = 'Enter your license number.';
    if (!form.license_expiry) e.license_expiry = 'Select the license expiry date.';
    if (!form.car_brand.trim()) e.car_brand = 'Enter the car brand.';
    if (!form.car_model.trim()) e.car_model = 'Enter the car model.';
    if (!form.car_year) e.car_year = 'Select a year.';
    if (!form.car_color) e.car_color = 'Pick a color.';
    if (form.car_color === 'other' && !form.car_color_custom.trim()) e.car_color_custom = 'Specify the color.';
    if (!form.plateL1 || !form.plateL2 || !form.plateL3) e.plate = 'Enter all 3 Arabic letters.';
    else if (!form.plate_number) e.plate = 'Enter the plate number.';
    if (!form.default_lat || !form.default_lng) e.default_location = 'Pick a location on the map or search for one.';
    if (!form.national_id_image_front) e.national_id_image_front = 'Upload the front of your National ID.';
    if (!form.national_id_image_back)  e.national_id_image_back  = 'Upload the back of your National ID.';
    if (!form.license_image)           e.license_image           = 'Upload your driving license.';
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
      const carNumber = `${form.plateL1}${form.plateL2}${form.plateL3} ${form.plate_number}`;
      const carColor  = form.car_color === 'other' ? form.car_color_custom.trim() : form.car_color;
      const carModel  = [form.car_brand.trim(), form.car_model.trim(), String(form.car_year)]
        .filter(Boolean).join(' ');

      const fd = new FormData();
      fd.append('national_id',    form.national_id);
      fd.append('license_number', form.license_number);
      fd.append('license_expiry', form.license_expiry);
      fd.append('car_type',       form.car_type);
      fd.append('car_model',      carModel);
      fd.append('car_number',     carNumber);
      fd.append('car_color',      carColor);
      fd.append('default_lat',    form.default_lat);
      fd.append('default_lng',    form.default_lng);
      fd.append('default_location_name', form.default_location_name.trim());
      if (form.price_per_km)    fd.append('price_per_km',    form.price_per_km);
      if (form.waiting_time)    fd.append('waiting_time',    form.waiting_time);
      if (form.seats)           fd.append('seats',           form.seats);
      if (form.passenger_gender) fd.append('passenger_gender', form.passenger_gender);
      if (form.license_image)           fd.append('license_image',           form.license_image);
      if (form.national_id_image_front) fd.append('national_id_image_front', form.national_id_image_front);
      if (form.national_id_image_back)  fd.append('national_id_image_back',  form.national_id_image_back);

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
            onClick={() => router.replace('/driver/requests')}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">License number</label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => set('license_number', e.target.value)}
                  placeholder="DL-1234567"
                  className={inputCls(errors.license_number)}
                />
                {errors.license_number && <p className="mt-1 text-xs text-[#E74C3C]">{errors.license_number}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Driving license expiry</label>
                <input
                  type="date"
                  value={form.license_expiry}
                  onChange={(e) => set('license_expiry', e.target.value)}
                  className={inputCls(errors.license_expiry)}
                />
                {errors.license_expiry && <p className="mt-1 text-xs text-[#E74C3C]">{errors.license_expiry}</p>}
              </div>
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
              name={form.default_location_name}
              onChange={(newLat, newLng, newName) => {
                setForm((f) => ({ ...f, default_lat: newLat, default_lng: newLng, default_location_name: newName }));
                if (newLat && newLng) setErrors((e) => { const { default_location: _, ...rest } = e; return rest; });
              }}
              error={errors.default_location}
            />
          </SectionCard>

          {/* Ride preferences */}
          <SectionCard icon={<Sliders size={14} />} title="Ride preferences (optional)">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Price per km</label>
                <div className="relative">
                  <input
                    type="number" min={0} step={0.5}
                    value={form.price_per_km}
                    onChange={(e) => set('price_per_km', e.target.value)}
                    placeholder="e.g. 5"
                    className={inputCls()}
                    style={{ paddingRight: 48 }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9CA3AF]">EGP</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Waiting time for passenger</label>
                <div className="relative">
                  <select
                    value={form.waiting_time}
                    onChange={(e) => set('waiting_time', e.target.value)}
                    className={selectCls()}
                  >
                    <option value="">Select</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">▾</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Available seats</label>
                <input
                  type="number" min={1} max={20}
                  value={form.seats}
                  onChange={(e) => set('seats', e.target.value)}
                  placeholder="e.g. 4"
                  className={inputCls()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0B1E3D] mb-1.5">Accepted passengers</label>
                <div className="relative">
                  <select
                    value={form.passenger_gender}
                    onChange={(e) => set('passenger_gender', e.target.value)}
                    className={selectCls()}
                  >
                    <option value="">Select</option>
                    <option value="any">Any</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">▾</span>
                </div>
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
            <p className="text-[11px] text-[#9CA3AF] mb-2">Clear photo of your license</p>
            <FileField label="Driving license" value={form.license_image}
              onChange={(f) => set('license_image', f)}
              error={errors.license_image} />
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
