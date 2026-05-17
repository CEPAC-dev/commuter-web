'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestIndexPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/user/request/new'); }, [router]);
  return null;
}
