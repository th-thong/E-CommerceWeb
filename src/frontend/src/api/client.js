import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

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

export async function get(path, token) {
  const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders(token) });
  return handleResponse(res);
}

export async function post(path, body, token, extraHeaders) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(token, extraHeaders),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function put(path, body, token, extraHeaders) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: buildHeaders(token, extraHeaders),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function del(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });
  return handleResponse(res);
}

export async function postFormData(path, formData, token) {
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return handleResponse(res);
}







