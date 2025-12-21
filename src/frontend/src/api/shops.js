import { get, post, put } from './client';

// My shop (owner)
export function fetchMyShop(token) {
  return get('/shops/my-shop/', token);
}

export function createMyShop(body, token) {
  return post('/shops/my-shop/', body, token);
}

export function updateMyShop(body, token) {
  return put('/shops/my-shop/', body, token);
}

// Register to become a seller (creates shop with pending status)
export function registerAsSeller(body, token) {
  return post('/shops/my-shop/', body, token);
}







