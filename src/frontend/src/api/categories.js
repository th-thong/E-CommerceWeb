import { get } from './client';

export function fetchCategories(token) {
  return get('/categories/', token);
}