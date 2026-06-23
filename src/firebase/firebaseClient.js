/**
 * firebaseClient.js
 * Initialisation paresseuse (lazy) de l'application Firebase.
 *
 * Ce module expose deux fonctions :
 *   - getFirebaseAuth() : retourne l'instance Firebase Auth (ou null si non configuré)
 *   - getFirebaseDb()   : retourne l'instance Firestore (ou null si non configuré)
 *
 * Firebase n'est initialisé qu'une seule fois, au premier appel d'une de ces fonctions.
 * La persistance Auth et la persistance Firestore (IndexedDB) sont
 * activées automatiquement pour permettre le mode hors ligne.
 */

import { getApps, initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { getFirebaseConfig, isFirebaseConfigured } from './firebaseConfig'

// Instances partagées, initialisées une seule fois.
let app = null
let auth = null
let db = null

// Drapeau pour éviter d'appeler enableIndexedDbPersistence plusieurs fois.
let persistenceStarted = false

/**
 * Active la persistance Firestore (IndexedDB) pour le mode hors ligne.
 * Ignore les erreurs "failed-precondition" (plusieurs onglets) et "unimplemented" (navigateur non supporté).
 */
async function enableFirestorePersistence() {
  if (!db || persistenceStarted) return
  persistenceStarted = true
  try {
    await enableIndexedDbPersistence(db)
  } catch (err) {
    // Ces codes d'erreur sont courants et non bloquants.
    if (err?.code !== 'failed-precondition' && err?.code !== 'unimplemented') {
      console.warn('Firestore persistence non activée:', err)
    }
  }
}

/**
 * Initialise Firebase si ce n'est pas encore fait et si la config est présente.
 * @returns {boolean} true si Firebase est prêt, false sinon.
 */
function ensureFirebaseInitialized() {
  if (!isFirebaseConfigured()) {
    return false
  }

  if (!app) {
    const config = getFirebaseConfig()
    // Réutilise l'app existante si Firebase a déjà été initialisé (ex: hot reload en dev).
    app = getApps().length > 0 ? getApps()[0] : initializeApp(config)
    auth = getAuth(app)
    db = getFirestore(app)

    // Persistance Auth : maintient la session même après fermeture du navigateur.
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    // Persistance Firestore : active le cache IndexedDB (asynchrone).
    enableFirestorePersistence()
  }

  return true
}

/**
 * Retourne l'instance Firebase Auth.
 * Initialise Firebase si nécessaire.
 * @returns {import('firebase/auth').Auth|null}
 */
export function getFirebaseAuth() {
  ensureFirebaseInitialized()
  return auth
}

/**
 * Retourne l'instance Firestore.
 * Initialise Firebase si nécessaire.
 * @returns {import('firebase/firestore').Firestore|null}
 */
export function getFirebaseDb() {
  ensureFirebaseInitialized()
  return db
}

// Ré-exporte isFirebaseConfigured pour permettre un import unique depuis ce module.
export { isFirebaseConfigured }
