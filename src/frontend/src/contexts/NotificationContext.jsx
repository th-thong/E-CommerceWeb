import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificationContext = createContext()

const NOTIFICATION_STORAGE_KEY = 'notifications'

// Các loại thông báo
export const NOTIFICATION_TYPES = {
  SELLER_APPROVED: 'seller_approved',
  ORDER_SUCCESS: 'order_success',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_SHIPPED: 'order_shipped',
  FEEDBACK_REPLY: 'feedback_reply',
  PRODUCT_APPROVED: 'product_approved',
}

// Helper để lấy notifications từ localStorage
const getStoredNotifications = () => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper để lưu notifications vào localStorage
const saveNotifications = (notifications) => {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications))
  } catch (error) {
    console.error('Error saving notifications:', error)
  }
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => getStoredNotifications())

  // Đồng bộ với localStorage khi notifications thay đổi
  useEffect(() => {
    saveNotifications(notifications)
  }, [notifications])

  // Thêm thông báo mới
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link || null,
      read: false,
      createdAt: new Date().toISOString(),
    }
    
    setNotifications((prev) => [newNotification, ...prev])
    return newNotification.id
  }, [])

  // Đánh dấu đã đọc
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }, [])

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }, [])

  // Xóa thông báo
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }, [])

  // Xóa tất cả thông báo
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Đếm số thông báo chưa đọc
  const unreadCount = notifications.filter((notif) => !notif.read).length

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
