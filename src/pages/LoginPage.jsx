import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'

function LoginPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      notify('Erreur', 'Merci de remplir email et mot de passe.', 'warning')
      return
    }
    notify('Connexion', 'Connexion reussie (demo).', 'success')
    navigate('/dashboard')
  }

  return (
    <section className="grid-one">
      <article className="card">
        <h2>Connexion</h2>
        <p>Connectez-vous pour acceder a vos listes partagees.</p>
        <form className="form" onSubmit={handleSubmit}>
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
        <p className="muted" style={{ marginTop: '0.8rem' }}>
          Pas de compte ? <Link to="/register">Creez un compte</Link>
        </p>
      </article>
    </section>
  )
}

export default LoginPage

