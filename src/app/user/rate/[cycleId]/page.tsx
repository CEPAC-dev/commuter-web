'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRequest } from '@/types/user';
// Mock data removed

const STAR_LABELS = ['', 'Terrible', 'Poor', 'OK', 'Good', 'Excellent'];

interface StarRatingInputProps {
  value: number;
  onChange: (v: number) => void;
}

function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              fontSize: 40,
              lineHeight: 1,
              color: star <= display ? '#F5A623' : '#E2E8F0',
              transition: 'color 0.1s, transform 0.1s',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: star <= display ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {'★'}
          </button>
        ))}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: display ? '#0B1E3D' : '#A0AEC0',
          minHeight: 20,
        }}
      >
        {display ? STAR_LABELS[display] : 'Tap to rate'}
      </div>
    </div>
  );
}

export default function RatePage() {
  const router = useRouter();
  const [stars, setStars] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Find matching completed request
  // TODO: fetch from API endpoint when available
  const requestData: UserRequest | null = null; // mockRequests.find((r) => r.id === params.cycleId && r.status === 'completed');
  const request = requestData || ({
    id: '', status: 'completed' as const, origin: { address: '', lat: 0, lng: 0 },
    destination: { address: '', lat: 0, lng: 0 }, distance_km: 0, duration_minutes: 0,
    route_coordinates: [], trip_type: 'one_way' as const, ride_type: 'shared' as const,
    gender_pref: 'mixed' as const, seat_preference: 'any' as const, walk_minutes: 0 as const,
    days: [], time_slots: [], arrival_from: '', arrival_to: '', departure_from: '', departure_to: '',
    cycle_start_date: '', cycle_end_date: '', base_price: 0, estimated_price_min: 0, estimated_price_max: 0,
    passenger_count: 1, group_type: 'own' as const, group_action: null, pickup_points: [], created_at: '',
    driver_name: 'Driver', driver_rating: 0,
  });

  if (!requestData) {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center', color: '#5A6A7A' }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <p>Cycle not found or already rated.</p>
        <button
          onClick={() => router.push('/user/my-requests')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: '#00C2A8', color: '#0B1E3D', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
        >
          Back to My Requests
        </button>
      </div>
    );
  }

  function handleSubmit() {
    if (!stars) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  }

  function handleSkip() {
    router.push('/user/my-requests');
  }

  if (submitted) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '60px auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '0 16px',
        }}
      >
        <div style={{ fontSize: 56 }}>✅</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0B1E3D' }}>
          Thanks for your feedback!
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A' }}>
          Your rating helps the community.
        </p>
        <button
          onClick={() => router.push('/user/my-requests')}
          style={{
            marginTop: 8,
            padding: '12px 28px',
            border: 'none',
            borderRadius: 10,
            background: '#00C2A8',
            color: '#0B1E3D',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          Back to My Requests
        </button>
      </div>
    );
  }

  const driverInitial = (request.driver_name ?? 'D')[0];

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#0B1E3D' }}>
          How was your ride?
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A' }}>
          {request.origin.address} → {request.destination.address}
          <span style={{ margin: '0 6px' }}>·</span>
          {new Date(request.cycle_start_date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(request.cycle_end_date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Driver card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px',
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#0B1E3D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00C2A8',
            fontWeight: 800,
            fontSize: 28,
          }}
        >
          {driverInitial}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0B1E3D' }}>
          {request.driver_name}
        </div>
        <div style={{ fontSize: 13, color: '#5A6A7A' }}>Your driver this week</div>

        <div style={{ marginTop: 8 }}>
          <StarRatingInput value={stars} onChange={setStars} />
        </div>
      </div>

      {/* Comment */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: '#0B1E3D',
            marginBottom: 8,
          }}
        >
          Add a comment{' '}
          <span style={{ fontWeight: 400, color: '#5A6A7A' }}>(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Great driver, always on time…"
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            fontSize: 14,
            fontFamily: 'inherit',
            color: '#0B1E3D',
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.5,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; e.currentTarget.style.background = '#EFF7F6'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSkip}
          style={{
            flex: 1,
            padding: '12px',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            background: '#fff',
            color: '#5A6A7A',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={!stars || loading}
          style={{
            flex: 2,
            padding: '12px',
            border: 'none',
            borderRadius: 10,
            background: stars ? '#00C2A8' : '#E2E8F0',
            color: stars ? '#0B1E3D' : '#A0AEC0',
            fontWeight: 700,
            fontSize: 14,
            cursor: stars ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            minHeight: 48,
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Submitting…' : 'Submit rating'}
        </button>
      </div>
    </div>
  );
}
