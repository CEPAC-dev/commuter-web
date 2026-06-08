'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useWizard } from '@/lib/RequestWizardContext';
import { isValidGroupCode } from '@/lib/groupCode';

export default function FriendsJoinPage() {
  const router = useRouter();
  const t = useTranslations('request_shared');
  const { setGroupCode } = useWizard();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleInput(raw: string) {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const formatted =
      cleaned.length > 3
        ? `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`
        : cleaned;
    setInput(formatted);
    setError('');
  }

  function handleJoin() {
    if (!isValidGroupCode(input)) {
      setError(t('code_error'));
      return;
    }
    setGroupCode(input);
    router.push('/user/request/schedule');
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          position: 'absolute',
          top: 80,
          left: 24,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#5A6A7A',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'inherit',
        }}
      >
        {t('back')}
      </button>

      <div style={{ textAlign: 'center', marginBottom: 40, width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B1E3D', marginBottom: 8 }}>
          {t('join_title')}
        </h1>
        <p style={{ fontSize: 15, color: '#5A6A7A', marginBottom: 32 }}>
          {t('join_desc')}
        </p>

        <input
          type="text"
          value={input}
          onChange={e => handleInput(e.target.value)}
          placeholder="XXX-XXX"
          maxLength={7}
          style={{
            width: '100%',
            height: 56,
            background: '#F8F9FA',
            border: `2px solid ${error ? '#E74C3C' : '#E2E8F0'}`,
            borderRadius: 12,
            color: '#0B1E3D',
            fontSize: 24,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: 6,
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: 8,
            boxSizing: 'border-box',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#00C2A8'; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = error ? '#E74C3C' : '#E2E8F0'; }}
        />

        {error && (
          <p style={{ fontSize: 13, color: '#E74C3C', marginBottom: 16, textAlign: 'left' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={input.length < 7}
          style={{
            width: '100%',
            padding: '14px',
            background: input.length >= 7 ? '#00C2A8' : '#E2E8F0',
            border: 'none',
            borderRadius: 12,
            color: input.length >= 7 ? '#0B1E3D' : '#9AA0A6',
            fontSize: 15,
            fontWeight: 700,
            cursor: input.length >= 7 ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            marginTop: 8,
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {t('join_btn')}
        </button>
      </div>
    </div>
  );
}
