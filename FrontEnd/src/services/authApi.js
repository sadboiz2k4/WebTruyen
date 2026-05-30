const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra, vui long thu lai.';
    throw new Error(message);
  }
  return data;
}

export async function loginApi(payload) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function registerApi(payload) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function meApi() {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function logoutApi() {
  const response = await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function getProfileApi() {
  const response = await fetch(`${API_BASE}/api/auth/profile`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function updateProfileApi(payload) {
  const response = await fetch(`${API_BASE}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateAvatarApi(avatarUrl) {
  const response = await fetch(`${API_BASE}/api/auth/avatar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ avatarUrl }),
  });
  return parseResponse(response);
}

export async function changePasswordApi(oldPassword, newPassword) {
  const response = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  return parseResponse(response);
}

export async function googleLoginApi(credential) {
  const response = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential }),
  });

  return parseResponse(response);
}
