'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DriverDocuments, DriverProfileMeData } from '@/types/driver';
import DocumentUploadField from '@/components/driver/DocumentUploadField';
import toast from 'react-hot-toast';
import { uploadDocument } from '@/lib/api/driver';
import driverApi from '@/lib/api/driver';
import { getUserData } from '@/lib/auth/tokenStorage';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMediaQuery } from '@/lib/useMediaQuery';
import authApi from '@/lib/api/auth';
import DriverEditProfileModal from '@/components/driver/DriverEditProfileModal';
import ChangePasswordModal from '@/components/user/profile/ChangePasswordModal';
import {
  Shield, FileText, Pencil, Loader2, Camera,
  Phone, MapPin, Calendar, LogOut, CheckCircle2,
  Clock, FolderOpen, ChevronDown, ChevronUp, KeyRound, Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  profileData: DriverProfileMeData | null;
  docUrls: DriverDocuments;
  onUpload: (fieldName: keyof DriverDocuments, file: File) => Promise<void>;
  onEdit: () => void;
  onChangePassword: () => void;
  onWallet: () => void;
  onLogout: () => void;
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return format(d, "dd/MM/yyyy · hh:mm aa");
}

function Avatar({ photoUrl, name, size = 64, fontSize = 22, altLabel }: { photoUrl: string | null; name: string; size?: number; fontSize?: number; altLabel?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#C8E6E2', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={altLabel ?? name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize, fontWeight: 700, color: '#00C2A8' }}>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function ClickableAvatar({ photoUrl, name, size = 64, fontSize = 22, onUpload, wrapperStyle, photoTitle, altLabel }: {
  photoUrl: string | null; name: string; size?: number; fontSize?: number;
  onUpload: (file: File) => void;
  wrapperStyle?: React.CSSProperties;
  photoTitle?: string;
  altLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ position: 'relative', cursor: 'pointer', flexShrink: 0, display: 'inline-block', borderRadius: '50%', ...wrapperStyle }}
      onClick={() => inputRef.current?.click()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={photoTitle}
    >
      <Avatar photoUrl={photoUrl} name={name} size={size} fontSize={fontSize} altLabel={altLabel} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'rgba(0,0,0,0.42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hov ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none',
      }}>
        <Camera size={Math.round(size * 0.3)} color="#fff" />
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── MOBILE VIEW ─────────────────────────────────────────────────────────────

function MobileProfile({ displayName, email, phone, address, profileData, docUrls, onUpload, onEdit, onChangePassword, onWallet, onLogout }: ProfileData) {
  const t = useTranslations('profile_driver');
  const tc = useTranslations('common');
  const tPw = useTranslations('change_password');
  const [docsOpen, setDocsOpen] = useState(false);

  const DOCUMENTS: { label: string; fieldName: keyof DriverDocuments }[] = [
    { label: t('doc_national_front'), fieldName: 'nationalIdFront' },
    { label: t('doc_national_back'),  fieldName: 'nationalIdBack' },
    { label: t('doc_driving_license'), fieldName: 'drivingLicense' },
    { label: t('doc_car_front'),      fieldName: 'carLicenseFront' },
    { label: t('doc_car_back'),       fieldName: 'carLicenseBack' },
    { label: t('doc_criminal'),       fieldName: 'criminalRecord' },
  ];

  const isVerified = profileData?.is_verified ?? false;
  const vehicle = [profileData?.car_brand, profileData?.car_model, profileData?.car_year]
    .filter(Boolean).join(' ') + (profileData?.car_color ? ` · ${profileData.car_color}` : '') || '—';

  const CARD: React.CSSProperties = {
    background: '#EFF7F5', border: '1px solid #C8E6E2', borderRadius: 16,
    padding: '18px 16px', marginBottom: 14,
  };

  return (
    <div style={{ padding: '20px 16px 40px', fontFamily: 'Inter, system-ui, sans-serif', background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B1E3D', margin: '0 0 4px' }}>{t('page_title')}</h1>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px' }}>{t('page_subtitle')}</p>

      <p style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D', margin: '0 0 10px' }}>{t('account_status')}</p>
      <div style={CARD}>
        {/* Status headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          {isVerified
            ? <CheckCircle2 size={20} color="#22C55E" />
            : <Clock size={20} color="#F97316" />
          }
          <span style={{ fontSize: 15, fontWeight: 700, color: isVerified ? '#16A34A' : '#F97316' }}>
            {isVerified ? t('verified') : t('pending_verification')}
          </span>
        </div>
        <div style={{ height: 1, background: '#C8E6E2', marginBottom: 14 }} />
        {/* Driver profile row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <FolderOpen size={18} color="#00C2A8" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{t('driver_profile')}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D' }}>
              {profileData ? t('profile_submitted') : t('profile_not_submitted')}
            </div>
          </div>
        </div>
        {/* Verification row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Shield size={18} color="#00C2A8" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{t('verification')}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isVerified ? '#16A34A' : '#F97316' }}>
              {isVerified ? t('verified') : t('pending_verification')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Identity card ── */}
      <div style={CARD}>
        {/* Avatar + name + email + edit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <ClickableAvatar photoUrl={docUrls.profilePhoto} name={displayName} size={80} fontSize={28} onUpload={(file) => onUpload('profilePhoto', file)} photoTitle={t('change_photo')} altLabel={t('photo_of', { name: displayName })} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D', lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
          <button
            onClick={onEdit}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: '#fff', border: '1.5px solid #00C2A8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Pencil size={16} color="#00C2A8" />
          </button>
        </div>
        <div style={{ height: 1, background: '#C8E6E2', marginBottom: 14 }} />
        {/* Contact rows */}
        {[
          { Icon: Phone,    label: t('mobile'),       value: phone },
          { Icon: MapPin,   label: t('address'),      value: address },
          { Icon: Calendar, label: t('member_since_label'), value: fmtDateTime(profileData?.created_at) },
        ].map(({ Icon, label, value }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < 2 ? 14 : 0 }}>
            <Icon size={18} color="#00C2A8" style={{ marginTop: 3, flexShrink: 0 }} strokeWidth={1.8} />
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D', lineHeight: 1.4 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Driver profile card ── */}
      {profileData && (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D', margin: '0 0 10px' }}>{t('driver_profile')}</p>
          <div style={CARD}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              {[
                { label: t('national_id'),           value: profileData.national_id        ?? '—' },
                { label: t('license_expiry'),        value: profileData.license_expiry     ?? '—' },
                { label: t('car_type'),              value: profileData.car_type           ?? '—' },
                { label: t('vehicle'),               value: vehicle },
                { label: t('license_plate'),         value: profileData.license_plate      ?? '—' },
                { label: t('car_capacity'),          value: profileData.car_capacity       != null ? String(profileData.car_capacity) : '—' },
                { label: t('price_per_km'),          value: profileData.price_per_km       != null ? `${profileData.price_per_km} EGP/km` : '—' },
                { label: t('waiting_price'),         value: profileData.waiting_price_per_hour != null ? `${profileData.waiting_price_per_hour} EGP/hr` : '—' },
                { label: t('passenger_type'),        value: profileData.passenger_type === 'male' ? t('passenger_male') : profileData.passenger_type === 'female' ? t('passenger_female') : profileData.passenger_type === 'mixed' ? t('passenger_mixed') : '—' },
                { label: t('profile_since'),         value: fmtDateTime(profileData.created_at) },
              ].map(({ label, value }, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D', lineHeight: 1.4, wordBreak: 'break-word' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Documents ── */}
      <button
        onClick={() => setDocsOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px', borderRadius: 14, marginBottom: docsOpen ? 0 : 14,
          background: '#EFF7F5', border: '1px solid #C8E6E2',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <FileText size={18} color="#00C2A8" strokeWidth={1.8} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>{t('documents')}</span>
        {docsOpen ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
      </button>
      {docsOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, padding: '14px 0' }}>
          {DOCUMENTS.map(({ label, fieldName }) => (
            <DocumentUploadField key={fieldName} label={label} fieldName={fieldName} currentUrl={docUrls[fieldName]} onUpload={onUpload} />
          ))}
        </div>
      )}

      {/* ── Wallet ── */}
      <button
        onClick={onWallet}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '14px', borderRadius: 14, marginBottom: 12,
          border: '1.5px solid #C8E6E2', background: '#EFF7F5',
          color: '#00C2A8', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <Wallet size={17} color="#00C2A8" />
        {t('wallet')}
      </button>

      <button
        onClick={onChangePassword}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '14px', borderRadius: 14, marginBottom: 12,
          border: '1.5px solid #C8E6E2', background: '#EFF7F5',
          color: '#00C2A8', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <KeyRound size={17} color="#00C2A8" />
        {tPw('title')}
      </button>

      <button
        onClick={onLogout}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '16px', borderRadius: 14,
          border: '1.5px solid #EF4444', background: '#fff',
          color: '#EF4444', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <LogOut size={18} color="#EF4444" />
        {tc('sign_out')}
      </button>
    </div>
  );
}

// ─── DESKTOP VIEW ─────────────────────────────────────────────────────────────

function DesktopProfile({ displayName, email, phone, address, profileData, docUrls, onUpload, onEdit, onChangePassword, onWallet, onLogout }: ProfileData) {
  const t = useTranslations('profile_driver');
  const tc = useTranslations('common');
  const tPw = useTranslations('change_password');
  const isVerified = profileData?.is_verified ?? false;
  const vehicle = [profileData?.car_brand, profileData?.car_model, profileData?.car_year]
    .filter(Boolean).join(' ') + (profileData?.car_color ? ` · ${profileData.car_color}` : '') || '—';

  const DOCUMENTS: { label: string; fieldName: keyof DriverDocuments }[] = [
    { label: t('doc_national_front'), fieldName: 'nationalIdFront' },
    { label: t('doc_national_back'),  fieldName: 'nationalIdBack' },
    { label: t('doc_driving_license'), fieldName: 'drivingLicense' },
    { label: t('doc_car_front'),      fieldName: 'carLicenseFront' },
    { label: t('doc_car_back'),       fieldName: 'carLicenseBack' },
    { label: t('doc_criminal'),       fieldName: 'criminalRecord' },
  ];

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{ background: '#fff', border: '1.5px solid #F1F5F9', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(11,30,61,0.05)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    );
  }

  function InfoRow({ label, value }: { label: string; value: string }) {
    return (
      <div style={{ marginBottom: 0 }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>{value}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '44px 40px 80px', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HERO ── */}
      <div style={{
        background: '#0B1E3D', borderRadius: 24, padding: '36px 40px 30px',
        position: 'relative', overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: '#00C2A8', opacity: 0.07, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 110, width: 150, height: 150, borderRadius: '50%', background: '#00C2A8', opacity: 0.04, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 22, position: 'relative', marginBottom: 26 }}>
          {/* Avatar */}
          <ClickableAvatar
            photoUrl={docUrls.profilePhoto}
            name={displayName}
            size={110}
            fontSize={36}
            onUpload={(file) => onUpload('profilePhoto', file)}
            wrapperStyle={{ border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 24px rgba(0,194,168,0.3)' }}
            photoTitle={t('change_photo')}
            altLabel={t('photo_of', { name: displayName })}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{displayName}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', marginTop: 6 }}>{email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, padding: '5px 13px', borderRadius: 20, background: isVerified ? 'rgba(34,197,94,0.14)' : 'rgba(249,115,22,0.14)', border: `1px solid ${isVerified ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)'}` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: isVerified ? '#22C55E' : '#F97316', boxShadow: `0 0 6px ${isVerified ? '#22C55E' : '#F97316'}` }} />
              <span style={{ fontSize: 12, color: isVerified ? '#22C55E' : '#F97316', fontWeight: 700 }}>
                {isVerified ? t('verified_driver') : t('pending_verification')}
              </span>
            </div>
          </div>

          <button
            onClick={onEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12, flexShrink: 0,
              border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Pencil size={15} color="#fff" /> {t('edit_btn')}
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 22 }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
          {[
            { Icon: Phone,    value: phone },
            { Icon: MapPin,   value: address },
            { Icon: Calendar, value: profileData ? `${t('member_since_label')} ${format(new Date(profileData.created_at), 'dd MMM yyyy')}` : '—' },
          ].map(({ Icon, value }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} color="rgba(255,255,255,0.35)" strokeWidth={1.8} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 1: Personal info + Status ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        <Section title={t('personal_information')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28, rowGap: 16 }}>
            <InfoRow label={t('full_name')}    value={displayName} />
            <InfoRow label={t('phone')} value={phone} />
            <InfoRow label={t('email')}        value={email} />
            <InfoRow label={t('national_id')}  value={profileData?.national_id ?? '—'} />
            <div style={{ gridColumn: '1 / -1' }}><InfoRow label={t('address')} value={address} /></div>
          </div>
        </Section>

        {/* Status card */}
        <div style={{ background: isVerified ? '#F0FDF4' : '#FFF7ED', border: `1.5px solid ${isVerified ? '#BBF7D0' : '#FED7AA'}`, borderRadius: 20, padding: '18px 20px', boxShadow: '0 2px 12px rgba(11,30,61,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {isVerified ? <CheckCircle2 size={20} color="#22C55E" /> : <Clock size={20} color="#F97316" />}
            <span style={{ fontSize: 14, fontWeight: 700, color: isVerified ? '#16A34A' : '#EA580C' }}>
              {isVerified ? t('account_verified') : t('pending_verification')}
            </span>
          </div>
          <div style={{ height: 1, background: isVerified ? '#BBF7D0' : '#FED7AA', marginBottom: 14 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { Icon: FolderOpen, label: t('driver_profile'), value: profileData ? t('profile_submitted') : t('profile_not_submitted') },
              { Icon: Shield,     label: t('verification'),   value: isVerified ? t('verified') : t('pending_verification'), color: isVerified ? '#16A34A' : '#EA580C' },
            ].map(({ Icon, label, value, color }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={15} color="#00C2A8" strokeWidth={1.8} />
                <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, flex: 1 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: color ?? '#0B1E3D' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Driver Details – full width, 3-col grid ── */}
      <div style={{ marginBottom: 16 }}>
        <Section title={t('driver_details')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 32, rowGap: 16 }}>
            <InfoRow label={t('car_type')}              value={profileData?.car_type       ?? '—'} />
            <InfoRow label={t('vehicle')}               value={vehicle} />
            <InfoRow label={t('license_plate')}         value={profileData?.license_plate  ?? '—'} />
            <InfoRow label={t('license_expiry')}        value={profileData?.license_expiry ?? '—'} />
            <InfoRow label={t('car_capacity')}          value={profileData?.car_capacity   != null ? String(profileData.car_capacity) : '—'} />
            <InfoRow label={t('price_per_km')}          value={profileData?.price_per_km   != null ? `${profileData.price_per_km} EGP/km` : '—'} />
            <InfoRow label={t('waiting_price')}         value={profileData?.waiting_price_per_hour != null ? `${profileData.waiting_price_per_hour} EGP/hr` : '—'} />
            <InfoRow label={t('passenger_type')}        value={profileData?.passenger_type === 'male' ? t('passenger_male') : profileData?.passenger_type === 'female' ? t('passenger_female') : profileData?.passenger_type === 'mixed' ? t('passenger_mixed') : '—'} />
            <InfoRow label={t('profile_since')}         value={fmtDateTime(profileData?.created_at)} />
          </div>
        </Section>
      </div>

      {/* ── DOCUMENTS ── */}
      <div style={{ background: '#fff', border: '1.5px solid #F1F5F9', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(11,30,61,0.05)', marginBottom: 16 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('documents')}</span>
        </div>
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {DOCUMENTS.map(({ label, fieldName }) => (
            <DocumentUploadField key={fieldName} label={label} fieldName={fieldName} currentUrl={docUrls[fieldName]} onUpload={onUpload} />
          ))}
        </div>
      </div>

      {/* ── SIGN OUT ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onWallet}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            padding: '14px', borderRadius: 14,
            border: '1.5px solid #C8E6E2', background: '#EFF7F5',
            color: '#00C2A8', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DFF1EE'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#EFF7F5'; }}
        >
          <Wallet size={17} color="#00C2A8" /> {t('wallet')}
        </button>
        <button
          onClick={onChangePassword}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            padding: '14px', borderRadius: 14,
            border: '1.5px solid #C8E6E2', background: '#EFF7F5',
            color: '#00C2A8', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DFF1EE'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#EFF7F5'; }}
        >
          <KeyRound size={17} color="#00C2A8" /> {tPw('title')}
        </button>
        <button
          onClick={onLogout}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            padding: '14px', borderRadius: 14,
            border: '1.5px solid #FEE2E2', background: '#FFF5F5',
            color: '#EF4444', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEE2E2'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFF5F5'; }}
        >
          <LogOut size={17} color="#EF4444" /> {tc('sign_out')}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const t = useTranslations('profile_driver');
  const router = useRouter();
  const { logout, name: authName, updateName, updateProfilePhoto } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [profileData, setProfileData] = useState<DriverProfileMeData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [editOpen, setEditOpen]       = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [docUrls, setDocUrls]         = useState<DriverDocuments>({
    nationalIdFront: null, nationalIdBack: null, drivingLicense: null,
    carLicenseFront: null, carLicenseBack: null, criminalRecord: null, profilePhoto: null,
  });

  const userData = getUserData() ?? {};
  // Live personal info (refreshed from GET /profile + edits)
  const [personal, setPersonal] = useState<{
    name: string; email: string; phone: string;
    building: string; street: string; sub_district: string;
    district: string; province: string; landmark: string;
  }>({
    name:        (userData.name as string)         || authName || '',
    email:       (userData.email as string)        || '',
    phone:       (userData.phone_number as string) || '',
    building:    (userData.building as string)     || '',
    street:      (userData.street as string)       || '',
    sub_district:(userData.sub_district as string) || '',
    district:    (userData.district as string)     || '',
    province:    (userData.province as string)     || '',
    landmark:    (userData.landmark as string)     || '',
  });

  const displayName = personal.name  || '—';
  const email       = personal.email || '—';
  const phone       = personal.phone || '—';
  const address     = [
    personal.building, personal.street, personal.sub_district,
    personal.district, personal.province, personal.landmark,
  ].filter(Boolean).join(', ') || '—';

  useEffect(() => {
    // Load driver profile + fresh personal info in parallel
    Promise.allSettled([
      driverApi.getProfileMe(),
      driverApi.getPersonalInfo(),
    ]).then(([driverRes, personalRes]) => {
      if (driverRes.status === 'fulfilled') {
        const d = (driverRes.value as { data: DriverProfileMeData }).data;
        setProfileData(d);
        setDocUrls({
          nationalIdFront: d.national_id_image_front_url       ?? null,
          nationalIdBack:  d.national_id_image_back_url        ?? null,
          drivingLicense:  d.driving_license_url               ?? null,
          carLicenseFront: d.vehicle_license_front_url         ?? null,
          carLicenseBack:  d.vehicle_license_back_url          ?? null,
          criminalRecord:  d.criminal_record_certificate_url   ?? null,
          profilePhoto:    d.profile_photo_url                 ?? null,
        });
        if (d.profile_photo_url) updateProfilePhoto(d.profile_photo_url);
      }
      if (personalRes.status === 'fulfilled') {
        const raw = personalRes.value as Record<string, unknown>;
        const u = (raw.user ?? raw.data ?? raw) as Record<string, unknown>;
        setPersonal((p) => ({
          name:        (u.name         as string) || p.name,
          email:       (u.email        as string) || p.email,
          phone:       ((u.phone_number as string) || (u.phone as string)) || p.phone,
          building:    (u.building     as string) || p.building,
          street:      (u.street       as string) || p.street,
          sub_district:(u.sub_district as string) || p.sub_district,
          district:    (u.district     as string) || p.district,
          province:    (u.province     as string) || p.province,
          landmark:    (u.landmark     as string) || p.landmark,
        }));
      }
    }).finally(() => setLoading(false));
  }, [updateProfilePhoto]);

  const handleUpload = useCallback(async (fieldName: keyof DriverDocuments, file: File) => {
    try {
      await uploadDocument(fieldName, file);
      const localUrl = URL.createObjectURL(file);
      setDocUrls((prev) => ({ ...prev, [fieldName]: localUrl }));
      if (fieldName === 'profilePhoto') updateProfilePhoto(localUrl);
      toast.success(t('doc_upload_success'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('doc_upload_failed'));
    }
  }, [updateProfilePhoto, t]);

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.replace('/');
  }

  function handleEdit() {
    setEditOpen(true);
  }

  function handleProfileSaved({ personal, driver }: { personal: Partial<{ name: string; email: string; phone: string; whatsapp_number: string; gender: string; birthdate: string; province: string; district: string; sub_district: string; building: string; street: string; landmark: string }>; driver: Partial<DriverProfileMeData> }) {
    setPersonal((p) => ({
      ...p,
      name:        personal.name        ?? p.name,
      email:       personal.email       ?? p.email,
      phone:       personal.phone       ?? p.phone,
      building:    personal.building    ?? p.building,
      street:      personal.street      ?? p.street,
      sub_district:personal.sub_district?? p.sub_district,
      district:    personal.district    ?? p.district,
      province:    personal.province    ?? p.province,
      landmark:    personal.landmark    ?? p.landmark,
    }));
    if (personal.name) updateName(personal.name);
    setProfileData((prev) => prev ? { ...prev, ...driver } as DriverProfileMeData : prev);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Loader2 size={32} style={{ color: '#00C2A8' }} className="animate-spin" />
    </div>
  );

  if (isDesktop === null) return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '44px 40px' }}>
      <div style={{ height: 200, background: '#E2E8F0', borderRadius: 24, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 180, background: '#E2E8F0', borderRadius: 20 }} />)}
      </div>
    </div>
  );

  const sharedProps: ProfileData = {
    displayName, email, phone, address, profileData, docUrls,
    onUpload: handleUpload, onEdit: handleEdit, onLogout: handleLogout,
    onChangePassword: () => setChangePwOpen(true),
    onWallet: () => router.push('/driver/wallet'),
  };

  return (
    <>
      {isDesktop
        ? <DesktopProfile {...sharedProps} />
        : <MobileProfile  {...sharedProps} />}

      <DriverEditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        initialPersonal={{
          name:            personal.name,
          email:           personal.email,
          phone:           personal.phone,
          whatsapp_number: '',
          gender:          '',
          birthdate:       '',
          province:        personal.province,
          district:        personal.district,
          sub_district:    personal.sub_district,
          building:        personal.building,
          street:          personal.street,
          landmark:        personal.landmark,
        }}
        driverProfile={profileData}
        onSaved={handleProfileSaved}
      />

      <ChangePasswordModal
        isOpen={changePwOpen}
        onClose={() => setChangePwOpen(false)}
      />
    </>
  );
}
