/**
 * App.jsx
 * Composant racine de l'application.
 * Définit toutes les routes via React Router v6 :
 *   /           → HomePage (page d'accueil publique)
 *   /auth       → AuthPage (connexion + inscription Firebase)
 *   /dashboard  → DashboardPage (protégée)
 *   /groupes    → GroupsPage (protégée)
 *   /profil     → ProfileSettingsPage (protégée)
 *   *           → NotFoundPage (404)
 *
 * Toutes les pages partagent le layout AppLayout (sidebar + topbar).
 * Les routes protégées nécessitent une session active via ProtectedRoute.
 */

import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import GroupsPage from './pages/GroupsPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import ProjectPage from './pages/ProjectPage'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Toutes les pages partagent le même layout (sidebar + topbar) */}
      <Route element={<AppLayout />}>
        {/* Page d'accueil publique */}
        <Route path="/" element={<HomePage />} />

        {/* Page de connexion / inscription Firebase */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard : accès réservé aux utilisateurs connectés */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Page détails d'un projet */}
        <Route
          path="/dashboard/projet/:projectId"
          element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          }
        />

        {/* Raccourci URL pour ouvrir la modal de création de projet */}
        <Route
          path="/dashboard/nouveau-projet"
          element={<Navigate to="/dashboard?nouveau-projet=1" replace />}
        />

        {/* Page des groupes/équipes : accès réservé */}
        <Route
          path="/groupes"
          element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          }
        />

        {/* Page de profil et paramètres : accès réservé */}
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Toute route inconnue affiche la page 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
