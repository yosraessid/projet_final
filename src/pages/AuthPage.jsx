import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'

function AuthPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { login, register } = useAuth()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [checkInstitutionalEmail, setCheckInstitutionalEmail] = useState(false)

  const handleLogin = (event) => {
    event.preventDefault()
    const result = login(loginEmail, loginPassword)
    if (!result.ok) {
      notify('Erreur', result.message, 'warning')
      return
    }
    notify('Connexion', 'Connexion reussie.', 'success')
    navigate('/dashboard')
  }

  const handleSignup = (event) => {
    event.preventDefault()
    if (
      checkInstitutionalEmail &&
      !/@(esprit\.tn|organisation\.com|entreprise\.com)$/i.test(signupEmail.trim())
    ) {
      notify(
        'Erreur',
        'Email institutionnel invalide. Exemple: nom@esprit.tn',
        'warning',
      )
      return
    }
    const result = register(signupName, signupEmail, signupPassword, signupConfirm)
    if (!result.ok) {
      notify('Erreur', result.message, 'warning')
      return
    }
    notify('Compte', 'Compte cree avec succes.', 'success')
    navigate('/dashboard')
  }

  return (
    <section className="grid-two">
      <article className="card">
        <h2>Connexion</h2>
        <p>Accede a ton espace collaboratif.</p>
        <form className="form" onSubmit={handleLogin}>
          <label>
            Email
            <input
              type="email"
              placeholder="exemple@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              placeholder="********"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="button button-primary full-width">
            Se connecter
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Inscription</h2>
        <p>Cree ton compte en quelques secondes.</p>
        <form className="form" onSubmit={handleSignup}>
          <label>
            Nom complet
            <input
              type="text"
              placeholder="Yosra Essid"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              placeholder="yosra@email.com"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              placeholder="********"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
            />
          </label>
          <label>
            Confirmation mot de passe
            <input
              type="password"
              placeholder="********"
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
            />
          </label>
          <label className="toggle-row">
            <span>Verifier email institutionnel (optionnel)</span>
            <input
              type="checkbox"
              checked={checkInstitutionalEmail}
              onChange={(e) => setCheckInstitutionalEmail(e.target.checked)}
            />
          </label>
          <button type="submit" className="button button-primary full-width">
            Creer un compte
          </button>
        </form>
      </article>
    </section>
  )
}

export default AuthPage
