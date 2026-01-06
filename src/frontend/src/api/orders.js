import { get } from './client';

// User - lấy lịch sử mua hàng
// GET /api/orders/
export function getOrderHistory(token) {
  return get('/orders/', token);
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


