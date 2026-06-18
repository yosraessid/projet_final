/**
 * NotificationsContext.jsx
 * Contexte React pour la gestion des notifications in-app (toasts / cloche).
 *
 * Fonctionnement :
 *   - Les notifications sont stockées dans localStorage pour survivre aux rechargements.
 *   - Tableau limité à 20 entrées (les plus récentes en premier).
 *   - Chaque notification possède : id, titre, message, niveau, état lu/non-lu, date de création.
 *   - Le compteur unreadCount est recalculé automatiquement.
 *
 * Valeurs exposées via useNotifications() :
 *   - items        : tableau des notifications
 *   - unreadCount  : nombre de notifications non lues
 *   - notify(title, message, level) : ajoute une nouvelle notification
 *   - markAllRead()                 : marque toutes les notifications comme lues
 *   - clearAll()                    : supprime toutes les notifications
 *
 * Niveaux disponibles : 'info' | 'success' | 'warning'
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const NotificationsContext = createContext(null)

/** Clé localStorage pour persister les notifications. */
const STORAGE_KEY = 'app-notifications'

/**
 * Lit les notifications sauvegardées dans localStorage.
 * Retourne un tableau vide si absent ou invalide.
 * @returns {object[]}
 */
function readStoredNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Sauvegarde les notifications dans localStorage.
 * Ignore les erreurs de quota (navigation privée, stockage plein).
 * @param {object[]} items
 */
function writeStoredNotifications(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Quota dépassé ou navigation privée : on ignore silencieusement.
  }
}

/**
 * Provider du contexte de notifications.
 * Initialise depuis localStorage et persiste chaque modification.
 */
export function NotificationsProvider({ children }) {
  // Initialise depuis localStorage pour restaurer les notifications après rechargement.
  const [items, setItems] = useState(() => readStoredNotifications())

  // Persiste dans localStorage à chaque changement de la liste.
  useEffect(() => {
    writeStoredNotifications(items)
  }, [items])

  // Nombre de notifications non lues — recalculé uniquement quand items change.
  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  )

  /**
   * Ajoute une nouvelle notification à la liste.
   * La liste est plafonnée à 20 entrées pour éviter les fuites mémoire.
   * @param {string} title   - Titre court de la notification (ex: 'Projet', 'Erreur').
   * @param {string} message - Message détaillé affiché dans la cloche.
   * @param {string} level   - Niveau visuel : 'info' | 'success' | 'warning'.
   */
  const notify = (title, message, level = 'info') => {
    const newItem = {
      id: Date.now(),
      title,
      message,
      level,
      read: false,
      createdAt: new Date().toISOString(),
    }
    // Insère en tête de liste et limite à 20 éléments.
    setItems((prev) => [newItem, ...prev].slice(0, 20))
  }

  /**
   * Marque toutes les notifications comme lues (read: true).
   * Met à jour le badge de la cloche à 0.
   */
  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  /**
   * Supprime toutes les notifications de la liste et du localStorage.
   */
  const clearAll = () => setItems([])

  /**
   * Supprime une seule notification par son id.
   * @param {number} id
   */
  const dismissOne = (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }

  // Mémoïse la valeur du contexte pour éviter des re-renders inutiles.
  const value = useMemo(
    () => ({ items, unreadCount, notify, markAllRead, clearAll, dismissOne }),
    [items, unreadCount],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * Hook personnalisé pour accéder au contexte de notifications.
 * Doit être utilisé à l'intérieur d'un NotificationsProvider.
 * @throws {Error} si utilisé hors du provider.
 */
export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}
