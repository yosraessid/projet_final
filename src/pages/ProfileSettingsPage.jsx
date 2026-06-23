/**
 * ProfileSettingsPage.jsx
 * Page de profil et paramètres de l'utilisateur connecté.
 *
 * Colonne gauche — Profil utilisateur :
 *   - Avatar généré dynamiquement depuis les initiales du nom (pas d'image externe).
 *   - Formulaire : nom complet, email (non modifiable), rôle dans l'équipe.
 *   - Appelle AuthContext.saveProfile() pour persister les changements dans Firestore.
 *
 * Colonne droite — Paramètres :
 *   - Toggle mode sombre/clair (via ThemeContext).
 *   - Toggles décoratifs : notifications email, chat d'équipe.
 *   - Bouton de déconnexion.
 *
 * Route protégée — accessible uniquement aux utilisateurs connectés (ProtectedRoute).
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

/**
 * Génère les initiales d'un nom complet (max 2 caractères).
 * Ex: "Yosra Essid" → "YE", "Yosra" → "Y"
 * @param {string} name
 * @returns {string}
 */
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { isDark, setDarkMode } = useTheme()
  const { user, saveProfile, logout } = useAuth()

  // États contrôlés des champs du formulaire de profil.
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Membre')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Synchronise les champs avec les données de l'utilisateur connecté.
  useEffect(() => {
    if (!user) return
    setFullName(user.name || '')
    setEmail(user.email || '')
    setRole(user.role || 'Membre')
  }, [user])

  // Initiales calculées depuis le nom courant (mis à jour à chaque frappe).
  const initials = getInitials(fullName) || '?'

  /**
   * Sauvegarde le nom et le rôle de l'utilisateur dans Firestore via AuthContext.
   */
  const handleUpdate = async (event) => {
    event.preventDefault()

    if (!fullName.trim()) {
      notify('Erreur', 'Merci de remplir au moins le nom.', 'warning')
      return
    }

    setSaving(true)
    try {
      const result = await saveProfile({ name: fullName.trim(), role: role.trim() || 'Membre' })
      if (!result.ok) {
        notify('Erreur', result.message, 'warning')
        return
      }
      notify('Profil', 'Profil mis à jour avec succès.', 'success')
      setSuccessMsg('✓ Profil mis à jour avec succès !')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error('Erreur mise à jour profil:', err)
      notify('Erreur', err?.message || 'Échec de la mise à jour.', 'warning')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Déconnecte l'utilisateur et redirige vers la page d'accueil.
   */
  const handleLogout = async () => {
    notify('Déconnexion', 'À bientôt !', 'info')
    await logout()
    navigate('/')
  }

  return (
    <section className="grid-two">
      {/* ─── Colonne gauche : profil utilisateur ─── */}
      <article className="card">
        <h2>Profil utilisateur</h2>

        {/* Avatar généré depuis les initiales — se met à jour en temps réel */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-avatar-info">
            <p className="profile-avatar-name">{fullName || 'Votre nom'}</p>
            <p className="profile-avatar-role">{role}</p>
          </div>
        </div>

        {/* Formulaire de modification du profil */}
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

          {/* Email en lecture seule — non modifiable via ce formulaire */}
          <label>
            Email
            <input type="email" value={email} disabled />
          </label>

          <label>
            Rôle dans l'équipe
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
            {saving ? 'Enregistrement...' : 'Mettre à jour'}
          </button>

          {successMsg && (
            <p className="success-msg" style={{ color: 'var(--accent)', marginTop: '0.75rem', textAlign: 'center', fontWeight: 500 }}>
              {successMsg}
            </p>
          )}
        </form>
      </article>

      {/* ─── Colonne droite : paramètres ─── */}
      <article className="card">
        <h2>Paramètres</h2>

        <div className="settings-list">
          {/* Toggle mode sombre — connecté à ThemeContext */}
          <label className="toggle-row">
            <span>Activer le mode sombre</span>
            <input
              type="checkbox"
              checked={isDark}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </label>
        </div>

        <button
          type="button"
          className="button button-light full-width"
          onClick={handleLogout}
        >
          Se déconnecter
        </button>
      </article>
    </section>
  )
}

export default ProfileSettingsPage
