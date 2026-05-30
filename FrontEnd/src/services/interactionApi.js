const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getChapterCommentsApi(chapterId, page = 0, size = 20) {
  const response = await fetch(
    `${API_BASE}/api/public/interactions/chapters/${chapterId}/comments?page=${page}&size=${size}`,
    { method: 'GET', credentials: 'include' }
  );
  return parseResponse(response);
}

export async function createCommentApi(chapterId, payload) {
  const response = await fetch(`${API_BASE}/api/interactions/chapters/${chapterId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteCommentApi(commentId) {
  const response = await fetch(`${API_BASE}/api/interactions/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getComicRatingSummaryApi(comicId) {
  const response = await fetch(`${API_BASE}/api/public/interactions/comics/${comicId}/rating`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function rateComicApi(comicId, payload) {
  const response = await fetch(`${API_BASE}/api/interactions/comics/${comicId}/rating`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function getComicDiscussionApi(comicId, page = 0, size = 20) {
  const response = await fetch(
    `${API_BASE}/api/public/interactions/comics/${comicId}/discussion?page=${page}&size=${size}`,
    { method: 'GET', credentials: 'include' }
  );
  return parseResponse(response);
}

export async function createComicDiscussionCommentApi(comicId, payload) {
  const response = await fetch(`${API_BASE}/api/interactions/comics/${comicId}/discussion`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteComicDiscussionCommentApi(commentId) {
  const response = await fetch(`${API_BASE}/api/interactions/comics/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function reportContentApi(targetType, targetId, reason) {
  const response = await fetch(`${API_BASE}/api/interactions/content-report`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetType, targetId, reason }),
  });

  return parseResponse(response);
}

export async function createReportAppealApi(reportId, scope, message) {
  const response = await fetch(`${API_BASE}/api/interactions/reports/${reportId}/appeal`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scope, message }),
  });

  return parseResponse(response);
}
