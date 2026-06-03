import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '../firebase/firebaseClient'

function requireAuth() {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase non configure.')
  return auth
}

function requireDb() {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase non configure.')
  return db
}

function emailToDefaultName(email) {
  return email?.split('@')?.[0] || 'Utilisateur'
}

async function fetchUserProfile(uid) {
  const db = requireDb()
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data()
}

export async function getUserProfileByUid(uid) {
  return fetchUserProfile(uid)
}

export async function updateUserProfile({ uid, name, role }) {
  const db = requireDb()
  const ref = doc(db, 'users', uid)
  const existing = await getDoc(ref)
  if (!existing.exists()) {
    throw new Error('Profil utilisateur introuvable.')
  }

  const data = existing.data()
  await setDoc(
    ref,
    {
      uid,
      name: name.trim(),
      email: data.email,
      role: role?.trim() || data.role || 'Membre',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return {
    uid,
    name: name.trim(),
    email: data.email,
    role: role?.trim() || data.role || 'Membre',
  }
}

async function upsertUserProfile({ uid, name, email }) {
  const db = requireDb()
  const ref = doc(db, 'users', uid)
  await setDoc(
    ref,
    {
      uid,
      name,
      email,
      role: 'Membre',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function loginWithEmailPassword({ email, password }) {
  const auth = requireAuth()
  const cleanEmail = email.trim().toLowerCase()
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password)
  const { uid } = cred.user
  const fallbackName = emailToDefaultName(cleanEmail)

  try {
    const existingProfile = await fetchUserProfile(uid)
    if (existingProfile) {
      return {
        uid,
        name: existingProfile.name,
        email: existingProfile.email,
        role: existingProfile.role || 'Membre',
      }
    }

    await upsertUserProfile({ uid, name: fallbackName, email: cleanEmail })
  } catch {
    // Connexion Auth reussie mais Firestore bloque (regles non publiees, etc.)
    // On laisse quand meme entrer l utilisateur.
  }

  return { uid, name: fallbackName, email: cleanEmail, role: 'Membre' }
}

export async function registerWithEmailPassword({ fullName, email, password }) {
  const auth = requireAuth()
  const cleanEmail = email.trim().toLowerCase()
  const name = fullName.trim()

  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
  const { uid } = cred.user

  await upsertUserProfile({ uid, name, email: cleanEmail })

  return { uid, name, email: cleanEmail, role: 'Membre' }
}

export async function sendPasswordReset(email) {
  const auth = requireAuth()
  const cleanEmail = email.trim()
  if (!cleanEmail) {
    throw new Error('Merci de saisir votre email.')
  }
  await sendPasswordResetEmail(auth, cleanEmail)
}

export async function logoutUser() {
  const auth = requireAuth()
  await signOut(auth)
}
