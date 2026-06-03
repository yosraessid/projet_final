// Configuration Firebase via variables d'environnement Vite (fichier .env).

const REQUIRED_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export function isFirebaseConfigured() {
  return REQUIRED_ENV_KEYS.every((key) => Boolean(import.meta.env[key]))
}

export function getMissingFirebaseEnvKeys() {
  return REQUIRED_ENV_KEYS.filter((key) => !import.meta.env[key])
}

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
