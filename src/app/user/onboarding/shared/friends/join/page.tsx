'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useIntent } from '@/lib/IntentContext';
import { isValidGroupCode } from '@/lib/groupCode';
import WizardProgress from '@/components/user/onboarding/WizardProgress';

export default function JoinGroupPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const { setIntent } = useIntent();

  const [part1, setPart1] = useState('');
  const [part2, setPart2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref2 = useRef<HTMLInputElement>(null);

  const fullCode = `${part1}-${part2}`;
  const isValid  = isValidGroupCode(fullCode);

  function handlePart1Change(val: string) {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    setPart1(clean);
    if (clean.length === 3) ref2.current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const parts = pasted.split('-');
    if (parts.length === 2) {
      setPart1(parts[0].slice(0, 3));
      setPart2(parts[1].slice(0, 3));
      e.preventDefault();
    }
  }

  async function handleJoin() {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cycles/group/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t('invalid_code'));
        return;
      }
      setIntent({
        group_code: fullCode,
        prefillRoute: data.origin
          ? { origin: data.origin, destination: data.destination, viaStops: data.viaStops ?? [] }
          : null,
      });
      router.push('/user/request/new');
    } catch {
      setError(t('join_error'));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: 80,
    height: 56,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 6,
    border: '2px solid #E2E8F0',
    borderRadius: 12,
    fontFamily: 'inherit',
    color: '#0B1E3D',
    background: '#fff',
    outline: 'none',
    textTransform: 'uppercase',
    transition: 'border-color 0.15s',
  };

  const whatNextItems = [t('what_next_1'), t('what_next_2'), t('what_next_3'), t('what_next_4')];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B1E3D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => router.push('/user/onboarding/shared/friends')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginRight: 'auto' }}
        >
          ← {tCommon('back')}
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#00C2A8' }}>{t('brand')}</span>
        <div style={{ marginLeft: 'auto', width: 60 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        <WizardProgress current={4} total={4} />

        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 6 }}>
          {t('enter_code_title')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '0 0 28px' }}>
          {t('enter_code_desc')}
        </p>

        <div style={{ background: '#1C3557', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <input
              value={part1}
              onChange={(e) => handlePart1Change(e.target.value)}
              onPaste={handlePaste}
              maxLength={3}
              placeholder="_ _ _"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
            />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>-</span>
            <input
              ref={ref2}
              value={part2}
              onChange={(e) => setPart2(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))}
              maxLength={3}
              placeholder="_ _ _"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
            />
          </div>

          {error && (
            <p style={{ color: '#E74C3C', fontSize: 13, margin: '0 0 16px', background: 'rgba(231,76,60,0.1)', borderRadius: 8, padding: '8px 12px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleJoin}
            disabled={!isValid || loading}
            style={{
              width: '100%', height: 48, borderRadius: 12, border: 'none',
              background: isValid && !loading ? '#00C2A8' : 'rgba(255,255,255,0.15)',
              color: isValid && !loading ? '#0B1E3D' : 'rgba(255,255,255,0.4)',
              fontWeight: 700, fontSize: 15, cursor: isValid && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'background 0.2s, color 0.2s',
            }}
          >
            {loading ? t('joining') : t('join_group')}
          </button>
        </div>

        <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
            {t('what_next')}
          </p>
          {whatNextItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <span style={{ color: '#00C2A8', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
