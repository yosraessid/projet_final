import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import { useAppData } from '../context/AppDataContext'

function GroupsPage() {
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { projects, createProject, loading, error } = useAppData()
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateGroup = async (event) => {
    event.preventDefault()
    const cleanName = groupName.trim()
    if (!cleanName) {
      notify('Erreur', 'Merci de donner un nom au groupe.', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createProject({
        name: cleanName,
        description: 'Groupe cree depuis la page Equipes',
        memberEmails: members,
      })

      let message = `Groupe "${cleanName}" cree. ${result.totalMembers} membre(s) inscrit(s).`
      if (result.pendingEmails?.length > 0) {
        message += ` ${result.pendingEmails.length} invitation(s) en attente: ${result.pendingEmails.join(', ')} (doivent creer un compte avec le meme email).`
      }

      notify('Groupe', message, result.pendingEmails?.length ? 'info' : 'success')
      setGroupName('')
      setMembers('')
    } catch (err) {
      const msg = err?.message || 'Echec creation groupe.'
      const friendly = msg.includes('permission') || msg.includes('Permission')
        ? 'Permissions refusees. Publiez le fichier firestore.rules dans Firebase.'
        : msg
      notify('Erreur', friendly, 'warning')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="grid-two">
      <article className="card">
        <h2>Creer un groupe</h2>
        <form className="form" onSubmit={handleCreateGroup}>
          <label>
            Nom du groupe
            <input
              type="text"
              placeholder="Ex: Equipe Marketing"
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
          <p className="muted" style={{ margin: 0 }}>
            Separez les emails par des virgules. Si la personne n a pas encore de compte,
            elle sera marquee &quot;en attente&quot; jusqu a son inscription.
          </p>
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creation en cours...' : 'Creer le groupe'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Groupes existants</h2>
        {error && <p className="form-error">{error}</p>}
        {loading && projects.length === 0 ? (
          <p className="muted">Chargement des groupes...</p>
        ) : projects.length === 0 ? (
          <p className="muted">Aucun groupe pour le moment. Creez-en un a gauche.</p>
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
