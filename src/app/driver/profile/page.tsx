'use client';

import { useState, useCallback } from 'react';
// Mock data removed
import { DriverProfile, DriverDocuments } from '@/types/driver';
import DocumentUploadField from '@/components/driver/DocumentUploadField';
import toast from 'react-hot-toast';
import { uploadDocument } from '@/lib/api/driver';
import { Star, Shield, User, Car, FileText, Pencil } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

const DOCUMENTS: { label: string; fieldName: keyof DriverDocuments }[] = [
  { label: 'National ID - front',         fieldName: 'nationalIdFront' },
  { label: 'National ID - back',          fieldName: 'nationalIdBack' },
  { label: 'Driving license',             fieldName: 'drivingLicense' },
  { label: 'Car license',                 fieldName: 'carLicense' },
  { label: 'Criminal Record Certificate', fieldName: 'criminalRecord' },
  { label: 'Profile photo',               fieldName: 'profilePhoto' },
];

type ProfileTab = 'personal' | 'car' | 'documents';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <dt style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</dt>
      <dd style={{ fontSize: 14, color: '#0B1E3D', fontWeight: 500, margin: 0 }}>{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  // TODO: fetch driver profile from API
  const [driver, setDriver] = useState<DriverProfile>({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    nationalId: '',
    drivingLicenseNumber: '',
    carLicensePlate: '',
    carModel: '',
    carYear: new Date().getFullYear(),
    carColor: '',
    rating: 0,
    totalTrips: 0,
    walletBalance: 0,
    joinedAt: new Date().toISOString(),
    documents: {
      nationalIdFront: null,
      nationalIdBack: null,
      drivingLicense: null,
      carLicense: null,
      criminalRecord: null,
      profilePhoto: null,
    },
    isVerified: false,
    completedCycles: 0,
    activeCycles: 0,
    gender: 'male',
  });
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  const completedCyclesCount = 0; // TODO: fetch from API

  const activeCyclesCount = 0; // TODO: fetch from API

  const handleUpload = useCallback(
    async (fieldName: keyof DriverDocuments, file: File) => {
      try {
        await uploadDocument(fieldName, file);
        const localUrl = URL.createObjectURL(file);
        setDriver((prev) => ({
          ...prev,
          documents: { ...prev.documents, [fieldName]: localUrl },
        }));
        toast.success('Document uploaded successfully');
      } catch {
        throw new Error('Upload failed. Please try again.');
      }
    },
    []
  );

  const TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: 'personal',  label: 'Personal Info', icon: <User     size={15} /> },
    { key: 'car',       label: 'Car Info',       icon: <Car      size={15} /> },
    { key: 'documents', label: 'Documents',      icon: <FileText size={15} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{`
        .profile-hero-body { padding: 0 28px 24px; position: relative; }
        .profile-stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 24px; }
        .profile-stat-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; }
        .profile-stat-num { font-size: 30px; font-weight: 700; color: #0B1E3D; margin: 0; line-height: 1; }
        .profile-tab-content { padding: 28px 28px 32px; }
        .profile-docs-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media (max-width: 767px) {
          .profile-hero-body { padding: 0 16px 18px !important; }
          .profile-stats-grid { gap: 8px !important; margin-bottom: 16px !important; }
          .profile-stat-card { padding: 14px 12px !important; }
          .profile-stat-num { font-size: 22px !important; }
          .profile-tab-content { padding: 18px 16px 24px !important; }
          .profile-docs-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
        }
      `}</style>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 100, background: 'linear-gradient(135deg, #0B1E3D 0%, #163566 60%, #00C2A8 100%)' }} />
        <div className="profile-hero-body">
          <div style={{ marginTop: -40, marginBottom: 12, display: 'inline-block', position: 'relative' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '3px solid #fff', background: '#EFF7F6',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)', position: 'relative',
            }}>
              {driver.documents.profilePhoto ? (
                <Image
                  src={driver.documents.profilePhoto}
                  alt={`Profile photo of ${driver.name}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="80px"
                />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 700, color: '#00C2A8' }}>
                  {driver.name.charAt(0)}
                </span>
              )}
            </div>
            {driver.isVerified && (
              <span title="Verified driver" style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 22, height: 22, borderRadius: '50%',
                background: '#00C2A8', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={11} style={{ color: '#fff' }} />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0B1E3D', margin: 0 }}>{driver.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} style={{ color: '#F5A623', fill: s <= Math.round(driver.rating) ? '#F5A623' : 'none' }} />
                  ))}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D', marginLeft: 4 }}>{driver.rating.toFixed(1)}</span>
                </span>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>.</span>
                <span style={{ fontSize: 13, color: '#5A6A7A' }}>{driver.totalTrips} trips</span>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>.</span>
                <span style={{ fontSize: 13, color: '#5A6A7A' }}>Member since {format(new Date(driver.joinedAt), 'MMM yyyy')}</span>
              </div>
            </div>
            <button
              onClick={() => toast('Edit profile coming soon')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'transparent', color: '#00C2A8', border: '1.5px solid #00C2A8',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Pencil size={13} /> Edit profile
            </button>
          </div>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <p className="profile-stat-num">{completedCyclesCount}</p>
          <p style={{ fontSize: 13, color: '#5A6A7A', margin: '6px 0 0' }}>Completed Cycles</p>
        </div>
        <div className="profile-stat-card">
          <p className="profile-stat-num" style={{ color: '#00C2A8' }}>{activeCyclesCount}</p>
          <p style={{ fontSize: 13, color: '#5A6A7A', margin: '6px 0 0' }}>Active Cycles</p>
        </div>
        <div className="profile-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#F5A623', margin: 0, lineHeight: 1 }}>
              EGP {driver.walletBalance.toLocaleString('en-EG')}
            </p>
            <p style={{ fontSize: 13, color: '#5A6A7A', margin: '6px 0 0' }}>Wallet Balance</p>
          </div>
          <button
            onClick={() => toast('Withdraw coming soon')}
            style={{
              marginTop: 10, padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              background: 'transparent', color: '#00C2A8', border: '1.5px solid #00C2A8',
              cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start',
            }}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
          {TABS.map(({ key, label, icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '14px 8px', fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? '#0B1E3D' : '#9CA3AF',
                  background: 'none', border: 'none',
                  borderBottom: active ? '2px solid #00C2A8' : '2px solid transparent',
                  cursor: 'pointer', transition: 'color 0.15s', fontFamily: 'inherit',
                  marginBottom: -1,
                }}
              >
                {icon} {label}
              </button>
            );
          })}
        </div>
        <div className="profile-tab-content">
          {activeTab === 'personal' && (
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px 32px' }}>
              <InfoRow label="Full name"     value={driver.name} />
              <InfoRow label="Phone number"  value={driver.phone} />
              <InfoRow label="Email"         value={driver.email} />
              <InfoRow label="Home address"  value={driver.address} />
              <InfoRow label="National ID"   value={driver.nationalId} />
            </dl>
          )}
          {activeTab === 'car' && (
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px 32px' }}>
              <InfoRow label="Car model"           value={driver.carModel} />
              <InfoRow label="Year"                value={String(driver.carYear)} />
              <InfoRow label="Color"               value={driver.carColor} />
              <InfoRow label="License plate"       value={driver.carLicensePlate} />
              <InfoRow label="Driving license no." value={driver.drivingLicenseNumber} />
            </dl>
          )}
          {activeTab === 'documents' && (
            <div className="profile-docs-grid">
              {DOCUMENTS.map(({ label, fieldName }) => (
                <DocumentUploadField
                  key={fieldName}
                  label={label}
                  fieldName={fieldName}
                  currentUrl={driver.documents[fieldName]}
                  onUpload={handleUpload}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
