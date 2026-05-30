const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function searchComicsApi(query, category, status, sortBy, paidType, page, size) {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category && category !== 'Tất cả') params.append('category', category);
  if (status && status !== 'Tất cả') params.append('status', status);
  if (sortBy) params.append('sort', sortBy);
  if (paidType && paidType !== 'all') params.append('paidType', paidType);
  params.append('page', page);
  params.append('size', size);

  const response = await fetch(`${API_BASE}/api/public/comics/search?${params.toString()}`, {
    method: 'GET',
  });

  return parseResponse(response);
}
