'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import ChangePasswordModal from '@/components/user/profile/ChangePasswordModal';

export default function SecurityMobilePage() {
  const router = useRouter();
  const [changePwOpen, setChangePwOpen] = useState(false);

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
        <h1 className="text-base font-bold text-[#0B1E3D]">Security</h1>
      </div>

      <div className="px-5 py-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#0B1E3D]">Password</p>
              <p className="text-xs text-[#5A6A7A] mt-0.5">Change your account password</p>
            </div>
            <button
              onClick={() => setChangePwOpen(true)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0B1E3D] hover:bg-[#F8F9FA] flex-shrink-0"
              style={{ fontFamily: 'inherit' }}
            >
              Change
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  );
}
