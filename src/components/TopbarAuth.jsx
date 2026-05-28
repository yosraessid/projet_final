import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { useClickOutside } from '../hooks/useClickOutside'

function TopbarAuth() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { user, isLoggedIn, login, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const closePanel = useCallback(() => setOpen(false), [])

  useClickOutside(containerRef, closePanel, open)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const handleLogin = (event) => {
    event.preventDefault()
    const result = login(email, password)
    if (!result.ok) {
      notify('Erreur', result.message, 'warning')
      return
    }
    notify('Connexion', `Bienvenue ${email.split('@')[0]} !`, 'success')
    setEmail('')
    setPassword('')
    setOpen(false)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    logout()
    setOpen(false)
    notify('Deconnexion', 'A bientot !', 'info')
    navigate('/')
  }

  return (
    <div className="topbar-auth" ref={containerRef}>
      <button
        type="button"
        className="auth-btn"
        aria-label={isLoggedIn ? 'Mon compte' : 'Connexion'}
        title={isLoggedIn ? user.name : 'Connexion'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {isLoggedIn ? (
          <span className="auth-avatar">{initials}</span>
        ) : (
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

      {open && (
        <div className="auth-panel" role="dialog" aria-label="Connexion">
          {isLoggedIn ? (
            <>
              <div className="auth-panel-header">
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
                <button type="button" className="button button-danger full-width" onClick={handleLogout}>
                  Se deconnecter
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="auth-panel-header">
                <p className="auth-panel-title">Connexion rapide</p>
              </div>
              <form className="form auth-panel-form" onSubmit={handleLogin}>
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
                  <input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button type="submit" className="button button-primary full-width">
                  Se connecter
                </button>
              </form>
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
