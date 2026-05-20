'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  topUp,
  getTransactions,
  getLastBalance,
  deleteTransaction,
  type WalletTransaction,
} from '@/lib/api/wallet';

const QUICK_AMOUNTS = [50, 100, 250, 500];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  const colorMap: Record<string, { bg: string; color: string }> = {
    PENDING:   { bg: '#FFF3E0', color: '#F57C00' },
    COMPLETED: { bg: '#E8F5E9', color: '#2E7D32' },
    FAILED:    { bg: '#FFEBEE', color: '#C62828' },
  };
  const style = colorMap[upper] ?? { bg: '#F5F5F5', color: '#555' };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
        padding: '3px 10px',
        borderRadius: 20,
        background: style.bg,
        color: style.color,
      }}
    >
      {upper}
    </span>
  );
}

function TransactionCard({
  tx,
  paymentUrl,
  onDelete,
}: {
  tx: WalletTransaction;
  paymentUrl?: string;
  onDelete: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTransaction(tx.id);
      onDelete(tx.id);
      toast.success('Transaction deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  function handleConfirmPayment() {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D', textTransform: 'capitalize' }}>
          {tx.operation_type}
        </span>
        <StatusBadge status={tx.status} />
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1E3D' }}>
        EGP {Number(tx.transaction_amount).toFixed(2)}
      </div>

      <div style={{ fontSize: 12, color: '#8A9AB0' }}>
        {formatDate(tx.created_at)}
      </div>

      {tx.status === 'pending' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={handleConfirmPayment}
            disabled={!paymentUrl}
            style={{
              flex: 1,
              padding: '11px 0',
              border: '1.5px solid #00C2A8',
              borderRadius: 10,
              background: '#fff',
              color: '#00C2A8',
              fontWeight: 700,
              fontSize: 14,
              cursor: paymentUrl ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              opacity: paymentUrl ? 1 : 0.5,
            }}
          >
            <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="16" height="13" rx="2.5" stroke="#00C2A8"/>
              <rect x="0.5" y="3.5" width="16" height="3" fill="#00C2A8" stroke="#00C2A8"/>
            </svg>
            Confirm payment
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              width: 44,
              height: 44,
              border: '1.5px solid #E74C3C',
              borderRadius: 10,
              background: '#fff',
              color: '#E74C3C',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: deleting ? 0.5 : 1,
            }}
            aria-label="Delete transaction"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4M6.667 7.333v4M9.333 7.333v4M3.333 4l.667 9.333A1.333 1.333 0 0 0 5.333 14.667h5.334a1.333 1.333 0 0 0 1.333-1.334L12.667 4" stroke="#E74C3C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [paymentUrls, setPaymentUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const finalAmount = selectedAmount ?? (customAmount ? parseInt(customAmount) || 0 : 0);

  useEffect(() => {
    async function load() {
      try {
        const [balRes, txRes] = await Promise.all([
          getLastBalance(),
          getTransactions(),
        ]);
        setBalance(balRes.data.last_balance);
        setTransactions(txRes.data);
      } catch {
        toast.error('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleTopUp() {
    if (!finalAmount || finalAmount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const res = await topUp(finalAmount);
      setTransactions((prev) => [res.data, ...prev]);
      if (res.payment_url) {
        setPaymentUrls((prev) => ({ ...prev, [res.data.id]: res.payment_url }));
      }
      setSelectedAmount(null);
      setCustomAmount('');
      toast.success('Top-up initiated — confirm payment to complete');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Top up failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(id: number) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setPaymentUrls((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, padding: '0 4px' }}>
      {/* Balance card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #E6FAF7 0%, #D0F5F0 100%)',
          borderRadius: 18,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#00C2A8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="5" width="26" height="18" rx="3" stroke="white" strokeWidth="2"/>
            <path d="M1 10h26" stroke="white" strokeWidth="2"/>
            <rect x="18" y="14" width="6" height="4" rx="1" fill="white"/>
          </svg>
        </div>
        <div style={{ fontSize: 13, color: '#5A7A75', fontWeight: 500, marginTop: 4 }}>
          Available balance
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#0B1E3D', letterSpacing: '-0.02em' }}>
          {loading ? '—' : `EGP ${Number(balance).toFixed(2)}`}
        </div>
      </div>

      {/* Top up section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>Top up amount</div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setSelectedAmount(a === selectedAmount ? null : a); setCustomAmount(''); }}
              style={{
                padding: '10px 18px',
                border: `1.5px solid ${selectedAmount === a ? '#00C2A8' : '#D4DCE8'}`,
                borderRadius: 10,
                background: selectedAmount === a ? '#E6FAF7' : '#fff',
                color: selectedAmount === a ? '#00917D' : '#4A5A6A',
                fontWeight: selectedAmount === a ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: 44,
                transition: 'all 0.15s',
              }}
            >
              EGP {a}
            </button>
          ))}
        </div>

        {/* Custom amount input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            border: '1.5px solid #D4DCE8',
            borderRadius: 12,
            background: '#fff',
            minHeight: 52,
          }}
        >
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.75" y="3.75" width="18.5" height="13.5" rx="2.25" stroke="#8A9AB0" strokeWidth="1.5"/>
            <path d="M0.75 7.75h18.5" stroke="#8A9AB0" strokeWidth="1.5"/>
            <rect x="13" y="10.5" width="4.5" height="3" rx="0.75" fill="#8A9AB0"/>
          </svg>
          <input
            type="number"
            min={1}
            placeholder="Amount (EGP)"
            value={customAmount}
            onChange={(e) => {
              const val = e.target.value;
              setCustomAmount(val);
              const num = parseInt(val);
              if (QUICK_AMOUNTS.includes(num)) {
                setSelectedAmount(num);
              } else {
                setSelectedAmount(null);
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#0B1E3D',
              fontFamily: 'inherit',
              background: 'transparent',
              minHeight: 44,
            }}
          />
        </div>

        {/* Top up button */}
        <button
          onClick={handleTopUp}
          disabled={submitting || !finalAmount}
          style={{
            width: '100%',
            padding: '15px 0',
            border: 'none',
            borderRadius: 12,
            background: submitting || !finalAmount ? '#A0D8D1' : '#00C2A8',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            cursor: submitting || !finalAmount ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            transition: 'background 0.15s',
          }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.75" y="0.75" width="18.5" height="14.5" rx="2.25" stroke="white" strokeWidth="1.5"/>
            <path d="M0.75 5.5h18.5" stroke="white" strokeWidth="1.5"/>
            <rect x="13" y="8.5" width="4.5" height="3" rx="0.75" fill="white"/>
          </svg>
          {submitting ? 'Processing…' : 'Top up'}
        </button>
      </div>

      {/* Transactions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>Your transactions</div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#8A9AB0', fontSize: 14 }}>
            Loading…
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#8A9AB0', fontSize: 14 }}>
            No transactions yet
          </div>
        ) : (
          transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              tx={tx}
              paymentUrl={paymentUrls[tx.id]}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
