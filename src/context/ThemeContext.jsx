import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'app-theme'
const ThemeContext = createContext(null)

function getStoredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' ? 'light' : 'dark'
}

export function initTheme() {
  const theme = getStoredTheme()
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => initTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      setDarkMode: (enabled) => setTheme(enabled ? 'dark' : 'light'),
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
