import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface WalletTransaction {
  id: number;
  user_id: number;
  operation_type: string;
  transaction_amount: number;
  balance_after: number;
  reason: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TopUpResponse {
  status: string;
  payment_url: string;
  data: WalletTransaction;
}

export async function topUp(amount: number): Promise<TopUpResponse> {
  const res = await fetch(`${API_BASE}/wallets/store`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Top up failed' }));
    throw new Error(err.message ?? 'Top up failed');
  }
  return res.json();
}

export async function getTransactions(): Promise<{ status: string; data: WalletTransaction[] }> {
  const res = await fetch(`${API_BASE}/wallets`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch transactions' }));
    throw new Error(err.message ?? 'Failed to fetch transactions');
  }
  return res.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/wallets/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(err.message ?? 'Delete failed');
  }
}

export async function getLastBalance(): Promise<{
  status: string;
  data: { user_id: number; last_balance: number };
}> {
  const res = await fetch(`${API_BASE}/wallets/last-balance`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch balance' }));
    throw new Error(err.message ?? 'Failed to fetch balance');
  }
  return res.json();
}

export async function getTransaction(id: number): Promise<{
  status: string;
  data: WalletTransaction;
}> {
  const res = await fetch(`${API_BASE}/wallets/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch transaction' }));
    throw new Error(err.message ?? 'Failed to fetch transaction');
  }
  return res.json();
}

export async function updateTransaction(
  id: number,
  payload: { operation_type: string; transaction_amount: number; reason?: string },
): Promise<{ status: string; data: WalletTransaction }> {
  const res = await fetch(`${API_BASE}/wallets/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(err.message ?? 'Update failed');
  }
  return res.json();
}
