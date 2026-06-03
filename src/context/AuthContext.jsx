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

const AuthContext = createContext(null)

function nameFromEmail(email) {
  const prefix = email?.trim()?.split('@')?.[0]
  return prefix || 'Utilisateur'
}

function firebaseErrorToFrenchMessage(err) {
  const code = err?.code
  switch (code) {
    case 'auth/invalid-email':
      return 'Email invalide.'
    case 'auth/user-not-found':
      return "Aucun compte ne correspond a cet email."
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.'
    case 'auth/email-already-in-use':
      return "Cet email est deja utilise."
    case 'auth/weak-password':
      return 'Mot de passe trop faible.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Reessayez plus tard.'
    default:
      return err?.message || "Erreur d'authentification. Veuillez reessayer."
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
          setUser({
            uid: fbUser.uid,
            name: profile.name,
            email: profile.email,
            role: profile.role || 'Membre',
          })
        } else {
          setUser({
            uid: fbUser.uid,
            name: nameFromEmail(fbUser.email),
            email: fbUser.email,
            role: 'Membre',
          })
        }
      } catch {
        setUser({
          uid: fbUser.uid,
          name: nameFromEmail(fbUser.email),
          email: fbUser.email,
          role: 'Membre',
        })
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
      setUser({
        uid: profile.uid,
        name: profile.name,
        email: profile.email,
        role: profile.role || 'Membre',
      })
      setLoading(false)
      return { ok: true }
    } catch (err) {
      setLoading(false)
      return { ok: false, message: firebaseErrorToFrenchMessage(err) }
    }
  }

  const register = async (fullName, email, password, confirmPassword) => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return { ok: false, message: 'Merci de remplir tous les champs.' }
    }
    if (password !== confirmPassword) {
      return { ok: false, message: 'La confirmation du mot de passe est incorrecte.' }
    }
    if (!isStrongPassword(password)) {
      return {
        ok: false,
        message: getPasswordErrorMessage(password) || 'Mot de passe trop faible.',
      }
    }

    try {
      const profile = await registerWithEmailPassword({ fullName, email, password })
      setUser({
        uid: profile.uid,
        name: profile.name,
        email: profile.email,
        role: profile.role || 'Membre',
      })
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
      return { ok: true, message: 'Email de reinitialisation envoye. Verifiez votre boite mail.' }
    } catch (err) {
      return { ok: false, message: firebaseErrorToFrenchMessage(err) }
    }
  }

  const saveProfile = async ({ name, role }) => {
    if (!user?.uid) {
      return { ok: false, message: 'Utilisateur non connecte.' }
    }
    try {
      const updated = await updateUserProfile({ uid: user.uid, name, role })
      setUser({
        uid: user.uid,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      })
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err?.message || 'Echec mise a jour profil.' }
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      loading,
      login,
      register,
      resetPassword,
      saveProfile,
      logout: handleLogout,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
