import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import PasswordInput from '../components/PasswordInput'

function LoginPage() {
  // Permet de rediriger vers le dashboard apres connexion.
  const navigate = useNavigate()
  // Permet d afficher des messages de retour.
  const { notify } = useNotifications()
  // Etats des champs du formulaire.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Gere la soumission du formulaire de connexion.
  const handleSubmit = (event) => {
    // Evite le rechargement complet de la page.
    event.preventDefault()
    // Verifie que les deux champs sont remplis.
    if (!email.trim() || !password.trim()) {
      notify('Erreur', 'Merci de remplir email et mot de passe.', 'warning')
      return
    }
    // Version demo: succes puis navigation.
    notify('Connexion', 'Connexion reussie (demo).', 'success')
    navigate('/dashboard')
  }

  return (
    // Mise en page sur une seule colonne.
    <section className="grid-one">
      <article className="card">
        <h2>Connexion</h2>
        <p>Connectez-vous pour acceder a vos listes partagees.</p>
        {/* Formulaire de connexion. */}
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
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="button button-primary full-width">
            Se connecter
          </button>
        </form>
        {/* Lien vers la page d inscription. */}
        <p className="muted" style={{ marginTop: '0.8rem' }}>
          Pas de compte ? <Link to="/register">Creez un compte</Link>
        </p>
      </article>
    </section>
  )
}

export default LoginPage

