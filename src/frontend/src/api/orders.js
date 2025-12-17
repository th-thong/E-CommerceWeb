import { get } from './client';

// Seller - orders for current shop
// GET /api/orders/my-shop/
export function fetchMyShopOrders(token) {
  return get('/orders/my-shop/', token);
}


