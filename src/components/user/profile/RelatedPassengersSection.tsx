'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getPassengers, createPassenger, updatePassenger, deletePassenger,
  getPassengerPreferences, savePassengerPreferences,
  type ApiPassenger, type PassengerPreferences,
} from '@/lib/api/passengers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function prefsTags(prefs: PassengerPreferences): string {
  const interaction = { quiet: 'Quiet', normal: 'Normal', talkative: 'Talkative' };
  const music = { no_music: 'No music', low: 'Low', normal: 'Normal' };
  const parts: string[] = [
    interaction[prefs.interaction_level] ?? prefs.interaction_level,
    music[prefs.music_preference]        ?? prefs.music_preference,
  ];
  if (prefs.smoking_allowed) parts.push('Smoking OK');
  return parts.join(' · ');
}

const DEFAULT_PREFS: Omit<PassengerPreferences, 'id' | 'passenger_id'> = {
  gender_preference:           'any',
  smoking_allowed:             false,
  interaction_level:           'normal',
  children_allowed:            true,
  music_preference:            'no_music',
  seat_preference:             'any',
  walking_distance_preference: 'no_walk',
  air_conditioning_preference: 'not_important',
};

// ─── Passenger Form Modal ─────────────────────────────────────────────────────


interface PassengerFormModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onSave:     (data: Omit<ApiPassenger, 'id'>) => void;
  initial?:   ApiPassenger;
  isLoading?: boolean;
}

function PassengerFormModal({
  isOpen,
  onClose,
  onSave,
  initial,
  isLoading,
}: PassengerFormModalProps) {
  const [form, setForm] = useState({
    name:     initial?.name     ?? '',
    phone:    initial?.phone    ?? '',
    age:      initial?.age      ?? ('' as unknown as number),
    gender:   initial?.gender   ?? ('male' as 'male' | 'female'),
    relation: initial?.relation ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        name:     initial?.name     ?? '',
        phone:    initial?.phone    ?? '',
        age:      initial?.age      ?? ('' as unknown as number),
        gender:   initial?.gender   ?? 'male',
        relation: initial?.relation ?? '',
      });
      setErrors({});
    }
  }, [isOpen, initial]);

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const age = Number(form.age);
    if (!form.age || age < 1 || age > 120) e.age = 'Enter a valid age (1–120)';
    if (form.phone && !/^01[0125]\d{8}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Egyptian phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      name:     form.name.trim(),
      phone:    form.phone    || '',
      age:      Number(form.age),
      gender:   form.gender,
      relation: form.relation || '',
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[600]"
        onClick={onClose}
      />

      {/* Panel — modal on desktop, bottom sheet on mobile */}
      <div className="fixed z-[700] bg-white md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:rounded-2xl md:shadow-2xl bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl md:bottom-auto max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#0B1E3D]">
            {initial ? 'Edit passenger' : 'Add a passenger'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#5A6A7A] hover:text-[#0B1E3D] rounded-lg hover:bg-[#F1F3F4]"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-1">
              Full name <span className="text-[#E74C3C]">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Mohamed Ashour"
              className={`w-full h-11 border rounded-lg px-3 text-sm focus:outline-none focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/20 ${errors.name ? 'border-[#E74C3C]' : 'border-[#E2E8F0]'}`}
            />
            {errors.name && <p className="text-xs text-[#E74C3C] mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-1">
              Phone number <span className="text-[#9AA0A6] font-normal ml-1">(optional)</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="010 1234 5678"
              inputMode="tel"
              className={`w-full h-11 border rounded-lg px-3 text-sm focus:outline-none focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/20 ${errors.phone ? 'border-[#E74C3C]' : 'border-[#E2E8F0]'}`}
            />
            {errors.phone && <p className="text-xs text-[#E74C3C] mt-1">{errors.phone}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-1">
              Age <span className="text-[#E74C3C]">*</span>
            </label>
            <input
              value={form.age || ''}
              onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
              placeholder="e.g. 22"
              type="number"
              min={1}
              max={120}
              inputMode="numeric"
              className={`w-full h-11 border rounded-lg px-3 text-sm focus:outline-none focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/20 ${errors.age ? 'border-[#E74C3C]' : 'border-[#E2E8F0]'}`}
            />
            {errors.age && <p className="text-xs text-[#E74C3C] mt-1">{errors.age}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-2">
              Gender <span className="text-[#E74C3C]">*</span>
            </label>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gender: g }))}
                  className={`flex-1 h-11 rounded-lg border-2 text-sm font-medium transition-colors capitalize ${form.gender === g ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D]' : 'border-[#E2E8F0] bg-white text-[#5A6A7A]'}`}
                >
                  {g === 'male' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </div>

          {/* Relation */}
          <div>
            <label className="block text-sm font-medium text-[#0B1E3D] mb-1">
              Relation <span className="text-[#9AA0A6] font-normal ml-1">(optional)</span>
            </label>
            <input
              value={form.relation}
              onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
              placeholder="e.g. Son, Daughter, Colleague, Friend"
              className="w-full h-11 border border-[#E2E8F0] rounded-lg px-3 text-sm focus:outline-none focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#5A6A7A] hover:bg-[#F8F9FA]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-11 bg-[#0B1E3D] text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save passenger'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Preferences Panel ────────────────────────────────────────────────────────

interface PrefsPanelProps {
  passenger: ApiPassenger;
  initial:   PassengerPreferences | null;
  onClose:   () => void;
  onSaved:   (prefs: PassengerPreferences) => void;
}

const PREF_FIELDS: Array<{
  key:     keyof Omit<PassengerPreferences, 'id' | 'passenger_id'>;
  label:   string;
  options: Array<{ value: string | boolean; label: string }>;
}> = [
  {
    key: 'gender_preference',
    label: 'Gender preference',
    options: [
      { value: 'any',    label: 'Any' },
      { value: 'male',   label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  {
    key: 'smoking_allowed',
    label: 'Smoking allowed',
    options: [
      { value: false, label: 'Smoking not allowed' },
      { value: true,  label: 'Smoking allowed' },
    ],
  },
  {
    key: 'interaction_level',
    label: 'Interaction level',
    options: [
      { value: 'quiet',     label: 'Quiet' },
      { value: 'normal',    label: 'Normal' },
      { value: 'talkative', label: 'Talkative' },
    ],
  },
  {
    key: 'children_allowed',
    label: 'Children allowed',
    options: [
      { value: false, label: 'Children not allowed' },
      { value: true,  label: 'Children allowed' },
    ],
  },
  {
    key: 'music_preference',
    label: 'Music preference',
    options: [
      { value: 'no_music', label: 'No music' },
      { value: 'low',      label: 'Low' },
      { value: 'normal',   label: 'Normal' },
    ],
  },
  {
    key: 'seat_preference',
    label: 'Seat preference',
    options: [
      { value: 'front', label: 'Front' },
      { value: 'back',  label: 'Back' },
      { value: 'any',   label: 'Any' },
    ],
  },
  {
    key: 'walking_distance_preference',
    label: 'Walking distance',
    options: [
      { value: 'no_walk',           label: 'No walk' },
      { value: 'less_than_5_min',   label: 'Less than 5 min' },
      { value: '5_to_10_min',       label: '5 to 10 min' },
      { value: 'more_than_10_min',  label: 'More than 10 min' },
    ],
  },
  {
    key: 'air_conditioning_preference',
    label: 'Air conditioning',
    options: [
      { value: 'not_important', label: 'Not important' },
      { value: 'preferred',     label: 'Preferred if available' },
      { value: 'mandatory',     label: 'Mandatory' },
    ],
  },
];

function PreferencesPanel({ passenger, initial, onClose, onSaved }: PrefsPanelProps) {
  const [form, setForm] = useState<Omit<PassengerPreferences, 'id' | 'passenger_id'>>(
    initial
      ? {
          gender_preference:           initial.gender_preference,
          smoking_allowed:             initial.smoking_allowed,
          interaction_level:           initial.interaction_level,
          children_allowed:            initial.children_allowed,
          music_preference:            initial.music_preference,
          seat_preference:             initial.seat_preference,
          walking_distance_preference: initial.walking_distance_preference,
          air_conditioning_preference: initial.air_conditioning_preference,
        }
      : DEFAULT_PREFS,
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await savePassengerPreferences(passenger.id, form);
      onSaved(saved);
      toast.success('Preferences saved');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[800] bg-white flex flex-col overflow-y-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E2E8F0] bg-white sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#0B1E3D] text-lg"
        >
          ←
        </button>
        <div>
          <p className="text-base font-bold text-[#0B1E3D] leading-tight">{passenger.name}</p>
          <p className="text-xs text-[#8A9AB0]">Choose ride preferences for this passenger.</p>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
        {PREF_FIELDS.map((field) => {
          const rawValue = form[field.key];
          const strValue = String(rawValue);
          return (
            <div
              key={field.key}
              style={{
                border: '1.5px solid #E2E8F0',
                borderRadius: 12,
                padding: '0 14px',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: -10,
                  left: 12,
                  background: '#fff',
                  padding: '0 4px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#8A9AB0',
                }}
              >
                {field.label}
              </span>
              <select
                value={strValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  const coerced = raw === 'true' ? true : raw === 'false' ? false : raw;
                  setForm((f) => ({ ...f, [field.key]: coerced }));
                }}
                style={{
                  width: '100%',
                  height: 52,
                  border: 'none',
                  outline: 'none',
                  fontSize: 15,
                  fontFamily: 'inherit',
                  color: '#0B1E3D',
                  background: 'transparent',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              >
                {field.options.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#8A9AB0',
                  fontSize: 12,
                }}
              >
                ▼
              </span>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="px-4 pb-8 pt-2 max-w-lg mx-auto w-full">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-[#0B1E3D] text-white rounded-2xl text-base font-semibold disabled:opacity-50"
          style={{ fontFamily: 'inherit' }}
        >
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}

// ─── Related Passengers Section ───────────────────────────────────────────────

interface RelatedPassengersSectionProps {
  /** When true, renders as a full mobile sub-page (no card wrapper) */
  isMobilePage?: boolean;
}

export default function RelatedPassengersSection({ isMobilePage }: RelatedPassengersSectionProps) {
  const [passengers,       setPassengers]       = useState<ApiPassenger[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [formOpen,         setFormOpen]         = useState(false);
  const [editing,          setEditing]          = useState<ApiPassenger | undefined>();
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [saving,           setSaving]           = useState(false);
  const [prefsPassenger,   setPrefsPassenger]   = useState<ApiPassenger | null>(null);
  const [prefsInitial,     setPrefsInitial]     = useState<PassengerPreferences | null>(null);
  const [prefsLoading,     setPrefsLoading]     = useState(false);
  const [prefsMap,         setPrefsMap]         = useState<Record<number, PassengerPreferences>>({});

  useEffect(() => {
    async function load() {
      try {
        const list = await getPassengers();
        setPassengers(list);
      } catch {
        toast.error('Failed to load passengers');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(data: Omit<ApiPassenger, 'id'>) {
    setSaving(true);
    try {
      if (editing) {
        const updated = await updatePassenger(editing.id, data);
        setPassengers((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
        toast.success('Passenger updated');
      } else {
        const created = await createPassenger(data);
        setPassengers((prev) => [...prev, created]);
        toast.success('Passenger added');
      }
      setFormOpen(false);
      setEditing(undefined);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deletePassenger(id);
      setPassengers((prev) => prev.filter((p) => p.id !== id));
      setConfirmingDelete(null);
      toast.success('Passenger removed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function openPrefs(passenger: ApiPassenger) {
    setPrefsLoading(true);
    setPrefsPassenger(passenger);
    try {
      const prefs = await getPassengerPreferences(passenger.id);
      setPrefsInitial(prefs);
    } catch {
      setPrefsInitial(null);
    } finally {
      setPrefsLoading(false);
    }
  }

  const content = (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#0B1E3D]">Your passengers</h3>
        <button
          onClick={() => { setEditing(undefined); setFormOpen(true); }}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#00C2A8] hover:text-[#009e88]"
        >
          <span className="text-lg leading-none">+</span> Add passenger
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#8A9AB0]">Loading…</div>
      ) : passengers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-4xl">👥</span>
          <p className="text-sm font-semibold text-[#0B1E3D]">No related passengers yet.</p>
          <p className="text-xs text-[#5A6A7A] max-w-[260px]">
            Add family members or colleagues who ride with you regularly.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {passengers.map((passenger) => {
            const initials = passenger.name
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0]?.toUpperCase() ?? '')
              .join('');
            const cachedPrefs = prefsMap[passenger.id];

            return (
              <div
                key={passenger.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-start gap-3"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#E0F7F4] text-[#00917D] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0B1E3D]">{passenger.name}</p>
                  <p className="text-xs text-[#5A6A7A] mt-0.5">
                    {passenger.relation ? `${passenger.relation} · ` : ''}
                    {passenger.age} yrs · {passenger.gender === 'male' ? 'Male' : 'Female'}
                  </p>
                  {cachedPrefs && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
                      </svg>
                      <span className="text-xs text-[#00917D] font-medium">{prefsTags(cachedPrefs)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {confirmingDelete === passenger.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#E74C3C]">Remove?</span>
                      <button
                        onClick={() => handleDelete(passenger.id)}
                        className="text-xs font-semibold text-[#E74C3C] hover:underline"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(null)}
                        className="text-xs text-[#5A6A7A] hover:underline"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Preferences button */}
                      <button
                        onClick={() => openPrefs(passenger)}
                        disabled={prefsLoading && prefsPassenger?.id === passenger.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EFF7F6] text-[#00C2A8] disabled:opacity-50"
                        aria-label="Edit preferences"
                        title="Ride preferences"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
                        </svg>
                      </button>
                      {/* Edit button */}
                      <button
                        onClick={() => { setEditing(passenger); setFormOpen(true); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F3F4] text-[#5A6A7A]"
                        aria-label="Edit passenger"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmingDelete(passenger.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FFEBEE] text-[#E74C3C]"
                        aria-label="Delete passenger"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      <PassengerFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(undefined); }}
        onSave={handleSave}
        initial={editing}
        isLoading={saving}
      />

      {/* Preferences panel — only when not still loading prefs */}
      {prefsPassenger && !prefsLoading && (
        <PreferencesPanel
          passenger={prefsPassenger}
          initial={prefsInitial}
          onClose={() => { setPrefsPassenger(null); setPrefsInitial(null); }}
          onSaved={(prefs) => setPrefsMap((prev) => ({ ...prev, [prefsPassenger.id]: prefs }))}
        />
      )}
    </>
  );

  if (isMobilePage) return <div className="px-5 py-6">{content}</div>;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
      {content}
    </div>
  );
}
