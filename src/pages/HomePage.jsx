/**
 * HomePage.jsx
 * Page d'accueil publique de l'application.
 *
 * Contenu :
 *   - Section hero : slogan + boutons de navigation vers /auth et /dashboard.
 *   - Liste des fonctionnalités principales de l'application.
 *
 * Cette page est accessible sans authentification.
 */

import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <section className="grid-one">
      {/* ─── Carte hero ─── */}
      <article className="card hero-card">
        {/* Badge catégorie */}
        <p className="badge">To-do liste collaborative</p>

        <h2>Organisez vos tâches en équipe facilement.</h2>

        <p>
          Créez des listes, assignez des tâches, suivez l'avancement et recevez
          des notifications importantes, le tout dans une interface moderne.
        </p>

        {/* Boutons d'appel à l'action */}
        <div className="row">
          <Link className="button button-primary" to="/auth">
            Commencer maintenant
          </Link>
          <Link className="button button-light" to="/dashboard">
            Ouvrir le dashboard
          </Link>
        </div>
      </article>

      {/* ─── Carte fonctionnalités ─── */}
      <article className="card">
        <h3>Fonctionnalités principales</h3>
        <ul className="list">
          <li>Listes / projets de to-do</li>
          <li>Tâches avec priorité, deadline et statut</li>
          <li>Attribution à un membre</li>
          <li>Notifications (assignation, deadline proche, tâche terminée)</li>
          <li>Interface moderne et responsive</li>
        </ul>
      </article>
    </section>
  )
}

export default HomePage
