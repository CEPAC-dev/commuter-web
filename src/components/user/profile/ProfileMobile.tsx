'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Bookmark, Users, Sliders, Shield, LogOut, ChevronRight,
  Phone, MessageSquare, MapPin, Pencil, Camera,
} from 'lucide-react';
import userApi from '@/lib/api/user';
import type { UserProfile } from '@/types/user';
import EditProfileModal from './EditProfileModal';
import PreferencesModal from './PreferencesModal';
import FavoritePlacesModal from './FavoritePlacesModal';
import RelatedPassengersModal from './RelatedPassengersModal';
import { useAuth } from '@/lib/auth/AuthContext';
import authApi from '@/lib/api/auth';
import { useTranslations } from 'next-intl';

const menuItems = [
  { labelKey: 'menu_wallet', icon: Wallet, href: '/user/wallet' },
  { labelKey: 'menu_security',  icon: Shield, href: '/user/profile/security' },
] as const;

function formatAddress(p: UserProfile) {
  return [p.building, p.street, p.sub_district, p.district, p.province, p.landmark]
    .filter(Boolean)
    .join(', ') || '—';
}

const PROFILE_DEFAULTS: UserProfile = {
  id: '', name: '', email: '', phone: '', whatsapp_number: '',
  gender: '', date_of_birth: '', avatar_url: null,
  joined_at: new Date().toISOString(), rating: 0,
  total_cycles: 0, active_cycles: 0, wallet_balance: 0,
  saved_locations: [], gender_pref: 'mixed', walk_minutes: 0,
  seat_preference: 'any', province: '', district: '',
  sub_district: '', building: '', street: '', landmark: '',
};

export default function ProfileMobile() {
  const tp = useTranslations('profile_mobile');
  const router    = useRouter();
  const { logout, updateName, profilePhoto, updateProfilePhoto } = useAuth();
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [prefOpen, setPrefOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [passOpen,   setPassOpen]   = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) { alert(tp('photo_size_error')); return; }
    // Upload to API
    const formData = new FormData();
    formData.append('profile_image', file);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('commuter_token') ?? '' : ''}`,
        Accept: 'application/json',
      },
      body: formData,
    }).catch(() => { /* ignore upload errors silently */ });
    // Preview locally
    const reader = new FileReader();
    reader.onload = () => updateProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  useEffect(() => {
    userApi.getProfile()
      .then((profile) => setProfile(profile))
      .catch(() => setProfile(PROFILE_DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.replace('/');
  }

  function handleSave(updates: Partial<UserProfile>) {
    setProfile((p) => p ? { ...p, ...updates } : null);
    if (updates.name) updateName(updates.name);
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#00C2A8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const infoRows = [
    { icon: <Phone      size={20} color="#00C2A8" />, label: tp('label_mobile'),   value: profile?.phone           || '—' },
    { icon: <MessageSquare size={20} color="#00C2A8" />, label: tp('label_whatsapp'), value: profile?.whatsapp_number  || '—' },
    { icon: <MapPin     size={20} color="#00C2A8" />, label: tp('label_address'),  value: profile ? formatAddress(profile) : '—' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', maxWidth: 480, margin: '0 auto', paddingBottom: 100, paddingTop: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Title */}
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0B1E3D', margin: '0 0 18px 0', padding: '0 20px' }}>
        {tp('title')}
      </h1>

      {/* Profile card */}
      <div style={{ margin: '0 16px 20px', background: '#EFF7F6', borderRadius: 20, padding: '20px 18px', border: '1px solid #C8E6E2' }}>

        {/* Avatar + name + email + edit button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            onClick={() => photoInputRef.current?.click()}
            title={tp('photo_title')}
            style={{ width: 56, height: 56, borderRadius: '50%', background: '#00C2A8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EFF7F6', fontWeight: 800, fontSize: 20, flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          >
            {profilePhoto
              ? <img src={profilePhoto} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={11} color="#fff" />
            </div>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0B1E3D', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || '—'}
            </div>
            <div style={{ fontSize: 13, color: '#5A6A7A', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.email || '—'}
            </div>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: '1.5px solid #00C2A8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <Pencil size={17} color="#00C2A8" />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#C8E6E2', margin: '0 0 16px' }} />

        {/* Info rows */}
        {infoRows.map(({ icon, label, value }, i) => (
          <div
            key={label}
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', ...(i < infoRows.length - 1 ? { marginBottom: 14 } : {}) }}
          >
            <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 12, color: '#6B82A0', fontWeight: 500, marginBottom: 1 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D', lineHeight: 1.4 }}>{value}</div>
            </div>
          </div>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: '#C8E6E2', margin: '16px 0' }} />

        {/* My preferences */}
        <button
          onClick={() => setPrefOpen(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #C8E6E2' }}>
            <Sliders size={18} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D', lineHeight: 1.2 }}>{tp('prefs_title')}</div>
            <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 2 }}>{tp('prefs_subtitle')}</div>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </button>
      </div>

      {/* Menu items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px', marginBottom: 24 }}>
        {menuItems.map(({ labelKey, icon: Icon, href }) => (
          <a
            key={href}
            href={href}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#fff', textDecoration: 'none' }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color="#00C2A8" strokeWidth={1.8} />
            </div>
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#0B1E3D' }}>{tp(labelKey)}</span>
            <ChevronRight size={20} color="#94A3B8" />
          </a>
        ))}

        {/* Favorite Places */}
        <button
          onClick={() => setPlacesOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bookmark size={22} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#0B1E3D' }}>{tp('favorite_places')}</span>
          <ChevronRight size={20} color="#94A3B8" />
        </button>

        {/* Related Passengers */}
        <button
          onClick={() => setPassOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#0B1E3D' }}>{tp('related_passengers')}</span>
          <ChevronRight size={20} color="#94A3B8" />
        </button>
      </div>

      {/* Log out */}
      <div style={{ padding: '0 16px' }}>
        <button
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 18, border: '1.5px solid #EF4444', background: '#fff', color: '#EF4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <LogOut size={20} color="#EF4444" />
          {tp('log_out')}
        </button>
      </div>

      <EditProfileModal
        profile={profile}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <PreferencesModal isOpen={prefOpen} onClose={() => setPrefOpen(false)} />
      <FavoritePlacesModal isOpen={placesOpen} onClose={() => setPlacesOpen(false)} />
      <RelatedPassengersModal isOpen={passOpen} onClose={() => setPassOpen(false)} />
    </div>
  );
}
