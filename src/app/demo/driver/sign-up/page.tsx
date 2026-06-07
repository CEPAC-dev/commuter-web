'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  CheckCircle, ArrowLeft, Loader2, User, Car, Clock, Sliders,
  Mail, Phone, MapPin, Eye, EyeOff,
} from 'lucide-react';
import { call } from '@/lib/api/client';
import authApi, {
  extractToken, extractRole, extractName, extractId,
} from '@/lib/api/auth';
import { saveSession } from '@/lib/auth/tokenStorage';

// ─── Design tokens ────────────────────────────────────────────────────────────

const PRIMARY   = '#00C2A8';
const NAVY      = '#0B1E3D';
const GRAY_BORDER = '#D1D5DB';
const GRAY_TEXT   = '#9CA3AF';
const ERROR       = '#E74C3C';

function fieldCls(err?: string) {
  return [
    'w-full h-[52px] border rounded-lg text-sm bg-white px-4 text-[#0B1E3D]',
    'focus:outline-none transition-all placeholder:text-[#9CA3AF]',
    err
      ? `border-[${ERROR}] focus:border-[${ERROR}] focus:ring-2 focus:ring-[${ERROR}]/15`
      : `border-[${GRAY_BORDER}] focus:border-[${PRIMARY}] focus:ring-2 focus:ring-[${PRIMARY}]/15`,
  ].join(' ');
}

function selectCls(err?: string) {
  return `${fieldCls(err)} appearance-none`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">{children}</label>;
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-[#E74C3C]">{msg}</p> : null;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ['Sign Up', 'Car Info', 'Availability', 'Preferences'] as const;

function StepBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center mb-8" role="list" aria-label="Registration progress">
      {STEP_LABELS.map((label, idx) => {
        const n      = (idx + 1) as 1 | 2 | 3 | 4;
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none" role="listitem">
            <div
              className={[
                'flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 text-xs font-bold transition-all',
                done
                  ? 'bg-[#00C2A8] border-[#00C2A8] text-[#0B1E3D]'
                  : active
                  ? 'bg-white border-[#00C2A8] text-[#00C2A8] shadow-[0_0_0_3px_rgba(0,194,168,0.2)]'
                  : 'bg-white border-[#D1D5DB] text-[#9CA3AF]',
              ].join(' ')}
              aria-current={active ? 'step' : undefined}
            >
              {done ? (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : n}
            </div>
            <span className={[
              'ml-1.5 text-xs whitespace-nowrap hidden sm:inline',
              active ? 'text-[#0B1E3D] font-semibold' : done ? 'text-[#00C2A8] font-medium' : 'text-[#9CA3AF]',
            ].join(' ')}>
              {label}
            </span>
            {idx < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px mx-2 sm:mx-3 ${done ? 'bg-[#00C2A8]' : 'bg-[#E2E8F0]'}`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────

function PrimaryBtn({ loading, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || rest.disabled}
      className="w-full h-[52px] rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
      style={{
        background: loading ? '#E2E8F0' : PRIMARY,
        color:      loading ? GRAY_TEXT  : NAVY,
      }}
      {...rest}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-[#5A6A7A] hover:text-[#0B1E3D] transition-colors mb-4"
    >
      <ArrowLeft size={15} />
      Back
    </button>
  );
}

// ─── STEP 1: Sign Up ──────────────────────────────────────────────────────────

interface Step1State {
  name: string; email: string; phone_number: string;
  whatsapp_number: string; whatsapp_same: boolean;
  gender: 'male' | 'female'; birthdate: string;
  province: string; district: string; sub_district: string;
  building: string; street: string; landmark: string;
  password: string; password_confirmation: string;
}

const EGYPT_PHONE = /^01[0125][0-9]{8}$/;
const EMAIL_RE    = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function Step1SignUp({ onNext, loading }: { onNext: (d: Step1State) => void; loading: boolean }) {
  const [form, setForm] = useState<Step1State>({
    name: '', email: '', phone_number: '', whatsapp_number: '',
    whatsapp_same: true, gender: 'male', birthdate: '',
    province: '', district: '', sub_district: '',
    building: '', street: '', landmark: '',
    password: '', password_confirmation: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step1State, string>>>({});
  const [showPw, setShowPw] = useState(false);

  const set = (k: keyof Step1State) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: typeof errors = {};
    if (form.name.trim().length < 3) e.name = 'Full name is required (at least 3 characters).';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.';
    if (!EGYPT_PHONE.test(form.phone_number)) e.phone_number = 'Enter a valid Egyptian phone number.';
    if (!form.whatsapp_same && !EGYPT_PHONE.test(form.whatsapp_number))
      e.whatsapp_number = 'Enter a valid WhatsApp number.';
    if (!form.birthdate) e.birthdate = 'Date of birth is required.';
    if (!form.province.trim()) e.province = 'Province is required.';
    if (!form.district.trim()) e.district = 'District is required.';
    if (!form.sub_district.trim()) e.sub_district = 'Sub-district is required.';
    if (!form.building.trim()) e.building = 'Building is required.';
    if (!form.street.trim()) e.street = 'Street is required.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.password_confirmation)
      e.password_confirmation = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-bold text-[#0B1E3D]">Create your account</h2>
        <p className="text-sm text-[#5A6A7A] mt-1">Join as a driver — takes 4 quick steps</p>
      </div>

      <StepBar current={1} />

      {/* Name */}
      <div>
        <Label>Full name</Label>
        <input value={form.name} onChange={set('name')} placeholder="Ahmed Mohamed" className={fieldCls(errors.name)} />
        <FieldError msg={errors.name} />
      </div>

      {/* Email */}
      <div>
        <Label>Email</Label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={form.email} onChange={set('email')} type="email" placeholder="you@example.com"
            className={`${fieldCls(errors.email)} pl-10`} />
        </div>
        <FieldError msg={errors.email} />
      </div>

      {/* Phone + WhatsApp */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Phone number</Label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input value={form.phone_number} onChange={set('phone_number')} placeholder="01xxxxxxxxx"
              className={`${fieldCls(errors.phone_number)} pl-10`} />
          </div>
          <FieldError msg={errors.phone_number} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          {form.whatsapp_same ? (
            <div
              className="w-full h-[52px] border border-[#D1D5DB] rounded-lg bg-[#F8F9FA] flex items-center px-4 text-sm text-[#9CA3AF] cursor-pointer"
              onClick={() => setForm((f) => ({ ...f, whatsapp_same: false, whatsapp_number: '' }))}
            >
              Same as phone ✓
            </div>
          ) : (
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input value={form.whatsapp_number} onChange={set('whatsapp_number')} placeholder="01xxxxxxxxx"
                className={`${fieldCls(errors.whatsapp_number)} pl-10`} />
            </div>
          )}
          {!form.whatsapp_same && (
            <button type="button" className="text-xs text-[#00C2A8] mt-1"
              onClick={() => setForm((f) => ({ ...f, whatsapp_same: true, whatsapp_number: f.phone_number }))}>
              Same as phone
            </button>
          )}
          <FieldError msg={errors.whatsapp_number} />
        </div>
      </div>

      {/* Gender + Birthdate */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Gender</Label>
          <select value={form.gender} onChange={set('gender')} className={selectCls()}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <Label>Date of birth</Label>
          <input value={form.birthdate} onChange={set('birthdate')} type="date"
            max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
            className={fieldCls(errors.birthdate)} />
          <FieldError msg={errors.birthdate} />
        </div>
      </div>

      {/* Address */}
      <div className="pt-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6A7A] mb-2 flex items-center gap-1.5">
          <MapPin size={13} /> Address
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Province</Label>
            <input value={form.province} onChange={set('province')} placeholder="Cairo" className={fieldCls(errors.province)} />
            <FieldError msg={errors.province} />
          </div>
          <div>
            <Label>District</Label>
            <input value={form.district} onChange={set('district')} placeholder="Nasr City" className={fieldCls(errors.district)} />
            <FieldError msg={errors.district} />
          </div>
          <div>
            <Label>Sub-district</Label>
            <input value={form.sub_district} onChange={set('sub_district')} placeholder="Zone 1" className={fieldCls(errors.sub_district)} />
            <FieldError msg={errors.sub_district} />
          </div>
          <div>
            <Label>Building</Label>
            <input value={form.building} onChange={set('building')} placeholder="10" className={fieldCls(errors.building)} />
            <FieldError msg={errors.building} />
          </div>
          <div className="col-span-2">
            <Label>Street</Label>
            <input value={form.street} onChange={set('street')} placeholder="Tayaran Street" className={fieldCls(errors.street)} />
            <FieldError msg={errors.street} />
          </div>
          <div className="col-span-2">
            <Label>Landmark <span className="text-[#9CA3AF] font-normal">(optional)</span></Label>
            <input value={form.landmark} onChange={set('landmark')} placeholder="near mall" className={fieldCls()} />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="pt-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6A7A] mb-2">Password</p>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <Label>Password</Label>
            <div className="relative">
              <input value={form.password} onChange={set('password')}
                type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                className={`${fieldCls(errors.password)} pr-10`} />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError msg={errors.password} />
          </div>
          <div>
            <Label>Confirm password</Label>
            <input value={form.password_confirmation} onChange={set('password_confirmation')}
              type={showPw ? 'text' : 'password'} placeholder="Repeat your password"
              className={fieldCls(errors.password_confirmation)} />
            <FieldError msg={errors.password_confirmation} />
          </div>
        </div>
      </div>

      <PrimaryBtn loading={loading}>Continue to Car Info →</PrimaryBtn>

      <p className="text-center text-sm text-[#5A6A7A]">
        Already have an account?{' '}
        <Link href="/driver/sign-in" className="text-[#00C2A8] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

// ─── STEP 2: Car Profile ──────────────────────────────────────────────────────

interface Step2State {
  car_type: 'taxi' | 'private';
  car_brand: string;
  car_model: string;
  car_year: string;
  car_capacity: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2005 + 1 }, (_, i) => CURRENT_YEAR - i);

function Step2CarProfile({ onNext, onBack, loading }: {
  onNext: (d: Step2State) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Step2State>({
    car_type: 'private', car_brand: '', car_model: '', car_year: '', car_capacity: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step2State, string>>>({});

  const set = (k: keyof Step2State) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: typeof errors = {};
    if (!form.car_brand.trim()) e.car_brand = 'Car brand is required.';
    if (!form.car_model.trim()) e.car_model = 'Car model is required.';
    if (!form.car_year) e.car_year = 'Car year is required.';
    if (!form.car_capacity || isNaN(Number(form.car_capacity)) || Number(form.car_capacity) < 1)
      e.car_capacity = 'Passenger capacity is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-bold text-[#0B1E3D]">Your car details</h2>
        <p className="text-sm text-[#5A6A7A] mt-1">Tell us about the car you&apos;ll be driving</p>
      </div>

      <StepBar current={2} />
      <BackBtn onClick={onBack} />

      {/* Car Type */}
      <div>
        <Label>Car type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['private', 'taxi'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, car_type: t }))}
              className={[
                'h-[52px] rounded-lg border-2 font-semibold text-sm capitalize transition-all',
                form.car_type === t
                  ? 'border-[#00C2A8] bg-[#00C2A8]/10 text-[#0B1E3D]'
                  : 'border-[#D1D5DB] text-[#5A6A7A] hover:border-[#00C2A8]/50',
              ].join(' ')}
            >
              {t === 'private' ? '🚗 Private' : '🚕 Taxi'}
            </button>
          ))}
        </div>
      </div>

      {/* Brand + Model */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Car brand</Label>
          <input value={form.car_brand} onChange={set('car_brand')} placeholder="Toyota" className={fieldCls(errors.car_brand)} />
          <FieldError msg={errors.car_brand} />
        </div>
        <div>
          <Label>Car model</Label>
          <input value={form.car_model} onChange={set('car_model')} placeholder="Corolla" className={fieldCls(errors.car_model)} />
          <FieldError msg={errors.car_model} />
        </div>
      </div>

      {/* Year + Capacity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Car year</Label>
          <select value={form.car_year} onChange={set('car_year')} className={selectCls(errors.car_year)}>
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <FieldError msg={errors.car_year} />
        </div>
        <div>
          <Label>Passenger capacity</Label>
          <select value={form.car_capacity} onChange={set('car_capacity')} className={selectCls(errors.car_capacity)}>
            <option value="">Select</option>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
            ))}
          </select>
          <FieldError msg={errors.car_capacity} />
        </div>
      </div>

      <PrimaryBtn loading={loading}>Continue to Availability →</PrimaryBtn>
    </form>
  );
}

// ─── STEP 3: Availability ─────────────────────────────────────────────────────

interface Step3State {
  days: string[];
  start_location_name: string;
  end_location_name: string;
  start_time: string;
  end_time: string;
}

const DAYS = [
  { value: 'sun', label: 'Sunday' },
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
];

// Default coordinates — Cairo area
const DEFAULT_START_LAT = 30.0626;
const DEFAULT_START_LNG = 31.3219;
const DEFAULT_END_LAT   = 30.0782;
const DEFAULT_END_LNG   = 30.9818;

function Step3Availability({ onNext, onBack, loading }: {
  onNext: (d: Step3State) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Step3State>({
    days: [], start_location_name: '', end_location_name: '',
    start_time: '', end_time: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step3State, string>>>({});

  const set = (k: keyof Step3State) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleDay = (dayValue: string) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(dayValue)
        ? f.days.filter((d) => d !== dayValue)
        : [...f.days, dayValue],
    }));
  };

  function validate() {
    const e: typeof errors = {};
    if (form.days.length === 0) e.days = 'Please select at least one day.';
    if (!form.start_location_name.trim()) e.start_location_name = 'Start location is required.';
    if (!form.end_location_name.trim()) e.end_location_name = 'End location is required.';
    if (!form.start_time) e.start_time = 'Start time is required.';
    if (!form.end_time) e.end_time = 'End time is required.';
    if (form.start_time && form.end_time && form.start_time >= form.end_time)
      e.end_time = 'End time must be after start time.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-bold text-[#0B1E3D]">Your availability</h2>
        <p className="text-sm text-[#5A6A7A] mt-1">When and where do you commute? You can add more days later.</p>
      </div>

      <StepBar current={3} />
      <BackBtn onClick={onBack} />

      {/* Days of week - Checkboxes */}
      <div>
        <Label>Days of the week</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDay(d.value)}
              className={[
                'h-[52px] px-3 rounded-lg font-medium text-sm transition-all border-2 flex items-center justify-center',
                form.days.includes(d.value)
                  ? `bg-[${PRIMARY}] border-[${PRIMARY}] text-white`
                  : `bg-white border-[${GRAY_BORDER}] text-[#0B1E3D] hover:border-[${PRIMARY}]`,
              ].join(' ')}
            >
              {d.label}
            </button>
          ))}
        </div>
        <FieldError msg={errors.days} />
      </div>

      {/* Locations */}
      <div>
        <Label>Start location name</Label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00C2A8]" />
          <input
            value={form.start_location_name}
            onChange={set('start_location_name')}
            placeholder="e.g. Nasr City — Block 5"
            className={`${fieldCls(errors.start_location_name)} pl-10`}
          />
        </div>
        <FieldError msg={errors.start_location_name} />
      </div>

      <div>
        <Label>End location name</Label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E74C3C]" />
          <input
            value={form.end_location_name}
            onChange={set('end_location_name')}
            placeholder="e.g. Smart Village"
            className={`${fieldCls(errors.end_location_name)} pl-10`}
          />
        </div>
        <FieldError msg={errors.end_location_name} />
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Start time</Label>
          <input value={form.start_time} onChange={set('start_time')} type="time"
            className={fieldCls(errors.start_time)} />
          <FieldError msg={errors.start_time} />
        </div>
        <div>
          <Label>End time</Label>
          <input value={form.end_time} onChange={set('end_time')} type="time"
            className={fieldCls(errors.end_time)} />
          <FieldError msg={errors.end_time} />
        </div>
      </div>

      <div className="rounded-xl bg-[#F0FDFA] border border-[#00C2A8]/30 px-4 py-3 text-sm text-[#0B1E3D] flex gap-2">
        <span className="text-[#00C2A8] flex-shrink-0 mt-0.5">ℹ</span>
        <span>Location coordinates are set automatically. You can update them from your profile later.</span>
      </div>

      <PrimaryBtn loading={loading}>Continue to Preferences →</PrimaryBtn>
    </form>
  );
}

// ─── STEP 4: Preferences ─────────────────────────────────────────────────────

interface Step4State {
  price_per_km: string;
  waiting_price_per_hour: string;
  passenger_type: 'male' | 'female' | 'mixed';
}

function Step4Preferences({ onNext, onBack, loading }: {
  onNext: (d: Step4State) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Step4State>({
    price_per_km: '', waiting_price_per_hour: '', passenger_type: 'mixed',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step4State, string>>>({});

  const set = (k: keyof Step4State) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: typeof errors = {};
    if (!form.price_per_km || isNaN(Number(form.price_per_km)) || Number(form.price_per_km) <= 0)
      e.price_per_km = 'Enter a valid price per km.';
    if (!form.waiting_price_per_hour || isNaN(Number(form.waiting_price_per_hour)) || Number(form.waiting_price_per_hour) < 0)
      e.waiting_price_per_hour = 'Enter a valid waiting price.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-bold text-[#0B1E3D]">Your preferences</h2>
        <p className="text-sm text-[#5A6A7A] mt-1">Set your pricing and passenger preferences</p>
      </div>

      <StepBar current={4} />
      <BackBtn onClick={onBack} />

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Price per km (EGP)</Label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] font-medium">EGP</span>
            <input value={form.price_per_km} onChange={set('price_per_km')} type="number"
              min="0" step="0.5" placeholder="e.g. 5"
              className={`${fieldCls(errors.price_per_km)} pr-12`} />
          </div>
          <FieldError msg={errors.price_per_km} />
        </div>
        <div>
          <Label>Waiting price / hr (EGP)</Label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] font-medium">EGP</span>
            <input value={form.waiting_price_per_hour} onChange={set('waiting_price_per_hour')} type="number"
              min="0" step="1" placeholder="e.g. 20"
              className={`${fieldCls(errors.waiting_price_per_hour)} pr-12`} />
          </div>
          <FieldError msg={errors.waiting_price_per_hour} />
        </div>
      </div>

      {/* Passenger type */}
      <div>
        <Label>Accepted passengers</Label>
        <div className="grid grid-cols-3 gap-2">
          {(['male', 'female', 'mixed'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, passenger_type: t }))}
              className={[
                'h-[52px] rounded-lg border-2 font-semibold text-sm capitalize transition-all',
                form.passenger_type === t
                  ? 'border-[#00C2A8] bg-[#00C2A8]/10 text-[#0B1E3D]'
                  : 'border-[#D1D5DB] text-[#5A6A7A] hover:border-[#00C2A8]/50',
              ].join(' ')}
            >
              {t === 'male' ? '👨 Male' : t === 'female' ? '👩 Female' : '👥 Mixed'}
            </button>
          ))}
        </div>
      </div>

      <PrimaryBtn loading={loading}>Complete Registration 🎉</PrimaryBtn>
    </form>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

const LEFT_ITEMS = [
  { icon: <User size={16} />,    text: 'Create your driver account' },
  { icon: <Car size={16} />,     text: 'Add your car details' },
  { icon: <Clock size={16} />,   text: 'Set your weekly availability' },
  { icon: <Sliders size={16} />, text: 'Configure your pricing' },
];

function LeftPanel({ currentStep }: { currentStep: number }) {
  return (
    <div className="text-white">
      <div className="mb-8">
        <h2 className="text-4xl font-bold leading-tight mb-3">
          Drive smarter.<br />
          <span style={{ color: '#00C2A8' }}>Earn better.</span>
        </h2>
        <p className="text-white/65 text-[15px] leading-relaxed">
          Join Egypt&apos;s leading ride-pooling platform and grow your income on your schedule.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-white/80 mb-3">Registration steps:</p>
        {LEFT_ITEMS.map((item, i) => {
          const n = i + 1;
          const done = n < currentStep;
          const active = n === currentStep;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                done   ? 'bg-[#00C2A8]'
                       : active
                       ? 'bg-white/20 border border-white/40'
                       : 'bg-white/10 border border-white/20',
              ].join(' ')}>
                {done
                  ? <CheckCircle size={14} color="#0B1E3D" />
                  : <span className={active ? 'text-white' : 'text-white/40'}>{item.icon}</span>}
              </div>
              <span className={[
                'text-sm',
                done   ? 'text-[#00C2A8] font-medium'
                       : active
                       ? 'text-white font-semibold'
                       : 'text-white/40',
              ].join(' ')}>
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#00C2A8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color: '#0B1E3D', fontWeight: 900, fontSize: 14, lineHeight: 1 }}>C</span>
      </div>
      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 18, letterSpacing: '0.02em' }}>commuter</span>
    </Link>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function DemoDriverSignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // ── Step 1: Register ──────────────────────────────────────────────────────
  async function handleStep1(data: Step1State) {
    setLoading(true);
    try {
      const result = await authApi.register({
        role:                  'driver',
        name:                  data.name.trim(),
        email:                 data.email.trim(),
        phone_number:          data.phone_number,
        whatsapp_number:       data.whatsapp_same ? data.phone_number : data.whatsapp_number,
        province:              data.province.trim(),
        gender:                data.gender,
        birthdate:             data.birthdate,
        district:              data.district.trim(),
        sub_district:          data.sub_district.trim(),
        building:              data.building.trim(),
        street:                data.street.trim(),
        landmark:              data.landmark.trim(),
        password:              data.password,
        password_confirmation: data.password_confirmation,
      });
      const token = extractToken(result);
      if (token) {
        saveSession({
          token,
          role:  extractRole(result) || 'driver',
          name:  extractName(result) || data.name.trim(),
          id:    extractId(result),
        });
      }
      setStep(2);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Car profile ───────────────────────────────────────────────────
  async function handleStep2(data: Step2State) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('national_id',    '12345678901234'); // demo value
      fd.append('license_number', 'DL123456789');    // demo value
      fd.append('license_expiry', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      fd.append('car_type',       data.car_type);
      fd.append('car_model',      `${data.car_brand} ${data.car_model} ${data.car_year}`);
      fd.append('car_number',     'XXX-0000'); // demo plate
      fd.append('car_color',      'Black');    // demo color
      fd.append('default_lat',    '30.0626');
      fd.append('default_lng',    '31.3219');
      fd.append('default_location_name', 'Cairo');
      fd.append('seats',          String(data.car_capacity));
      
      await call('driver/profile', { method: 'POST', body: fd });
      setStep(3);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save car details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Availability ──────────────────────────────────────────────────
  async function handleStep3(data: Step3State) {
    setLoading(true);
    try {
      // Make API call for each selected day
      for (const day of data.days) {
        await call('driver/availability', {
          method: 'POST',
          body: {
            day,
            start_location_name: data.start_location_name,
            start_lat:           DEFAULT_START_LAT,
            start_lng:           DEFAULT_START_LNG,
            end_location_name:   data.end_location_name,
            end_lat:             DEFAULT_END_LAT,
            end_lng:             DEFAULT_END_LNG,
            start_time:          data.start_time.length === 5 ? `${data.start_time}:00` : data.start_time,
            end_time:            data.end_time.length === 5   ? `${data.end_time}:00`   : data.end_time,
          },
        });
      }
      setStep(4);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save availability. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 4: Preferences ───────────────────────────────────────────────────
  async function handleStep4(data: Step4State) {
    setLoading(true);
    try {
      await call('driver/profile', {
        method: 'PUT',
        body: {
          price_per_km:           Number(data.price_per_km),
          waiting_price_per_hour: Number(data.waiting_price_per_hour),
          passenger_type:         data.passenger_type,
        },
      });
      router.push('/demo/driver/success');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* ── Left panel (desktop) ── */}
      <div
        className="auth-left-panel"
        style={{
          width: '42%',
          background: '#0B1E3D', padding: '40px 52px',
          flexDirection: 'column', flexShrink: 0,
        }}
      >
        <Logo />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '48px' }}>
          <LeftPanel currentStep={step} />
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Demo portal — commuter.site
        </p>
      </div>

      {/* ── Right panel (scroll) ── */}
      <div className="auth-right-panel" style={{ background: '#ffffff' }}>
        <div className="auth-form-scroll" style={{ maxWidth: 540, width: '100%', margin: '0 auto' }}>
          {step === 1 && <Step1SignUp  onNext={handleStep1} loading={loading} />}
          {step === 2 && <Step2CarProfile onNext={handleStep2} onBack={() => setStep(1)} loading={loading} />}
          {step === 3 && <Step3Availability onNext={handleStep3} onBack={() => setStep(2)} loading={loading} />}
          {step === 4 && <Step4Preferences onNext={handleStep4} onBack={() => setStep(3)} loading={loading} />}
        </div>
      </div>

      {/* ── Responsive override: on mobile the left panel collapses ── */}
      <style>{`
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
