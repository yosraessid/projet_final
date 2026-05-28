import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import GroupsPage from './pages/GroupsPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/groupes" element={<GroupsPage />} />
        <Route path="/profil" element={<ProfileSettingsPage />} />
      </Route>

      <Route path="/accueil" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
