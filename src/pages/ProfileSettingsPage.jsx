import { useState } from 'react'
import { useNotifications } from '../context/NotificationsContext'
import { useTheme } from '../context/ThemeContext'

function ProfileSettingsPage() {
  const { notify } = useNotifications()
  const { isDark, setDarkMode } = useTheme()
  const [fullName, setFullName] = useState('Yosra Essid')
  const [email, setEmail] = useState('yosra@email.com')
  const [role, setRole] = useState('Chef de projet')
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  )
  const handleUpdate = (event) => {
    event.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      notify('Erreur', 'Merci de remplir au moins le nom et l email.', 'warning')
      return
    }
    notify('Profil', 'Profil mis a jour (demo).', 'success')
  }

  return (
    <section className="grid-two">
      <article className="card">
        <h2>Profil utilisateur</h2>
        <div className="profile-preview">
          <img src={photoUrl} alt="Photo profil" />
        </div>
        <form className="form" onSubmit={handleUpdate}>
          <label>
            Nom complet
            <input
              type="text"
              placeholder="Yosra Essid"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              placeholder="yosra@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Role dans l equipe
            <input
              type="text"
              placeholder="Chef de projet"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </label>
          <label>
            Photo de profil (URL)
            <input
              type="url"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </label>
          <button type="submit" className="button button-primary full-width">
            Mettre a jour
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Parametres</h2>
        <div className="settings-list">
          <label className="toggle-row">
            <span>Activer le mode sombre</span>
            <input
              type="checkbox"
              checked={isDark}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </label>
          <label className="toggle-row">
            <span>Recevoir les notifications email</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="toggle-row">
            <span>Activer le chat d equipe</span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
        <button type="button" className="button button-light full-width">
          Se deconnecter
        </button>
      </article>
    </section>
  )
}

export default ProfileSettingsPage
