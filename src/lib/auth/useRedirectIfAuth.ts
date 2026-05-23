'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export function useRedirectIfAuth(
  defaultDriver = '/driver/requests',
  defaultUser   = '/user/my-requests',
) {
  const { isAuth, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (isAuth) {
      router.replace(role === 'driver' ? defaultDriver : defaultUser);
    }
  }, [isAuth, role, loading, defaultDriver, defaultUser, router]);

  return { loading, isAuth };
}
