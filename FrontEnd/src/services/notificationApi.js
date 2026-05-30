const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function getNotificationsApi(limit = 20) {
  const response = await fetch(`${API_BASE}/api/notifications?limit=${limit}`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function getUnreadCountApi() {
  const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function markNotificationAsReadApi(notificationId) {
  const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function markAllNotificationsAsReadApi() {
  const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseResponse(response);
}
