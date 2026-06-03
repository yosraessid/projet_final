import { NavLink, Outlet, useLocation } from 'react-router-dom'
import logoWorkspace from '../../assets/logo-workspace.svg'
import NotificationBell from '../NotificationBell'
import TopbarAuth from '../TopbarAuth'
import { useTheme } from '../../context/ThemeContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/groupes', label: 'Teams' },
  { to: '/profil', label: 'Settings' },
]

function AppLayout() {
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const titleByPath = {
    '/': 'Home',
    '/auth': 'Home',
    '/dashboard': 'Dashboard',
    '/groupes': 'Teams',
    '/profil': 'Settings',
  }

  const pageTitle = titleByPath[location.pathname] || 'To-Do Liste Collaborative'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src={logoWorkspace} alt="Logo" />
          <div className="brand-text">
            <p className="brand-name">To-Do Liste</p>
            <p className="brand-tagline">Collaborative</p>
          </div>
        </div>
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

      <div className="main-area">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <NotificationBell />
            <TopbarAuth />
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
