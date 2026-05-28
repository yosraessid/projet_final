import { createContext, useContext, useMemo, useState } from 'react'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([])

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  )

  const notify = (title, message, level = 'info') => {
    const newItem = {
      id: Date.now(),
      title,
      message,
      level,
      read: false,
      createdAt: new Date().toISOString(),
    }
    setItems((prev) => [newItem, ...prev].slice(0, 20))
  }

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAll = () => setItems([])

  const value = useMemo(
    () => ({ items, unreadCount, notify, markAllRead, clearAll }),
    [items, unreadCount],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}

