/**
 * AuthPage.jsx
 * Page principale d'authentification Firebase.
 * Combine la connexion et l'inscription sur une seule page en deux colonnes.
 *
 * Formulaire de connexion (colonne gauche) :
 *   - Email + mot de passe.
 *   - Bouton "Mot de passe oublié ?" → envoie un email de réinitialisation.
 *
 * Formulaire d'inscription (colonne droite) :
 *   - Nom complet, email, mot de passe, confirmation.
 *   - PasswordRequirements affiche les règles de sécurité en temps réel.
 *   - Validation du mot de passe côté client avant d'appeler Firebase.
 *
 * Gestion des erreurs :
 *   - Les erreurs Firebase sont traduites en français par firebaseErrorToFrenchMessage (AuthContext).
 *   - Les erreurs sont affichées dans le formulaire ET via le système de notifications.
 *
 * Après succès : redirige vers /dashboard.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import PasswordRequirements from '../components/PasswordRequirements'
import PasswordInput from '../components/PasswordInput'
import { isStrongPassword, PASSWORD_MAX_LENGTH } from '../utils/passwordValidation'
import { authLimiter, registerLimiter, resetPasswordLimiter } from '../utils/rateLimiter'

function AuthPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { login, register, resetPassword } = useAuth()

  // ── États du formulaire de connexion ──
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // ── États du formulaire d'inscription ──
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupError, setSignupError] = useState('')
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  /**
   * Gère la soumission du formulaire de connexion.
   * Rate limiting : 5 tentatives max par minute.
   */
  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')

    // Vérifie la limite de tentatives avant d'appeler Firebase.
    if (!authLimiter.tryConsume('login')) {
      const wait = authLimiter.getRemainingTime('login')
      const msg = `Trop de tentatives. Réessayez dans ${wait} seconde${wait > 1 ? 's' : ''}.`
      setLoginError(msg)
      notify('Sécurité', msg, 'warning')
      return
    }

    setIsLoginLoading(true)
    const result = await login(loginEmail, loginPassword)
    setIsLoginLoading(false)

    if (!result.ok) {
      setLoginError(result.message)
      notify('Erreur', result.message, 'warning')
      return
    }

    // Connexion réussie : réinitialise le compteur de tentatives.
    authLimiter.reset('login')
    notify('Connexion', 'Connexion réussie.', 'success')
    navigate('/dashboard')
  }

  /**
   * Gère la soumission du formulaire d'inscription.
   * Rate limiting : 3 tentatives max par 5 minutes.
   */
  const handleSignup = async (event) => {
    event.preventDefault()
    setSignupError('')

    // Vérifie la limite de tentatives d'inscription.
    if (!registerLimiter.tryConsume('register')) {
      const wait = registerLimiter.getRemainingTime('register')
      const msg = `Trop de tentatives. Réessayez dans ${wait} seconde${wait > 1 ? 's' : ''}.`
      setSignupError(msg)
      notify('Sécurité', msg, 'warning')
      return
    }

    // Validation anticipée du mot de passe (avant d'appeler Firebase).
    if (!isStrongPassword(signupPassword)) {
      const msg =
        'Le mot de passe doit respecter toutes les règles (8-16 caractères, majuscule, minuscule, chiffre, caractère spécial).'
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

    notify('Compte', 'Compte créé. Vérifiez votre email pour activer votre compte.', 'success')
    navigate('/dashboard')
  }

  /**
   * Envoie un email de réinitialisation.
   * Rate limiting : 3 demandes max par 10 minutes.
   */
  const handleResetPassword = async () => {
    if (!resetPasswordLimiter.tryConsume('reset')) {
      const wait = resetPasswordLimiter.getRemainingTime('reset')
      notify('Sécurité', `Trop de demandes. Réessayez dans ${wait}s.`, 'warning')
      return
    }
    const result = await resetPassword(loginEmail)
    if (!result.ok) {
      notify('Erreur', result.message, 'warning')
      return
    }
    notify('Mot de passe', result.message, 'success')
  }

  return (
    // Deux colonnes : connexion à gauche, inscription à droite.
    <section className="grid-two">
      {/* ─── Colonne connexion ─── */}
      <article className="card">
        <h2>Connexion</h2>
        <p>Accède à ton espace collaboratif.</p>

        <form className="form" onSubmit={handleLogin}>
          {/* Affiche l'erreur de connexion si présente */}
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

          {/* Bouton de connexion — désactivé pendant le chargement */}
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={isLoginLoading}
          >
            {isLoginLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>

          {/* Bouton mot de passe oublié — utilise l'email saisi dans le champ ci-dessus */}
          <button
            type="button"
            className="button button-light full-width"
            onClick={handleResetPassword}
          >
            Mot de passe oublié ?
          </button>
        </form>
      </article>

      {/* ─── Colonne inscription ─── */}
      <article className="card">
        <h2>Inscription</h2>
        <p>Crée ton compte en quelques secondes.</p>

        <form className="form" onSubmit={handleSignup}>
          {/* Affiche l'erreur d'inscription si présente */}
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

          {/* Indicateur des règles de sécurité — mis à jour à chaque frappe */}
          <PasswordRequirements password={signupPassword} />

          <label>
            Confirmation mot de passe
            <PasswordInput
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          {/* Bouton d'inscription — désactivé pendant le chargement */}
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={isSignupLoading}
          >
            {isSignupLoading ? 'Création en cours...' : 'Créer un compte'}
          </button>
        </form>
      </article>
    </section>
  )
}

export default AuthPage
