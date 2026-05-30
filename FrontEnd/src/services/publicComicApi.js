const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getPublishedComicsApi(page = 0, size = 20) {
  const response = await fetch(`${API_BASE}/api/public/comics?page=${page}&size=${size}`, {
    method: 'GET',
  });
  return parseResponse(response);
}

export async function getPublishedComicDetailApi(slug) {
  const response = await fetch(`${API_BASE}/api/public/comics/${slug}`, {
    method: 'GET',
  });
  return parseResponse(response);
}

export async function getPublishedChapterDetailApi(chapterId) {
  const response = await fetch(`${API_BASE}/api/public/comics/chapters/${chapterId}`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getComicsByAuthorApi(authorName) {
  const response = await fetch(
    `${API_BASE}/api/public/comics/author/${encodeURIComponent(authorName)}`,
    { method: 'GET' }
  );
  return parseResponse(response);
}

export async function getAuthorProfileApi(authorName) {
  const response = await fetch(
    `${API_BASE}/api/public/comics/author-profile/${encodeURIComponent(authorName)}`,
    { method: 'GET' }
  );
  return parseResponse(response);
}

export async function getAuthorReadingListApi(authorName) {
  const response = await fetch(
    `${API_BASE}/api/public/comics/author-profile/${encodeURIComponent(authorName)}/reading-list`,
    { method: 'GET' }
  );
  return parseResponse(response);
}

export async function getAuthorFollowersApi(authorName) {
  const response = await fetch(
    `${API_BASE}/api/public/comics/author-profile/${encodeURIComponent(authorName)}/followers`,
    { method: 'GET' }
  );
  return parseResponse(response);
}

export async function getRelatedComicsApi(slug, categories) {
  const params = new URLSearchParams({ categories: categories || '', limit: '6' });
  const response = await fetch(`${API_BASE}/api/public/comics/${slug}/related?${params}`, {
    method: 'GET',
  });
  return parseResponse(response);
}

export async function unlockChapterApi(chapterId) {
  const response = await fetch(`${API_BASE}/api/public/comics/chapters/${chapterId}/unlock`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseResponse(response);
}
