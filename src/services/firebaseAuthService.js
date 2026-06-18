/**
 * firebaseAuthService.js
 * Service d'authentification Firebase.
 *
 * Expose les fonctions suivantes :
 *   - getUserProfileByUid(uid)                    : lit le profil Firestore d'un utilisateur
 *   - updateUserProfile({ uid, name, role })       : met à jour le profil Firestore
 *   - loginWithEmailPassword({ email, password })  : connecte un utilisateur
 *   - registerWithEmailPassword({ fullName, email, password }) : inscrit un nouvel utilisateur
 *   - sendPasswordReset(email)                    : envoie un email de réinitialisation
 *   - logoutUser()                                : déconnecte l'utilisateur courant
 *
 * Toutes les fonctions lancent une erreur si Firebase n'est pas configuré.
 */

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '../firebase/firebaseClient'

/**
 * Vérifie que Firebase Auth est initialisé et le retourne.
 * @throws {Error} si Firebase n'est pas configuré.
 * @returns {import('firebase/auth').Auth}
 */
function requireAuth() {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase non configuré.')
  return auth
}

/**
 * Vérifie que Firestore est initialisé et le retourne.
 * @throws {Error} si Firebase n'est pas configuré.
 * @returns {import('firebase/firestore').Firestore}
 */
function requireDb() {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase non configuré.')
  return db
}

/**
 * Génère un nom d'affichage depuis une adresse email (partie avant le @).
 * @param {string} email
 * @returns {string}
 */
function emailToDefaultName(email) {
  return email?.split('@')?.[0] || 'Utilisateur'
}

/**
 * Lit le document profil d'un utilisateur dans la collection "users".
 * Fonction interne non exportée.
 * @param {string} uid
 * @returns {object|null} Données du profil ou null si inexistant.
 */
async function fetchUserProfile(uid) {
  const db = requireDb()
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data()
}

/**
 * Lit et retourne le profil Firestore d'un utilisateur par son UID.
 * @param {string} uid
 * @returns {object|null}
 */
export async function getUserProfileByUid(uid) {
  return fetchUserProfile(uid)
}

/**
 * Met à jour le nom et le rôle d'un utilisateur dans Firestore.
 * Lance une erreur si le profil n'existe pas encore.
 * @param {{ uid: string, name: string, role: string }}
 * @returns {{ uid, name, email, role }}
 */
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
    { merge: true }, // merge: true pour ne pas écraser les champs non modifiés.
  )

  return {
    uid,
    name: name.trim(),
    email: data.email,
    role: role?.trim() || data.role || 'Membre',
  }
}

/**
 * Crée ou met à jour le profil Firestore d'un utilisateur.
 * Utilisé à la connexion et à l'inscription pour s'assurer que le profil existe.
 * @param {{ uid: string, name: string, email: string }}
 */
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

/**
 * Connecte un utilisateur avec son email et son mot de passe.
 * Récupère ou crée son profil Firestore après authentification.
 * Si Firestore est inaccessible, retourne un profil minimal basé sur l'email.
 * @param {{ email: string, password: string }}
 * @returns {{ uid, name, email, role }}
 */
export async function loginWithEmailPassword({ email, password }) {
  const auth = requireAuth()
  const cleanEmail = email.trim().toLowerCase()
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password)
  const { uid } = cred.user
  const fallbackName = emailToDefaultName(cleanEmail)

  try {
    const existingProfile = await fetchUserProfile(uid)
    if (existingProfile) {
      // Retourne le profil complet depuis Firestore.
      return {
        uid,
        name: existingProfile.name,
        email: existingProfile.email,
        role: existingProfile.role || 'Membre',
      }
    }

    // Premier login sans profil existant : on en crée un.
    await upsertUserProfile({ uid, name: fallbackName, email: cleanEmail })
  } catch {
    // Connexion Auth réussie mais Firestore bloqué (règles non publiées, hors ligne…).
    // On laisse quand même entrer l'utilisateur avec un profil minimal.
  }

  return { uid, name: fallbackName, email: cleanEmail, role: 'Membre' }
}

/**
 * Inscrit un nouvel utilisateur avec email, mot de passe et nom complet.
 * Crée automatiquement son profil dans Firestore après l'inscription Firebase Auth.
 * @param {{ fullName: string, email: string, password: string }}
 * @returns {{ uid, name, email, role }}
 */
export async function registerWithEmailPassword({ fullName, email, password }) {
  const auth = requireAuth()
  const cleanEmail = email.trim().toLowerCase()
  const name = fullName.trim()

  // Création du compte Firebase Auth.
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
  const { uid } = cred.user

  // Création du profil Firestore associé.
  await upsertUserProfile({ uid, name, email: cleanEmail })

  return { uid, name, email: cleanEmail, role: 'Membre' }
}

/**
 * Envoie un email de réinitialisation de mot de passe.
 * @param {string} email
 * @throws {Error} si l'email est vide.
 */
export async function sendPasswordReset(email) {
  const auth = requireAuth()
  const cleanEmail = email.trim()
  if (!cleanEmail) {
    throw new Error('Merci de saisir votre email.')
  }
  await sendPasswordResetEmail(auth, cleanEmail)
}

/**
 * Déconnecte l'utilisateur courant de Firebase Auth.
 */
export async function logoutUser() {
  const auth = requireAuth()
  await signOut(auth)
}
