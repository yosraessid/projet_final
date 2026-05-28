import { useCallback, useRef, useState } from 'react'
import { useNotifications } from '../context/NotificationsContext'
import { useClickOutside } from '../hooks/useClickOutside'

function NotificationBell() {
  const { items, unreadCount, markAllRead, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const closePanel = useCallback(() => setOpen(false), [])

  useClickOutside(containerRef, closePanel, open)

  return (
    <div className="notif" ref={containerRef}>
      <button
        type="button"
        className="notification-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-6.2V11a7 7 0 0 0-5-6.7V3a2 2 0 1 0-4 0v1.3A7 7 0 0 0 5 11v4.8l-1.6 1.6c-.4.4-.1 1.1.5 1.1h16.2c.6 0 .9-.7.5-1.1L19 15.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Panneau notifications">
          <div className="notif-header">
            <p>Notifications</p>
            <div className="notif-actions">
              <button type="button" className="link-btn" onClick={markAllRead}>
                Tout lire
              </button>
              <button type="button" className="link-btn" onClick={clearAll}>
                Effacer
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="notif-empty">Aucune notification pour le moment.</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={n.read ? 'notif-item' : 'notif-item notif-item-unread'}
                >
                  <div className="notif-item-top">
                    <span className={`pill pill-${n.level}`}>{n.title}</span>
                    <span className="muted">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="notif-message">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell

