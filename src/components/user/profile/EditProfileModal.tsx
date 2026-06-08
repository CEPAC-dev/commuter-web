'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { UserProfile } from '@/types/user';
import BottomSheet from '@/components/shared/BottomSheet';
import userApi from '@/lib/api/user';
import { useTranslations } from 'next-intl';

type Tab = 'info' | 'address';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#0B1E3D',
  outline: 'none',
  minHeight: 44,
  background: '#fff',
  boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, type = 'text', placeholder }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; e.currentTarget.style.background = '#EFF7F6'; }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; }}
    />
  );
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => void;
}

export default function EditProfileModal({ isOpen, onClose, profile, onSave }: EditProfileModalProps) {
  const te = useTranslations('edit_profile');
  const [tab, setTab] = useState<Tab>('info');

  // Info tab fields
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [whatsapp,  setWhatsapp]  = useState('');
  const [gender,    setGender]    = useState('');
  const [birthdate, setBirthdate] = useState('');

  // Address tab fields
  const [province,    setProvince]    = useState('');
  const [district,    setDistrict]    = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [building,    setBuilding]    = useState('');
  const [street,      setStreet]      = useState('');
  const [landmark,    setLandmark]    = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && isOpen) {
      setName(profile.name ?? '');
      setEmail(profile.email ?? '');
      setPhone(profile.phone ?? '');
      setWhatsapp(profile.whatsapp_number ?? '');
      setGender(profile.gender ?? '');
      setBirthdate(profile.date_of_birth ?? '');
      setProvince(profile.province ?? '');
      setDistrict(profile.district ?? '');
      setSubDistrict(profile.sub_district ?? '');
      setBuilding(profile.building ?? '');
      setStreet(profile.street ?? '');
      setLandmark(profile.landmark ?? '');
      setTab('info');
    }
  }, [profile, isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      await userApi.updateProfile({
        name,
        email,
        phone_number:    phone,
        whatsapp_number: whatsapp,
        gender:          gender || undefined,
        birthdate:       birthdate || undefined,
        province,
        district,
        sub_district:    subDistrict,
        building,
        street,
        landmark,
      });
      onSave({
        name,
        email,
        phone,
        whatsapp_number: whatsapp,
        gender:          gender as UserProfile['gender'],
        date_of_birth:   birthdate,
        province,
        district,
        sub_district:    subDistrict,
        building,
        street,
        landmark,
      });
      toast.success(t('save_success'));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('save_failed'));
    } finally {
      setSaving(false);
    }
  }

  const tabBar = (
    <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 20 }}>
      {(['info', 'address'] as Tab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          style={{
            flex: 1,
            padding: '8px 0',
            border: 'none',
            borderRadius: 7,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
            background: tab === t ? '#fff' : 'transparent',
            color: tab === t ? '#0B1E3D' : '#5A6A7A',
            boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          {t === 'info' ? te('tab_info') : te('tab_address')}
        </button>
      ))}
    </div>
  );

  const infoTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label={te('name_label')}>
        <StyledInput value={name} onChange={setName} placeholder={te('name_placeholder')} />
      </Field>
      <Field label={te('email_label')}>
        <StyledInput value={email} onChange={setEmail} type="email" placeholder={te('email_placeholder')} />
      </Field>
      <Field label={te('phone_label')}>
        <StyledInput value={phone} onChange={setPhone} type="tel" placeholder={te('phone_placeholder')} />
      </Field>
      <Field label={te('whatsapp_label')}>
        <StyledInput value={whatsapp} onChange={setWhatsapp} type="tel" placeholder={te('phone_placeholder')} />
      </Field>
      <Field label={te('gender_label')}>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; e.currentTarget.style.background = '#EFF7F6'; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; }}
        >
          <option value="">{te('gender_placeholder')}</option>
          <option value="male">{te('gender_male')}</option>
          <option value="female">{te('gender_female')}</option>
        </select>
      </Field>
      <Field label={te('dob_label')}>
        <StyledInput value={birthdate} onChange={setBirthdate} type="date" />
      </Field>
    </div>
  );

  const addressTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label={te('province_label')}>
        <StyledInput value={province} onChange={setProvince} placeholder={te('province_placeholder')} />
      </Field>
      <Field label={te('district_label')}>
        <StyledInput value={district} onChange={setDistrict} placeholder={te('district_placeholder')} />
      </Field>
      <Field label={te('subdistrict_label')}>
        <StyledInput value={subDistrict} onChange={setSubDistrict} placeholder={te('subdistrict_placeholder')} />
      </Field>
      <Field label={te('building_label')}>
        <StyledInput value={building} onChange={setBuilding} placeholder={te('building_placeholder')} />
      </Field>
      <Field label={te('street_label')}>
        <StyledInput value={street} onChange={setStreet} placeholder={te('street_placeholder')} />
      </Field>
      <Field label={te('landmark_label')}>
        <StyledInput value={landmark} onChange={setLandmark} placeholder={te('landmark_placeholder')} />
      </Field>
    </div>
  );

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tabBar}
      {tab === 'info' ? infoTab : addressTab}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          marginTop: 20,
          padding: '14px',
          border: 'none',
          borderRadius: 10,
          background: saving ? '#7DDDD5' : '#00C2A8',
          color: '#0B1E3D',
          fontWeight: 700,
          fontSize: 15,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          minHeight: 48,
        }}
      >
        {saving ? te('saving_btn') : te('save_btn')}
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        {isOpen && (
          <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
            <div
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 201, background: '#fff', borderRadius: 16, padding: 28,
                width: 480, maxWidth: '90vw', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0B1E3D' }}>{te('title')}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#5A6A7A', minWidth: 44, minHeight: 44, fontSize: 18 }}>✕</button>
              </div>
              {content}
            </div>
          </>
        )}
      </div>
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} title={te('title')}>
          {content}
        </BottomSheet>
      </div>
    </>
  );
}
