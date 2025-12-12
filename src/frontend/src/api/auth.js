const API_BASE = '/api/auth';

async function postJson(url, body, accessToken) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function login({ email, password }) {
  return postJson(`${API_BASE}/login/`, { email, password });
}

export async function register({ user_name, email, password }) {
  // Backend expects user_name (mapped to username), email, password
  return postJson(`${API_BASE}/register/`, { user_name, email, password });
}

export async function getProfile(accessToken) {
  const res = await fetch('/api/users/me/', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch profile (${res.status})`);
  }

  return res.json();
}





