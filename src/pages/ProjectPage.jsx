/**
 * ProjectPage.jsx
 * Page complète des détails d'un projet.
 * Accessible via /dashboard/projet/:projectId
 *
 * Reprend toute la logique de ProjectDetailsModal mais en pleine page
 * avec un bouton retour vers le dashboard.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { resolveMemberInput } from '../services/firebaseAppDataService'
import TaskStatusMenu from '../components/TaskStatusMenu'

const PRIORITY_OPTIONS = [
  { value: 'Haute',   label: 'Haute',   className: 'priority-high' },
  { value: 'Moyenne', label: 'Moyenne', className: 'priority-medium' },
  { value: 'Basse',   label: 'Basse',   className: 'priority-low' },
]

function priorityClass(priority) {
  return PRIORITY_OPTIONS.find((o) => o.value === priority)?.className || 'priority-medium'
}

function buildTeamList(project, globalMembers) {
  const list = []
  ;(project.members || []).forEach((uid) => {
    const member = globalMembers.find((m) => m.id === uid)
    list.push({ key: `uid-${uid}`, uid, name: member?.name || 'Membre', role: project.memberRoles?.[uid] || member?.role || 'Membre', pending: false })
  })
  ;(project.pendingEmails || []).forEach((email) => {
    list.push({ key: `pending-${email}`, email, name: email, role: 'En attente', pending: true })
  })
  return list
}

function ConfirmDialog({ message, detail, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="confirm-icon" aria-hidden="true">⚠️</div>
        <h3 id="confirm-title">{message}</h3>
        {detail && <p className="confirm-detail">{detail}</p>}
        <div className="confirm-actions">
          <button type="button" className="button button-light" onClick={onCancel}>Annuler</button>
          <button type="button" className="button button-danger" onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { user } = useAuth()
  const { projects, tasks, members, updateProject, deleteProject, addTask, updateTask, setTaskStatus, deleteTask } = useAppData()

  const project = useMemo(() => projects.find((p) => String(p.id) === String(projectId)) || null, [projects, projectId])
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === (project?.id)), [tasks, project])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [memberUids, setMemberUids] = useState([])
  const [pendingEmails, setPendingEmails] = useState([])
  const [memberRoles, setMemberRoles] = useState({})
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Membre')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Moyenne')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [confirmState, setConfirmState] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState('')

  const initKey = project ? String(project.id) : 'none'

  useEffect(() => {
    if (!project) return
    setTitle(project.name || '')
    setDescription(project.description || '')
    setDeadline(project.deadline || '')
    setMemberUids([...(project.members || [])])
    setPendingEmails([...(project.pendingEmails || [])])
    setMemberRoles({ ...(project.memberRoles || {}) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey])

  const teamMembers = useMemo(() => buildTeamList({ members: memberUids, pendingEmails, memberRoles }, members), [memberUids, pendingEmails, memberRoles, members])
  const assignableMembers = useMemo(() => teamMembers.filter((m) => !m.pending), [teamMembers])

  const projectStats = useMemo(() => {
    const total = projectTasks.length
    const done = projectTasks.filter((t) => t.status === 'Terminee').length
    const inProgress = projectTasks.filter((t) => t.status === 'En cours').length
    const todo = projectTasks.filter((t) => (t.status || 'A faire') === 'A faire').length
    const completion = total === 0 ? 0 : Math.round((done / total) * 100)
    return { total, done, inProgress, todo, completion, memberCount: teamMembers.length }
  }, [projectTasks, teamMembers])

  if (!project) {
    return (
      <section className="card center" style={{ marginTop: '2rem' }}>
        <p className="muted">Projet introuvable.</p>
        <button type="button" className="button button-light" onClick={() => navigate('/dashboard')}>
          ← Retour au dashboard
        </button>
      </section>
    )
  }

  const handleAddMember = async () => {
    const value = newMemberName.trim()
    if (!value) return
    const existing = members.find((m) => m.name.toLowerCase() === value.toLowerCase() || m.email?.toLowerCase() === value.toLowerCase())
    let newUid = null, newPending = null
    if (existing) {
      if (memberUids.includes(existing.id)) { notify('Membre', 'Déjà membre.', 'info'); return }
      newUid = existing.id
    } else {
      try {
        const resolved = await resolveMemberInput(value)
        if (resolved?.uid) { newUid = resolved.uid } else { newPending = value.includes('@') ? value.toLowerCase() : value }
      } catch { newPending = value.includes('@') ? value.toLowerCase() : value }
    }
    const updatedUids = newUid ? [...memberUids, newUid] : memberUids
    const updatedPending = newPending ? [...pendingEmails, newPending] : pendingEmails
    try {
      await updateProject({ projectId: project.id, memberUids: updatedUids, pendingEmails: updatedPending })
      if (newUid) setMemberUids(updatedUids)
      else if (newPending) setPendingEmails(updatedPending)
      notify('Membre', newPending ? `Invitation envoyée à ${newPending}.` : 'Membre ajouté.', 'success')
    } catch (err) { notify('Erreur', err?.message || 'Échec ajout membre.', 'warning') }
    setNewMemberName('')
  }

  const handleAddTask = async () => {
    const cleanTitle = newTaskTitle.trim()
    if (!cleanTitle) return
    try {
      await addTask({ projectId: project.id, task: { id: Date.now(), title: cleanTitle, description: '', status: 'A faire', priority: newTaskPriority, deadline: '—', assigneeId: newTaskAssignee || '' } })
      setNewTaskTitle(''); setNewTaskPriority('Moyenne'); setNewTaskAssignee('')
    } catch (err) { notify('Erreur', err?.message, 'warning') }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const resolvedUids = [...memberUids]
      if (user?.uid && !resolvedUids.includes(user.uid)) resolvedUids.push(user.uid)
      await updateProject({ projectId: project.id, name: title, description, deadline: deadline || null, memberUids: resolvedUids, pendingEmails, memberRoles })
      notify('Projet', 'Projet enregistré.', 'success')
    } catch (err) { notify('Erreur', err?.message, 'warning') }
    finally { setIsSaving(false) }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    try { await deleteProject({ projectId: project.id }); notify('Projet', 'Projet supprimé.', 'warning'); navigate('/dashboard') }
    catch (err) { notify('Erreur', err?.message, 'warning') }
    finally { setIsSaving(false) }
  }

  const handleDeleteTask = async (task) => {
    try { await deleteTask({ projectId: task.projectId, taskId: task.id }); notify('Tâche', 'Tâche supprimée.', 'warning') }
    catch (err) { notify('Erreur', err?.message, 'warning') }
  }

  const handleTaskStatus = async (task, nextStatus, newTitle, newPriority, newAssigneeId) => {
    try {
      const updates = {}
      if (nextStatus) updates.status = nextStatus
      if (newTitle && newTitle !== task.title) updates.title = newTitle
      if (newPriority && newPriority !== (task.priority || 'Moyenne')) updates.priority = newPriority
      if (newAssigneeId !== undefined && newAssigneeId !== task.assigneeId) updates.assigneeId = newAssigneeId
      if (Object.keys(updates).length === 1 && updates.status) {
        await setTaskStatus({ projectId: task.projectId, taskId: task.id, status: nextStatus })
      } else {
        await updateTask({ projectId: task.projectId, taskId: task.id, updates })
      }
    } catch (err) { notify('Erreur', err?.message, 'warning') }
  }

  const confirmEditTask = (task) => {
    const newTitle = editingTaskTitle.trim()
    if (!newTitle || newTitle === task.title) { setEditingTaskId(null); return }
    handleTaskStatus(task, task.status || 'A faire', newTitle, undefined)
    setEditingTaskId(null)
  }

  const handleConfirm = () => {
    if (!confirmState) return
    if (confirmState.type === 'project') handleDelete()
    else if (confirmState.type === 'task') handleDeleteTask(confirmState.task)
    setConfirmState(null)
  }

  return (
    <div className="project-page">
      {/* ── En-tête page ── */}
      <div className="project-page-header">
        <div className="pdm-header-bar" aria-hidden="true" />
        <div className="pdm-header-content">
          <div>
            <p className="pdm-header-label">
              <button type="button" className="project-page-back" onClick={() => navigate('/dashboard')}>
                ← Dashboard
              </button>
              <span> / Détails du projet</span>
            </p>
            <h2 className="pdm-header-title">{title || project.name}</h2>
          </div>
        </div>
      </div>

      {/* ── Corps formulaire 2 colonnes ── */}
      <form className="project-page-body" onSubmit={handleSave}>
        {/* Colonne gauche */}
        <div className="pdm-col project-page-col">
          <section className="pdm-section">
            <h3 className="pdm-section-title"><span className="pdm-section-icon">📋</span> Informations</h3>
            <div className="pdm-fields">
              <label className="pdm-label">Titre<input className="pdm-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
              <label className="pdm-label">Description<textarea className="pdm-input pdm-textarea" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <label className="pdm-label">Date limite<input className="pdm-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
            </div>
          </section>

          <section className="pdm-section">
            <h3 className="pdm-section-title"><span className="pdm-section-icon">👥</span> Membres ({teamMembers.length})</h3>
            {teamMembers.length === 0 ? <p className="pdm-empty">Aucun membre.</p> : (
              <ul className="pdm-member-list">
                {teamMembers.map((m) => (
                  <li key={m.key} className="pdm-member-item">
                    <div className="pdm-member-avatar">{m.name.charAt(0).toUpperCase()}</div>
                    <div className="pdm-member-info">
                      <span className="pdm-member-name">{m.name}</span>
                      <span className={`pdm-member-role ${m.pending ? 'pdm-role-pending' : ''}`}>{m.role}</span>
                    </div>
                    <button type="button" className="pdm-member-remove" onClick={() => { if (m.pending) setPendingEmails((p) => p.filter((e) => e !== m.email)); else { setMemberUids((p) => p.filter((u) => u !== m.uid)); setMemberRoles((p) => { const n = { ...p }; delete n[m.uid]; return n }) } }} disabled={isSaving}>×</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="pdm-add-row">
              <input className="pdm-input" type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Nom ou email" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember() } }} />
              <select className="pdm-input pdm-select" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
                <option value="Membre">Membre</option>
                <option value="Administrateur">Admin</option>
              </select>
              <button type="button" className="button button-primary pdm-add-btn" onClick={handleAddMember}>+</button>
            </div>
            <p className="pdm-hint">Nom exact ou email. Compte inexistant → invitation en attente.</p>
          </section>
        </div>

        {/* Colonne droite */}
        <div className="pdm-col project-page-col">
          <section className="pdm-section">
            <h3 className="pdm-section-title"><span className="pdm-section-icon">📊</span> Progression</h3>
            <div className="pdm-stats">
              <div className="pdm-stat-row">
                <span className="pdm-stat-item pdm-stat-todo"><span className="pdm-stat-dot" /><span className="pdm-stat-num">{projectStats.todo}</span><span className="pdm-stat-label">À faire</span></span>
                <span className="pdm-stat-item pdm-stat-progress"><span className="pdm-stat-dot" /><span className="pdm-stat-num">{projectStats.inProgress}</span><span className="pdm-stat-label">En cours</span></span>
                <span className="pdm-stat-item pdm-stat-done"><span className="pdm-stat-dot" /><span className="pdm-stat-num">{projectStats.done}</span><span className="pdm-stat-label">Terminées</span></span>
              </div>
              <div className="pdm-progress-wrap">
                <div className="pdm-progress-bar"><div className="pdm-progress-fill" style={{ width: `${projectStats.completion}%` }} role="progressbar" aria-valuenow={projectStats.completion} aria-valuemin={0} aria-valuemax={100} /></div>
                <span className="pdm-progress-pct">{projectStats.completion}%</span>
              </div>
              <p className="pdm-hint">{projectStats.done} sur {projectStats.total} tâche{projectStats.total > 1 ? 's' : ''} terminée{projectStats.done > 1 ? 's' : ''}</p>
            </div>
          </section>

          <section className="pdm-section pdm-tasks-section">
            <h3 className="pdm-section-title"><span className="pdm-section-icon">✅</span> Tâches ({projectTasks.length})</h3>
            <div className="pdm-task-list project-page-task-list">
              {projectTasks.length === 0 ? <p className="pdm-empty">Aucune tâche.</p> : projectTasks.map((t) => {
                return (
                  <div key={t.id} className="pdm-task-item">
                    <div className="pdm-task-main">
                      {editingTaskId === t.id ? (
                        <input className="pdm-input pdm-task-edit-input" type="text" value={editingTaskTitle} onChange={(e) => setEditingTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmEditTask(t) } if (e.key === 'Escape') setEditingTaskId(null) }} onBlur={() => confirmEditTask(t)} autoFocus />
                      ) : (
                        <span className="pdm-task-title">{t.title}</span>
                      )}
                      <div className="pdm-task-meta">
                        <select className={`pdm-priority-select ${priorityClass(t.priority || 'Moyenne')}`} value={t.priority || 'Moyenne'} onChange={(e) => handleTaskStatus(t, t.status, undefined, e.target.value)} aria-label="Priorité">
                          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select className="pdm-assignee-select" value={t.assigneeId || ''} onChange={(e) => handleTaskStatus(t, t.status, undefined, undefined, e.target.value || null)} aria-label="Assigné à">
                          <option value="">— Non assigné</option>
                          {assignableMembers.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="pdm-task-actions">
                      <select
                        className={`pdm-status-select ${
                          (t.status || 'A faire') === 'Terminee' ? 'status-select-done' :
                          (t.status || 'A faire') === 'En cours' ? 'status-select-progress' :
                          'status-select-todo'
                        }`}
                        value={t.status || 'A faire'}
                        onChange={(e) => handleTaskStatus(t, e.target.value)}
                        aria-label="Statut"
                      >
                        <option value="A faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="Terminee">Terminé</option>
                      </select>
                      {editingTaskId === t.id ? (
                        <button type="button" className="pdm-task-edit-confirm" onClick={() => confirmEditTask(t)}>✓</button>
                      ) : (
                        <button type="button" className="pdm-task-edit-btn" onClick={() => { setEditingTaskId(t.id); setEditingTaskTitle(t.title) }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      )}
                      <button type="button" className="pdm-task-delete" onClick={() => setConfirmState({ type: 'task', task: t })}>×</button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pdm-new-task-form">
              <input className="pdm-input" type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Nouvelle tâche..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask() } }} />
              <div className="pdm-new-task-options">
                <select className="pdm-input pdm-select" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} aria-label="Priorité">
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="pdm-input pdm-select" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} aria-label="Assigner à">
                  <option value="">Non assignée</option>
                  {assignableMembers.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                </select>
                <button type="button" className="button button-primary pdm-add-btn" onClick={handleAddTask}>+ Ajouter</button>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="project-page-footer">
          <button type="button" className="button button-danger-outline" onClick={() => setConfirmState({ type: 'project' })} disabled={isSaving}>🗑 Supprimer le projet</button>
          <div className="pdm-footer-actions">
            <button type="button" className="button button-light" onClick={() => navigate('/dashboard')} disabled={isSaving}>Annuler</button>
            <button type="submit" className="button button-primary" disabled={isSaving}>{isSaving ? 'Enregistrement...' : '✓ Enregistrer'}</button>
          </div>
        </footer>
      </form>

      {confirmState?.type === 'project' && <ConfirmDialog message="Supprimer ce projet ?" detail="Toutes les tâches seront supprimées." onConfirm={handleConfirm} onCancel={() => setConfirmState(null)} />}
      {confirmState?.type === 'task' && <ConfirmDialog message={`Supprimer "${confirmState.task.title}" ?`} detail="Cette tâche sera définitivement supprimée." onConfirm={handleConfirm} onCancel={() => setConfirmState(null)} />}
    </div>
  )
}

export default ProjectPage
