'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Mail, RefreshCw } from 'lucide-react';

interface Step3OtpProps {
  email:         string;
  loading:       boolean;
  resendLoading: boolean;
  error:         string | null;
  onVerify:      (code: string) => void;
  onResend:      () => void;
}

const DIGITS = 6;

export default function Step3Otp({
  email,
  loading,
  resendLoading,
  error,
  onVerify,
  onResend,
}: Step3OtpProps) {
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first box on mount
  useEffect(() => { inputs.current[0]?.focus(); }, []);

  // Submit when all 6 digits are filled
  useEffect(() => {
    if (digits.every(d => d !== '')) {
      onVerify(digits.join(''));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const setDigit = useCallback((index: number, value: string) => {
    setDigits(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setDigit(index, '');
      return;
    }
    // Handle paste of full code
    if (val.length > 1) {
      const pasted = val.slice(0, DIGITS).split('');
      const next = Array(DIGITS).fill('');
      pasted.forEach((c, i) => { next[i] = c; });
      setDigits(next);
      inputs.current[Math.min(pasted.length, DIGITS - 1)]?.focus();
      return;
    }
    setDigit(index, val);
    if (index < DIGITS - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigit(index, '');
      } else if (index > 0) {
        inputs.current[index - 1]?.focus();
        setDigit(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < DIGITS - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    const next = Array(DIGITS).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputs.current[Math.min(pasted.length, DIGITS - 1)]?.focus();
  }

  const code = digits.join('');
  const canSubmit = code.length === DIGITS && !loading;

  return (
    <div>
      {/* Icon + heading */}
      <div
        style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#EFF7F6', border: '2px solid #C0E6E1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Mail size={24} color="#00C2A8" />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0B1E3D', margin: '0 0 6px' }}>
        Verify your email
      </h2>
      <p style={{ fontSize: 14, color: '#5A6A7A', margin: '0 0 24px' }}>
        We sent a 6-digit code to{' '}
        <strong style={{ color: '#0B1E3D' }}>{email}</strong>.
        Enter it below.
      </p>

      {/* OTP boxes */}
      <div
        style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}
        onPaste={handlePaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={d}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onFocus={e => e.target.select()}
            style={{
              width: 48, height: 56,
              border: `2px solid ${error ? '#E74C3C' : d ? '#00C2A8' : '#D1D5DB'}`,
              borderRadius: 12,
              fontSize: 22, fontWeight: 700, textAlign: 'center',
              color: '#0B1E3D', background: '#fff',
              outline: 'none',
              transition: 'border-color 0.15s',
              caretColor: '#00C2A8',
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: '#E74C3C', textAlign: 'center', marginBottom: 16 }}>
          {error}
        </p>
      )}

      {/* Verify button */}
      <button
        type="button"
        onClick={() => canSubmit && onVerify(code)}
        disabled={!canSubmit}
        style={{
          width: '100%', height: 52, borderRadius: 10,
          fontSize: 14, fontWeight: 700,
          background: '#00C2A8', color: '#fff',
          border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: canSubmit ? 1 : 0.55,
          transition: 'opacity 0.15s',
          fontFamily: 'inherit', marginBottom: 16,
        }}
      >
        {loading && <Loader2 size={16} className="spin" />}
        Verify email
      </button>

      {/* Resend */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: '#5A6A7A' }}>Didn&apos;t receive it? </span>
        <button
          type="button"
          onClick={onResend}
          disabled={resendLoading}
          style={{
            background: 'none', border: 'none', cursor: resendLoading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, color: '#00C2A8',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            opacity: resendLoading ? 0.6 : 1, fontFamily: 'inherit', padding: 0,
          }}
        >
          {resendLoading && <Loader2 size={12} className="spin" />}
          {!resendLoading && <RefreshCw size={12} />}
          Resend code
        </button>
      </div>
    </div>
  );
}
