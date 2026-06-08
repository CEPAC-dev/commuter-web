'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Bookmark, Users, Sliders, Shield, LogOut, ChevronRight,
  Phone, MessageSquare, MapPin, Pencil, Camera,
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
import { useTranslations } from 'next-intl';

function formatAddress(p: UserProfile) {
  return [p.building, p.street, p.sub_district, p.district, p.province, p.landmark]
    .filter(Boolean).join(', ') || 'â€”';
}

function formatJoinDate(iso: string) {
  if (!iso) return 'â€”';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'â€”';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day} / ${month} / ${year}`;
}

/* â”€â”€ Tile card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Tile({
  icon: Icon,
  label,
  sub,
  onClick,
  href,
  accent = '#00C2A8',
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  onClick?: () => void;
  href?: string;
  accent?: string;
}) {
  const content = (
    <>
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: `${accent}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={accent} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.1px' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
      <ChevronRight size={16} color="#CBD5E1" />
    </>
  );

  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '18px 20px', borderRadius: 16, width: '100%',
    border: '1.5px solid #F1F5F9', background: '#FAFAFA',
    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', textDecoration: 'none',
    transition: 'border-color .15s, background .15s, box-shadow .15s',
    boxSizing: 'border-box',
  };

  const hover = (el: HTMLElement) => { el.style.borderColor = `${accent}40`; el.style.background = '#fff'; el.style.boxShadow = `0 4px 18px ${accent}18`; };
  const leave = (el: HTMLElement) => { el.style.borderColor = '#F1F5F9'; el.style.background = '#FAFAFA'; el.style.boxShadow = 'none'; };

  if (href) return <a href={href} style={base} onMouseEnter={e => hover(e.currentTarget as HTMLElement)} onMouseLeave={e => leave(e.currentTarget as HTMLElement)}>{content}</a>;
  return <button onClick={onClick} style={base} onMouseEnter={e => hover(e.currentTarget as HTMLElement)} onMouseLeave={e => leave(e.currentTarget as HTMLElement)}>{content}</button>;
}

export default function ProfileDesktop() {
  const tp = useTranslations('profile_mobile');
  const tc = useTranslations('common');
  const router = useRouter();
  const { logout, updateName, profilePhoto, updateProfilePhoto } = useAuth();
  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [editOpen,     setEditOpen]     = useState(false);
  const [prefOpen,     setPrefOpen]     = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [placesOpen,   setPlacesOpen]   = useState(false);
  const [passOpen,     setPassOpen]     = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE) { alert(tp('photo_size_error')); return; }
    const reader = new FileReader();
    reader.onload = () => updateProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

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

  /* â”€â”€ Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (loading) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '48px 40px 80px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ height: 220, background: '#E2E8F0', borderRadius: 24, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 72, background: '#E2E8F0', borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '48px 40px 80px', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* â•â• HERO CARD â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{
        background: '#0B1E3D', borderRadius: 24, padding: '36px 40px 32px',
        position: 'relative', overflow: 'hidden', marginBottom: 14,
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -70, right: -50, width: 220, height: 220, borderRadius: '50%', background: '#00C2A8', opacity: 0.07, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 120, width: 160, height: 160, borderRadius: '50%', background: '#00C2A8', opacity: 0.045, pointerEvents: 'none' }} />

        {/* Top row â€” avatar + identity + edit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, position: 'relative', marginBottom: 28 }}>
          {/* Avatar */}
          <div
            onClick={() => photoInputRef.current?.click()}
            title={tp('photo_title')}
            style={{
              width: 84, height: 84, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #00C2A8 0%, #007A6A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
              border: '3px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 24px rgba(0,194,168,0.35)',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}
          >
            {profilePhoto
              ? <img src={profilePhoto} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
            {/* Camera overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 30, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={14} color="#fff" />
            </div>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />

          {/* Name / email / badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.6px' }}>
              {profile.name || 'â€”'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', marginTop: 6 }}>
              {profile.email || 'â€”'}
            </div>
            {/* Active badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, padding: '5px 13px', borderRadius: 20, background: 'rgba(0,194,168,0.14)', border: '1px solid rgba(0,194,168,0.28)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C2A8', boxShadow: '0 0 6px #00C2A8' }} />
              <span style={{ fontSize: 12, color: '#00C2A8', fontWeight: 700, letterSpacing: '0.01em' }}>
                {tp('member_since', { date: formatJoinDate(profile.joined_at) })}
              </span>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12, flexShrink: 0,
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(4px)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background .15s, border-color .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            <Pencil size={15} color="#fff" />
            {tp('edit_profile')}
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24, position: 'relative' }} />

        {/* Contact info row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, position: 'relative' }}>
          {[
            { Icon: Phone,         value: profile.phone             || 'â€”' },
            { Icon: MessageSquare, value: profile.whatsapp_number   || 'â€”' },
            { Icon: MapPin,        value: formatAddress(profile) },
          ].map(({ Icon, value }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} color="rgba(255,255,255,0.35)" strokeWidth={1.8} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* â•â• PREFERENCES CTA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <button
        onClick={() => setPrefOpen(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 20,
          padding: '22px 28px', borderRadius: 20, marginBottom: 14,
          background: 'linear-gradient(130deg, #00C2A8 0%, #009E88 100%)',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          transition: 'filter .15s, box-shadow .15s',
          boxShadow: '0 6px 24px rgba(0,194,168,0.28)',
          boxSizing: 'border-box',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(0,194,168,0.38)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,194,168,0.28)'; }}
      >
        <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sliders size={24} color="#fff" strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.2px' }}>{tp('ride_preferences')}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>{tp('ride_preferences_desc')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.18)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{tp('configure')}</span>
          <ChevronRight size={15} color="#fff" />
        </div>
      </button>

      {/* â•â• ACCOUNT TILES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>
        {tp('account_section')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Tile icon={Wallet}   label={tp('menu_wallet')}            sub={tp('tile_wallet_sub')}         href="/user/wallet" />
        <Tile icon={Bookmark} label={tp('favorite_places')}      sub={tp('tile_places_sub')}         onClick={() => setPlacesOpen(true)} />
        <Tile icon={Users}    label={tp('related_passengers')}   sub={tp('tile_passengers_sub')}         onClick={() => setPassOpen(true)} />
        <Tile icon={Shield}   label={tp('menu_security')}             sub={tp('tile_security_sub')}    onClick={() => setChangePwOpen(true)} accent="#6366F1" />
      </div>

      {/* â•â• SIGN OUT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          padding: '14px', borderRadius: 14,
          border: '1.5px solid #FEE2E2', background: '#FFF5F5',
          color: '#EF4444', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background .15s, border-color .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEE2E2'; (e.currentTarget as HTMLElement).style.borderColor = '#FCA5A5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFF5F5'; (e.currentTarget as HTMLElement).style.borderColor = '#FEE2E2'; }}
      >
        <LogOut size={17} color="#EF4444" />
        {tc('sign_out')}
      </button>

      {/* â”€â”€ Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <EditProfileModal profile={profile} isOpen={editOpen} onClose={() => setEditOpen(false)} onSave={handleSave} />
      <PreferencesModal isOpen={prefOpen} onClose={() => setPrefOpen(false)} />
      <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
      <FavoritePlacesModal isOpen={placesOpen} onClose={() => setPlacesOpen(false)} />
      <RelatedPassengersModal isOpen={passOpen} onClose={() => setPassOpen(false)} />
    </div>
  );
}
