/**
 * ThemeContext.jsx
 * Contexte React pour la gestion du thème visuel (clair / sombre).
 *
 * Le thème est persisté dans Firestore (champ "theme" du document utilisateur).
 * Par défaut, le thème sombre est appliqué si aucune préférence n'est sauvegardée.
 *
 * Valeurs exposées via useTheme() :
 *   - theme        : 'dark' | 'light'
 *   - isDark       : boolean — raccourci pour theme === 'dark'
 *   - setTheme     : (theme: string) => void
 *   - setDarkMode  : (enabled: boolean) => void — active/désactive le mode sombre
 *   - toggleTheme  : () => void — bascule entre clair et sombre
 *
 * Fonctions utilitaires exportées :
 *   - initTheme()  : à appeler avant le premier rendu pour appliquer le thème par défaut
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '../firebase/firebaseClient'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

/**
 * Applique le thème par défaut (sombre) sur <html data-theme="...">.
 * À appeler avant createRoot() pour éviter le flash blanc au chargement.
 * @returns {'dark'}
 */
export function initTheme() {
  document.documentElement.setAttribute('data-theme', 'dark')
  return 'dark'
}

/**
 * Provider du contexte de thème.
 * Lit la préférence de thème depuis le profil Firestore et la sauvegarde à chaque changement.
 */
export function ThemeProvider({ children }) {
  const { user } = useAuth()

  // Initialise le thème (sombre par défaut).
  const [theme, setThemeState] = useState('dark')

  // Quand l'utilisateur se connecte et que son profil contient un thème, on l'applique.
  useEffect(() => {
    if (user?.theme) {
      const t = user.theme === 'light' ? 'light' : 'dark'
      setThemeState(t)
      document.documentElement.setAttribute('data-theme', t)
    }
  }, [user?.theme])

  // Réinitialise au thème sombre lors de la déconnexion.
  useEffect(() => {
    if (!user) {
      setThemeState('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [user])

  // Synchronise l'attribut data-theme du <html> à chaque changement.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  /**
   * Change le thème et le sauvegarde dans Firestore.
   * @param {string} newTheme
   */
  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    // Sauvegarde dans Firestore si l'utilisateur est connecté.
    if (user?.uid && isFirebaseConfigured()) {
      const db = getFirebaseDb()
      if (db) {
        setDoc(doc(db, 'users', user.uid), { theme: newTheme }, { merge: true }).catch(() => {})
      }
    }
  }

  // Mémoïse la valeur du contexte pour éviter des re-renders inutiles des consommateurs.
  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      /** Active ou désactive le mode sombre selon le booléen fourni. */
      setDarkMode: (enabled) => setTheme(enabled ? 'dark' : 'light'),
      /** Bascule entre les deux thèmes. */
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, user?.uid],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook personnalisé pour accéder au contexte de thème.
 * Doit être utilisé à l'intérieur d'un ThemeProvider.
 * @throws {Error} si utilisé hors du provider.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
