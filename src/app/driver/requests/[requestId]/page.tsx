'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
// Mock data removed
import RequestDetailModal from '@/components/driver/RequestDetailModal';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { DriverCycleRequest } from '@/types/driver';

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params?.requestId as string;
  const [requests, setRequests] = useState<DriverCycleRequest[]>([]); // TODO: fetch from API

  const request = requests.find((r) => r.id === requestId) ?? null;

  const handleAccept = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'confirmed' as const } : r));
    toast.success('Request accepted!');
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' as const } : r));
    toast.success('Request rejected.');
  };

  const handleRaise = (id: string) => {
    // Would open raise modal — here we redirect up
    toast(`Use the requests list to raise price for ${id}`);
  };

  if (!request) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Request not found.</p>
        <Link href="/driver/requests" className="mt-4 inline-block text-secondary hover:underline">
          ← Back to requests
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/driver/requests" className="text-secondary text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded">
        ← Back to requests
      </Link>
      {/* Render as inline (always open) modal using a wrapper */}
      <div className="mt-4">
        <RequestDetailModal
          request={request}
          isOpen={true}
          onClose={() => window.history.back()}
          onAccept={handleAccept}
          onReject={handleReject}
          onRaise={handleRaise}
        />
      </div>
    </div>
  );
}
