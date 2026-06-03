import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useNotifications } from '../context/NotificationsContext'

function DashboardPage() {
  const { notify } = useNotifications()
  const { projects, tasks, members, addTask, updateTask, deleteTask, setTaskStatus } = useAppData()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Moyenne',
    deadline: '',
    assigneeId: members[0]?.id || '',
  })
  // Contient l id de la tache en cours de modification (null = mode ajout).
  const [editingId, setEditingId] = useState(null)

  // Colonnes du mini tableau kanban.
  const columns = [
    { key: 'A faire', title: 'A faire', statusClass: 'status-todo' },
    { key: 'En cours', title: 'En cours', statusClass: 'status-progress' },
    { key: 'Terminee', title: 'Termine', statusClass: 'status-done' },
  ]

  // Associe un statut a une classe CSS pour la couleur d affichage.
  const statusClass = (status) => {
    if (status === 'Terminee') return 'status-done'
    if (status === 'En cours') return 'status-progress'
    return 'status-todo'
  }

  const completion = useMemo(() => {
    if (tasks.length === 0) return 0
    const done = tasks.filter((t) => t.status === 'Terminee').length
    return Math.round((done / tasks.length) * 100)
  }, [tasks])

  const recentTasks = useMemo(() => tasks.slice(0, 6), [tasks])

  // Met a jour un champ du formulaire sans ecraser les autres champs.
  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Remet le formulaire a son etat initial.
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      priority: 'Moyenne',
      deadline: '',
      assigneeId: members[0]?.id || '',
    })
    setEditingId(null)
  }

  // Ajoute une nouvelle tache ou met a jour une tache existante.
  const handleSaveTask = async (event) => {
    // Evite le rechargement de la page lors du submit.
    event.preventDefault()
    // Nettoie le titre pour eviter les espaces inutiles.
    const cleanTitle = form.title.trim()
    // Le titre est obligatoire.
    if (!cleanTitle) {
      notify('Erreur', 'Merci de saisir un titre de tache.', 'warning')
      return
    }

    // Objet commun utilise pour creation ou modification.
    const payload = {
      title: cleanTitle,
      description: form.description.trim() || 'Sans description',
      priority: form.priority,
      deadline: form.deadline || '—',
      status: 'A faire',
      assigneeId: String(form.assigneeId || members[0]?.id || ''),
      projectId: projects[0]?.id || 102,
    }

    const projectId = payload.projectId
    const preparedPayload = { ...payload }

    if (editingId) {
      try {
        await updateTask({
          projectId,
          taskId: editingId,
          updates: preparedPayload,
        })
        notify('Tache', 'Tache modifiee avec succes.', 'success')
      } catch (err) {
        notify('Erreur', err?.message || 'Echec modification tache.', 'warning')
        return
      }
    } else {
      // Sinon: mode creation.
      try {
        await addTask({
          projectId,
          task: { id: Date.now(), ...preparedPayload },
        })
        notify('Tache', `Nouvelle tache ajoutee: "${cleanTitle}"`, 'success')
      } catch (err) {
        notify('Erreur', err?.message || 'Echec creation tache.', 'warning')
        return
      }
    }
    resetForm()
  }

  // Supprime une tache.
  const handleDeleteTask = async (task) => {
    try {
      await deleteTask({ projectId: task.projectId, taskId: task.id })
      notify('Tache', 'Tache supprimee.', 'warning')
      if (editingId === task.id) resetForm()
    } catch (err) {
      notify('Erreur', err?.message || 'Echec suppression tache.', 'warning')
    }
  }

  // Charge une tache dans le formulaire pour edition.
  const handleEditTask = (task) => {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: task.deadline === '—' ? '' : task.deadline,
      assigneeId: task.assigneeId,
    })
  }

  // Change uniquement le statut d une tache.
  const handleStatusChange = async (task, nextStatus) => {
    try {
      await setTaskStatus({ projectId: task.projectId, taskId: task.id, status: nextStatus })
      notify('Statut', `Statut mis a jour: ${nextStatus}`, 'info')
    } catch (err) {
      notify('Erreur', err?.message || 'Echec changement statut.', 'warning')
    }
  }

  return (
    // Ecran principal du dashboard.
    <section className="stack">
      <div className="widget-grid">
        <article className="card">
          <h2>Liste collaborative</h2>
          <ul className="group-list">
            {projects.map((p) => (
              <li key={p.id}>
                <div>
                  <h3>{p.name}</h3>
                  <p className="muted">{p.description}</p>
                </div>
                <span className="pill pill-info">Active</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Statistiques</h2>
          <div className="stats-grid">
            <article className="card stat-card">
              <p>Projets</p>
              <h3>{projects.length}</h3>
            </article>
            <article className="card stat-card">
              <p>Taches</p>
              <h3>{tasks.length}</h3>
            </article>
            <article className="card stat-card">
              <p>Membres</p>
              <h3>{members.length}</h3>
            </article>
            <article className="card stat-card">
              <p>Avancement</p>
              <h3>{completion}%</h3>
            </article>
          </div>
        </article>
      </div>

      {/* Bloc: vue kanban par statut. */}
      <div className="kanban-grid">
        {columns.map((column) => (
          <article key={column.key} className={`kanban-column ${column.statusClass}`}>
            <h3>{column.title}</h3>
            {tasks
              .filter((task) => task.status === column.key)
              .map((task) => (
                <div key={task.id} className={`kanban-item ${column.statusClass}`}>
                  <p>{task.title}</p>
                  <small>{task.priority}</small>
                </div>
              ))}
          </article>
        ))}
      </div>

      {/* Bloc: formulaire d ajout/modification de tache. */}
      <article className="card">
        <h2>{editingId ? 'Modifier la tache' : 'Ajouter une tache'}</h2>
        <form className="form form-grid" onSubmit={handleSaveTask}>
          <label>
            Titre
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="Ex: Preparation presentation PFE"
            />
          </label>
          <label>
            Priorite
            <select
              value={form.priority}
              onChange={(e) => handleFormChange('priority', e.target.value)}
            >
              <option>Haute</option>
              <option>Moyenne</option>
              <option>Basse</option>
            </select>
          </label>
          <label>
            Deadline
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => handleFormChange('deadline', e.target.value)}
            />
          </label>
          <label>
            Membre assigne
            <select
              value={form.assigneeId}
              onChange={(e) => handleFormChange('assigneeId', e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="full-span">
            Description
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Petite description de la tache"
            />
          </label>
          <div className="row">
            <button type="submit" className="button button-primary">
              {editingId ? 'Enregistrer modifications' : 'Ajouter la tache'}
            </button>
            {editingId && (
              <button type="button" className="button button-light" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </article>

      {/* Bloc: tableau detaille des taches recentes. */}
      <article className="card">
        <h2>Taches recentes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Projet</th>
                <th>Statut</th>
                <th>Priorite</th>
                <th>Deadline</th>
                <th>Assigne</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((t) => {
                const project = projects.find((p) => p.id === t.projectId)
                const assignee = members.find((m) => m.id === t.assigneeId)
                return (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{project?.name || '—'}</td>
                    <td>
                      <select
                        className={`status-select ${statusClass(t.status)}`}
                        value={t.status}
                        onChange={(e) => handleStatusChange(t, e.target.value)}
                      >
                        <option>A faire</option>
                        <option>En cours</option>
                        <option>Terminee</option>
                      </select>
                    </td>
                    <td>{t.priority}</td>
                    <td>{t.deadline}</td>
                    <td>{assignee?.name || '—'}</td>
                    <td>
                      <div className="task-actions">
                        <button
                          type="button"
                          className="button button-light"
                          onClick={() => handleEditTask(t)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="button button-danger"
                          onClick={() => handleDeleteTask(t)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      {/* Bloc: progression visuelle + actions rapides. */}
      <div className="widget-grid">
        <article className="card">
          <h2>Progression</h2>
          <div
            className="progress-ring"
            style={{ '--progress': completion }}
            role="progressbar"
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression des taches"
          >
            <div className="progress-ring-inner">
              <span>{completion}%</span>
            </div>
          </div>
        </article>
        <article className="card">
          <h2>Actions rapides</h2>
          <div className="row">
            <button
              type="button"
              className="button button-primary"
              onClick={() =>
                notify(
                  'Tache',
                  'Utilise le formulaire Dashboard pour ajouter une nouvelle tache.',
                  'info',
                )
              }
            >
              Nouvelle tache
            </button>
            <button
              type="button"
              className="button button-light"
              onClick={() =>
                notify('Rapport', 'Fonctionnalite a connecter au backend (demo).', 'info')
              }
            >
              Voir le rapport
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}

export default DashboardPage
