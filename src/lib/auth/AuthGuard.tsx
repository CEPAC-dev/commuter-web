'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export default function AuthGuard({
  role,
  children,
}: {
  role: 'driver' | 'user';
  children: React.ReactNode;
}) {
  const { isAuth, role: userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuth) {
      router.replace(role === 'driver' ? '/driver/sign-in' : '/sign-in');
      return;
    }
    if (userRole !== role) {
      router.replace(userRole === 'driver' ? '/driver/my-requests' : '/user/my-requests');
    }
  }, [isAuth, userRole, loading, role, router]);

  if (loading || !isAuth || userRole !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
        <div
          style={{
            width: 32, height: 32,
            border: '2px solid #00C2A8',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
