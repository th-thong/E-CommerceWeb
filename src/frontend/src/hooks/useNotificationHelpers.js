import { useNotifications, NOTIFICATION_TYPES } from '@/contexts/NotificationContext'

/**
 * Hook helper để dễ dàng thêm các loại thông báo phổ biến
 */
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications()

  const notifyOrderSuccess = (orderId) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ORDER_SUCCESS,
      title: 'Đặt hàng thành công!',
      message: 'Đơn hàng của bạn đã được tạo thành công và đang chờ xác nhận.',
      link: `/orders`,
    })
  }

  const notifyOrderConfirmed = (orderId) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
      title: 'Đơn hàng đã được xác nhận',
      message: 'Đơn hàng của bạn đã được shop xác nhận và đang được chuẩn bị.',
      link: `/orders`,
    })
  }

  const notifyOrderShipped = (orderId) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ORDER_SHIPPED,
      title: 'Đơn hàng đã được giao',
      message: 'Đơn hàng của bạn đã được vận chuyển và đang trên đường đến bạn.',
      link: `/orders`,
    })
  }

  const notifySellerApproved = () => {
    return addNotification({
      type: NOTIFICATION_TYPES.SELLER_APPROVED,
      title: 'Được duyệt trở thành người bán!',
      message: 'Yêu cầu đăng ký trở thành người bán của bạn đã được duyệt. Bây giờ bạn có thể bắt đầu bán hàng!',
      link: `/seller`,
    })
  }

  const notifyProductApproved = (productName) => {
    return addNotification({
      type: NOTIFICATION_TYPES.PRODUCT_APPROVED,
      title: 'Sản phẩm đã được duyệt',
      message: `Sản phẩm "${productName}" của bạn đã được admin duyệt và hiển thị trên website.`,
      link: `/seller`,
    })
  }

  const notifyFeedbackReply = (productName) => {
    return addNotification({
      type: NOTIFICATION_TYPES.FEEDBACK_REPLY,
      title: 'Có phản hồi mới',
      message: `Bạn có phản hồi mới cho đánh giá sản phẩm "${productName}".`,
      link: `/seller`,
    })
  }

  const notifyNewFeedback = (productName, count = 1) => {
    return addNotification({
      type: NOTIFICATION_TYPES.FEEDBACK_NEW,
      title: 'Có đánh giá mới',
      message: count === 1 
        ? `Khách hàng đã đánh giá sản phẩm "${productName}".`
        : `Có ${count} đánh giá mới cho các sản phẩm của bạn.`,
      link: `/seller?menu=feedback-management`,
    })
  }

  return {
    notifyOrderSuccess,
    notifyOrderConfirmed,
    notifyOrderShipped,
    notifySellerApproved,
    notifyProductApproved,
    notifyFeedbackReply,
    notifyNewFeedback,
  }
}
