/**
 * AuthContext.jsx
 * Contexte React pour la gestion de l'authentification Firebase.
 *
 * Fonctionnement :
 *   - Écoute en temps réel l'état de la session Firebase via onAuthStateChanged.
 *   - Charge le profil Firestore de l'utilisateur (nom, rôle) à chaque changement de session.
 *   - Expose les actions login, register, resetPassword, saveProfile, logout.
 *
 * Valeurs exposées via useAuth() :
 *   - user       : { uid, name, email, role } | null
 *   - isLoggedIn : boolean
 *   - loading    : boolean — true pendant la vérification initiale de session
 *   - login(email, password)                          → { ok, message? }
 *   - register(fullName, email, password, confirm)    → { ok, message? }
 *   - resetPassword(email)                            → { ok, message }
 *   - saveProfile({ name, role })                     → { ok, message? }
 *   - logout()                                        → void
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  getUserProfileByUid,
  loginWithEmailPassword,
  registerWithEmailPassword,
  sendPasswordReset,
  logoutUser,
  updateUserProfile,
} from '../services/firebaseAuthService'
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase/firebaseClient'
import { getPasswordErrorMessage, isStrongPassword } from '../utils/passwordValidation'
import { logSecurityEvent } from '../utils/securityLogger'

const AuthContext = createContext(null)

/**
 * Extrait un nom d'affichage lisible depuis une adresse email.
 * Ex: "yosra.essid@gmail.com" → "yosra.essid"
 */
function nameFromEmail(email) {
  const prefix = email?.trim()?.split('@')?.[0]
  return prefix || 'Utilisateur'
}

/**
 * Traduit les codes d'erreur Firebase Auth en messages français lisibles.
 */
function firebaseErrorToFrenchMessage(err) {
  const code = err?.code
  switch (code) {
    case 'auth/invalid-email':
      return 'Email invalide.'
    case 'auth/user-not-found':
      return "Aucun compte ne correspond à cet email."
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.'
    case 'auth/email-already-in-use':
      return "Cet email est déjà utilisé."
    case 'auth/weak-password':
      return 'Mot de passe trop faible.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard.'
    default:
      return err?.message || "Erreur d'authentification. Veuillez réessayer."
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false)
      return undefined
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const profile = await getUserProfileByUid(fbUser.uid)
        if (profile?.name && profile?.email) {
          setUser({ uid: fbUser.uid, name: profile.name, email: profile.email, role: profile.role || 'Membre', theme: profile.theme || 'dark' })
        } else {
          setUser({ uid: fbUser.uid, name: nameFromEmail(fbUser.email), email: fbUser.email, role: 'Membre', theme: 'dark' })
        }
      } catch {
        setUser({ uid: fbUser.uid, name: nameFromEmail(fbUser.email), email: fbUser.email, role: 'Membre', theme: 'dark' })
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const login = async (email, password) => {
    const cleanEmail = email.trim()
    if (!cleanEmail || !password.trim()) {
      return { ok: false, message: 'Merci de remplir email et mot de passe.' }
    }
    try {
      const profile = await loginWithEmailPassword({ email: cleanEmail, password })
      setUser({ uid: profile.uid, name: profile.name, email: profile.email, role: profile.role || 'Membre' })
      setLoading(false)
      logSecurityEvent('login_success', { email: cleanEmail })
      return { ok: true }
    } catch (err) {
      setLoading(false)
      logSecurityEvent('login_failed', { email: cleanEmail, reason: err?.code || 'unknown' })
      return { ok: false, message: firebaseErrorToFrenchMessage(err) }
    }
  }

  const register = async (fullName, email, password, confirmPassword) => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return { ok: false, message: 'Merci de remplir tous les champs.' }
    }
    // Validation format email avant d'appeler Firebase.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(email.trim())) {
      return { ok: false, message: 'Format email invalide (ex: nom@domaine.com).' }
    }
    if (password !== confirmPassword) {
      return { ok: false, message: 'La confirmation du mot de passe est incorrecte.' }
    }
    if (!isStrongPassword(password)) {
      return { ok: false, message: getPasswordErrorMessage(password) || 'Mot de passe trop faible.' }
    }
    try {
      const profile = await registerWithEmailPassword({ fullName, email, password })
      setUser({ uid: profile.uid, name: profile.name, email: profile.email, role: profile.role || 'Membre' })
      setLoading(false)
      return { ok: true }
    } catch (err) {
      setLoading(false)
      return { ok: false, message: firebaseErrorToFrenchMessage(err) }
    }
  }

  const resetPassword = async (email) => {
    try {
      await sendPasswordReset(email)
      return { ok: true, message: 'Email de réinitialisation envoyé. Vérifiez votre boîte mail.' }
    } catch (err) {
      return { ok: false, message: firebaseErrorToFrenchMessage(err) }
    }
  }

  const saveProfile = async ({ name, role }) => {
    if (!user?.uid) return { ok: false, message: 'Utilisateur non connecté.' }
    try {
      const updated = await updateUserProfile({ uid: user.uid, name, role })
      setUser({ uid: user.uid, name: updated.name, email: updated.email, role: updated.role })
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err?.message || 'Échec mise à jour profil.' }
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, isLoggedIn: Boolean(user), loading, login, register, resetPassword, saveProfile, logout: handleLogout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
