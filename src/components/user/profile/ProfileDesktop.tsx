'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getName } from '@/lib/auth';
import { getLastBalance } from '@/lib/api/wallet';
import type { UserProfile } from '@/types/user';
import EditProfileModal from '@/components/user/profile/EditProfileModal';
import SavedLocationsSection from '@/components/user/profile/SavedLocationsSection';
import ChangePasswordModal from '@/components/user/profile/ChangePasswordModal';
import RelatedPassengersSection from '@/components/user/profile/RelatedPassengersSection';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-EG', { month: 'short', year: 'numeric' });
}

function buildDefaultProfile(name: string, email: string): UserProfile {
  return {
    id: '',
    name,
    email,
    phone: '',
    whatsapp_number: '',
    gender: 'male',
    date_of_birth: '',
    avatar_url: null,
    joined_at: new Date().toISOString(),
    rating: 0,
    total_cycles: 0,
    active_cycles: 0,
    wallet_balance: 0,
    gender_pref: 'mixed',
    walk_minutes: 0,
    seat_preference: 'any',
    saved_locations: [],
    province: '',
    district: '',
    sub_district: '',
    building: '',
    street: '',
    landmark: '',
  };
}

export default function ProfileDesktop() {
  const [profile, setProfile]       = useState<UserProfile | null>(null);
  const [editOpen, setEditOpen]     = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const loadProfile = useCallback(() => {
    const name  = getName() ?? '';
    const email = typeof window !== 'undefined'
      ? (localStorage.getItem('commuter_email') ?? '')
      : '';
    if (name) {
      setProfile((prev) =>
        prev
          ? { ...prev, name, email }
          : buildDefaultProfile(name, email)
      );
    }
  }, []);

  useEffect(() => {
    loadProfile();
    // Fetch wallet balance
    async function loadWallet() {
      try {
        const res = await getLastBalance();
        setProfile((prev) =>
          prev ? { ...prev, wallet_balance: res.data.last_balance } : null
        );
      } catch (err) {
        console.error('Failed to load wallet balance:', err);
      }
    }
    loadWallet();
  }, [loadProfile]);

  function handleSave(updates: Partial<UserProfile>) {
    setProfile((p) => (p ? { ...p, ...updates } : null));
    toast.success('Profile updated!');
  }

  if (!profile) return null;

  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const personalFields: [string, string][] = [
    ['Name',  profile.name],
    ['Email', profile.email],
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-5">

      {/* Hero card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-start gap-4 flex-wrap">
        <div className="w-[72px] h-[72px] rounded-full bg-[#0B1E3D] flex items-center justify-center text-[#00C2A8] font-extrabold text-2xl flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-[#0B1E3D] mb-0.5">{profile.name}</h2>
              <p className="text-sm text-[#5A6A7A]">Member since {formatDate(profile.joined_at)}</p>
              <p className="text-sm text-[#5A6A7A]">Cairo, Egypt</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[#F5A623] text-lg">★</span>
                <span className="text-base font-bold text-[#0B1E3D]">{profile.rating.toFixed(1)}</span>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="px-4 py-2 border border-[#00C2A8] rounded-lg text-[#00C2A8] text-sm font-semibold hover:bg-[#EFF7F6] transition-colors"
              >
                Edit profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold text-[#0B1E3D] leading-none">{profile.total_cycles}</div>
          <div className="text-xs text-[#5A6A7A] mt-2">Past Cycles</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold text-[#00C2A8] leading-none">{profile.active_cycles}</div>
          <div className="text-xs text-[#5A6A7A] mt-2">Active Cycles</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold text-[#F5A623] leading-none">{profile.wallet_balance}</div>
          <div className="text-[10px] text-[#5A6A7A] mt-1">EGP</div>
          <div className="text-xs text-[#5A6A7A] mt-1">Wallet</div>
          <Link href="/user/wallet" className="text-xs text-[#00C2A8] font-semibold block mt-1 no-underline hover:underline">
            Add funds
          </Link>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <h3 className="text-base font-bold text-[#0B1E3D] mb-4">Personal Information</h3>
        <div className="flex flex-col">
          {personalFields.map(([label, value], i) => (
            <div
              key={label}
              className={`flex justify-between items-center py-3 gap-3 ${i < personalFields.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
            >
              <span className="text-sm text-[#5A6A7A] font-medium flex-shrink-0">{label}</span>
              <span className={`text-sm font-semibold text-right ${value ? 'text-[#0B1E3D]' : 'text-[#CBD5E1]'}`}>
                {value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Related Passengers */}
      <RelatedPassengersSection />

      {/* Commute Preferences */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <h3 className="text-base font-bold text-[#0B1E3D] mb-5">Commute Preferences</h3>

        {/* Gender preference */}
        <div className="mb-5">
          <p className="text-sm text-[#5A6A7A] font-medium mb-2">Gender preference</p>
          <div className="flex gap-2">
            {(['mixed', 'same'] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setProfile((p) => (p ? { ...p, gender_pref: val } : null))}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${profile.gender_pref === val ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D] font-semibold' : 'border-[#D1D5DB] bg-white text-[#5A6A7A]'}`}
              >
                {val === 'mixed' ? 'Mixed' : 'Same gender'}
              </button>
            ))}
          </div>
        </div>

        {/* Walk to pickup */}
        <div className="mb-5">
          <p className="text-sm text-[#5A6A7A] font-medium mb-2">Walk to pickup</p>
          <div className="flex gap-2 flex-wrap">
            {([
              [0, 'No walk', 'Door pickup'],
              [5, '5 min', '~400 m · -8%'],
              [10, '10 min', '~800 m · -15%'],
            ] as const).map(([val, title, sub]) => (
              <button
                key={val}
                type="button"
                onClick={() => setProfile((p) => (p ? { ...p, walk_minutes: val } : null))}
                className={`px-3 py-2 rounded-xl text-left border transition-colors text-sm ${profile.walk_minutes === val ? 'border-[#00C2A8] bg-[#EFF7F6]' : 'border-[#D1D5DB] bg-white'}`}
              >
                <div className="font-semibold text-[#0B1E3D]">{title}</div>
                <div className="text-[11px] text-[#5A6A7A] mt-0.5">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred seat */}
        <div className="mb-5">
          <p className="text-sm text-[#5A6A7A] font-medium mb-1">Preferred seat</p>
          <p className="text-xs text-[#94A3B8] mb-2">{"We'll try to match this, but it's not guaranteed."}</p>
          <div className="flex gap-2">
            {(['front', 'back', 'any'] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setProfile((p) => (p ? { ...p, seat_preference: val } : null))}
                className={`px-4 py-1.5 rounded-full text-sm border capitalize transition-colors ${profile.seat_preference === val ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D] font-semibold' : 'border-[#D1D5DB] bg-white text-[#5A6A7A]'}`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => toast.success('Commute preferences saved!')}
          className="px-5 py-2.5 rounded-lg bg-[#00C2A8] text-[#0B1E3D] font-semibold text-sm hover:bg-[#00AD98] transition-colors"
        >
          Save preferences
        </button>
      </div>

      {/* Favourite Places */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <SavedLocationsSection />
      </div>

      {/* Security */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <h3 className="text-base font-bold text-[#0B1E3D] mb-4">Security</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#0B1E3D]">Password</p>
            <p className="text-xs text-[#5A6A7A] mt-0.5">Change your account password</p>
          </div>
          <button
            onClick={() => setChangePwOpen(true)}
            className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#0B1E3D] hover:bg-[#F8F9FA] transition-colors flex-shrink-0"
          >
            Change
          </button>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        profile={profile}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
      <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  );
}
