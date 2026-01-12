import { get, post } from './client';

/**
 * Lấy danh sách đánh giá của một sản phẩm
 * @param {number} productId - ID của sản phẩm
 * @returns {Promise} Danh sách đánh giá
 */
export function fetchProductFeedbacks(productId) {
  return get(`/feedback/${productId}/`);
}

/**
 * Tạo đánh giá mới cho sản phẩm
 * @param {number} productId - ID của sản phẩm
 * @param {Object} feedbackData - Dữ liệu đánh giá { rating: number (1-5), review: string }
 * @param {string} token - JWT token (tùy chọn)
 * @returns {Promise} Kết quả tạo đánh giá
 */
export function createProductFeedback(productId, feedbackData, token = null) {
  return post(`/feedback/${productId}/`, feedbackData, token);
}

/**
 * Tạo reply cho một đánh giá
 * @param {number} productId - ID của sản phẩm
 * @param {number} feedbackId - ID của đánh giá gốc
 * @param {Object} replyData - Dữ liệu reply { review: string }
 * @param {string} token - JWT token (tùy chọn)
 * @returns {Promise} Kết quả tạo reply
 */
export function createFeedbackReply(productId, feedbackId, replyData, token = null) {
  return post(`/feedback/${productId}/${feedbackId}/`, replyData, token);
}

/**
 * Lấy danh sách replies của một đánh giá
 * @param {number} productId - ID của sản phẩm
 * @param {number} feedbackId - ID của đánh giá gốc
 * @param {string} token - JWT token (tùy chọn)
 * @returns {Promise} Danh sách replies
 */
export function fetchFeedbackReplies(productId, feedbackId, token = null) {
  return get(`/feedback/${productId}/${feedbackId}/`, token);
}
