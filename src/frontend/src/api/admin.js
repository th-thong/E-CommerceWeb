// Admin API endpoints - base path is /shopadmin/ instead of /api/
import { ADMIN_BASE_URL } from '../config/api';

const ADMIN_BASE = ADMIN_BASE_URL;

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
    throw new Error(msg);
  }
  return data;
}

// ==================== USER MANAGEMENT ====================

// Lấy danh sách tất cả người dùng
export async function getAllUsers(token) {
  const res = await fetch(`${ADMIN_BASE}/users/`, {
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// Lấy danh sách người dùng đang chờ duyệt thành người bán
export async function getPendingUsers(token) {
  const res = await fetch(`${ADMIN_BASE}/pendingusers/`, {
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// Lấy chi tiết một người dùng
export async function getUserById(userId, token) {
  const res = await fetch(`${ADMIN_BASE}/user/${userId}/`, {
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// Cập nhật vai trò/trạng thái người dùng
// body: { role?: "seller", status?: "active" | "pending" | "banned" }
export async function updateUser(userId, data, token) {
  const res = await fetch(`${ADMIN_BASE}/user/${userId}/`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Xóa một người dùng
export async function deleteUser(userId, token) {
  const res = await fetch(`${ADMIN_BASE}/user/${userId}/`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// ==================== PRODUCT REVIEW ====================

// Lấy danh sách sản phẩm chờ duyệt
export async function getPendingProducts(token) {
  const res = await fetch(`${ADMIN_BASE}/product-list/`, {
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// Lấy chi tiết sản phẩm chờ duyệt
export async function getProductById(productId, token) {
  const res = await fetch(`${ADMIN_BASE}/product/${productId}/`, {
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// Duyệt sản phẩm (chấp thuận)
export async function approveProduct(productId, token) {
  const res = await fetch(`${ADMIN_BASE}/product/${productId}/`, {
    method: 'PUT',
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// ==================== CONTENT MODERATION (FEEDBACK) ====================

// Lấy danh sách các feedback bị cấm của sản phẩm
export async function getBannedFeedback(productId, token) {
  const res = await fetch(`${ADMIN_BASE}/banned-feedback/${productId}/`, {
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

// Chấp thuận feedback (phục hồi từ trạng thái bị cấm)
export async function approveFeedback(feedbackId, token) {
  const res = await fetch(`${ADMIN_BASE}/approve-feedback/${feedbackId}/`, {
    method: 'PUT',
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}
