const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    throw new Error(message);
  }
  return data;
}

export async function getAuthorPostsApi(authorName, page = 0, size = 20) {
  const response = await fetch(
    `${API_BASE}/api/public/interactions/author/${encodeURIComponent(authorName)}/posts?page=${page}&size=${size}`,
    { method: 'GET', credentials: 'include' }
  );
  return parseResponse(response);
}

export async function createAuthorPostApi(authorName, content) {
  const response = await fetch(
    `${API_BASE}/api/interactions/author/${encodeURIComponent(authorName)}/posts`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  );
  return parseResponse(response);
}

export async function deleteAuthorPostApi(postId) {
  const response = await fetch(`${API_BASE}/api/interactions/author/posts/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getAuthorPostCommentsApi(postId, authorName) {
  const response = await fetch(
    `${API_BASE}/api/public/interactions/author/posts/${postId}/comments?authorName=${encodeURIComponent(authorName)}`,
    { method: 'GET', credentials: 'include' }
  );
  return parseResponse(response);
}

export async function createAuthorPostCommentApi(postId, content) {
  const response = await fetch(`${API_BASE}/api/interactions/author/posts/${postId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return parseResponse(response);
}

export async function deleteAuthorPostCommentApi(commentId) {
  const response = await fetch(`${API_BASE}/api/interactions/author/posts/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseResponse(response);
}
