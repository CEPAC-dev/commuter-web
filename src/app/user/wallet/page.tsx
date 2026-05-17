'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { WalletTransaction } from '@/types/user';
// Mock data removed
import BottomSheet from '@/components/shared/BottomSheet';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const PAYMENT_METHODS = ['Fawry', 'Vodafone Cash', 'Bank transfer'];

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isIncoming = tx.amount > 0;
  const colorMap = {
    top_up: '#27AE60',
    refund: '#00C2A8',
    payment: '#E74C3C',
  };
  const arrowColor = colorMap[tx.type];
  const arrowIcon = isIncoming ? '↑' : '↓';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid #F8F9FA',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Arrow icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isIncoming ? `${arrowColor}20` : '#FFEBEE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: arrowColor,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {arrowIcon}
      </div>

      {/* Description */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D' }}>{tx.description}</div>
        <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 1 }}>{tx.date}</div>
      </div>

      {/* Amount + balance */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: arrowColor }}>
          {isIncoming ? '+' : ''}EGP {Math.abs(tx.amount)}
        </div>
        <div style={{ fontSize: 11, color: '#5A6A7A', marginTop: 1 }}>
          Balance: EGP {tx.balance}
        </div>
      </div>
    </div>
  );
}

function TopUpModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const finalAmount = useCustom ? parseInt(customAmount) || 0 : selectedAmount ?? 0;

  function handleConfirm() {
    if (!finalAmount || finalAmount < 10) {
      toast.error('Please enter a valid amount (min EGP 10)');
      return;
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    onConfirm(finalAmount);
    onClose();
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Amount selection */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
          Select amount
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setSelectedAmount(a); setUseCustom(false); }}
              style={{
                padding: '8px 14px',
                border: `1.5px solid ${!useCustom && selectedAmount === a ? '#00C2A8' : '#E2E8F0'}`,
                borderRadius: 8,
                background: !useCustom && selectedAmount === a ? '#00C2A8' : '#fff',
                color: !useCustom && selectedAmount === a ? '#0B1E3D' : '#5A6A7A',
                fontWeight: !useCustom && selectedAmount === a ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: 44,
              }}
            >
              EGP {a}
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            style={{
              padding: '8px 14px',
              border: `1.5px solid ${useCustom ? '#00C2A8' : '#E2E8F0'}`,
              borderRadius: 8,
              background: useCustom ? '#00C2A8' : '#fff',
              color: useCustom ? '#0B1E3D' : '#5A6A7A',
              fontWeight: useCustom ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          >
            Custom
          </button>
        </div>
      </div>

      {useCustom && (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 6 }}>
            Custom amount (EGP)
          </label>
          <input
            type="number"
            min={10}
            placeholder="Enter amount…"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: '#0B1E3D', outline: 'none', minHeight: 44 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#00C2A8'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
          />
        </div>
      )}

      {/* Payment method */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
          Payment method
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                border: `1.5px solid ${paymentMethod === m ? '#00C2A8' : '#E2E8F0'}`,
                borderRadius: 8,
                cursor: 'pointer',
                background: paymentMethod === m ? '#EFF7F6' : '#fff',
                minHeight: 48,
              }}
            >
              <input
                type="radio"
                name="payment"
                value={m}
                checked={paymentMethod === m}
                onChange={() => setPaymentMethod(m)}
                style={{ accentColor: '#00C2A8', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0B1E3D' }}>{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div
        style={{
          padding: '10px 14px',
          background: '#EFF7F6',
          borderRadius: 8,
          fontSize: 12,
          color: '#5A6A7A',
        }}
      >
        ⓘ Payment gateway coming soon. This UI is for preview only.
      </div>

      <button
        onClick={handleConfirm}
        style={{
          width: '100%',
          padding: '14px',
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
        Confirm top-up
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        {isOpen && (
          <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
            <div
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 201, background: '#fff', borderRadius: 16, padding: 28,
                width: 480, maxWidth: '90vw', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0B1E3D' }}>Add funds to wallet</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#5A6A7A', minWidth: 44, minHeight: 44, fontSize: 18 }}>✕</button>
              </div>
              {content}
            </div>
          </>
        )}
      </div>
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Add funds to wallet">
          {content}
        </BottomSheet>
      </div>
    </>
  );
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0); // TODO: fetch from API
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]); // TODO: fetch from API
  const [topUpOpen, setTopUpOpen] = useState(false);

  function handleTopUp(amount: number) {
    const newBalance = balance + amount;
    setBalance(newBalance);
    const newTx: WalletTransaction = {
      id: `t-${Date.now()}`,
      type: 'top_up',
      amount,
      description: 'Wallet top-up',
      date: new Date().toISOString().split('T')[0],
      balance: newBalance,
    };
    setTransactions([newTx, ...transactions]);
    toast.success(`EGP ${amount} added to your wallet`);
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Balance card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '28px 32px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Wallet Balance
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#F5A623', lineHeight: 1 }}>
          EGP {balance.toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTopUpOpen(true)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 10,
              background: '#00C2A8',
              color: '#0B1E3D',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          >
            + Add funds
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1E3D' }}>
            Transaction History
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#5A6A7A', fontSize: 14 }}>
            No transactions yet
          </div>
        ) : (
          transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>

      <TopUpModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onConfirm={handleTopUp}
      />
    </div>
  );
}
