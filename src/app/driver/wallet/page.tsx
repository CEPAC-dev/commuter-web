'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import driverApi from '@/lib/api/driver';

const QUICK_AMOUNTS = [50, 100, 250, 500];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverTransaction {
  id: number;
  operation_type: string;
  transaction_amount: number;
  balance_after?: number;
  reason?: string | null;
  status: string;
  created_at: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 400,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(88vw, 340px)',
          background: '#fff',
          borderRadius: 20,
          padding: '28px 24px 22px',
          zIndex: 401,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0B1E3D' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 8 }}>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#00C2A8', fontFamily: 'inherit', padding: '4px 0' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: confirmColor, fontFamily: 'inherit', padding: '4px 0' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

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
    SUCCESS:   { bg: '#E8F5E9', color: '#2E7D32' },
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

function TransactionCard({ tx }: { tx: DriverTransaction }) {
  const isDebit = tx.operation_type?.toLowerCase().includes('withdraw') || tx.operation_type?.toLowerCase().includes('debit');
  const amountColor = isDebit ? '#E74C3C' : '#2E7D32';
  const amountPrefix = isDebit ? '−' : '+';

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
          {tx.operation_type ?? 'Transaction'}
        </span>
        <StatusBadge status={tx.status} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: amountColor }}>
        {amountPrefix} EGP {Number(tx.transaction_amount).toFixed(2)}
      </div>
      {tx.balance_after != null && (
        <div style={{ fontSize: 12, color: '#8A9AB0' }}>
          Balance after: EGP {Number(tx.balance_after).toFixed(2)}
        </div>
      )}
      {tx.reason && (
        <div style={{ fontSize: 12, color: '#8A9AB0' }}>{tx.reason}</div>
      )}
      <div style={{ fontSize: 12, color: '#8A9AB0' }}>
        {formatDate(tx.created_at)}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DriverWalletPage() {
  const [balance, setBalance]             = useState<number>(0);
  const [transactions, setTransactions]   = useState<DriverTransaction[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount]   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [showWithdrawDlg, setShowWithdrawDlg] = useState(false);

  const finalAmount = selectedAmount ?? (customAmount ? parseInt(customAmount) || 0 : 0);

  useEffect(() => {
    async function load() {
      try {
        const res = await driverApi.getWallet() as {
          data?: { balance?: number; transactions?: DriverTransaction[] };
          balance?: number;
          transactions?: DriverTransaction[];
        };
        // Handle different possible response shapes
        const data = res?.data ?? res ?? {};
        setBalance(Number((data as { balance?: number }).balance ?? 0));
        setTransactions(Array.isArray((data as { transactions?: DriverTransaction[] }).transactions)
          ? (data as { transactions?: DriverTransaction[] }).transactions!
          : []);
      } catch {
        toast.error('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleWithdraw() {
    if (!finalAmount || finalAmount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (finalAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    setShowWithdrawDlg(true);
  }

  async function doWithdraw() {
    setShowWithdrawDlg(false);
    setSubmitting(true);
    try {
      await driverApi.withdraw(finalAmount);
      // Refresh wallet after withdrawal
      const res = await driverApi.getWallet() as {
        data?: { balance?: number; transactions?: DriverTransaction[] };
        balance?: number;
        transactions?: DriverTransaction[];
      };
      const data = res?.data ?? res ?? {};
      setBalance(Number((data as { balance?: number }).balance ?? 0));
      setTransactions(Array.isArray((data as { transactions?: DriverTransaction[] }).transactions)
        ? (data as { transactions?: DriverTransaction[] }).transactions!
        : []);
      setSelectedAmount(null);
      setCustomAmount('');
      toast.success('Withdrawal requested successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, padding: '0 4px' }}>
      {showWithdrawDlg && (
        <ConfirmDialog
          title="Confirm withdrawal?"
          message={`You are about to withdraw EGP ${Number(finalAmount).toFixed(2)} from your earnings.`}
          confirmLabel="Withdraw"
          confirmColor="#00C2A8"
          onConfirm={doWithdraw}
          onCancel={() => setShowWithdrawDlg(false)}
        />
      )}

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
          Your earnings
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#0B1E3D', letterSpacing: '-0.02em' }}>
          {loading ? '—' : `EGP ${Number(balance).toFixed(2)}`}
        </div>
      </div>

      {/* Withdraw section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>Withdraw amount</div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => {
                if (a === selectedAmount) {
                  setSelectedAmount(null);
                  setCustomAmount('');
                } else {
                  setSelectedAmount(a);
                  setCustomAmount(String(a));
                }
              }}
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

        {/* Withdraw button */}
        <button
          onClick={handleWithdraw}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {submitting ? 'Processing…' : 'Withdraw'}
        </button>
      </div>

      {/* Transactions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
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
            <TransactionCard key={tx.id} tx={tx} />
          ))
        )}
      </div>
    </div>
  );
}
