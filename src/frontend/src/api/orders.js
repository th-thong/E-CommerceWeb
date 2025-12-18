import { get } from './client';

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


