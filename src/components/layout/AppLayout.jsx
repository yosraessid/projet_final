/**
 * AppLayout.jsx
 * Layout principal partagé par toutes les pages de l'application.
 *
 * Structure :
 *   ┌─────────────────────────────────────────────────┐
 *   │  .app-shell                                     │
 *   │  ┌──────────┐  ┌──────────────────────────────┐ │
 *   │  │ .sidebar │  │ .main-area                   │ │
 *   │  │  logo    │  │  ┌──────────────────────────┐ │ │
 *   │  │  nav     │  │  │ .topbar (titre + actions)│ │ │
 *   │  │          │  │  └──────────────────────────┘ │ │
 *   │  │          │  │  ┌──────────────────────────┐ │ │
 *   │  │          │  │  │ <Outlet />               │ │ │
 *   │  │          │  │  └──────────────────────────┘ │ │
 *   │  └──────────┘  └──────────────────────────────┘ │
 *   └─────────────────────────────────────────────────┘
 *
 * La topbar affiche dynamiquement le titre de la page selon le chemin URL.
 * Les actions en haut à droite : bouton thème, cloche de notifications, bouton auth.
 */

import { NavLink, Outlet, useLocation } from 'react-router-dom'
import logoWorkspace from '../../assets/logo-workspace.svg'
import NotificationBell from '../NotificationBell'
import TopbarAuth from '../TopbarAuth'
import { useTheme } from '../../context/ThemeContext'

/** Liens de navigation affichés dans la sidebar. */
const links = [
  { to: '/', label: 'Accueil' },
  { to: '/dashboard', label: 'Tableau de bord' },
  { to: '/profil', label: 'Paramètres' },
]

/**
 * Composant AppLayout.
 * Rendu via <Outlet /> pour toutes les routes imbriquées sous ce layout.
 */
function AppLayout() {
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  // Titre affiché dans la topbar selon le chemin URL courant.
  const titleByPath = {
    '/': 'Accueil',
    '/auth': 'Connexion',
    '/dashboard': 'Tableau de bord',
    '/profil': 'Paramètres',
  }

  const pageTitle = titleByPath[location.pathname] || 'To-Do Liste Collaborative'

  return (
    <div className="app-shell">
      {/* ─── Sidebar : logo + navigation ─── */}
      <aside className="sidebar">
        {/* Identité visuelle de l'application */}
        <div className="brand">
          <img className="brand-logo" src={logoWorkspace} alt="Logo" />
          <div className="brand-text">
            <p className="brand-name">WorkSpace</p>
            <p className="brand-tagline">Gestion collaborative</p>
          </div>
        </div>

        {/* Liens de navigation — NavLink ajoute la classe active automatiquement */}
        <nav className="menu">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'menu-link menu-link-active' : 'menu-link')}
            >
              <span className="menu-dot" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ─── Zone principale : topbar + contenu ─── */}
      <div className="main-area">
        {/* Barre supérieure : titre de la page + actions utilisateur */}
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-actions">
            {/* Bouton bascule thème clair/sombre */}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Cloche de notifications avec badge */}
            <NotificationBell />

            {/* Bouton de connexion / menu utilisateur */}
            <TopbarAuth />
          </div>
        </header>

        {/* Contenu de la page courante rendu par React Router */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
