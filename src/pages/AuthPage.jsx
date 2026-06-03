import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import PasswordRequirements from '../components/PasswordRequirements'
import PasswordInput from '../components/PasswordInput'
import { isStrongPassword, PASSWORD_MAX_LENGTH } from '../utils/passwordValidation'

function AuthPage() {
  // Permet de rediriger l utilisateur apres connexion/inscription.
  const navigate = useNavigate()
  // Permet d afficher des messages (erreur, succes, info) a l utilisateur.
  const { notify } = useNotifications()
  // Fonctions du contexte d authentification.
  const { login, register, resetPassword } = useAuth()
  // Champs du formulaire de connexion.
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Champs du formulaire d inscription.
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [loginError, setLoginError] = useState('')
  const [signupError, setSignupError] = useState('')
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  // Gere la soumission du formulaire "Connexion".
  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setIsLoginLoading(true)

    const result = await login(loginEmail, loginPassword)
    setIsLoginLoading(false)

    if (!result.ok) {
      setLoginError(result.message)
      notify('Erreur', result.message, 'warning')
      return
    }

    notify('Connexion', 'Connexion reussie.', 'success')
    navigate('/dashboard')
  }

  // Gere la soumission du formulaire "Inscription".
  const handleSignup = async (event) => {
    event.preventDefault()
    setSignupError('')

    if (!isStrongPassword(signupPassword)) {
      const msg =
        'Le mot de passe doit respecter toutes les regles (8-16 caracteres, majuscule, minuscule, chiffre, caractere special).'
      setSignupError(msg)
      notify('Erreur', msg, 'warning')
      return
    }

    setIsSignupLoading(true)
    const result = await register(signupName, signupEmail, signupPassword, signupConfirm)
    setIsSignupLoading(false)

    if (!result.ok) {
      setSignupError(result.message)
      notify('Erreur', result.message, 'warning')
      return
    }

    notify('Compte', 'Compte cree avec succes.', 'success')
    navigate('/dashboard')
  }

  const handleResetPassword = async () => {
    const result = await resetPassword(loginEmail)
    if (!result.ok) {
      notify('Erreur', result.message, 'warning')
      return
    }
    notify('Mot de passe', result.message, 'success')
  }

  return (
    // Deux colonnes: connexion a gauche, inscription a droite.
    <section className="grid-two">
      <article className="card">
        <h2>Connexion</h2>
        <p>Accede a ton espace collaboratif.</p>
        {/* Formulaire de connexion. */}
        <form className="form" onSubmit={handleLogin}>
          {loginError && <p className="form-error">{loginError}</p>}
          <label>
            Email
            <input
              type="email"
              placeholder="exemple@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe
            <PasswordInput
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={isLoginLoading}
          >
            {isLoginLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
          <button
            type="button"
            className="button button-light full-width"
            onClick={handleResetPassword}
          >
            Mot de passe oublie ?
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Inscription</h2>
        <p>Cree ton compte en quelques secondes.</p>
        {/* Formulaire de creation de compte. */}
        <form className="form" onSubmit={handleSignup}>
          {signupError && <p className="form-error">{signupError}</p>}
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
            <PasswordInput
              placeholder="Ex: Projet@2026"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
            />
          </label>
          <PasswordRequirements password={signupPassword} />
          <label>
            Confirmation mot de passe
            <PasswordInput
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={isSignupLoading}
          >
            {isSignupLoading ? 'Creation en cours...' : 'Creer un compte'}
          </button>
        </form>
      </article>
    </section>
  )
}

export default AuthPage
