import { get, post, patch } from './client';

// User - lấy lịch sử mua hàng
// GET /api/orders/
export function getOrderHistory(token) {
  return get('/orders/', token);
}

// User - tạo đơn hàng mới
// POST /api/orders/
export function createOrder(orderData, token) {
  return post('/orders/', orderData, token);
}

// Seller - orders for current shop
// GET /api/orders/my-shop/
export function fetchMyShopOrders(token) {
  return get('/orders/my-shop/', token);
}

// Seller - shop statistics (order count and revenue)
// GET /api/orders/my-shop/statistics/
export function fetchShopStatistics(token) {
  return get('/orders/my-shop/statistics/', token);
}

// Seller - cập nhật trạng thái đơn hàng
// PATCH /api/shops/my-shop/orders/{detail_id}/update/
// Theo schema.yaml: Order (Seller) - Cập nhật trạng thái đơn hàng
// Request body: { order_status?: "pending" | "confirmed" | "shipped", payment_status?: "paid" | "pending" }
export function updateOrderStatus(detailId, statusData, token) {
  return patch(`/shops/my-shop/orders/${detailId}/update/`, statusData, token);
}


