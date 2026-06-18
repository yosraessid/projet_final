/**
 * firebaseConfig.js
 * Gestion de la configuration Firebase via les variables d'environnement Vite (fichier .env).
 *
 * Fonctions exportées :
 *   - isFirebaseConfigured()      : vérifie que toutes les variables requises sont présentes
 *   - getMissingFirebaseEnvKeys() : retourne la liste des variables manquantes
 *   - getFirebaseConfig()         : retourne l'objet de configuration Firebase ou null
 *
 * Les variables attendues dans le fichier .env :
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 */

// Liste de toutes les clés d'environnement nécessaires au bon fonctionnement de Firebase.
const REQUIRED_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

/**
 * Vérifie que toutes les variables d'environnement Firebase sont définies et non vides.
 * @returns {boolean} true si Firebase est entièrement configuré, false sinon.
 */
export function isFirebaseConfigured() {
  return REQUIRED_ENV_KEYS.every((key) => Boolean(import.meta.env[key]))
}

/**
 * Retourne la liste des variables d'environnement Firebase manquantes ou vides.
 * Utile pour afficher un message d'aide à l'utilisateur.
 * @returns {string[]} tableau des noms de variables manquantes.
 */
export function getMissingFirebaseEnvKeys() {
  return REQUIRED_ENV_KEYS.filter((key) => !import.meta.env[key])
}

/**
 * Construit et retourne l'objet de configuration Firebase.
 * @returns {object|null} objet config Firebase, ou null si la config est incomplète.
 */
export function getFirebaseConfig() {
  if (!isFirebaseConfigured()) {
    return null
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}
