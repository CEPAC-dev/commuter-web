'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WalletMobilePage() {
  const router = useRouter();

  useEffect(() => {
    if (window.innerWidth >= 768) router.replace('/user/wallet');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 88 }}>
      {/* Back header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-[#E2E8F0]">
        <Link href="/user/profile" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9]">
          <ArrowLeft size={20} color="#0B1E3D" />
        </Link>
        <h1 className="text-base font-bold text-[#0B1E3D]">My Wallet</h1>
      </div>

      <div className="px-5 py-6">
        {/* Balance card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center mb-4">
          <div className="text-4xl font-extrabold text-[#F5A623] leading-none">0</div>
          <div className="text-sm text-[#5A6A7A] mt-1">EGP</div>
          <p className="text-xs text-[#94A3B8] mt-2">Available balance</p>
        </div>
        <Link
          href="/user/wallet"
          className="block w-full py-3.5 rounded-2xl bg-[#00C2A8] text-[#0B1E3D] font-semibold text-base text-center no-underline"
        >
          Add funds
        </Link>
      </div>
    </div>
  );
}
