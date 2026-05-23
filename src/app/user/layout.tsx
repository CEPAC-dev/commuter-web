'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import UserNavbar from '@/components/layout/UserNavbar';
import BottomNav from '@/components/layout/BottomNav';
import { RequestWizardProvider } from '@/lib/RequestWizardContext';
import AuthGuard from '@/lib/auth/AuthGuard';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMapPage =
    pathname.startsWith('/user/request/map') ||
    pathname.startsWith('/user/request/return-map');
  const isFullBleedPage = isMapPage;
  const isOnboardingPage = pathname.startsWith('/user/onboarding');
  const isTripPage = pathname.startsWith('/user/trip/');

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = ''; };
  }, []);

  // Onboarding wizard pages: full-screen, no navbar, no bottom nav
  if (isOnboardingPage || isTripPage) {
    return (
      <AuthGuard role="user">
        <RequestWizardProvider>
          <Toaster position="top-right" />
          {children}
        </RequestWizardProvider>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard role="user">
    <RequestWizardProvider>
      <div style={{ minHeight: '100vh', background: isFullBleedPage ? 'transparent' : '#F8F9FA', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>
        <Toaster position="top-right" />
        <UserNavbar />
        {isFullBleedPage ? (
          // Full-bleed pages: no padding, no max-width
          <main style={{ position: 'relative' }}>
            {children}
          </main>
        ) : (
          <main
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 16,
              paddingBottom: 80,
            }}
            className="sm:px-6 sm:pt-8 sm:pb-8"
          >
            {children}
          </main>
        )}
        <BottomNav />
      </div>
    </RequestWizardProvider>
    </AuthGuard>
  );
}

