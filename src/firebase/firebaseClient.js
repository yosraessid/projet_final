import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseConfig, isFirebaseConfigured } from './firebaseConfig'

let app = null
let auth = null
let db = null

function ensureFirebaseInitialized() {
  if (!isFirebaseConfigured()) {
    return false
  }

  if (!app) {
    const config = getFirebaseConfig()
    app = getApps().length > 0 ? getApps()[0] : initializeApp(config)
    auth = getAuth(app)
    db = getFirestore(app)
  }

  return true
}

export function getFirebaseAuth() {
  ensureFirebaseInitialized()
  return auth
}

export function getFirebaseDb() {
  ensureFirebaseInitialized()
  return db
}

export { isFirebaseConfigured }
