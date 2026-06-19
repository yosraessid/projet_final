/**
 * App.jsx
 * Composant racine — définit toutes les routes de l'application.
 *
 * Routes :
 *   /                        → HomePage (publique)
 *   /auth                    → AuthPage (connexion + inscription)
 *   /dashboard               → DashboardPage (protégée)
 *   /dashboard/projet/:id    → ProjectPage (protégée)
 *   /dashboard/nouveau-projet → redirige vers ?nouveau-projet=1
 *   /profil                  → ProfileSettingsPage (protégée)
 *   *                        → NotFoundPage (404)
 */

import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import ProjectPage from './pages/ProjectPage'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/projet/:projectId"
          element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/nouveau-projet"
          element={<Navigate to="/dashboard?nouveau-projet=1" replace />}
        />

        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
