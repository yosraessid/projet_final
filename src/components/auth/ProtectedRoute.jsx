import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  // Affiche "Chargement" seulement si on ne sait pas encore si l utilisateur est connecte.
  if (loading && !isLoggedIn) {
    return <p className="auth-loading">Chargement...</p>
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  return children
}

export default ProtectedRoute

