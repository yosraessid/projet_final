import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider, initTheme } from './context/ThemeContext.jsx'

initTheme()

createRoot(document.getElementById('root')).render(
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
