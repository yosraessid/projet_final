import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'app-user'
const AuthContext = createContext(null)

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadUser())

  const login = (email, password) => {
    const cleanEmail = email.trim()
    if (!cleanEmail || !password.trim()) {
      return { ok: false, message: 'Merci de remplir email et mot de passe.' }
    }
    const name = cleanEmail.split('@')[0]
    const nextUser = { name, email: cleanEmail }
    setUser(nextUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    return { ok: true }
  }

  const register = (fullName, email, password, confirmPassword) => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return { ok: false, message: 'Merci de remplir tous les champs.' }
    }
    if (password !== confirmPassword) {
      return { ok: false, message: 'La confirmation du mot de passe est incorrecte.' }
    }
    const nextUser = { name: fullName.trim(), email: email.trim() }
    setUser(nextUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      login,
      register,
      logout,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
