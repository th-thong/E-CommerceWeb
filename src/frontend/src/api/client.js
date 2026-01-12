import { API_BASE_URL } from '../config/api';
import { refreshToken } from './auth';

const API_BASE = API_BASE_URL;

const TOKEN_KEY = 'auth_tokens';

function buildHeaders(token, extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function handleResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }
  if (!res.ok) {
    const msg = typeof data === 'string' ? data : data?.error || data?.message || `Request failed (${res.status})`;
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

// Hàm tự động refresh token khi gặp 401
async function refreshAccessTokenIfNeeded() {
  try {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      return null;
    }
    const tokens = JSON.parse(saved);
    if (!tokens?.refresh) {
      return null;
    }
    
    // Gọi API refresh
    const newTokens = await refreshToken(tokens.refresh);
    const updatedTokens = { ...tokens, ...newTokens };
    
    // Lưu lại vào localStorage
    localStorage.setItem(TOKEN_KEY, JSON.stringify(updatedTokens));
    
    return updatedTokens.access;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Nếu refresh thất bại, xóa token và yêu cầu đăng nhập lại
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export async function get(path, token) {
  return retryWithRefreshToken(async (t) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders(t) });
    return await handleResponse(res);
  }, token);
}

// Helper function để retry request với token mới khi gặp 401
async function retryWithRefreshToken(fetchFn, token) {
  try {
    return await fetchFn(token);
  } catch (error) {
    // Nếu là lỗi 401 và có token, thử refresh token và retry
    if (error.status === 401 && token) {
      const newToken = await refreshAccessTokenIfNeeded();
      if (newToken) {
        // Retry với token mới
        return await fetchFn(newToken);
      }
      // Nếu không refresh được, throw error yêu cầu đăng nhập lại
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    throw error;
  }
}

export async function post(path, body, token, extraHeaders) {
  return retryWithRefreshToken(async (t) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: buildHeaders(t, extraHeaders),
      body: JSON.stringify(body),
    });
    return await handleResponse(res);
  }, token);
}

export async function put(path, body, token, extraHeaders) {
  return retryWithRefreshToken(async (t) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: buildHeaders(t, extraHeaders),
      body: JSON.stringify(body),
    });
    return await handleResponse(res);
  }, token);
}

export async function patch(path, body, token, extraHeaders) {
  return retryWithRefreshToken(async (t) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(t, extraHeaders),
      body: JSON.stringify(body),
    });
    return await handleResponse(res);
  }, token);
}

export async function del(path, token) {
  return retryWithRefreshToken(async (t) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: buildHeaders(t),
    });
    return await handleResponse(res);
  }, token);
}

export async function postFormData(path, formData, token) {
  return retryWithRefreshToken(async (t) => {
    const headers = {
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return await handleResponse(res);
  }, token);
}

export async function putFormData(path, formData, token) {
  return retryWithRefreshToken(async (t) => {
    const headers = {
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers,
      body: formData,
    });
    return await handleResponse(res);
  }, token);
}







