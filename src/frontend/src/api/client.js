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
export async function retryWithRefreshToken(fetchFn, token) {
  try {
    return await fetchFn(token);
  } catch (error) {
    if (error.status === 401) {
      const errorData = error.data;

      // TRƯỜNG HỢP 1: Token hết hạn
      if (errorData?.code === 'token_not_valid') {
        console.log("Access Token hết hạn, đang thử làm mới...");
        const newToken = await refreshAccessTokenIfNeeded();
        if (newToken) {
          return await fetchFn(newToken);
        }
        localStorage.removeItem(TOKEN_KEY);
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      // TRƯỜNG HỢP 2: Tài khoản bị khóa
      if (errorData?.code === 'user_inactive') {
        console.warn("Tài khoản bị khóa, đang đăng xuất người dùng...");
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/";
        throw new Error('Tài khoản của bạn đã bị khóa.');
      }

      // TRƯỜNG HỢP 3: Các mã 401 khác
      localStorage.removeItem(TOKEN_KEY);
      throw new Error('Vui lòng đăng nhập để thực hiện hành động này.');
    }
    
    // Nếu không phải 401, throw lỗi như bình thường
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
