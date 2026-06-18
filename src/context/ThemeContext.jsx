/**
 * ThemeContext.jsx
 * Contexte React pour la gestion du thème visuel (clair / sombre).
 *
 * Le thème est persisté dans localStorage sous la clé "app-theme".
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
 *   - initTheme()  : à appeler avant le premier rendu pour éviter le flash de thème
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/** Clé utilisée pour sauvegarder la préférence de thème dans localStorage. */
const STORAGE_KEY = 'app-theme'

const ThemeContext = createContext(null)

/**
 * Lit le thème sauvegardé dans localStorage.
 * Retourne 'light' si la valeur est explicitement 'light', 'dark' dans tous les autres cas.
 * @returns {'dark' | 'light'}
 */
function getStoredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' ? 'light' : 'dark'
}

/**
 * Applique immédiatement le thème sauvegardé sur <html data-theme="...">.
 * À appeler avant createRoot() pour éviter le flash blanc/noir au chargement.
 * @returns {'dark' | 'light'} le thème appliqué.
 */
export function initTheme() {
  const theme = getStoredTheme()
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}

/**
 * Provider du contexte de thème.
 * Enveloppe les composants enfants et leur donne accès aux valeurs et actions de thème.
 */
export function ThemeProvider({ children }) {
  // Initialise le thème depuis localStorage (avec initTheme comme valeur initiale).
  const [theme, setTheme] = useState(() => initTheme())

  // Synchronise l'attribut data-theme du <html> et sauvegarde dans localStorage à chaque changement.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // Mémoïse la valeur du contexte pour éviter des re-renders inutiles des consommateurs.
  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      /** Active ou désactive le mode sombre selon le booléen fourni. */
      setDarkMode: (enabled) => setTheme(enabled ? 'dark' : 'light'),
      /** Bascule entre les deux thèmes. */
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
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
