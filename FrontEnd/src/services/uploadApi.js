const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/toptruyen';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function uploadImageApi(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/uploads/images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await parseResponse(response);
  const imageUrl = buildImageUrl(data?.objectKey, data?.url);
  return {
    ...data,
    imageUrl,
  };
}

function buildImageUrl(objectKey, fallbackUrl) {
  if (objectKey) {
    const normalizedEndpoint = IMAGEKIT_URL_ENDPOINT.replace(/\/+$/, '');
    const normalizedKey = String(objectKey).startsWith('/') ? String(objectKey) : `/${String(objectKey)}`;
    return `${normalizedEndpoint}${normalizedKey}`;
  }
  return fallbackUrl || '';
}
