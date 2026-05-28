import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'

function RegisterPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      notify('Erreur', 'Merci de remplir tous les champs.', 'warning')
      return
    }
    if (password !== confirm) {
      notify('Erreur', 'La confirmation du mot de passe ne correspond pas.', 'warning')
      return
    }
    notify('Compte', 'Compte cree (demo).', 'success')
    navigate('/dashboard')
  }

  return (
    <section className="grid-one">
      <article className="card">
        <h2>Inscription</h2>
        <p>Creez un compte pour partager vos to-do.</p>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Nom
            <input
              type="text"
              placeholder="Yosra Essid"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              placeholder="yosra@email.com"
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
          <label>
            Confirmation
            <input
              type="password"
              placeholder="********"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button type="submit" className="button button-primary full-width">
            Creer un compte
          </button>
        </form>
        <p className="muted" style={{ marginTop: '0.8rem' }}>
          Deja un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </article>
    </section>
  )
}

export default RegisterPage

