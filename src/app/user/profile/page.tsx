'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { mockUser } from '@/lib/mockUser';
import type { UserProfile } from '@/types/user';
import EditProfileModal from '@/components/user/profile/EditProfileModal';
import SavedLocationsSection from '@/components/user/profile/SavedLocationsSection';
import Link from 'next/link';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-EG', { month: 'short', year: 'numeric' });
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(mockUser);
  const [editOpen, setEditOpen] = useState(false);

  function handleSave(updates: Partial<UserProfile>) {
    setProfile((p) => ({ ...p, ...updates }));
    toast.success('Profile updated!');
  }
  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#0B1E3D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00C2A8',
            fontWeight: 800,
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: '#0B1E3D' }}>
                {profile.name}
              </h2>
              <div style={{ fontSize: 13, color: '#5A6A7A' }}>
                Member since {formatDate(profile.joined_at)}
              </div>
              <div style={{ fontSize: 13, color: '#5A6A7A', marginTop: 2 }}>
                Cairo, Egypt
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#F5A623', fontSize: 18 }}>{'\u2605'}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D' }}>
                  {profile.rating.toFixed(1)}
                </span>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                style={{
                  padding: '8px 16px',
                  border: '1.5px solid #00C2A8',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#00C2A8',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  minHeight: 40,
                }}
              >
                Edit profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0B1E3D', lineHeight: 1 }}>
            {profile.total_cycles}
          </div>
          <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 6 }}>Past Cycles</div>
        </div>
        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 800, color: '#00C2A8', lineHeight: 1 }}>
            {profile.active_cycles}
          </div>
          <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 6 }}>Active Cycles</div>
        </div>
        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: '#F5A623', lineHeight: 1 }}>
            {profile.wallet_balance}
          </div>
          <div style={{ fontSize: 10, color: '#5A6A7A', marginTop: 2 }}>EGP</div>
          <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 4 }}>Wallet</div>
          <Link
            href="/user/wallet"
            style={{
              fontSize: 12,
              color: '#00C2A8',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'block',
              marginTop: 4,
            }}
          >
            Add funds
          </Link>
        </div>
      </div>

      {/* Personal Information */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0B1E3D' }}>
          Personal Information
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['Name', profile.name],
            ['Email', profile.email],
            ['Phone', profile.phone],
            ['Gender', profile.gender === 'male' ? 'Male' : 'Female'],
            ['Date of birth', new Date(profile.date_of_birth).toLocaleDateString('en-EG', { day: 'numeric', month: 'long', year: 'numeric' })],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #F8F9FA',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, color: '#5A6A7A', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 14, color: '#0B1E3D', fontWeight: 600, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commute preferences */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0B1E3D' }}>
          Commute preferences
        </h3>

        {/* Gender preference */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#5A6A7A', marginBottom: 8, fontWeight: 500 }}>Gender preference</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['mixed', 'same'] as const).map((val) => (
              <button key={val} type="button"
                onClick={() => setProfile((p) => ({ ...p, gender_pref: val }))}
                style={{
                  padding: '7px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', border: '1.5px solid',
                  borderColor: profile.gender_pref === val ? '#00C2A8' : '#D1D5DB',
                  background: profile.gender_pref === val ? '#EFF7F6' : '#fff',
                  color: profile.gender_pref === val ? '#0B1E3D' : '#5A6A7A',
                  fontWeight: profile.gender_pref === val ? 600 : 400,
                }}
              >{val === 'mixed' ? 'Mixed' : 'Same gender'}</button>
            ))}
          </div>
        </div>

        {/* Walk to pickup */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#5A6A7A', marginBottom: 8, fontWeight: 500 }}>Walk to pickup</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              [0, 'No walk', 'Door pickup'],
              [5, '5 min', '~400 m · -8%'],
              [10, '10 min', '~800 m · -15%'],
            ] as const).map(([val, title, sub]) => (
              <button key={val} type="button"
                onClick={() => setProfile((p) => ({ ...p, walk_minutes: val }))}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', border: '1.5px solid', textAlign: 'left',
                  borderColor: profile.walk_minutes === val ? '#00C2A8' : '#D1D5DB',
                  background: profile.walk_minutes === val ? '#EFF7F6' : '#fff',
                }}
              >
                <div style={{ fontWeight: 600, color: '#0B1E3D' }}>{title}</div>
                <div style={{ fontSize: 11, color: '#5A6A7A', marginTop: 2 }}>{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred seat */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#5A6A7A', marginBottom: 4, fontWeight: 500 }}>Preferred seat</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>{"We'll try to match this, but it's not guaranteed."}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['front', 'back', 'any'] as const).map((val) => (
              <button key={val} type="button"
                onClick={() => setProfile((p) => ({ ...p, seat_preference: val }))}
                style={{
                  padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', border: '1.5px solid',
                  borderColor: profile.seat_preference === val ? '#00C2A8' : '#D1D5DB',
                  background: profile.seat_preference === val ? '#EFF7F6' : '#fff',
                  color: profile.seat_preference === val ? '#0B1E3D' : '#5A6A7A',
                  fontWeight: profile.seat_preference === val ? 600 : 400,
                  textTransform: 'capitalize',
                }}
              >{val}</button>
            ))}
          </div>
        </div>

        <button
          onClick={() => toast.success('Commute preferences saved!')}
          style={{
            padding: '10px 20px', borderRadius: 8, background: '#00C2A8',
            color: '#0B1E3D', fontWeight: 600, fontSize: 13, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Save preferences
        </button>
      </div>

      {/* Saved locations */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SavedLocationsSection
          locations={profile.saved_locations}
          onUpdate={(locs) => setProfile((p) => ({ ...p, saved_locations: locs }))}
        />
      </div>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSave={handleSave}
      />
    </div>
  );
}

