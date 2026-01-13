import { useEffect } from 'react'
import { fetchSellerProducts } from '@/api/products'
import { fetchProductFeedbacks } from '@/api/feedback'
import { useNotificationHelpers } from './useNotificationHelpers'

const LAST_CHECKED_KEY = 'seller_feedbacks_last_checked'
const SEEN_FEEDBACK_IDS_KEY = 'seller_seen_feedback_ids'

/**
 * Hook để check và tạo thông báo khi có feedback mới cho seller
 */
export const useFeedbackNotifications = (isSeller = false, enabled = true) => {
  const { notifyNewFeedback } = useNotificationHelpers()

  useEffect(() => {
    console.log('[FeedbackNotifications] Hook called, isSeller:', isSeller, 'enabled:', enabled)
    if (!isSeller || !enabled) {
      console.log('[FeedbackNotifications] Hook skipped, isSeller:', isSeller, 'enabled:', enabled)
      return
    }

    const checkNewFeedbacks = async () => {
      console.log('[FeedbackNotifications] Starting check...')
      try {
        const token = localStorage.getItem('auth_tokens')
        if (!token) return

        const tokens = JSON.parse(token)
        if (!tokens?.access) return

        // Lấy danh sách feedback IDs đã xem
        const seenIdsStr = localStorage.getItem(SEEN_FEEDBACK_IDS_KEY)
        const seenIds = seenIdsStr ? new Set(JSON.parse(seenIdsStr)) : new Set()

        // Lấy danh sách sản phẩm của seller
        const products = await fetchSellerProducts(tokens.access)
        console.log('[FeedbackNotifications] Seller products:', products.length)
        
        // Lấy tất cả feedbacks
        const allFeedbacks = []
        for (const product of products) {
          try {
            const productFeedbacks = await fetchProductFeedbacks(product.product_id)
            const feedbacksWithProduct = productFeedbacks.map(fb => ({
              ...fb,
              product_id: product.product_id,
              product_name: product.product_name,
            }))
            allFeedbacks.push(...feedbacksWithProduct)
          } catch (err) {
            console.error(`Error fetching feedbacks for product ${product.product_id}:`, err)
          }
        }

        // Tìm feedbacks mới (chưa được xem)
        console.log('[FeedbackNotifications] All feedbacks:', allFeedbacks.length, 'Seen IDs:', seenIds.size)
        const newFeedbacks = allFeedbacks.filter(fb => !seenIds.has(fb.id))
        console.log('[FeedbackNotifications] New feedbacks:', newFeedbacks.length)

        // Tạo thông báo cho mỗi feedback mới
        if (newFeedbacks.length > 0) {
          console.log('[FeedbackNotifications] Found new feedbacks:', newFeedbacks.length)
          
          // Tạo thông báo tổng hợp
          if (newFeedbacks.length === 1) {
            notifyNewFeedback(newFeedbacks[0].product_name, 1)
          } else {
            notifyNewFeedback('', newFeedbacks.length)
          }

          // Lưu các feedback IDs đã thấy
          newFeedbacks.forEach(fb => seenIds.add(fb.id))
          localStorage.setItem(SEEN_FEEDBACK_IDS_KEY, JSON.stringify(Array.from(seenIds)))
        } else {
          console.log('[FeedbackNotifications] No new feedbacks')
        }

        // Cập nhật timestamp check
        localStorage.setItem(LAST_CHECKED_KEY, new Date().toISOString())
      } catch (error) {
        console.error('Error checking new feedbacks:', error)
      }
    }

    checkNewFeedbacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller, enabled])
}

/**
 * Hàm để đánh dấu feedback đã xem (gọi khi seller xem feedback)
 */
export const markFeedbackAsSeen = (feedbackId) => {
  const seenIdsStr = localStorage.getItem(SEEN_FEEDBACK_IDS_KEY)
  const seenIds = seenIdsStr ? new Set(JSON.parse(seenIdsStr)) : new Set()
  seenIds.add(feedbackId)
  localStorage.setItem(SEEN_FEEDBACK_IDS_KEY, JSON.stringify(Array.from(seenIds)))
}
