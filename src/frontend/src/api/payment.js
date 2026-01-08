import { post } from './client';

// Xác nhận thanh toán COD
// POST /api/payment/cod/
export function confirmCOD(orderId, token) {
  return post('/payment/cod/', { order_id: orderId }, token);
}

