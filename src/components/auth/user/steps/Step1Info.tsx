'use client';

import { useState, useCallback } from 'react';
import { Mail, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import PasswordInput from '@/components/shared/PasswordInput';
import PasswordStrengthMeter from '@/components/shared/PasswordStrengthMeter';
import AgeGateInput from '@/components/shared/AgeGateInput';

export interface Step1Data {
  name:                   string;
  birthdate:              string;  // YYYY-MM-DD
  gender:                 'male' | 'female';
  email:                  string;
  phone_number:           string;
  whatsapp_number:        string;
  whatsapp_same_as_phone: boolean;
  password:               string;
  password_confirmation:  string;
}

interface Step1Props {
  initial: Partial<Step1Data>;
  onNext:  (data: Step1Data) => void;
}

const NAME_RE     = /^[^\d]{3,}$/;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EGYPT_PHONE = /^01[0125][0-9]{8}$/;

// ── Helpers (outside component to avoid remount-on-render) ────────────────────

function fieldCls(err?: string) {
  return [
    'w-full h-[52px] border rounded-lg text-sm bg-white px-4',
    'focus:outline-none transition-all placeholder:text-[#9CA3AF]',
    err
      ? 'border-[#E74C3C] focus:border-[#E74C3C] focus:ring-2 focus:ring-[#E74C3C]/15 text-[#0B1E3D]'
      : 'border-[#D1D5DB] focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/15 text-[#0B1E3D]',
  ].join(' ');
}

function iconFieldCls(err?: string) {
  return `${fieldCls(err)} pl-10`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step1Info({ initial, onNext }: Step1Props) {
  const t = useTranslations('signup_step1');
  const [form, setForm] = useState<Step1Data>({
    name:                   initial.name                   ?? '',
    birthdate:              initial.birthdate              ?? '',
    gender:                 initial.gender                 ?? 'male',
    email:                  initial.email                  ?? '',
    phone_number:           initial.phone_number           ?? '',
    whatsapp_number:        initial.whatsapp_number        ?? '',
    whatsapp_same_as_phone: initial.whatsapp_same_as_phone ?? true,
    password:               initial.password               ?? '',
    password_confirmation:  initial.password_confirmation  ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});

  const set = (k: keyof Step1Data) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleWhatsappToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        whatsapp_same_as_phone: e.target.checked,
        whatsapp_number: e.target.checked ? f.phone_number : '',
      })),
    []
  );

  function validate(): boolean {
    const e: Partial<Record<keyof Step1Data, string>> = {};
    if (!NAME_RE.test(form.name.trim()))
      e.name = t('name_error');
    if (!form.birthdate)
      e.birthdate = t('dob_error');
    if (!EMAIL_RE.test(form.email))
      e.email = t('email_error');
    if (!EGYPT_PHONE.test(form.phone_number))
      e.phone_number = t('mobile_error');
    if (!form.whatsapp_same_as_phone && !EGYPT_PHONE.test(form.whatsapp_number))
      e.whatsapp_number = t('whatsapp_error');
    if (form.password.length < 8)
      e.password = t('password_error');
    if (form.password_confirmation !== form.password)
      e.password_confirmation = t('confirm_error');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">{t('name_label')}</label>
        <input
          value={form.name}
          onChange={set('name')}
          placeholder={t('name_placeholder')}
          autoComplete="name"
          className={fieldCls(errors.name)}
        />
        {errors.name && <p className="mt-1 text-xs text-[#E74C3C]">{errors.name}</p>}
      </div>

      {/* Date of birth */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">{t('dob_label')}</label>
        <AgeGateInput
          onChange={(val) => setForm((f) => ({ ...f, birthdate: val }))}
          error={errors.birthdate}
        />
        {errors.birthdate && <p className="mt-1 text-xs text-[#E74C3C]">{errors.birthdate}</p>}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">{t('gender_label')}</label>
        <div className="grid grid-cols-2 gap-3">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm((f) => ({ ...f, gender: g }))}
              className={[
                'h-[52px] rounded-lg border text-sm font-semibold capitalize transition-all',
                form.gender === g
                  ? 'border-[#00C2A8] bg-[#00C2A8]/5 text-[#0B1E3D]'
                  : 'border-[#D1D5DB] bg-white text-[#0B1E3D] hover:border-[#00C2A8]',
              ].join(' ')}
            >
              {g === 'male' ? t('male') : t('female')}
            </button>
          ))}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">{t('email_label')}</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" aria-hidden />
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
            className={iconFieldCls(errors.email)}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-[#E74C3C]">{errors.email}</p>}
      </div>

      {/* Mobile */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">{t('mobile_label')}</label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" aria-hidden />
          <input
            type="tel"
            value={form.phone_number}
            onChange={set('phone_number')}
            placeholder="01xxxxxxxxx"
            autoComplete="tel"
            className={iconFieldCls(errors.phone_number)}
          />
        </div>
        {errors.phone_number && <p className="mt-1 text-xs text-[#E74C3C]">{errors.phone_number}</p>}
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">{t('whatsapp_label')}</label>
        <label className="flex items-center gap-2 text-sm text-[#5A6A7A] mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.whatsapp_same_as_phone}
            onChange={handleWhatsappToggle}
            className="accent-[#00C2A8] w-4 h-4"
          />
          {t('whatsapp_same')}
        </label>
        {!form.whatsapp_same_as_phone && (
          <div>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" aria-hidden />
              <input
                type="tel"
                value={form.whatsapp_number}
                onChange={set('whatsapp_number')}
                placeholder="01xxxxxxxxx"
                className={iconFieldCls(errors.whatsapp_number)}
              />
            </div>
            {errors.whatsapp_number && (
              <p className="mt-1 text-xs text-[#E74C3C]">{errors.whatsapp_number}</p>
            )}
          </div>
        )}
      </div>

      {/* Password */}
      <div>
        <PasswordInput
          label={t('password_label')}
          value={form.password}
          onChange={set('password')}
          placeholder={t('password_placeholder')}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={form.password} />
      </div>

      {/* Confirm password */}
      <div>
        <PasswordInput
          label={t('confirm_label')}
          value={form.password_confirmation}
          onChange={set('password_confirmation')}
          placeholder={t('confirm_placeholder')}
          error={errors.password_confirmation}
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        className="w-full h-[52px] rounded-lg text-sm font-bold bg-[#00C2A8] text-[#0B1E3D] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 mt-2"
      >
        {t('continue_btn')}
      </button>
    </form>
  );
}
