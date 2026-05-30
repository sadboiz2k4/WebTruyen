const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getWalletBalanceApi() {
  const response = await fetch(`${API_BASE}/api/wallet/balance`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function depositWalletApi(amount, reason) {
  const response = await fetch(`${API_BASE}/api/wallet/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount, reason }),
  });
  return parseResponse(response);
}

export async function withdrawWalletApi(amount, reason) {
  const response = await fetch(`${API_BASE}/api/wallet/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount, reason }),
  });
  return parseResponse(response);
}

export async function getWalletTransactionsApi(limit = 20) {
  const response = await fetch(`${API_BASE}/api/wallet/transactions?limit=${limit}`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getDailyStatusApi() {
  const response = await fetch(`${API_BASE}/api/wallet/daily-status`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function checkInApi() {
  const response = await fetch(`${API_BASE}/api/wallet/checkin`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function createVnPayPaymentApi(amountVnd) {
  const response = await fetch(`${API_BASE}/api/wallet/vnpay/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amountVnd }),
  });
  return parseResponse(response);
}

export async function createMoMoPaymentApi(amountVnd) {
  const response = await fetch(`${API_BASE}/api/wallet/momo/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amountVnd }),
  });
  return parseResponse(response);
}

export async function transferWalletApi(toDisplayName, amount, note = '') {
  const response = await fetch(`${API_BASE}/api/wallet/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ toDisplayName, amount, note }),
  });
  return parseResponse(response);
}

export async function requestWithdrawalApi(amount, bankInfo, note = '') {
  const response = await fetch(`${API_BASE}/api/wallet/withdrawal-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount, bankInfo, note }),
  });
  return parseResponse(response);
}

export async function getDonationsReceivedApi(page = 0, limit = 20) {
  const response = await fetch(`${API_BASE}/api/wallet/donations/received?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getWithdrawalRequestsApi(page = 0, limit = 20) {
  const response = await fetch(`${API_BASE}/api/wallet/withdrawal-requests?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });
  return parseResponse(response);
}
