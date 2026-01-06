import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/auth`;
const USERS_API_BASE = `${API_BASE_URL}/users`;

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
    let errorMessage = `Request failed with status ${res.status}`;
    
    // Cố gắng parse JSON error response
    try {
      const errorObj = JSON.parse(text);
      errorMessage = errorObj.error || errorObj.message || errorMessage;
    } catch (e) {
      // Nếu không phải JSON, dùng text trực tiếp
      errorMessage = text || errorMessage;
    }
    
    const error = new Error(errorMessage);
    error.status = res.status;
    throw error;
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
  const res = await fetch(`${USERS_API_BASE}/me/`, {
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

// Cập nhật thông tin cá nhân
export async function updateProfile(accessToken, data) {
  const res = await fetch('/api/users/me/', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to update profile (${res.status})`);
  }

  return res.json();
}

// Quên mật khẩu - gửi OTP
export async function forgotPassword({ email }) {
  return postJson(`${API_BASE}/forgot-password/`, { email });
}

// Đặt lại mật khẩu bằng OTP
export async function resetPassword({ email, otp, new_password }) {
  return postJson(`${API_BASE}/reset-password/`, { email, otp, new_password });
}





