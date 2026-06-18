/**
 * ProtectedRoute.jsx
 * Composant de garde pour les routes nécessitant une authentification.
 *
 * Comportement :
 *   - Pendant la vérification initiale de session (loading && !isLoggedIn) :
 *     affiche un message "Chargement..." pour éviter une redirection prématurée.
 *   - Si l'utilisateur n'est pas connecté :
 *     redirige vers /auth en sauvegardant l'URL d'origine dans l'état de navigation
 *     (state.from) pour un éventuel retour après connexion.
 *   - Si l'utilisateur est connecté : affiche les enfants normalement.
 *
 * Usage :
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * @param {{ children: React.ReactNode }} props
 */
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  // Affiche un indicateur de chargement uniquement si la session n'est pas encore connue.
  // Évite une redirection vers /auth lors d'un rechargement de page avec une session active.
  if (loading && !isLoggedIn) {
    return <p className="auth-loading">Chargement...</p>
  }

  // Utilisateur non connecté : redirige vers la page d'authentification.
  // `state.from` permet de revenir à la page demandée après connexion.
  if (!isLoggedIn) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  // Utilisateur connecté : rendu normal des enfants.
  return children
}

export default ProtectedRoute
