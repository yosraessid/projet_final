import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useNotifications } from '../context/NotificationsContext'

function DashboardPage() {
  const { notify } = useNotifications()
  const { projects, tasks, setTasks, members } = useAppData()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Moyenne',
    deadline: '',
    assigneeId: members[0]?.id || 1,
  })
  const [editingId, setEditingId] = useState(null)

  const columns = [
    { key: 'A faire', title: 'A faire', statusClass: 'status-todo' },
    { key: 'En cours', title: 'En cours', statusClass: 'status-progress' },
    { key: 'Terminee', title: 'Termine', statusClass: 'status-done' },
  ]

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

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      priority: 'Moyenne',
      deadline: '',
      assigneeId: members[0]?.id || 1,
    })
    setEditingId(null)
  }

  const handleSaveTask = (event) => {
    event.preventDefault()
    const cleanTitle = form.title.trim()
    if (!cleanTitle) {
      notify('Erreur', 'Merci de saisir un titre de tache.', 'warning')
      return
    }

    const payload = {
      title: cleanTitle,
      description: form.description.trim() || 'Sans description',
      priority: form.priority,
      deadline: form.deadline || '—',
      status: 'A faire',
      assigneeId: Number(form.assigneeId),
      projectId: projects[0]?.id || 102,
    }

    if (editingId) {
      setTasks((prev) =>
        prev.map((task) => (task.id === editingId ? { ...task, ...payload } : task)),
      )
      notify('Tache', 'Tache modifiee avec succes.', 'success')
    } else {
      setTasks((prev) => [{ id: Date.now(), ...payload }, ...prev])
      notify('Tache', `Nouvelle tache ajoutee: "${cleanTitle}"`, 'success')
    }
    resetForm()
  }

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    notify('Tache', 'Tache supprimee.', 'warning')
    if (editingId === taskId) resetForm()
  }

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

  const handleStatusChange = (taskId, nextStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
    )
    notify('Statut', `Statut mis a jour: ${nextStatus}`, 'info')
  }

  return (
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
              <p>Progression</p>
              <h3>{completion}%</h3>
            </article>
          </div>
        </article>
      </div>

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
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
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
                          onClick={() => handleDeleteTask(t.id)}
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

      <div className="widget-grid">
        <article className="card">
          <h2>Progression</h2>
          <div className="progress-ring">
            <span>{completion}%</span>
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
