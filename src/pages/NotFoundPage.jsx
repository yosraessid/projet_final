/**
 * NotFoundPage.jsx
 * Page 404 — affichée quand aucune route ne correspond à l'URL demandée.
 *
 * Contenu :
 *   - Message d'erreur clair.
 *   - Bouton de retour vers la page d'accueil.
 *
 * Configurée dans App.jsx avec <Route path="*" element={<NotFoundPage />} />.
 */

import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="card center">
      <h2>Page non trouvée</h2>
      <p>Le lien demandé n'existe pas ou a été déplacé.</p>

      {/* Retour à l'accueil sans rechargement de page */}
      <Link className="button button-primary" to="/">
        Retour à l'accueil
      </Link>
    </section>
  )
}

export default NotFoundPage
