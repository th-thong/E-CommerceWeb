import { get } from './client';

export function fetchCategories() {
  return get('/categories/');
}