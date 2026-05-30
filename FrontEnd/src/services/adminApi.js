const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Lỗi không xác định.';
    throw new Error(message);
  }
  return data;
}

export async function getAdminStatsApi() {
  return parseResponse(await fetch(`${API_BASE}/api/admin/stats`, { credentials: 'include' }));
}

export async function getAdminUsersApi(page = 0, size = 20) {
  return parseResponse(await fetch(`${API_BASE}/api/admin/users?page=${page}&size=${size}`, { credentials: 'include' }));
}

export async function setUserStatusApi(userId, status) {
  return parseResponse(await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }));
}

export async function getAdminComicsApi(page = 0, size = 20, status = '') {
  const params = new URLSearchParams({ page, size, ...(status ? { status } : {}) });
  return parseResponse(await fetch(`${API_BASE}/api/admin/comics?${params}`, { credentials: 'include' }));
}

export async function setComicStatusApi(comicId, status) {
  return parseResponse(await fetch(`${API_BASE}/api/admin/comics/${comicId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }));
}

export async function deleteAdminComicApi(comicId) {
  return parseResponse(await fetch(`${API_BASE}/api/admin/comics/${comicId}`, {
    method: 'DELETE',
    credentials: 'include',
  }));
}

export async function getAdminReportsApi(page = 0, size = 20, status = '') {
  const params = new URLSearchParams({ page, size, ...(status ? { status } : {}) });
  return parseResponse(await fetch(`${API_BASE}/api/admin/reports?${params}`, { credentials: 'include' }));
}

export async function getAdminReportDetailApi(reportId, scope = 'CONTENT') {
  const params = new URLSearchParams({ scope });
  return parseResponse(await fetch(`${API_BASE}/api/admin/reports/${reportId}?${params}`, { credentials: 'include' }));
}

export async function resolveReportApi(reportId, status, scope = 'CONTENT', note = '') {
  return parseResponse(await fetch(`${API_BASE}/api/admin/reports/${reportId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, scope, note }),
  }));
}

export async function getAdminAppealsApi(page = 0, size = 20, status = '') {
  const params = new URLSearchParams({ page, size, ...(status ? { status } : {}) });
  return parseResponse(await fetch(`${API_BASE}/api/admin/report-appeals?${params}`, { credentials: 'include' }));
}

export async function resolveAppealApi(appealId, status, note = '') {
  return parseResponse(await fetch(`${API_BASE}/api/admin/report-appeals/${appealId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  }));
}

export async function deleteAdminCommentApi(commentId) {
  return parseResponse(await fetch(`${API_BASE}/api/admin/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  }));
}

export async function getAdminChaptersApi(page = 0, size = 20, comicSlug = '') {
  const params = new URLSearchParams({ page, size, ...(comicSlug ? { comicSlug } : {}) });
  return parseResponse(await fetch(`${API_BASE}/api/admin/chapters?${params}`, { credentials: 'include' }));
}

export async function getAdminRevenueApi() {
  return parseResponse(await fetch(`${API_BASE}/api/admin/revenue`, { credentials: 'include' }));
}

export async function getAdminMonthlyRevenueApi() {
  return parseResponse(await fetch(`${API_BASE}/api/admin/revenue/monthly`, { credentials: 'include' }));
}

export async function deleteAdminChapterApi(chapterId) {
  return parseResponse(await fetch(`${API_BASE}/api/admin/chapters/${chapterId}`, {
    method: 'DELETE',
    credentials: 'include',
  }));
}

export async function getAdminTransactionsApi(page = 0, size = 20, type = '') {
  const params = new URLSearchParams({ page, size, ...(type ? { type } : {}) });
  return parseResponse(await fetch(`${API_BASE}/api/admin/transactions?${params}`, { credentials: 'include' }));
}

export async function getAdminWithdrawalRequestsApi(page = 0, size = 20, status = '') {
  const params = new URLSearchParams({ page, size, ...(status ? { status } : {}) });
  return parseResponse(await fetch(`${API_BASE}/api/admin/withdrawal-requests?${params}`, { credentials: 'include' }));
}

export async function processWithdrawalApi(requestId, status, adminNote = '') {
  return parseResponse(await fetch(`${API_BASE}/api/admin/withdrawal-requests/${requestId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminNote }),
  }));
}

export async function getAdminCommentsApi(page = 0, size = 20, comicSlug = '') {
  const params = new URLSearchParams({ page, size, ...(comicSlug ? { comicSlug } : {}) });
  return parseResponse(await fetch(`${API_BASE}/api/admin/comments?${params}`, { credentials: 'include' }));
}

export async function setComicFeaturedApi(comicId, featured) {
  return parseResponse(await fetch(`${API_BASE}/api/admin/comics/${comicId}/featured`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ featured }),
  }));
}
