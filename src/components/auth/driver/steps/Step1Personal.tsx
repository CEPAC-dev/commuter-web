'use client';

import { useState, useCallback } from 'react';
import { Mail, Phone, CreditCard, MapPin, Loader2 } from 'lucide-react';
import PasswordInput from '@/components/shared/PasswordInput';
import PasswordStrengthMeter from '@/components/shared/PasswordStrengthMeter';
import AgeGateInput from '@/components/shared/AgeGateInput';

export interface Step1Data {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  address: string;
  password: string;
  confirmPassword: string;
}

interface Step1Props {
  initial: Partial<Step1Data>;
  onNext: (data: Step1Data) => void;
}

const EGYPT_PHONE = /^01[0125][0-9]{8}$/;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Step1Personal({ initial, onNext }: Step1Props) {
  const [form, setForm] = useState<Step1Data>({
    name: initial.name ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    nationalId: initial.nationalId ?? '',
    dateOfBirth: initial.dateOfBirth ?? '',
    address: initial.address ?? '',
    password: initial.password ?? '',
    confirmPassword: initial.confirmPassword ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof Step1Data) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleDob = useCallback((v: string) => setForm((f) => ({ ...f, dateOfBirth: v })), []);

  function validate(): boolean {
    const e: Partial<Record<keyof Step1Data, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 3) e.name = 'Full name must be at least 3 characters.';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.';
    if (!EGYPT_PHONE.test(form.phone)) e.phone = 'Enter a valid Egyptian phone number (010/011/012/015 + 8 digits).';
    if (!/^\d{14}$/.test(form.nationalId)) e.nationalId = 'National ID must be exactly 14 digits.';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
    if (!form.address.trim() || form.address.trim().length < 10) e.address = 'Address must be at least 10 characters.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onNext(form);
  }

  const inputClass = (err?: string) => [
    'w-full h-[52px] border rounded-lg text-sm text-primary bg-white px-4',
    'focus:outline-none transition-all placeholder:text-text-muted/60',
    err
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15'
      : 'border-[#D1D5DB] focus:border-secondary focus:ring-2 focus:ring-secondary/15',
  ].join(' ');

  const withIcon = (err?: string) => [
    inputClass(err),
    'pl-10',
  ].join(' ');

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4">
        {/* Full name */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
          <input value={form.name} onChange={set('name')} placeholder="Your full name" className={inputClass(errors.name)} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={withIcon(errors.email)} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Phone number</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="010XXXXXXXX" className={withIcon(errors.phone)} />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
        </div>

        {/* National ID */}
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">National ID</label>
          <div className="relative">
            <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              value={form.nationalId}
              onChange={(e) => { if (/^\d*$/.test(e.target.value) && e.target.value.length <= 14) set('nationalId')(e); }}
              placeholder="14-digit National ID"
              className={withIcon(errors.nationalId)}
              inputMode="numeric"
            />
          </div>
          {errors.nationalId && <p className="mt-1 text-xs text-danger">{errors.nationalId}</p>}
        </div>

        {/* Date of birth */}
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Date of birth</label>
          <AgeGateInput value={form.dateOfBirth} onChange={handleDob} error={errors.dateOfBirth} />
        </div>

        {/* Address */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-primary mb-1.5">Home address</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-3.5 text-text-muted" aria-hidden />
            <textarea
              value={form.address}
              onChange={set('address')}
              rows={3}
              placeholder="Street, district, city"
              className={[
                'w-full border rounded-lg text-sm text-primary bg-white px-4 py-3 pl-10 resize-none',
                'focus:outline-none transition-all placeholder:text-text-muted/60',
                errors.address
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15'
                  : 'border-[#D1D5DB] focus:border-secondary focus:ring-2 focus:ring-secondary/15',
              ].join(' ')}
            />
          </div>
          {errors.address && <p className="mt-1 text-xs text-danger">{errors.address}</p>}
        </div>

        {/* Password */}
        <div>
          <PasswordInput
            label="Password"
            value={form.password}
            onChange={set('password')}
            placeholder="Min. 8 characters"
            error={errors.password}
          />
          <PasswordStrengthMeter password={form.password} />
        </div>

        {/* Confirm password */}
        <div>
          <PasswordInput
            label="Confirm password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Repeat password"
            error={errors.confirmPassword}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: '#00C2A8', color: '#fff' }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Continue to Car Info →
      </button>
    </form>
  );
}
