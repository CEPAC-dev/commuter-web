'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogOut, User, Wallet, Bell } from 'lucide-react';
import { getName, clearSession } from '@/lib/auth';
import LanguageToggle from './LanguageToggle';

export default function UserNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMapPage = pathname.startsWith('/user/request/map') || pathname.startsWith('/user/request/return-map');

  const LINKS = [
    { label: 'Create request', href: '/user/request/new', isCreate: true },
    { label: 'My Requests',    href: '/user/my-requests', isCreate: false },
    { label: 'Profile',        href: '/user/profile',     isCreate: false },
  ];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = 0; // TODO: fetch from API when notifications endpoint available

  useEffect(() => {
    const n = getName();
    if (n) setUserName(n);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  const initials = userName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <style>{`
        .unav-link { text-decoration: none; transition: color 0.15s; position: relative; padding-bottom: 4px; }
        .unav-drop-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 14px; font-weight: 500; text-decoration: none; width: 100%; background: none; border: none; cursor: pointer; font-family: inherit; color: #0B1E3D; border-radius: 6px; }
        .unav-drop-item:hover { background: #EFF7F6; }
        .unav-drop-danger:hover { background: #FEF2F2; color: #E74C3C; }
      `}</style>

      {/* Desktop only */}
      <nav
        dir="ltr"
        className={`hidden md:flex ${isMapPage ? 'navbar-glass' : ''}`}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 64,
          background: isMapPage ? undefined : '#fff',
          borderBottom: isMapPage ? undefined : '1px solid #E2E8F0',
          alignItems: 'center',
          padding: '0 32px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Logo — left */}
        <Link
          href="/user/my-requests"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#0B1E3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#00C2A8', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>
              C
            </span>
          </div>
          <span style={{ color: '#0B1E3D', fontWeight: 700, fontSize: 18 }}>commuter</span>
        </Link>

        {/* Center nav links */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 36,
          }}
        >
          {LINKS.map(({ label, href, isCreate }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="unav-link"
                style={{
                  fontSize: 15,
                  fontWeight: active ? 600 : 500,
                  color: isCreate
                    ? active ? '#00C2A8' : '#009E8A'
                    : active ? '#0B1E3D' : '#5A6A7A',
                  borderBottom: active
                    ? `2px solid ${isCreate ? '#00C2A8' : '#00C2A8'}`
                    : '2px solid transparent',
                  paddingBottom: 4,
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: language toggle + user avatar + dropdown */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
          <LanguageToggle />
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          >
            {/* Avatar with notification dot */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#0B1E3D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00C2A8',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {initials}
              </div>
              {unreadCount > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    background: '#E74C3C',
                    borderRadius: '50%',
                    border: '2px solid #fff',
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0B1E3D' }}>{userName}</span>
            <ChevronDown
              size={14}
              color="#5A6A7A"
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 200,
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              <Link href="/user/profile" className="unav-drop-item" onClick={() => setDropdownOpen(false)}>
                <User size={16} />
                Profile
              </Link>
              <Link href="/user/wallet" className="unav-drop-item" onClick={() => setDropdownOpen(false)}>
                <Wallet size={16} />
                Wallet
              </Link>
              <Link href="/user/notifications" className="unav-drop-item" onClick={() => setDropdownOpen(false)}>
                <Bell size={16} />
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: '#E74C3C',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '1px 6px',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
              <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
              <button className="unav-drop-item unav-drop-danger" onClick={handleLogout}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
        </div>
      </nav>
    </>
  );
}
