'use client';

import { useMediaQuery } from '@/lib/useMediaQuery';
import ProfileDesktop from './ProfileDesktop';
import ProfileMobile from './ProfileMobile';

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-24 bg-[#E2E8F0] rounded-2xl mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#E2E8F0] rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-[#E2E8F0] rounded-2xl mb-4" />
      <div className="h-32 bg-[#E2E8F0] rounded-2xl" />
    </div>
  );
}

export default function ProfilePageLayout() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Render skeleton until screen size is known — prevents layout flash
  if (isDesktop === null) return <ProfileSkeleton />;

  return isDesktop ? <ProfileDesktop /> : <ProfileMobile />;
}
