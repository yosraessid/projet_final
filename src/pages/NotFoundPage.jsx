import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    // Page affichee si la route demandee n existe pas.
    <section className="card center">
      <h2>Page non trouvee</h2>
      <p>Le lien demande n existe pas ou a ete deplace.</p>
      {/* Bouton pour revenir rapidement a l accueil. */}
      <Link className="button button-primary" to="/">
        Retour a l accueil
      </Link>
    </section>
  )
}

export default NotFoundPage
