const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getFollowStatusApi(comicId) {
  const response = await fetch(`${API_BASE}/api/library/follows/${comicId}/status`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function followComicApi(comicId) {
  const response = await fetch(`${API_BASE}/api/library/follows/${comicId}`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function unfollowComicApi(comicId) {
  const response = await fetch(`${API_BASE}/api/library/follows/${comicId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function markChapterReadApi(chapterId) {
  const response = await fetch(`${API_BASE}/api/library/history/chapters/${chapterId}`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getFollowedComicsApi() {
  const response = await fetch(`${API_BASE}/api/library/follows`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getReadHistoryApi() {
  const response = await fetch(`${API_BASE}/api/library/history`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function deleteHistoryItemApi(comicId) {
  const response = await fetch(`${API_BASE}/api/library/history/${comicId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function clearAllHistoryApi() {
  const response = await fetch(`${API_BASE}/api/library/history`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function updateFollowStatusApi(comicId, readStatus) {
  const response = await fetch(`${API_BASE}/api/library/follows/${comicId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ readStatus }),
  });
  return parseResponse(response);
}

export async function getAuthorFollowStatusApi(authorName) {
  const response = await fetch(
    `${API_BASE}/api/library/author-follows/${encodeURIComponent(authorName)}/status`,
    { credentials: 'include' }
  );
  return parseResponse(response);
}

export async function followAuthorApi(authorName) {
  const response = await fetch(
    `${API_BASE}/api/library/author-follows/${encodeURIComponent(authorName)}`,
    { method: 'POST', credentials: 'include' }
  );
  return parseResponse(response);
}

export async function unfollowAuthorApi(authorName) {
  const response = await fetch(
    `${API_BASE}/api/library/author-follows/${encodeURIComponent(authorName)}`,
    { method: 'DELETE', credentials: 'include' }
  );
  return parseResponse(response);
}
