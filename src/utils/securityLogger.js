/**
 * securityLogger.js
 * Logger d'événements de sécurité — envoi vers Firestore uniquement.
 *
 * Événements enregistrés :
 *   - login_success    : connexion réussie
 *   - login_failed     : tentative de connexion échouée
 *   - login_blocked    : tentative bloquée par le rate limiter
 *   - register_success : inscription réussie
 *   - register_failed  : inscription échouée
 *   - profile_update   : modification du profil
 *   - project_delete   : suppression d'un projet
 *   - suspicious_input : tentative d'injection détectée
 *
 * Chaque entrée contient : action, timestamp, uid (si connecté), userAgent, détails.
 * Les logs Firestore sont consultables dans Firebase Console > Firestore > audit-logs.
 */

import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '../firebase/firebaseClient'

// ── Envoi vers Firestore ───────────────────────────────────────────────────────

/**
 * Envoie un événement de sécurité vers la collection Firestore "audit-logs".
 * Échoue silencieusement si Firestore est inaccessible.
 * @param {object} entry - L'événement à enregistrer.
 * @returns {boolean} true si envoyé avec succès, false sinon.
 */
async function sendToFirestore(entry) {
  if (!isFirebaseConfigured()) return false
  const db = getFirebaseDb()
  if (!db) return false

  try {
    await addDoc(collection(db, 'audit-logs'), {
      ...entry,
      createdAt: serverTimestamp(),
    })
    return true
  } catch {
    // Firestore inaccessible (offline, règles bloquantes, etc.)
    return false
  }
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Enregistre un événement de sécurité.
 * Envoie vers Firestore (collection "audit-logs").
 *
 * @param {'login_success'|'login_failed'|'login_blocked'|'register_success'|'register_failed'|'profile_update'|'project_delete'|'suspicious_input'} action
 * @param {object} details - Détails de l'événement (email, raison, etc.)
 */
export function logSecurityEvent(action, details = {}) {
  const entry = {
    action,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent?.slice(0, 150),
    ...details,
  }

  // Envoi vers Firestore (asynchrone, non bloquant).
  sendToFirestore(entry)

  // En développement, affiche dans la console.
  if (import.meta.env.DEV) {
    console.info(`[SECURITY] ${action}`, details)
  }
}

/**
 * Récupère les derniers événements d'audit depuis Firestore.
 * Utile pour afficher un tableau de bord de sécurité ou pour l'admin.
 *
 * @param {string} uid - UID de l'utilisateur (optionnel, filtre par utilisateur).
 * @param {number} count - Nombre d'entrées à retourner (défaut: 20).
 * @returns {object[]} Événements triés par date décroissante.
 */
export async function getAuditLogs(uid = null, count = 20) {
  if (!isFirebaseConfigured()) return []
  const db = getFirebaseDb()
  if (!db) return []

  try {
    let q
    if (uid) {
      q = query(
        collection(db, 'audit-logs'),
        where('email', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(count),
      )
    } else {
      q = query(
        collection(db, 'audit-logs'),
        orderBy('createdAt', 'desc'),
        limit(count),
      )
    }

    const snap = await getDocs(q)
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch {
    return []
  }
}
