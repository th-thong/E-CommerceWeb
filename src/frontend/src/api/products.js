import { get, post, put, del, postFormData, putFormData } from './client';

// Public
export function fetchPublicProducts() {
  return get('/products/public/list/');
}

export function fetchPublicProductDetail(productId) {
  return get(`/products/public/${productId}/`);
}

export function fetchTrendyProducts(token = null) {
  return get('/products/public/trendy/', token);
}

export function fetchFlashSaleProducts(token = null) {
  return get('/products/public/flash-sale/', token);
}

export function fetchRecommendProducts(token = null) {
  return get('/products/public/recommend/', token);
}

// Private (require token)
export function fetchPrivateProducts(token) {
  return get('/products/private/list/', token);
}

export function fetchPrivateProductDetail(productId, token) {
  return get(`/products/private/${productId}/`, token);
}

export function createPrivateProduct(body, token) {
  return post('/products/private/', body, token);
}

export function updatePrivateProduct(productId, body, token) {
  return put(`/products/private/${productId}/`, body, token);
}

export function deletePrivateProduct(productId, token) {
  return del(`/products/private/${productId}/`, token);
}

// Seller product management
export function fetchSellerProducts(token) {
  return get('/products/seller/my-products/', token);
}

export function fetchSellerProductDetail(productId, token) {
  return get(`/products/seller/my-products/${productId}/`, token);
}

export function createSellerProduct(formData, token) {
  return postFormData('/products/seller/my-products/', formData, token);
}

export function updateSellerProduct(productId, body, token) {
  // If body is FormData, use putFormData, otherwise use regular put
  if (body instanceof FormData) {
    return putFormData(`/products/seller/my-products/${productId}/`, body, token);
  }
  return put(`/products/seller/my-products/${productId}/`, body, token);
}

export function deleteSellerProduct(productId, token) {
  return del(`/products/seller/my-products/${productId}/`, token);
}
// Promote product to trendy/flash sale
export function promoteProduct(productId, body, token) {
  return post(`/products/seller/my-products/${productId}/promote/`, body, token);
}

