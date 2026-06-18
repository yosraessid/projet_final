/**
 * TopbarAuth.jsx
 * Bouton d'authentification dans la topbar (haut à droite).
 *
 * Comportement selon l'état de connexion :
 *   Non connecté :
 *     - Icône silhouette → ouvre un panneau de connexion rapide (email + mot de passe).
 *     - Lien vers /auth pour l'inscription.
 *
 *   Connecté :
 *     - Avatar avec initiales → ouvre un panneau utilisateur.
 *     - Affiche nom et email de l'utilisateur.
 *     - Liens "Mon profil" et "Se déconnecter".
 *
 * Le panneau se ferme automatiquement si on clique en dehors (useClickOutside).
 *
 * Accessibilité :
 *   - aria-label et aria-expanded sur le bouton principal.
 *   - role="dialog" sur le panneau flottant.
 *   - Les icônes SVG ont aria-hidden="true".
 */

import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { useClickOutside } from '../hooks/useClickOutside'
import PasswordInput from './PasswordInput'

function TopbarAuth() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { user, isLoggedIn, login, logout } = useAuth()

  // État d'ouverture/fermeture du panneau.
  const [open, setOpen] = useState(false)

  // Référence sur le conteneur pour détecter les clics extérieurs.
  const containerRef = useRef(null)

  const closePanel = useCallback(() => setOpen(false), [])
  useClickOutside(containerRef, closePanel, open)

  // États du formulaire de connexion rapide.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Calcule les initiales de l'utilisateur pour l'avatar (max 2 caractères).
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  /**
   * Gère la connexion depuis le formulaire rapide de la topbar.
   * Redirige vers /dashboard en cas de succès.
   */
  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setIsLoading(true)
    const result = await login(email, password)
    setIsLoading(false)

    if (!result.ok) {
      setLoginError(result.message)
      notify('Erreur', result.message, 'warning')
      return
    }

    // Connexion réussie : réinitialise le formulaire, ferme le panneau et redirige.
    notify('Connexion', `Bienvenue ${email.split('@')[0]} !`, 'success')
    setEmail('')
    setPassword('')
    setOpen(false)
    navigate('/dashboard')
  }

  /**
   * Déconnecte l'utilisateur et redirige vers l'accueil.
   */
  const handleLogout = async () => {
    await logout()
    setOpen(false)
    notify('Déconnexion', 'À bientôt !', 'info')
    navigate('/')
  }

  return (
    <div className="topbar-auth" ref={containerRef}>
      {/* Bouton principal : avatar (connecté) ou icône silhouette (non connecté) */}
      <button
        type="button"
        className="auth-btn"
        aria-label={isLoggedIn ? 'Mon compte' : 'Connexion'}
        title={isLoggedIn ? user.name : 'Connexion'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {isLoggedIn ? (
          // Avatar avec initiales de l'utilisateur connecté.
          <span className="auth-avatar">{initials}</span>
        ) : (
          // Icône silhouette pour l'état non connecté.
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4 20.5c0-3.5 3.6-6.5 8-6.5s8 3 8 6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {/* Panneau flottant */}
      {open && (
        <div className="auth-panel" role="dialog" aria-label="Connexion">
          {isLoggedIn ? (
            /* ─── Vue connecté : infos utilisateur + actions ─── */
            <>
              <div className="auth-panel-header">
                {/* Avatar large avec initiales */}
                <span className="auth-avatar auth-avatar-lg">{initials}</span>
                <div>
                  <p className="auth-panel-name">{user.name}</p>
                  <p className="auth-panel-email">{user.email}</p>
                </div>
              </div>
              <div className="auth-panel-actions">
                <Link
                  to="/profil"
                  className="button button-light full-width"
                  onClick={() => setOpen(false)}
                >
                  Mon profil
                </Link>
                <button
                  type="button"
                  className="button button-danger full-width"
                  onClick={handleLogout}
                >
                  Se déconnecter
                </button>
              </div>
            </>
          ) : (
            /* ─── Vue non connecté : formulaire de connexion rapide ─── */
            <>
              <div className="auth-panel-header">
                <p className="auth-panel-title">Connexion rapide</p>
              </div>
              <form className="form auth-panel-form" onSubmit={handleLogin}>
                {/* Message d'erreur de connexion */}
                {loginError && <p className="form-error">{loginError}</p>}

                <label>
                  Email
                  <input
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label>
                  Mot de passe
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className="button button-primary full-width"
                  disabled={isLoading}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              {/* Lien vers la page d'inscription complète */}
              <p className="auth-panel-footer">
                Pas encore de compte ?{' '}
                <Link to="/auth" onClick={() => setOpen(false)}>
                  S'inscrire
                </Link>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default TopbarAuth
