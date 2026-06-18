/**
 * GroupsPage.jsx
 * Page de gestion des groupes / équipes.
 *
 * Colonne gauche — Créer un groupe :
 *   - Formulaire : nom du groupe + champ d'emails (séparés par des virgules).
 *   - Appelle AppDataContext.createProject() qui résout les emails en UIDs Firestore.
 *   - Affiche le nombre de membres inscrits et d'invitations en attente.
 *
 * Colonne droite — Groupes existants :
 *   - Liste des projets de l'utilisateur avec leur nombre de membres.
 *   - Cliquer sur un groupe redirige vers /dashboard.
 *   - Affiche les emails en attente si applicable.
 *
 * Route protégée — accessible uniquement aux utilisateurs connectés (ProtectedRoute).
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import { useAppData } from '../context/AppDataContext'

function GroupsPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { projects, createProject, loading, error } = useAppData()

  // États du formulaire de création de groupe.
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Crée un nouveau groupe dans Firestore.
   * Valide le format des emails avant envoi, puis résout les UIDs ou place en attente.
   */
  const handleCreateGroup = async (event) => {
    event.preventDefault()
    const cleanName = groupName.trim()

    if (!cleanName) {
      notify('Erreur', 'Merci de donner un nom au groupe.', 'warning')
      return
    }

    // Validation des emails saisis avant d'appeler le service.
    if (members.trim()) {
      const emailList = members.split(',').map((e) => e.trim()).filter(Boolean)
      const invalid = emailList.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      if (invalid.length > 0) {
        notify(
          'Email invalide',
          `Ces adresses ne sont pas valides : ${invalid.join(', ')}`,
          'warning',
        )
        return
      }
    }

    setIsSubmitting(true)
    try {
      const result = await createProject({
        name: cleanName,
        description: 'Groupe créé depuis la page Équipes',
        memberEmails: members,
      })

      // Message de retour adapté selon les invitations en attente.
      let message = `Groupe "${cleanName}" créé. ${result.totalMembers} membre(s) inscrit(s).`
      if (result.pendingEmails?.length > 0) {
        message += ` ${result.pendingEmails.length} invitation(s) en attente: ${result.pendingEmails.join(', ')} (doivent créer un compte avec le même email).`
      }

      notify('Groupe', message, result.pendingEmails?.length ? 'info' : 'success')

      // Réinitialise le formulaire après succès.
      setGroupName('')
      setMembers('')
    } catch (err) {
      const msg = err?.message || 'Échec création groupe.'
      // Message d'aide spécifique si les règles Firestore sont bloquantes.
      const friendly = msg.includes('permission') || msg.includes('Permission')
        ? 'Permissions refusées. Publiez le fichier firestore.rules dans Firebase.'
        : msg
      notify('Erreur', friendly, 'warning')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="grid-two">
      {/* ─── Colonne gauche : formulaire de création ─── */}
      <article className="card">
        <h2>Créer un groupe</h2>
        <form className="form" onSubmit={handleCreateGroup}>
          <label>
            Nom du groupe
            <input
              type="text"
              placeholder="Ex: Équipe Marketing"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </label>

          <label>
            Membres (emails)
            <textarea
              rows="4"
              placeholder="membre1@email.com, membre2@email.com"
              value={members}
              onChange={(e) => setMembers(e.target.value)}
            />
          </label>

          {/* Note explicative sur la gestion des invitations en attente */}
          <p className="muted" style={{ margin: 0 }}>
            Séparez les emails par des virgules. Si la personne n'a pas encore de compte,
            elle sera marquée &quot;en attente&quot; jusqu'à son inscription.
          </p>

          {/* Bouton de soumission — désactivé pendant la création */}
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer le groupe'}
          </button>
        </form>
      </article>

      {/* ─── Colonne droite : liste des groupes existants ─── */}
      <article className="card">
        <h2>Groupes existants</h2>

        {/* Affichage des erreurs Firestore */}
        {error && <p className="form-error">{error}</p>}

        {loading && projects.length === 0 ? (
          <p className="muted">Chargement des groupes...</p>
        ) : projects.length === 0 ? (
          <p className="muted">Aucun groupe pour le moment. Créez-en un à gauche.</p>
        ) : (
          <ul className="group-list">
            {projects.map((group) => {
              const inscrits = group.members?.length || 0
              const enAttente = group.pendingEmails?.length || 0
              const total = inscrits + enAttente

              return (
                <li
                  key={group.id}
                  className="group-list-clickable"
                  // Clic sur le groupe → redirige vers le dashboard.
                  onClick={() => navigate('/dashboard')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate('/dashboard')
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Ouvrir le dashboard"
                >
                  <div>
                    <h3>{group.name}</h3>
                    <p>
                      {total} membre(s) au total ({inscrits} inscrit(s)
                      {enAttente > 0 ? `, ${enAttente} en attente` : ''})
                    </p>
                    {/* Liste des emails en attente d'inscription */}
                    {enAttente > 0 && (
                      <p className="muted">En attente: {group.pendingEmails.join(', ')}</p>
                    )}
                    {group.description && <p className="muted">{group.description}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </article>
    </section>
  )
}

export default GroupsPage
