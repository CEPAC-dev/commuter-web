'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageToggle from '@/components/layout/LanguageToggle';
import { useRedirectIfAuth } from '@/lib/auth/useRedirectIfAuth';

type Role = 'driver' | 'passenger';

export default function Home() {
  const t = useTranslations('home');
  // If already signed in, bounce to the matching dashboard.
  useRedirectIfAuth();

  const ROLES = {
    driver: {
      icon: <Car size={26} color="#0B1E3D" strokeWidth={2.5} />,
      iconBg: '#00C2A8',
      accentColor: '#00C2A8',
      title: t('driver_card_title'),
      description: t('driver_card_desc'),
      primaryBtn:   { label: t('driver_cta_apply'),  href: '/driver/sign-up' },
      secondaryBtn: { label: t('driver_cta_signin'), href: '/driver/sign-in' },
    },
    passenger: {
      icon: <Users size={26} color="#0B1E3D" strokeWidth={2.5} />,
      iconBg: '#00C2A8',
      accentColor: '#00C2A8',
      title: t('passenger_card_title'),
      description: t('passenger_card_desc'),
      primaryBtn:   { label: t('passenger_cta_signup'), href: '/sign-up' },
      secondaryBtn: { label: t('passenger_cta_signin'), href: '/sign-in' },
    },
  } as const;
  const [active,    setActive]    = useState<Role>('driver');
  const [displayed, setDisplayed] = useState<Role>('driver');
  const [phase,     setPhase]     = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [direction, setDirection] = useState<'right' | 'left'>('right');

  function switchTo(r: Role) {
    if (r === active || phase !== 'idle') return;
    const enterFrom: 'right' | 'left' = r === 'passenger' ? 'right' : 'left';
    setDirection(enterFrom);
    setActive(r);
    setPhase('exiting');
    setTimeout(() => {
      setDisplayed(r);
      setPhase('entering');
      setTimeout(() => setPhase('idle'), 250);
    }, 200);
  }

  const role = ROLES[displayed];
  const animClass =
    phase === 'exiting'  ? (direction === 'right' ? 'commuter-exit-left'  : 'commuter-exit-right') :
    phase === 'entering' ? (direction === 'right' ? 'commuter-enter-right' : 'commuter-enter-left') :
    '';

  return (
    <>
    <style>{`
      @keyframes commuterSlideFromRight {
        from { opacity: 0; transform: translateX(52px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes commuterSlideFromLeft {
        from { opacity: 0; transform: translateX(-52px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes commuterSlideToLeft {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(-52px); }
      }
      @keyframes commuterSlideToRight {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(52px); }
      }
      .commuter-enter-right { animation: commuterSlideFromRight 0.25s cubic-bezier(0.4,0,0.2,1) both; }
      .commuter-enter-left  { animation: commuterSlideFromLeft  0.25s cubic-bezier(0.4,0,0.2,1) both; }
      .commuter-exit-left   { animation: commuterSlideToLeft    0.2s  cubic-bezier(0.4,0,0.2,1) both; }
      .commuter-exit-right  { animation: commuterSlideToRight   0.2s  cubic-bezier(0.4,0,0.2,1) both; }
    `}</style>
    <div style={{
      minHeight: '100vh',
      background: '#0B1E3D',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>

      {/* ── Header ── */}
      <header style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: '#00C2A8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#0B1E3D', fontWeight: 900, fontSize: 17, lineHeight: 1 }}>C</span>
        </div>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 20, letterSpacing: '0.02em' }}>commuter</span>
        <div style={{ marginLeft: 'auto', filter: 'invert(1) brightness(2)' }}>
          <LanguageToggle />
        </div>
      </header>

      {/* ── Hero ── */}
      <main style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px 64px',
        textAlign: 'center',
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 800, lineHeight: 1.1,
          margin: '0 0 14px',
          letterSpacing: '-0.02em',
        }}>
          {t('headline')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, margin: '0 0 48px', lineHeight: 1.5 }}>
          {t('subheadline')}
        </p>

        {/* ── Toggle pill ── */}
        <div style={{
          display: 'inline-flex',
          background: '#132A4A',
          borderRadius: 60,
          padding: 5,
          marginBottom: 36,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['driver', 'passenger'] as Role[]).map((key) => {
            const isActive = active === key;
            const bg       = isActive ? '#00C2A8' : 'transparent';
            const color    = isActive ? '#0B1E3D' : 'rgba(255,255,255,0.5)';
            return (
              <button
                key={key}
                onClick={() => switchTo(key)}
                style={{
                  padding: '10px 36px',
                  borderRadius: 56,
                  background: bg,
                  color,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.22s, color 0.22s',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  letterSpacing: '0.01em',
                }}
              >
                {key === 'driver' ? t('driver_card_title') : t('passenger_card_title')}
              </button>
            );
          })}
        </div>

        {/* ── Animated card ── */}
        <div
          key={displayed}
          className={animClass}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <div style={{
            background: '#1C3557',
            border: '1.5px solid rgba(255,255,255,0.09)',
            borderRadius: 22,
            padding: '40px 36px',
            display: 'flex', flexDirection: 'column',
            gap: 24,
            textAlign: 'left',
          }}>
            {/* Icon badge */}
            <div style={{
              width: 56, height: 56, borderRadius: 15,
              background: role.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {role.icon}
            </div>

            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{ color: '#ffffff', fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                {role.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                {role.description}
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href={role.primaryBtn.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 48, borderRadius: 11,
                  background: role.accentColor,
                  color: '#0B1E3D',
                  fontSize: 15, fontWeight: 700,
                  textDecoration: 'none',
                  letterSpacing: '0.01em',
                }}
              >
                {role.primaryBtn.label}
              </Link>
              <Link
                href={role.secondaryBtn.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 48, borderRadius: 11,
                  border: '1.5px solid rgba(255,255,255,0.22)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 15, fontWeight: 600,
                  textDecoration: 'none',
                  background: 'transparent',
                  letterSpacing: '0.01em',
                }}
              >
                {role.secondaryBtn.label}
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '20px 32px', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
        © 2026 Commuter · Egypt Standard Time (UTC+2)
      </footer>
    </div>
    </>
  );
}