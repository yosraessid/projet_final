/**
 * securityLogger.js
 * Logger d'événements de sécurité — envoi vers Firestore + cache localStorage.
 *
 * Architecture double :
 *   1. Envoi vers Firestore (collection "audit-logs") pour un monitoring centralisé.
 *   2. Cache en localStorage comme fallback si Firestore est inaccessible.
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

/** Clé localStorage pour le cache local (fallback). */
const STORAGE_KEY = 'security-audit-log'
const MAX_LOCAL_ENTRIES = 100

// ── Cache localStorage (fallback) ──────────────────────────────────────────────

/**
 * Lit le journal d'audit local depuis localStorage.
 * @returns {object[]}
 */
function readLocalLog() {
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
 * Écrit le journal d'audit local dans localStorage.
 * @param {object[]} entries
 */
function writeLocalLog(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Quota dépassé : on ignore.
  }
}

// ── Envoi vers Firestore ───────────────────────────────────────────────────────

/**
 * Envoie un événement de sécurité vers la collection Firestore "audit-logs".
 * Échoue silencieusement si Firestore est inaccessible (l'entrée reste en local).
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
 * Envoie vers Firestore ET sauvegarde en localStorage (double écriture).
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

  // 1. Sauvegarde locale (toujours, même si Firestore échoue).
  const log = readLocalLog()
  log.unshift(entry)
  writeLocalLog(log.slice(0, MAX_LOCAL_ENTRIES))

  // 2. Envoi vers Firestore (asynchrone, non bloquant).
  sendToFirestore(entry)

  // 3. En développement, affiche dans la console.
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
  if (!isFirebaseConfigured()) return readLocalLog().slice(0, count)
  const db = getFirebaseDb()
  if (!db) return readLocalLog().slice(0, count)

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
    // Fallback sur le cache local si Firestore est inaccessible.
    return readLocalLog().slice(0, count)
  }
}

/**
 * Récupère les événements depuis le cache local uniquement.
 * @param {number} count
 * @returns {object[]}
 */
export function getLocalSecurityLog(count = 20) {
  return readLocalLog().slice(0, count)
}

/**
 * Vide le journal d'audit local (ne supprime pas les logs Firestore).
 */
export function clearLocalSecurityLog() {
  localStorage.removeItem(STORAGE_KEY)
}
