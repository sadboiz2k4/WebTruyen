const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getAllMyComicsStatsApi() {
  const response = await fetch(`${API_BASE}/api/author/my-comics-stats`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getComicStatsApi(comicId) {
  const response = await fetch(`${API_BASE}/api/author/comics/${comicId}/stats`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getReportedCommentsApi(comicId) {
  const response = await fetch(`${API_BASE}/api/author/comics/${comicId}/reported-comments`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function dismissReportApi(reportId) {
  const response = await fetch(`${API_BASE}/api/author/reports/${reportId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}
