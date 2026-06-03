import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { isDark, setDarkMode } = useTheme()
  const { user, saveProfile, logout } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Membre')
  const [saving, setSaving] = useState(false)

  const [photoLink] = useState(
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  )

  useEffect(() => {
    if (!user) return
    setFullName(user.name || '')
    setEmail(user.email || '')
    setRole(user.role || 'Membre')
  }, [user])

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!fullName.trim()) {
      notify('Erreur', 'Merci de remplir au moins le nom.', 'warning')
      return
    }

    setSaving(true)
    const result = await saveProfile({ name: fullName, role })
    setSaving(false)

    if (!result.ok) {
      notify('Erreur', result.message, 'warning')
      return
    }
    notify('Profil', 'Profil mis a jour avec succes.', 'success')
  }

  const handleLogout = async () => {
    await logout()
    notify('Deconnexion', 'A bientot !', 'info')
    navigate('/')
  }

  return (
    <section className="grid-two">
      <article className="card">
        <h2>Profil utilisateur</h2>
        <div className="profile-preview">
          <img src={photoLink} alt="Photo profil" />
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
            <input type="email" value={email} disabled />
          </label>
          <label>
            Role dans l equipe
            <input
              type="text"
              placeholder="Membre"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Mettre a jour'}
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
        <button
          type="button"
          className="button button-light full-width"
          onClick={handleLogout}
        >
          Se deconnecter
        </button>
      </article>
    </section>
  )
}

export default ProfileSettingsPage
