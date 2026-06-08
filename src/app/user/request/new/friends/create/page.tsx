'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useWizard } from '@/lib/RequestWizardContext';
import { generateGroupCode } from '@/lib/groupCode';

export default function FriendsCreatePage() {
  const router = useRouter();
  const t = useTranslations('request_shared');
  const { setGroupCode } = useWizard();
  const [code] = useState(() => generateGroupCode());
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleContinue() {
    setGroupCode(code);
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
          {t('your_code')}
        </h1>
        <p style={{ fontSize: 15, color: '#5A6A7A', marginBottom: 32 }}>
          {t('share_friends')}
        </p>

        <div
          style={{
            background: '#EFF7F6',
            border: '2px solid #C8E8E4',
            borderRadius: 16,
            padding: '28px 24px',
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#00C2A8',
              letterSpacing: 8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {code}
          </p>
          <p style={{ fontSize: 12, color: '#5A6A7A', marginTop: 8 }}>
            {t('expires_48h')}
          </p>
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: `1px solid #E2E8F0`,
            borderRadius: 12,
            color: copied ? '#00C2A8' : '#5A6A7A',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginBottom: 24,
            transition: 'color 0.2s',
          }}
        >
          {copied ? t('copied') : t('copy_code')}
        </button>

        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: '14px',
            background: '#00C2A8',
            border: 'none',
            borderRadius: 12,
            color: '#0B1E3D',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {t('continue_route')}
        </button>
      </div>
    </div>
  );
}
