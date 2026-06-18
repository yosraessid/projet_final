/**
 * main.jsx
 * Point d'entrée principal de l'application React.
 * - Initialise le thème avant le rendu pour éviter le flash
 * - Vérifie si Firebase est configuré :
 *   - Si non : affiche un écran de configuration guidée (FirebaseSetupScreen)
 *   - Si oui  : monte l'arbre complet des providers (Theme, Auth, Notifications, AppData)
 *               puis rend le composant App avec le routeur
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider, initTheme } from './context/ThemeContext.jsx'
import FirebaseSetupScreen from './components/FirebaseSetupScreen.jsx'
import { isFirebaseConfigured } from './firebase/firebaseClient'

// Applique le thème sauvegardé avant le premier rendu pour éviter le flash clair/sombre.
initTheme()

// Cible le div#root défini dans index.html.
const root = createRoot(document.getElementById('root'))

if (!isFirebaseConfigured()) {
  // Firebase non configuré : on affiche uniquement l'écran d'aide à la configuration.
  root.render(
    <StrictMode>
      <ThemeProvider>
        <FirebaseSetupScreen />
      </ThemeProvider>
    </StrictMode>,
  )
} else {
  // Firebase configuré : rendu complet avec tous les providers imbriqués.
  root.render(
    <StrictMode>
      {/* BrowserRouter active la navigation côté client */}
      <BrowserRouter>
        {/* ThemeProvider gère le mode clair/sombre */}
        <ThemeProvider>
          {/* AuthProvider gère la session utilisateur Firebase */}
          <AuthProvider>
            {/* NotificationsProvider gère les messages toast */}
            <NotificationsProvider>
              {/* AppDataProvider synchronise projets/tâches/membres en temps réel */}
              <AppDataProvider>
                <App />
              </AppDataProvider>
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}
