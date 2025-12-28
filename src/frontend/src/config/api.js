/**
 * API Configuration
 * Reads base URLs from environment variables
 * Falls back to defaults for local development
 */

// API Base URL - defaults to relative path for same-origin requests
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Admin API Base URL
export const ADMIN_BASE_URL = import.meta.env.VITE_ADMIN_BASE_URL || '/shopadmin';

// Backend server URL (for proxy configuration in vite.config.js)
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

