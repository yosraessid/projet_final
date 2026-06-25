/**
 * NotificationsContext.jsx
 * Contexte React pour la gestion des notifications in-app (toasts / cloche).
 *
 * Fonctionnement :
 *   - Les notifications sont stockées dans Firestore (sous-collection users/{uid}/notifications).
 *   - Écoute en temps réel via onSnapshot.
 *   - Tableau limité à 20 entrées (les plus récentes en premier).
 *   - Chaque notification possède : id, titre, message, niveau, état lu/non-lu, date de création.
 *   - Le compteur unreadCount est recalculé automatiquement.
 *   - Les notifications sont réinitialisées à chaque déconnexion.
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
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '../firebase/firebaseClient'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext(null)

/**
 * Provider du contexte de notifications.
 * Synchronise les notifications en temps réel depuis Firestore.
 */
export function NotificationsProvider({ children }) {
  const { user, isLoggedIn } = useAuth()

  const [items, setItems] = useState([])

  // Écoute en temps réel les notifications de l'utilisateur dans Firestore.
  useEffect(() => {
    if (!isLoggedIn || !user?.uid || !isFirebaseConfigured()) {
      setItems([])
      return undefined
    }

    const db = getFirebaseDb()
    if (!db) {
      setItems([])
      return undefined
    }

    const notifRef = collection(db, 'users', user.uid, 'notifications')
    const q = query(notifRef, orderBy('createdAt', 'desc'), limit(20))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }))
        setItems(notifications)
      },
      () => {
        // Erreur d'écoute (permissions, offline) — on garde l'état actuel.
      },
    )

    return unsubscribe
  }, [isLoggedIn, user?.uid])

  // Nombre de notifications non lues — recalculé uniquement quand items change.
  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  )

  /**
   * Ajoute une nouvelle notification dans Firestore.
   * @param {string} title   - Titre court de la notification.
   * @param {string} message - Message détaillé.
   * @param {string} level   - Niveau visuel : 'info' | 'success' | 'warning'.
   */
  const notify = (title, message, level = 'info') => {
    if (!user?.uid || !isFirebaseConfigured()) return

    const db = getFirebaseDb()
    if (!db) return

    const notifRef = collection(db, 'users', user.uid, 'notifications')
    addDoc(notifRef, {
      title,
      message,
      level,
      read: false,
      createdAt: serverTimestamp(),
    }).catch(() => {})
  }

  /**
   * Marque toutes les notifications comme lues (read: true).
   */
  const markAllRead = async () => {
    if (!user?.uid || !isFirebaseConfigured()) return

    const db = getFirebaseDb()
    if (!db) return

    const batch = writeBatch(db)
    items.filter((n) => !n.read).forEach((n) => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id)
      batch.update(ref, { read: true })
    })

    try {
      await batch.commit()
    } catch {
      // Erreur silencieuse.
    }
  }

  /**
   * Supprime toutes les notifications de Firestore.
   */
  const clearAll = async () => {
    if (!user?.uid || !isFirebaseConfigured()) return

    const db = getFirebaseDb()
    if (!db) return

    const batch = writeBatch(db)
    items.forEach((n) => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id)
      batch.delete(ref)
    })

    try {
      await batch.commit()
    } catch {
      // Erreur silencieuse.
    }
  }

  /**
   * Supprime une seule notification par son id.
   * @param {string} id
   */
  const dismissOne = async (id) => {
    if (!user?.uid || !isFirebaseConfigured()) return

    const db = getFirebaseDb()
    if (!db) return

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id))
    } catch {
      // Erreur silencieuse.
    }
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
