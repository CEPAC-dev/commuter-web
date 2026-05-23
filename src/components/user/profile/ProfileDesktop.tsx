'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Bookmark, Users, Sliders, Shield, LogOut, ChevronRight,
  Phone, MessageSquare, MapPin, Calendar, Pencil,
} from 'lucide-react';
import userApi from '@/lib/api/user';
import { useAuth } from '@/lib/auth/AuthContext';
import type { UserProfile } from '@/types/user';
import EditProfileModal from '@/components/user/profile/EditProfileModal';
import PreferencesModal from '@/components/user/profile/PreferencesModal';
import ChangePasswordModal from '@/components/user/profile/ChangePasswordModal';
import FavoritePlacesModal from '@/components/user/profile/FavoritePlacesModal';
import RelatedPassengersModal from '@/components/user/profile/RelatedPassengersModal';
import authApi from '@/lib/api/auth';

const menuItems = [
  { label: 'My Wallet', icon: Wallet, href: '/user/wallet' },
] as const;

function formatAddress(p: UserProfile) {
  return [p.building, p.street, p.sub_district, p.district, p.province, p.landmark]
    .filter(Boolean).join(', ') || '—';
}

function formatJoinDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const h12   = d.getHours() % 12 || 12;
  const mins  = String(d.getMinutes()).padStart(2, '0');
  const ampm  = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${day}/${month}/${year} · ${String(h12).padStart(2, '0')}:${mins} ${ampm}`;
}

export default function ProfileDesktop() {
  const router = useRouter();
  const { logout, updateName } = useAuth();
  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [editOpen,     setEditOpen]     = useState(false);
  const [prefOpen,     setPrefOpen]     = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [placesOpen,   setPlacesOpen]   = useState(false);
  const [passOpen,     setPassOpen]     = useState(false);

  useEffect(() => {
    userApi.getProfile()
      .then((p) => setProfile(p))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  function handleSave(updates: Partial<UserProfile>) {
    setProfile((p) => (p ? { ...p, ...updates } : null));
    if (updates.name) updateName(updates.name);
  }

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.replace('/');
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  /* ── Loading skeleton ────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ height: 34, width: 160, background: '#E2E8F0', borderRadius: 8, marginBottom: 6 }} />
        <div style={{ height: 18, width: 200, background: '#E2E8F0', borderRadius: 6, marginBottom: 28 }} />
        <div style={{ height: 260, background: '#E2E8F0', borderRadius: 24, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ height: 80, background: '#E2E8F0', borderRadius: 18 }} />)}
        </div>
        <div style={{ height: 58, background: '#E2E8F0', borderRadius: 18 }} />
      </div>
    );
  }

  if (!profile) return null;

  const infoRows: { icon: React.ReactNode; label: string; value: string; wide?: boolean }[] = [
    { icon: <Phone        size={20} color="#00C2A8" />, label: 'Mobile',       value: profile.phone             || '—' },
    { icon: <MessageSquare size={20} color="#00C2A8" />, label: 'WhatsApp',   value: profile.whatsapp_number   || '—' },
    { icon: <MapPin       size={20} color="#00C2A8" />, label: 'Address',      value: formatAddress(profile),       wide: true },
    { icon: <Calendar     size={20} color="#00C2A8" />, label: 'Member since', value: formatJoinDate(profile.joined_at), wide: true },
  ];

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 32px 60px', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0B1E3D', margin: 0, lineHeight: 1.2 }}>Profile</h1>
        <p style={{ fontSize: 14, color: '#8A9AB0', margin: '5px 0 0' }}>Your account and settings</p>
      </div>

      {/* ── Profile card ─────────────────────────────────────────── */}
      <div style={{ background: '#EFF7F6', border: '1px solid #C8E6E2', borderRadius: 24, padding: '28px 32px', marginBottom: 20 }}>

        {/* Avatar + name + edit button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#00C2A8', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 26, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0B1E3D', lineHeight: 1.2 }}>{profile.name || '—'}</div>
            <div style={{ fontSize: 14, color: '#5A6A7A', marginTop: 4 }}>{profile.email || '—'}</div>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: '#fff', border: '1.5px solid #00C2A8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Pencil size={20} color="#00C2A8" />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#C8E6E2', marginBottom: 24 }} />

        {/* Info rows — 2-col grid, Address & Member since span full width */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 40px', marginBottom: 24 }}>
          {infoRows.map(({ icon, label, value, wide }) => (
            <div
              key={label}
              style={{ display: 'flex', gap: 14, alignItems: 'flex-start', ...(wide ? { gridColumn: 'span 2' } : {}) }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 12, color: '#6B82A0', fontWeight: 500, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D', lineHeight: 1.4 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#C8E6E2', marginBottom: 20 }} />

        {/* My preferences */}
        <button
          onClick={() => setPrefOpen(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', border: '1px solid #C8E6E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sliders size={22} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D', lineHeight: 1.2 }}>My preferences</div>
            <div style={{ fontSize: 13, color: '#5A6A7A', marginTop: 3 }}>Set your ride preferences to help drivers match your style.</div>
          </div>
          <ChevronRight size={20} color="#94A3B8" />
        </button>
      </div>

      {/* ── Menu items — 2-col grid ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {menuItems.map(({ label, icon: Icon, href }) => (
          <a
            key={href}
            href={href}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#fff', textDecoration: 'none' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={24} color="#00C2A8" strokeWidth={1.8} />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>{label}</span>
            <ChevronRight size={20} color="#94A3B8" />
          </a>
        ))}

        {/* Favorite Places */}
        <button
          onClick={() => setPlacesOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bookmark size={24} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>Favorite Places</span>
          <ChevronRight size={20} color="#94A3B8" />
        </button>

        {/* Related Passengers */}
        <button
          onClick={() => setPassOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={24} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>Related Passengers</span>
          <ChevronRight size={20} color="#94A3B8" />
        </button>

        {/* Security */}
        <button
          onClick={() => setChangePwOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 18, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={24} color="#00C2A8" strokeWidth={1.8} />
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>Security</span>
          <ChevronRight size={20} color="#94A3B8" />
        </button>
      </div>

      {/* ── Log out ───────────────────────────────────────────────── */}
      <button
        onClick={handleLogout}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 18, border: '1.5px solid #EF4444', background: '#fff', color: '#EF4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <LogOut size={20} color="#EF4444" />
        Log out
      </button>

      {/* ── Modals ───────────────────────────────────────────────── */}
      <EditProfileModal
        profile={profile}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
      <PreferencesModal isOpen={prefOpen} onClose={() => setPrefOpen(false)} />
      <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
      <FavoritePlacesModal isOpen={placesOpen} onClose={() => setPlacesOpen(false)} />
      <RelatedPassengersModal isOpen={passOpen} onClose={() => setPassOpen(false)} />
    </div>
  );
}
