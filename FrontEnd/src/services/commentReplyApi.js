const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getCommentRepliesApi(parentCommentId) {
  const response = await fetch(`${API_BASE}/api/public/interactions/comments/${parentCommentId}/replies`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function createCommentReplyApi(parentCommentId, content) {
  const response = await fetch(`${API_BASE}/api/interactions/comments/${parentCommentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ parentCommentId, content }),
  });
  return parseResponse(response);
}

export async function deleteCommentReplyApi(replyId) {
  const response = await fetch(`${API_BASE}/api/interactions/replies/${replyId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getComicDiscussionRepliesApi(parentCommentId) {
  const response = await fetch(`${API_BASE}/api/public/interactions/comics/comments/${parentCommentId}/replies`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function createComicDiscussionReplyApi(parentCommentId, content) {
  const response = await fetch(`${API_BASE}/api/interactions/comics/comments/${parentCommentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ parentCommentId, content }),
  });
  return parseResponse(response);
}

export async function deleteComicDiscussionReplyApi(replyId) {
  const response = await fetch(`${API_BASE}/api/interactions/comics/replies/${replyId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function reportCommentApi(commentId, reason) {
  const response = await fetch(`${API_BASE}/api/interactions/comments/${commentId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ commentId, reason }),
  });
  return parseResponse(response);
}
