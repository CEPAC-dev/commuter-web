'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  topUp,
  getTransactions,
  getLastBalance,
  deleteTransaction,
  updateTransaction,
  type WalletTransaction,
} from '@/lib/api/wallet';

const QUICK_AMOUNTS = [50, 100, 250, 500];

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
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 400,
        }}
      />
      {/* Dialog */}
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
  onDelete,
  onConfirm,
  onUpdate,
}: {
  tx: WalletTransaction;
  onDelete: (id: number) => void;
  onConfirm: (id: number, updated: WalletTransaction) => void;
  onUpdate: (id: number, updated: WalletTransaction) => void;
}) {
  const [deleting, setDeleting]     = useState(false);
  const [confirming, setConfirming]  = useState(false);
  const [editing, setEditing]        = useState(false);
  const [editAmount, setEditAmount]  = useState(String(tx.transaction_amount));
  const [saving, setSaving]          = useState(false);
  const [showDeleteDlg, setShowDeleteDlg] = useState(false);

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

  async function handleConfirm() {
    setConfirming(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.commuter.site/api';
      const paymentUrl = `${base}/kashier/payment/${tx.id}`;
      onConfirm(tx.id, tx);
      window.location.href = paymentUrl;
      // keep confirming=true so button shows "Redirecting…" while browser navigates
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Redirect failed');
      setConfirming(false);
    }
  }

  async function handleSaveEdit() {
    const amount = Number(editAmount);
    if (!amount || amount < 1) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const res = await updateTransaction(tx.id, {
        operation_type: tx.operation_type,
        transaction_amount: amount,
        reason: tx.reason ?? '',
      });
      onUpdate(tx.id, res.data);
      setEditing(false);
      toast.success('Transaction updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {showDeleteDlg && (
        <ConfirmDialog
          title="Delete transaction?"
          message={`Are you sure you want to delete this EGP ${Number(tx.transaction_amount).toFixed(2)} ${tx.operation_type}? This cannot be undone.`}
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          confirmColor="#E74C3C"
          onConfirm={() => { setShowDeleteDlg(false); handleDelete(); }}
          onCancel={() => setShowDeleteDlg(false)}
        />
      )}
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

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input
            type="number"
            min={1}
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              height: 40,
              border: '1.5px solid #00C2A8',
              borderRadius: 8,
              padding: '0 10px',
              fontSize: 15,
              fontWeight: 700,
              color: '#0B1E3D',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            style={{ height: 40, padding: '0 14px', border: 'none', borderRadius: 8, background: '#00C2A8', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setEditAmount(String(tx.transaction_amount)); }}
            style={{ height: 40, padding: '0 12px', border: '1.5px solid #D4DCE8', borderRadius: 8, background: '#fff', color: '#5A6A7A', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1E3D' }}>
          EGP {Number(tx.transaction_amount).toFixed(2)}
        </div>
      )}

      <div style={{ fontSize: 12, color: '#8A9AB0' }}>
        {formatDate(tx.created_at)}
      </div>

      {tx.status === 'pending' && !editing && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {/* Confirm payment */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            style={{
              flex: 1,
              padding: '11px 0',
              border: '1.5px solid #00C2A8',
              borderRadius: 10,
              background: '#fff',
              color: '#00C2A8',
              fontWeight: 700,
              fontSize: 14,
              cursor: confirming ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              opacity: confirming ? 0.6 : 1,
            }}
          >
            <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="16" height="13" rx="2.5" stroke="#00C2A8"/>
              <rect x="0.5" y="3.5" width="16" height="3" fill="#00C2A8" stroke="#00C2A8"/>
            </svg>
            {confirming ? 'Redirecting…' : 'Confirm payment'}
          </button>
          {/* Edit */}
          <button
            onClick={() => setEditing(true)}
            style={{
              width: 44,
              height: 44,
              border: '1.5px solid #00C2A8',
              borderRadius: 10,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Edit amount"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.586 1.586a2 2 0 0 1 2.828 2.828l-9 9A2 2 0 0 1 3 14H1v-2a2 2 0 0 1 .586-1.414l9-9z" stroke="#00C2A8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Delete */}
          <button
            onClick={() => setShowDeleteDlg(true)}
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
    </>
  );
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTopUpDlg, setShowTopUpDlg] = useState(false);
  const [showPendingDlg, setShowPendingDlg] = useState(false);

  const finalAmount = selectedAmount ?? (customAmount ? parseInt(customAmount) || 0 : 0);
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const maxPendingReached = pendingCount >= 2;

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
    setShowTopUpDlg(true);
  }

  async function doTopUp() {
    setShowTopUpDlg(false);
    if (maxPendingReached) {
      setShowPendingDlg(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await topUp(finalAmount);
      setTransactions((prev) => [res.data, ...prev]);
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
  }

  async function handleConfirm(id: number, updated: WalletTransaction) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    // Refresh balance
    try {
      const balRes = await getLastBalance();
      setBalance(balRes.data.last_balance);
    } catch { /* silent */ }
  }

  function handleUpdate(id: number, updated: WalletTransaction) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, padding: '0 4px' }}>
      {showTopUpDlg && (
        <ConfirmDialog
          title="Confirm top up?"
          message={`You are about to top up EGP ${Number(finalAmount).toFixed(2)}. You will need to confirm payment after this.`}
          confirmLabel="Top up"
          confirmColor="#00C2A8"
          onConfirm={doTopUp}
          onCancel={() => setShowTopUpDlg(false)}
        />
      )}
      {showPendingDlg && (
        <ConfirmDialog
          title="Pending transactions"
          message={`You already have ${pendingCount} pending transaction${pendingCount > 1 ? 's' : ''}. Confirm, update, or delete them before topping up again.`}
          confirmLabel="OK"
          confirmColor="#00C2A8"
          onConfirm={() => setShowPendingDlg(false)}
          onCancel={() => setShowPendingDlg(false)}
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
            <TransactionCard
              key={tx.id}
              tx={tx}
              onDelete={handleDelete}
              onConfirm={handleConfirm}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}
