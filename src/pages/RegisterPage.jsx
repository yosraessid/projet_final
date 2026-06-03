import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import PasswordRequirements from '../components/PasswordRequirements'
import PasswordInput from '../components/PasswordInput'
import { isStrongPassword, PASSWORD_MAX_LENGTH } from '../utils/passwordValidation'

function RegisterPage() {
  // Hook React Router: permet de rediriger l utilisateur vers une autre page.
  const navigate = useNavigate()
  // Hook custom: permet d afficher des messages (succes, erreur, info) en haut de l interface.
  const { notify } = useNotifications()

  // Etat du champ "Nom".
  const [name, setName] = useState('')
  // Etat du champ "Email".
  const [email, setEmail] = useState('')
  // Etat du champ "Mot de passe".
  const [password, setPassword] = useState('')
  // Etat du champ "Confirmation du mot de passe".
  const [confirm, setConfirm] = useState('')

  // Fonction appelee quand on clique sur "Creer un compte".
  const handleSubmit = (event) => {
    // Empeche le comportement par defaut du formulaire (rechargement de la page).
    event.preventDefault()

    // Validation 1: on verifie que tous les champs sont remplis apres suppression des espaces.
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      // Message d erreur si un champ est vide.
      notify('Erreur', 'Merci de remplir tous les champs.', 'warning')
      // On stoppe la fonction pour eviter la suite des validations.
      return
    }

    // Validation 2: verifie les regles de securite du mot de passe.
    if (!isStrongPassword(password)) {
      notify(
        'Erreur',
        'Le mot de passe doit respecter toutes les regles (8-16 caracteres, majuscule, minuscule, chiffre, caractere special).',
        'warning',
      )
      // On stoppe si le mot de passe est faible.
      return
    }

    // Validation 3: verifie que "Mot de passe" et "Confirmation" sont identiques.
    if (password !== confirm) {
      notify('Erreur', 'La confirmation du mot de passe ne correspond pas.', 'warning')
      // On stoppe si les 2 valeurs ne correspondent pas.
      return
    }

    // Si tout est valide: on affiche un message de succes.
    notify('Compte', 'Compte cree (demo).', 'success')
    // Puis on redirige vers le dashboard.
    navigate('/dashboard')
  }

  return (
    // Conteneur principal en une seule colonne.
    <section className="grid-one">
      {/* Carte visuelle contenant le titre + formulaire + lien de connexion. */}
      <article className="card">
        {/* Titre principal de la page. */}
        <h2>Inscription</h2>
        {/* Petite phrase d explication sous le titre. */}
        <p>Creez un compte pour partager vos to-do.</p>

        {/* Formulaire principal: onSubmit lance handleSubmit. */}
        <form className="form" onSubmit={handleSubmit}>
          {/* Champ 1: nom de l utilisateur. */}
          <label>
            Nom
            <input
              // Champ texte simple.
              type="text"
              // Exemple visuel affiche avant saisie.
              placeholder="Yosra Essid"
              // Valeur liee a l etat React "name".
              value={name}
              // A chaque frappe, on met a jour l etat "name".
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          {/* Champ 2: email utilisateur. */}
          <label>
            Email
            <input
              // type="email" aide le navigateur a verifier le format email.
              type="email"
              placeholder="yosra@email.com"
              // Valeur controlee par React.
              value={email}
              // Mise a jour de l etat "email" pendant la saisie.
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {/* Champ 3: mot de passe principal. */}
          <label>
            Mot de passe
            <PasswordInput
              placeholder="Ex: Projet@2026"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
            />
          </label>

          {/* Composant qui affiche les regles de mot de passe en temps reel. */}
          <PasswordRequirements password={password} />

          {/* Champ 4: confirmation du mot de passe. */}
          <label>
            Confirmation
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          {/* Bouton submit: declenche handleSubmit. */}
          <button type="submit" className="button button-primary full-width">
            Creer un compte
          </button>
        </form>

        {/* Message secondaire + lien pour les utilisateurs deja inscrits. */}
        <p className="muted" style={{ marginTop: '0.8rem' }}>
          {/* Link remplace une balise <a> pour naviguer sans recharger la page. */}
          Deja un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </article>
    </section>
  )
}

export default RegisterPage

