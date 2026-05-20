'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Bookmark, Users, Settings, Shield, LogOut, User, ChevronRight } from 'lucide-react';
import { getName, clearSession } from '@/lib/auth';

const menuItems = [
  { label: 'My Wallet',          icon: Wallet,   href: '/user/wallet' },
  { label: 'Favorite Places',    icon: Bookmark, href: '/user/profile/locations' },
  { label: 'Related Passengers', icon: Users,    href: '/user/profile/passengers' },
  { label: 'Preferences',        icon: Settings, href: '/user/profile/preferences' },
  { label: 'Security',           icon: Shield,   href: '/user/profile/security' },
] as const;

export default function ProfileMobile() {
  const router = useRouter();
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(() => {
    setError(null);
    const storedName = getName() ?? '';
    const storedEmail = typeof window !== 'undefined'
      ? (localStorage.getItem('commuter_email') ?? '')
      : '';
    if (storedName) {
      setName(storedName);
      setEmail(storedEmail);
    } else {
      setError('The route api/profile could not be found.');
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  function handleLogout() {
    clearSession();
    if (typeof window !== 'undefined') localStorage.removeItem('commuter_email');
    router.push('/');
  }

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: '100vh',
        background: '#fff',
        maxWidth: 480,
        margin: '0 auto',
        paddingBottom: 88,
        paddingTop: 32,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Icon + title */}
      <div className="flex flex-col items-center gap-2 px-6 mb-5">
        <div className="w-[72px] h-[72px] rounded-full bg-[#E0F7F4] flex items-center justify-center mb-1">
          <User size={38} color="#00C2A8" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-[#0B1E3D] m-0">Profile</h1>
        <p className="text-sm text-[#94A3B8] text-center m-0">Manage your account settings.</p>
      </div>

      {/* Name / email / error */}
      <div className="flex flex-col items-center gap-1 px-6 mb-7">
        {name  && <p className="text-base font-bold text-[#0B1E3D] m-0">{name}</p>}
        {email && <p className="text-sm text-[#94A3B8] m-0">{email}</p>}
        {error && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-sm text-[#94A3B8] text-center m-0">{error}</p>
            <button
              onClick={loadProfile}
              className="text-[15px] font-semibold text-[#00C2A8] bg-transparent border-none cursor-pointer p-0"
              style={{ fontFamily: 'inherit' }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Menu list */}
      <div className="flex flex-col gap-3 px-5 mb-6">
        {menuItems.map(({ label, icon: Icon, href }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3.5 px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-white no-underline"
          >
            <div className="w-[46px] h-[46px] rounded-xl bg-[#E0F7F4] flex items-center justify-center flex-shrink-0">
              <Icon size={22} color="#00C2A8" strokeWidth={1.8} />
            </div>
            <span className="flex-1 text-base font-semibold text-[#0B1E3D]">{label}</span>
            <ChevronRight size={20} color="#94A3B8" />
          </a>
        ))}
      </div>

      {/* Log out */}
      <div className="px-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border border-[#EF4444] bg-white text-[#EF4444] text-base font-semibold cursor-pointer"
          style={{ fontFamily: 'inherit' }}
        >
          <LogOut size={20} color="#EF4444" />
          Log out
        </button>
      </div>
    </div>
  );
}
