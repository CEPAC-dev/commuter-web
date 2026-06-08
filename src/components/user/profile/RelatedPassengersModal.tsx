'use client';

import { X } from 'lucide-react';
import RelatedPassengersSection from './RelatedPassengersSection';
import { useTranslations } from 'next-intl';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

export default function RelatedPassengersModal({ isOpen, onClose }: Props) {
  const tp = useTranslations('profile_mobile');
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16,
          padding: 28, width: '100%', maxWidth: 520,
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0B1E3D', margin: 0 }}>{tp('related_passengers')}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#5A6A7A' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <RelatedPassengersSection />
        </div>
      </div>
    </div>
  );
}
