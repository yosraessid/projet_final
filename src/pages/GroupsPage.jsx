import { useState } from 'react'
import { useNotifications } from '../context/NotificationsContext'
import { useAppData } from '../context/AppDataContext'

function GroupsPage() {
  const { notify } = useNotifications()
  const { projects, setProjects } = useAppData()
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState('')

  const handleCreateGroup = (event) => {
    event.preventDefault()
    const cleanName = groupName.trim()
    if (!cleanName) {
      notify('Erreur', 'Merci de donner un nom au groupe.', 'warning')
      return
    }
    const count = members
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean).length

    setProjects((prev) => [
      {
        id: Date.now(),
        name: cleanName,
        description: 'Groupe cree depuis la page Equipes',
        members: Array.from({ length: Math.max(1, count) }, (_, i) => i + 1),
      },
      ...prev,
    ])
    setGroupName('')
    setMembers('')
    notify('Groupe', `Groupe "${cleanName}" cree (demo).`, 'success')
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
          <button type="submit" className="button button-primary full-width">
            Creer le groupe
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Groupes existants</h2>
        <ul className="group-list">
          {projects.map((group) => (
            <li key={group.id}>
              <div>
                <h3>{group.name}</h3>
                <p>{group.members.length} membres</p>
              </div>
              <p>Taches partagees avec le groupe</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

export default GroupsPage
