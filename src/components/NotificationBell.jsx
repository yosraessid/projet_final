/**
 * NotificationBell.jsx
 * Composant cloche de notifications dans la topbar.
 *
 * Comportement :
 *   - Affiche une icône cloche avec un badge rouge si des notifications non lues existent.
 *   - Ouvre/ferme un panneau flottant au clic.
 *   - Le panneau se ferme automatiquement si on clique en dehors (useClickOutside).
 *   - Le panneau liste les notifications par ordre anti-chronologique.
 *   - Actions disponibles : "Tout lire" (marque toutes comme lues) et "Effacer" (vide la liste).
 *
 * Accessibilité :
 *   - Le bouton a aria-label="Notifications" et aria-expanded pour indiquer l'état.
 *   - Le panneau a role="dialog" et aria-label pour les lecteurs d'écran.
 *   - L'icône SVG a aria-hidden="true".
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNotifications } from '../context/NotificationsContext'

function NotificationBell() {
  const { items, unreadCount, markAllRead, clearAll, dismissOne } = useNotifications()

  // État d'ouverture/fermeture du panneau.
  const [open, setOpen] = useState(false)

  // Référence sur le conteneur (bouton cloche) pour détecter les clics extérieurs.
  const containerRef = useRef(null)

  // Référence sur le panneau (rendu via portal) pour l'inclure dans la zone de clic autorisée.
  const panelRef = useRef(null)

  // Mémoïse closePanel pour éviter des re-renders dans useClickOutside.
  const closePanel = useCallback(() => setOpen(false), [])

  // Ferme le panneau si on clique en dehors du conteneur ET du panneau.
  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = (event) => {
      // Ignore les clics dans le bouton cloche.
      if (containerRef.current && containerRef.current.contains(event.target)) return
      // Ignore les clics dans le panneau (rendu via portal).
      if (panelRef.current && panelRef.current.contains(event.target)) return
      // Clic en dehors → fermer.
      closePanel()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, closePanel])

  // Bloque le scroll de la page quand le panneau est ouvert.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="notif" ref={containerRef}>
      {/* Bouton cloche avec badge non-lus */}
      <button
        type="button"
        className="notification-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Icône cloche SVG */}
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

        {/* Badge rouge — affiché uniquement s'il y a des notifications non lues */}
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && createPortal(
        <div className="notif-panel" ref={panelRef} role="dialog" aria-label="Panneau notifications">
          {/* ── Header fixe ── */}
          <div className="notif-header">
            <p><span aria-hidden="true">🔔</span> Notifications {unreadCount > 0 && <span className="notif-header-count">{unreadCount}</span>}</p>
            <div className="notif-actions">
              <button type="button" className="link-btn" onClick={markAllRead}>Tout lire</button>
              <button type="button" className="link-btn" onClick={clearAll}>Effacer</button>
              <button type="button" className="notif-panel-close" onClick={() => setOpen(false)} aria-label="Fermer" title="Fermer">×</button>
            </div>
          </div>

          {/* ── Liste scrollable ── */}
          <div className="notif-scroll-area">
            {items.length === 0 ? (
              <div className="notif-empty-state">
                <span aria-hidden="true" className="notif-empty-icon">🔕</span>
                <p className="notif-empty">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <ul className="notif-list">
                {items.map((n) => (
                  <li key={n.id} className={n.read ? 'notif-item' : 'notif-item notif-item-unread'}>
                    <div className="notif-item-top">
                      <span className={`pill pill-${n.level}`}>{n.title}</span>
                      <div className="notif-item-right">
                        <span className="muted">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        <button type="button" className="notif-dismiss" onClick={() => dismissOne(n.id)} aria-label={`Fermer ${n.title}`} title="Fermer">×</button>
                      </div>
                    </div>
                    <p className="notif-message">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default NotificationBell
