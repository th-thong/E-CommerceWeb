import { get, put } from './client';

export function fetchMe(token) {
  return get('/users/me/', token);
}

export function updateMe(body, token) {
  return put('/users/me/', body, token);
}







