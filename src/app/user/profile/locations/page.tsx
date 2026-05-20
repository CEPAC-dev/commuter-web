'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LocationsMobilePage() {
  const router = useRouter();

  useEffect(() => {
    if (window.innerWidth >= 768) router.replace('/user/profile');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 88 }}>
      {/* Back header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-[#E2E8F0]">
        <Link href="/user/profile" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9]">
          <ArrowLeft size={20} color="#0B1E3D" />
        </Link>
        <h1 className="text-base font-bold text-[#0B1E3D]">Favorite Places</h1>
      </div>

      <div className="px-5 py-6 flex flex-col items-center gap-3 text-center">
        <span className="text-5xl">📍</span>
        <p className="text-sm font-semibold text-[#0B1E3D]">No saved locations yet.</p>
        <p className="text-xs text-[#5A6A7A] max-w-[240px]">
          Save your home, work, and other frequent destinations for faster trip planning.
        </p>
      </div>
    </div>
  );
}
