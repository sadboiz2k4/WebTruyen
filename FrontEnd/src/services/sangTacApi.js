const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const AI_BASE = import.meta.env.VITE_AI_BASE || 'http://localhost:5000';

export async function getAiHealthApi() {
  const response = await fetch(`${AI_BASE}/health`, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error('AI offline');
  return response.json();
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getAuthorDraftApi(mode) {
  const response = await fetch(`${API_BASE}/api/author-workspace/drafts/${mode}`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function saveAuthorDraftApi(mode, payload) {
  const response = await fetch(`${API_BASE}/api/author-workspace/drafts/${mode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function publishAuthorDraftApi(mode, scheduledAt) {
  const response = await fetch(`${API_BASE}/api/author-workspace/publish/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scheduledAt: scheduledAt || null }),
  });

  return parseResponse(response);
}

export async function getAuthorRevenueApi(slug) {
  const response = await fetch(`${API_BASE}/api/author-workspace/comics/${slug}/revenue`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getAllAuthorRevenueApi() {
  const response = await fetch(`${API_BASE}/api/author-workspace/revenue`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getAuthorMonthlyRevenueApi() {
  const response = await fetch(`${API_BASE}/api/author-workspace/revenue/monthly`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function deletePublishedChapterApi(chapterId) {
  const response = await fetch(`${API_BASE}/api/author-workspace/chapters/${chapterId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function updateStoryInfoApi(slug, { title, coverUrl, description, categories }) {
  const response = await fetch(`${API_BASE}/api/author-workspace/comics/${slug}/info`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title, coverUrl, description, categories }),
  });

  return parseResponse(response);
}

export async function getStoryCommentsApi(slug) {
  const response = await fetch(`${API_BASE}/api/author-workspace/comics/${slug}/comments`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function deleteCommentAsAuthorApi(commentId) {
  const response = await fetch(`${API_BASE}/api/author-workspace/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function updateStoryStatusApi(slug, storyStatus) {
  const response = await fetch(`${API_BASE}/api/author-workspace/comics/${slug}/story-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ storyStatus }),
  });

  return parseResponse(response);
}

export async function deleteStoryApi(slug) {
  const response = await fetch(`${API_BASE}/api/author-workspace/comics/${slug}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getMyComicsApi() {
  const response = await fetch(`${API_BASE}/api/author-workspace/my-comics`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getStoryStatsApi(slug) {
  const response = await fetch(`${API_BASE}/api/author-workspace/comics/${slug}/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function swapChaptersApi(chapterId1, chapterId2) {
  const response = await fetch(`${API_BASE}/api/author-workspace/chapters/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ chapterId1, chapterId2 }),
  });

  return parseResponse(response);
}

export async function commitChapterDraftApi(mode) {
  const response = await fetch(`${API_BASE}/api/author-workspace/drafts/${mode}/chapters/commit`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function deleteDraftChapterApi(mode, draftChapterId) {
  const response = await fetch(`${API_BASE}/api/author-workspace/drafts/${mode}/chapters/${draftChapterId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function publishDraftChapterApi(mode, draftChapterId, scheduledAt) {
  const response = await fetch(`${API_BASE}/api/author-workspace/drafts/${mode}/chapters/${draftChapterId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scheduledAt: scheduledAt || null }),
  });
  return parseResponse(response);
}

export async function getPendingChaptersApi() {
  const response = await fetch(`${API_BASE}/api/author-workspace/chapters/pending`, {
    credentials: 'include',
  });
  return parseResponse(response);
}
