/**
 * NotFoundPage.jsx
 * Page 404 — affichée quand aucune route ne correspond à l'URL demandée.
 *
 * Design moderne avec :
 *   - Illustration SVG animée (astronaute perdu dans l'espace)
 *   - Code d'erreur 404 en grand
 *   - Message clair et bouton de retour
 *
 * Configurée dans App.jsx avec <Route path="*" element={<NotFoundPage />} />.
 */

import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="not-found-page">
      {/* Illustration SVG — astronaute flottant */}
      <div className="not-found-illustration" aria-hidden="true">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Planète en arrière-plan */}
          <circle cx="100" cy="140" r="50" fill="url(#planet-gradient)" opacity="0.15" />
          <ellipse cx="100" cy="140" rx="65" ry="8" fill="url(#ring-gradient)" opacity="0.1" />

          {/* Étoiles */}
          <circle cx="30" cy="30" r="2" fill="#67e8f9" className="not-found-star" />
          <circle cx="170" cy="50" r="1.5" fill="#a5b4fc" className="not-found-star" />
          <circle cx="50" cy="80" r="1" fill="#7c3aed" className="not-found-star" />
          <circle cx="160" cy="120" r="1.5" fill="#67e8f9" className="not-found-star" />
          <circle cx="25" cy="150" r="1" fill="#a5b4fc" className="not-found-star" />
          <circle cx="175" cy="160" r="2" fill="#7c3aed" className="not-found-star" />

          {/* Astronaute */}
          <g className="not-found-astronaut">
            {/* Corps */}
            <rect x="78" y="55" width="44" height="55" rx="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Casque */}
            <circle cx="100" cy="45" r="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Visière */}
            <path d="M85 40 A15 15 0 0 1 115 40 A15 15 0 0 1 100 55 A15 15 0 0 1 85 40Z" fill="url(#visor-gradient)" />
            {/* Sac à dos */}
            <rect x="70" y="60" width="10" height="35" rx="5" fill="#94a3b8" />
            {/* Bras gauche */}
            <path d="M78 70 Q60 80 65 95" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" fill="none" />
            {/* Bras droit */}
            <path d="M122 70 Q140 80 135 95" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" fill="none" />
            {/* Jambes */}
            <path d="M90 108 Q88 125 85 135" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M110 108 Q112 125 115 135" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" fill="none" />
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="planet-gradient" x1="50" y1="90" x2="150" y2="190">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="ring-gradient" x1="35" y1="140" x2="165" y2="140">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="visor-gradient" x1="85" y1="35" x2="115" y2="55">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Code erreur */}
      <h1 className="not-found-code">404</h1>

      {/* Message */}
      <h2 className="not-found-title">Page introuvable</h2>
      <p className="not-found-desc">
        Cette page n'existe pas ou a été déplacée.<br />
        Pas de panique, vous pouvez revenir en terrain connu.
      </p>

      {/* Boutons d'action */}
      <div className="not-found-actions">
        <Link className="button button-primary" to="/">
          ← Retour à l'accueil
        </Link>
        <Link className="button button-light" to="/dashboard">
          Tableau de bord
        </Link>
      </div>
    </section>
  )
}

export default NotFoundPage
