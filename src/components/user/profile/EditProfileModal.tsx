'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/types/user';
import BottomSheet from '@/components/shared/BottomSheet';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  useEffect(() => {
    if (profile && isOpen) {
      setName(profile.name);
      setPhone(profile.phone);
      setGender(profile.gender);
    }
  }, [profile, isOpen]);

  function handleSave() {
    onSave({ name, phone, gender });
    onClose();
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 6 }}>
          Full name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: '#0B1E3D', outline: 'none', minHeight: 44 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; e.currentTarget.style.background = '#EFF7F6'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 6 }}>
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: '#0B1E3D', outline: 'none', minHeight: 44 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; e.currentTarget.style.background = '#EFF7F6'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
          Gender
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              style={{
                flex: 1,
                padding: '10px',
                border: `1.5px solid ${gender === g ? '#00C2A8' : '#E2E8F0'}`,
                borderRadius: 8,
                background: gender === g ? '#00C2A8' : '#fff',
                color: gender === g ? '#0B1E3D' : '#5A6A7A',
                fontWeight: gender === g ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: 44,
              }}
            >
              {g === 'male' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 12px', background: '#F8F9FA', borderRadius: 8, fontSize: 12, color: '#5A6A7A' }}>
        Email and date of birth cannot be changed after registration.
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '14px',
          border: 'none',
          borderRadius: 10,
          background: '#00C2A8',
          color: '#0B1E3D',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          fontFamily: 'inherit',
          minHeight: 48,
        }}
      >
        Save changes
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
                width: 440, maxWidth: '90vw', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0B1E3D' }}>Edit profile</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#5A6A7A', minWidth: 44, minHeight: 44, fontSize: 18 }}>✕</button>
              </div>
              {content}
            </div>
          </>
        )}
      </div>
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Edit profile">
          {content}
        </BottomSheet>
      </div>
    </>
  );
}
