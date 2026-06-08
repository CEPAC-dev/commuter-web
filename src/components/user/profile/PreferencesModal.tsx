'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import userApi from '@/lib/api/user';
import type { CommutePreferences } from '@/types/user';
import { useTranslations } from 'next-intl';

const DEFAULTS: CommutePreferences = {
  gender_preference:           'any',
  smoking_allowed:             false,
  interaction_level:           'normal',
  children_allowed:            true,
  music_preference:            'normal',
  seat_preference:             'any',
  walking_distance_preference: 'no_walk',
  air_conditioning_preference: 'not_important',
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5A6A7A', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: 52,
            padding: '0 44px 0 14px',
            border: '1.5px solid #E2E8F0',
            borderRadius: 12,
            fontSize: 14,
            color: '#0B1E3D',
            background: '#fff',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Chevron icon */}
        <svg
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="#5A6A7A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({ isOpen, onClose }: Props) {
  const t = useTranslations('preferences_modal');
  const [prefs,   setPrefs]   = useState<CommutePreferences>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    userApi.getPreferences()
      .then((res: unknown) => {
        const data =
          (res as { data?: Partial<CommutePreferences> })?.data ??
          (res as Partial<CommutePreferences>);
        setPrefs((prev) => ({ ...prev, ...data }));
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => setLoading(false));
  }, [isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      await userApi.updatePreferences(prefs);
      toast.success(t('save_success'));
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('save_failed'));
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof CommutePreferences>(key: K, value: CommutePreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 300,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxHeight: '92vh',
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          zIndex: 301,
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#E2E8F0' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0B1E3D', margin: 0 }}>{t('title')}</h2>
            <p style={{ fontSize: 13, color: '#5A6A7A', margin: '4px 0 0' }}>{t('subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <X size={18} color="#5A6A7A" />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <Loader2 size={24} color="#00C2A8" style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              <SelectField
                label={t('gender_pref')}
                value={prefs.gender_preference}
                onChange={(v) => set('gender_preference', v as CommutePreferences['gender_preference'])}
                options={[
                  { value: 'any',    label: t('gender_any') },
                  { value: 'male',   label: t('gender_male_only') },
                  { value: 'female', label: t('gender_female_only') },
                ]}
              />

              <SelectField
                label={t('smoking')}
                value={String(prefs.smoking_allowed)}
                onChange={(v) => set('smoking_allowed', v === 'true')}
                options={[
                  { value: 'false', label: t('smoking_no') },
                  { value: 'true',  label: t('smoking_yes') },
                ]}
              />

              <SelectField
                label={t('interaction')}
                value={prefs.interaction_level}
                onChange={(v) => set('interaction_level', v as CommutePreferences['interaction_level'])}
                options={[
                  { value: 'quiet',     label: t('interaction_quiet') },
                  { value: 'normal',    label: t('interaction_normal') },
                  { value: 'talkative', label: t('interaction_talkative') },
                ]}
              />

              <SelectField
                label={t('children')}
                value={String(prefs.children_allowed)}
                onChange={(v) => set('children_allowed', v === 'true')}
                options={[
                  { value: 'true',  label: t('children_yes') },
                  { value: 'false', label: t('children_no') },
                ]}
              />

              <SelectField
                label={t('music')}
                value={prefs.music_preference}
                onChange={(v) => set('music_preference', v as CommutePreferences['music_preference'])}
                options={[
                  { value: 'no_music', label: t('music_none') },
                  { value: 'low',      label: t('music_low') },
                  { value: 'normal',   label: t('music_normal') },
                ]}
              />

              <SelectField
                label={t('seat')}
                value={prefs.seat_preference}
                onChange={(v) => set('seat_preference', v as CommutePreferences['seat_preference'])}
                options={[
                  { value: 'any',   label: t('seat_any') },
                  { value: 'front', label: t('seat_front') },
                  { value: 'back',  label: t('seat_back') },
                ]}
              />

              <SelectField
                label={t('walking')}
                value={prefs.walking_distance_preference}
                onChange={(v) => set('walking_distance_preference', v as CommutePreferences['walking_distance_preference'])}
                options={[
                  { value: 'no_walk',          label: t('walking_none') },
                  { value: 'less_than_5_min',  label: t('walking_5') },
                  { value: '5_to_10_min',      label: t('walking_10') },
                  { value: 'more_than_10_min', label: t('walking_more') },
                ]}
              />

              <SelectField
                label={t('ac')}
                value={prefs.air_conditioning_preference}
                onChange={(v) => set('air_conditioning_preference', v as CommutePreferences['air_conditioning_preference'])}
                options={[
                  { value: 'not_important',          label: t('ac_not_important') },
                  { value: 'preferred_if_available', label: t('ac_preferred') },
                  { value: 'mandatory',              label: t('ac_mandatory') },
                ]}
              />
            </>
          )}
        </div>

        {/* Save button */}
        <div style={{ padding: '12px 20px 32px', borderTop: '1px solid #F1F5F9' }}>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              width: '100%', height: 52, borderRadius: 14,
              background: '#0B1E3D', color: '#fff',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              border: 'none', cursor: saving || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: saving || loading ? 0.65 : 1,
            }}
          >
            {saving && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
            {t('save_btn')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}
