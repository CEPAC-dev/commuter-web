'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LocationsMobilePage() {
  const router = useRouter();
  const t = useTranslations('profile_mobile');

  useEffect(() => {
    if (window.innerWidth >= 768) router.replace('/user/profile');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 88 }}>
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-[#E2E8F0]">
        <Link href="/user/profile" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9]">
          <ArrowLeft size={20} color="#0B1E3D" />
        </Link>
        <h1 className="text-base font-bold text-[#0B1E3D]">{t('favorite_places')}</h1>
      </div>

      <div className="px-5 py-6 flex flex-col items-center gap-3 text-center">
        <span className="text-5xl">📍</span>
        <p className="text-sm font-semibold text-[#0B1E3D]">{t('locations_empty')}</p>
        <p className="text-xs text-[#5A6A7A] max-w-[240px]">
          {t('locations_empty_desc')}
        </p>
      </div>
    </div>
  );
}
