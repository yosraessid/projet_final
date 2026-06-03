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

initTheme()

const root = createRoot(document.getElementById('root'))

if (!isFirebaseConfigured()) {
  root.render(
    <StrictMode>
      <ThemeProvider>
        <FirebaseSetupScreen />
      </ThemeProvider>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <NotificationsProvider>
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
