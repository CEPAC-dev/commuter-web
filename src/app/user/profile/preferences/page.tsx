'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PreferencesMobilePage() {
  const router = useRouter();
  const [genderPref,   setGenderPref]   = useState<'mixed' | 'same'>('mixed');
  const [walkMinutes,  setWalkMinutes]  = useState<0 | 5 | 10>(0);
  const [seatPref,     setSeatPref]     = useState<'front' | 'back' | 'any'>('any');

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
        <h1 className="text-base font-bold text-[#0B1E3D]">Preferences</h1>
      </div>

      <div className="px-5 py-6 flex flex-col gap-6">

        {/* Gender preference */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <p className="text-sm font-semibold text-[#0B1E3D] mb-3">Gender preference</p>
          <div className="flex gap-2">
            {(['mixed', 'same'] as const).map((val) => (
              <button
                key={val}
                onClick={() => setGenderPref(val)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${genderPref === val ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D] font-semibold' : 'border-[#D1D5DB] bg-white text-[#5A6A7A]'}`}
                style={{ fontFamily: 'inherit' }}
              >
                {val === 'mixed' ? 'Mixed' : 'Same gender'}
              </button>
            ))}
          </div>
        </div>

        {/* Walk to pickup */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <p className="text-sm font-semibold text-[#0B1E3D] mb-3">Walk to pickup</p>
          <div className="flex flex-col gap-2">
            {([
              [0,  'No walk',  'Door pickup'],
              [5,  '5 min',    '~400 m · -8%'],
              [10, '10 min',   '~800 m · -15%'],
            ] as const).map(([val, title, sub]) => (
              <button
                key={val}
                onClick={() => setWalkMinutes(val)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${walkMinutes === val ? 'border-[#00C2A8] bg-[#EFF7F6]' : 'border-[#E2E8F0] bg-white'}`}
                style={{ fontFamily: 'inherit' }}
              >
                <span className="text-sm font-semibold text-[#0B1E3D]">{title}</span>
                <span className="text-xs text-[#5A6A7A]">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred seat */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <p className="text-sm font-semibold text-[#0B1E3D] mb-1">Preferred seat</p>
          <p className="text-xs text-[#94A3B8] mb-3">{"We'll try to match this, but it's not guaranteed."}</p>
          <div className="flex gap-2">
            {(['front', 'back', 'any'] as const).map((val) => (
              <button
                key={val}
                onClick={() => setSeatPref(val)}
                className={`px-4 py-2 rounded-full text-sm border capitalize transition-colors ${seatPref === val ? 'border-[#00C2A8] bg-[#EFF7F6] text-[#0B1E3D] font-semibold' : 'border-[#D1D5DB] bg-white text-[#5A6A7A]'}`}
                style={{ fontFamily: 'inherit' }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => toast.success('Preferences saved!')}
          className="w-full py-3.5 rounded-2xl bg-[#00C2A8] text-[#0B1E3D] font-semibold text-base"
          style={{ fontFamily: 'inherit' }}
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
