'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import userApi from '@/lib/api/user';
import type { CommutePreferences } from '@/types/user';
import { useTranslations } from 'next-intl';

const DEFAULTS: CommutePreferences = {
  gender_preference:            'any',
  smoking_allowed:              false,
  interaction_level:            'normal',
  children_allowed:             true,
  music_preference:             'normal',
  seat_preference:              'any',
  walking_distance_preference:  'no_walk',
  air_conditioning_preference:  'not_important',
};

// ── Small primitives ──────────────────────────────────────────────────────────

function PrefRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-[#5A6A7A] mb-2">{label}</p>
      {children}
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'px-4 py-1.5 rounded-full text-sm border transition-colors',
            value === opt.value
              ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D] font-semibold'
              : 'border-[#D1D5DB] bg-white text-[#5A6A7A]',
          ].join(' ')}
          style={{ fontFamily: 'inherit' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface Props {
  /** true = desktop inline button; false = full-width mobile button */
  compact?: boolean;
}

export default function CommutePreferencesForm({ compact = false }: Props) {
  const tc = useTranslations('commute_prefs');
  const tp = useTranslations('preferences_modal');
  const [prefs,   setPrefs]   = useState<CommutePreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    userApi.getPreferences()
      .then((res: unknown) => {
        const data =
          (res as { data?: Partial<CommutePreferences> })?.data ??
          (res as Partial<CommutePreferences>);
        setPrefs((prev) => ({ ...prev, ...data }));
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await userApi.updatePreferences(prefs);
      toast.success(tc('save_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tc('save_failed'));
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof CommutePreferences>(key: K, value: CommutePreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  if (loading) {
    return <p className="py-4 text-center text-sm text-[#5A6A7A]">{tc('loading')}</p>;
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Gender preference */}
      <PrefRow label={tc('gender_pref')}>
        <Pills
          options={[
            { value: 'any',    label: tc('any') },
            { value: 'male',   label: tc('male_only') },
            { value: 'female', label: tc('female_only') },
          ]}
          value={prefs.gender_preference}
          onChange={(v) => set('gender_preference', v as CommutePreferences['gender_preference'])}
        />
      </PrefRow>

      {/* Smoking */}
      <PrefRow label={tc('smoking')}>
        <Pills
          options={[
            { value: 'false', label: tc('not_allowed') },
            { value: 'true',  label: tc('allowed') },
          ]}
          value={String(prefs.smoking_allowed)}
          onChange={(v) => set('smoking_allowed', v === 'true')}
        />
      </PrefRow>

      {/* Interaction level */}
      <PrefRow label={tc('interaction')}>
        <Pills
          options={[
            { value: 'quiet',     label: tc('quiet') },
            { value: 'normal',    label: tc('normal') },
            { value: 'talkative', label: tc('talkative') },
          ]}
          value={prefs.interaction_level}
          onChange={(v) => set('interaction_level', v as CommutePreferences['interaction_level'])}
        />
      </PrefRow>

      {/* Children allowed */}
      <PrefRow label={tp('children')}>
        <Pills
          options={[
            { value: 'true',  label: tp('children_yes') },
            { value: 'false', label: tp('children_no') },
          ]}
          value={String(prefs.children_allowed)}
          onChange={(v) => set('children_allowed', v === 'true')}
        />
      </PrefRow>

      {/* Music preference */}
      <PrefRow label={tp('music')}>
        <Pills
          options={[
            { value: 'no_music', label: tp('music_none') },
            { value: 'low',      label: tp('music_low') },
            { value: 'normal',   label: tp('music_normal') },
          ]}
          value={prefs.music_preference}
          onChange={(v) => set('music_preference', v as CommutePreferences['music_preference'])}
        />
      </PrefRow>

      {/* Seat preference */}
      <PrefRow label={tp('seat')}>
        <Pills
          options={[
            { value: 'front', label: tp('seat_front') },
            { value: 'back',  label: tp('seat_back') },
            { value: 'any',   label: tp('seat_any') },
          ]}
          value={prefs.seat_preference}
          onChange={(v) => set('seat_preference', v as CommutePreferences['seat_preference'])}
        />
      </PrefRow>

      {/* Walking distance */}
      <PrefRow label={tp('walking')}>
        <Pills
          options={[
            { value: 'no_walk',          label: tp('walking_none') },
            { value: 'less_than_5_min',  label: tp('walking_5') },
            { value: '5_to_10_min',      label: tp('walking_10') },
            { value: 'more_than_10_min', label: tp('walking_more') },
          ]}
          value={prefs.walking_distance_preference}
          onChange={(v) => set('walking_distance_preference', v as CommutePreferences['walking_distance_preference'])}
        />
      </PrefRow>

      {/* Air conditioning */}
      <PrefRow label={tp('ac')}>
        <Pills
          options={[
            { value: 'not_important',         label: tp('ac_not_important') },
            { value: 'preferred_if_available', label: tp('ac_preferred') },
            { value: 'mandatory',             label: tp('ac_mandatory') },
          ]}
          value={prefs.air_conditioning_preference}
          onChange={(v) => set('air_conditioning_preference', v as CommutePreferences['air_conditioning_preference'])}
        />
      </PrefRow>

      <button
        onClick={handleSave}
        disabled={saving}
        className={[
          compact
            ? 'px-5 py-2.5 text-sm rounded-lg'
            : 'w-full py-3.5 text-base rounded-2xl',
          'bg-[#00C2A8] text-[#0B1E3D] font-semibold',
          'hover:bg-[#00AD98] transition-colors disabled:opacity-60',
        ].join(' ')}
        style={{ fontFamily: 'inherit' }}
      >
        {saving ? tc('loading') : tc('save')}
      </button>
    </div>
  );
}
