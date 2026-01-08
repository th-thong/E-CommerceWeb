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

export async function register({ user_name, email, password, phone_number }) {
  // Backend expects user_name (mapped to username), email, password, optional phone_number
  return postJson(`${API_BASE}/register/`, { user_name, email, password, phone_number });
}

// Dùng refresh token để xin access token mới
export async function refreshToken(refresh) {
  return postJson(`${API_BASE}/refresh/`, { refresh });
}

export async function getProfile(accessToken) {
  const fetchProfile = async (token) => {
    const res = await fetch(`${USERS_API_BASE}/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      const error = new Error(text || `Failed to fetch profile (${res.status})`);
      error.status = res.status;
      throw error;
    }

    return res.json();
  };

  try {
    // Thử gọi với access token hiện tại
    return await fetchProfile(accessToken);
  } catch (err) {
    // Nếu không phải lỗi hết hạn (401) thì ném ra luôn
    if (err.status !== 401) {
      throw err;
    }

    // Thử dùng refresh token trong localStorage để xin access token mới
    try {
      const saved = localStorage.getItem('auth_tokens');
      if (!saved) {
        throw err;
      }
      const tokens = JSON.parse(saved);
      if (!tokens?.refresh) {
        throw err;
      }

      // Gọi API refresh
      const newTokens = await refreshToken(tokens.refresh);
      const updatedTokens = { ...tokens, ...newTokens };

      // Lưu lại vào localStorage để các nơi khác dùng
      localStorage.setItem('auth_tokens', JSON.stringify(updatedTokens));

      // Gọi lại profile với access token mới
      return await fetchProfile(updatedTokens.access);
    } catch (refreshError) {
      // Nếu refresh cũng lỗi thì coi như hết phiên đăng nhập
      throw err;
    }
  }
}

// Cập nhật thông tin cá nhân
export async function updateProfile(accessToken, data) {
  const res = await fetch(`${USERS_API_BASE}/me/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `Failed to update profile (${res.status})`;
    
    // Cố gắng parse JSON error response
    try {
      const errorObj = JSON.parse(text);
      errorMessage = errorObj.error || errorObj.message || errorMessage;
    } catch (e) {
      // Nếu không phải JSON, dùng text trực tiếp nếu có
      if (text && text.trim()) {
        errorMessage = text;
      }
    }
    
    const error = new Error(errorMessage);
    error.status = res.status;
    throw error;
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





