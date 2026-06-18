/**
 * ProjectDetailsModal.jsx
 * Modal d'édition complète d'un projet — design moderne 2 colonnes.
 */

import { useEffect, useMemo, useState } from 'react'
import TaskStatusMenu from './TaskStatusMenu'

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

function ProjectDetailsModal({
  open, project, globalMembers, projectTasks,
  onClose, onSave, onDelete, onAddMember, onAddTask,
  onTaskStatusChange, onTaskDelete, isSubmitting,
}) {
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
  const [pendingTasks, setPendingTasks] = useState([])
  const [confirmState, setConfirmState] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState('')

  const initKey = open ? String(project?.id) : 'closed'

  useEffect(() => {
    if (!open || !project) return
    setTitle(project.name || '')
    setDescription(project.description || '')
    setDeadline(project.deadline || '')
    setMemberUids([...(project.members || [])])
    setPendingEmails([...(project.pendingEmails || [])])
    setMemberRoles({ ...(project.memberRoles || {}) })
    setNewMemberName('')
    setNewMemberRole('Membre')
    setNewTaskTitle('')
    setNewTaskPriority('Moyenne')
    setNewTaskAssignee('')
    setPendingTasks([])
    setConfirmState(null)
    setEditingTaskId(null)
    setEditingTaskTitle('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey])

  const teamMembers = useMemo(
    () => buildTeamList({ members: memberUids, pendingEmails, memberRoles }, globalMembers),
    [memberUids, pendingEmails, memberRoles, globalMembers],
  )

  const assignableMembers = useMemo(() => teamMembers.filter((m) => !m.pending), [teamMembers])
  const allTasks = useMemo(() => [...projectTasks, ...pendingTasks], [projectTasks, pendingTasks])

  const projectStats = useMemo(() => {
    const total = allTasks.length
    const done = allTasks.filter((t) => t.status === 'Terminee').length
    const inProgress = allTasks.filter((t) => t.status === 'En cours').length
    const todo = allTasks.filter((t) => (t.status || 'A faire') === 'A faire').length
    const completion = total === 0 ? 0 : Math.round((done / total) * 100)
    return { total, done, inProgress, todo, completion, memberCount: teamMembers.length }
  }, [allTasks, teamMembers])

  if (!open || !project) return null

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting && !confirmState) onClose()
  }

  const handleAddMember = async () => {
    const value = newMemberName.trim()
    if (!value || !onAddMember) return
    const result = await onAddMember({ input: value, role: newMemberRole, memberUids, pendingEmails, projectId: project.id })
    if (!result?.ok) return
    if (result.uid && !memberUids.includes(result.uid)) {
      setMemberUids((prev) => [...prev, result.uid])
      setMemberRoles((prev) => ({ ...prev, [result.uid]: result.role || newMemberRole }))
    } else if (result.pendingValue && !pendingEmails.includes(result.pendingValue)) {
      setPendingEmails((prev) => [...prev, result.pendingValue])
    }
    setNewMemberName('')
  }

  const handleAddTask = async () => {
    const cleanTitle = newTaskTitle.trim()
    if (!cleanTitle) return
    if (onAddTask) {
      const result = await onAddTask({ projectId: project.id, title: cleanTitle, priority: newTaskPriority, assigneeId: newTaskAssignee || null })
      if (!result?.ok) return
    } else {
      setPendingTasks((prev) => [...prev, { id: `draft-${Date.now()}-${prev.length}`, title: cleanTitle, status: 'A faire', priority: newTaskPriority, assigneeId: newTaskAssignee || null }])
    }
    setNewTaskTitle('')
    setNewTaskPriority('Moyenne')
    setNewTaskAssignee('')
  }

  const isDraftTask = (taskId) => String(taskId).startsWith('draft-')

  const startEditTask = (task) => { setEditingTaskId(task.id); setEditingTaskTitle(task.title) }

  const confirmEditTask = (task) => {
    const newTitle = editingTaskTitle.trim()
    if (!newTitle || newTitle === task.title) { setEditingTaskId(null); return }
    if (isDraftTask(task.id)) {
      setPendingTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title: newTitle } : t)))
    } else {
      onTaskStatusChange?.(task, task.status || 'A faire', newTitle, undefined)
    }
    setEditingTaskId(null)
  }

  const cancelEditTask = () => { setEditingTaskId(null); setEditingTaskTitle('') }

  const handleTaskStatusChange = (task, nextStatus) => {
    if (isDraftTask(task.id)) {
      setPendingTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))
      return
    }
    onTaskStatusChange?.(task, nextStatus)
  }

  const handleTaskPriorityChange = (task, newPriority) => {
    if (isDraftTask(task.id)) {
      setPendingTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, priority: newPriority } : t)))
      return
    }
    onTaskStatusChange?.(task, task.status || 'A faire', undefined, newPriority)
  }

  const handleTaskAssigneeChange = (task, newAssigneeId) => {
    if (isDraftTask(task.id)) {
      setPendingTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, assigneeId: newAssigneeId || null } : t)))
      return
    }
    onTaskStatusChange?.(task, task.status || 'A faire', undefined, undefined, newAssigneeId || null)
  }

  const handleConfirm = () => {
    if (!confirmState) return
    if (confirmState.type === 'project') {
      onDelete(project.id)
    } else if (confirmState.type === 'task') {
      const task = confirmState.task
      if (isDraftTask(task.id)) {
        setPendingTasks((prev) => prev.filter((t) => t.id !== task.id))
      } else {
        onTaskDelete?.(task)
      }
    }
    setConfirmState(null)
  }

  const handleSave = (event) => {
    event.preventDefault()
    onSave({ projectId: project.id, name: title, description, deadline, memberUids, pendingEmails, memberRoles, newTasks: [] })
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={handleBackdropClick}>
      <div className="pdm-shell" role="dialog" aria-modal="true" aria-labelledby="pdm-title">

        {/* ── En-tête ── */}
        <div className="pdm-header">
          <div className="pdm-header-bar" aria-hidden="true" />
          <div className="pdm-header-content">
            <div>
              <p className="pdm-header-label">Détails du projet</p>
              <h2 id="pdm-title" className="pdm-header-title">{title || project.name}</h2>
            </div>
            <button type="button" className="pdm-close" onClick={onClose} disabled={isSubmitting} aria-label="Fermer">×</button>
          </div>
        </div>

        {/* ── Corps 2 colonnes ── */}
        <form className="pdm-body" onSubmit={handleSave}>

          {/* ════ Colonne gauche ════ */}
          <div className="pdm-col">
            <section className="pdm-section">
              <h3 className="pdm-section-title"><span className="pdm-section-icon" aria-hidden="true">📋</span>Informations</h3>
              <div className="pdm-fields">
                <label className="pdm-label">Titre du projet<input className="pdm-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
                <label className="pdm-label">Description<textarea className="pdm-input pdm-textarea" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre projet..." /></label>
                <label className="pdm-label">Date limite<input className="pdm-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
              </div>
            </section>

            <section className="pdm-section">
              <h3 className="pdm-section-title"><span className="pdm-section-icon" aria-hidden="true">👥</span>Membres ({teamMembers.length})</h3>
              {teamMembers.length === 0 ? (
                <p className="pdm-empty">Aucun membre pour le moment.</p>
              ) : (
                <ul className="pdm-member-list">
                  {teamMembers.map((m) => (
                    <li key={m.key} className="pdm-member-item">
                      <div className="pdm-member-avatar">{m.name.charAt(0).toUpperCase()}</div>
                      <div className="pdm-member-info">
                        <span className="pdm-member-name">{m.name}</span>
                        <span className={`pdm-member-role ${m.pending ? 'pdm-role-pending' : ''}`}>{m.role}</span>
                      </div>
                      <button type="button" className="pdm-member-remove" onClick={() => { if (m.pending) { setPendingEmails((prev) => prev.filter((e) => e !== m.email)) } else { setMemberUids((prev) => prev.filter((uid) => uid !== m.uid)); setMemberRoles((prev) => { const next = { ...prev }; delete next[m.uid]; return next }) } }} aria-label={`Retirer ${m.name}`} disabled={isSubmitting}>×</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="pdm-add-row">
                <input className="pdm-input" type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Nom ou email" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember() } }} />
                <select className="pdm-input pdm-select" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} aria-label="Rôle">
                  <option value="Membre">Membre</option>
                  <option value="Administrateur">Admin</option>
                </select>
                <button type="button" className="button button-primary pdm-add-btn" onClick={handleAddMember}>+</button>
              </div>
              <p className="pdm-hint">Nom exact ou email. Compte inexistant → invitation en attente.</p>
            </section>
          </div>

          {/* ════ Colonne droite ════ */}
          <div className="pdm-col">
            <section className="pdm-section">
              <h3 className="pdm-section-title"><span className="pdm-section-icon" aria-hidden="true">📊</span>Progression</h3>
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
                <p className="pdm-hint" style={{ marginTop: '0.35rem' }}>{projectStats.done} sur {projectStats.total} tâche{projectStats.total > 1 ? 's' : ''} terminée{projectStats.done > 1 ? 's' : ''}</p>
              </div>
            </section>

            <section className="pdm-section pdm-tasks-section">
              <h3 className="pdm-section-title"><span className="pdm-section-icon" aria-hidden="true">✅</span>Tâches ({allTasks.length})</h3>
              <div className="pdm-task-list">
                {allTasks.length === 0 ? (
                  <p className="pdm-empty">Aucune tâche dans ce projet.</p>
                ) : (
                  allTasks.map((t) => (
                    <div key={t.id} className="pdm-task-item">
                      <div className="pdm-task-main">
                        {editingTaskId === t.id ? (
                          <input className="pdm-input pdm-task-edit-input" type="text" value={editingTaskTitle} onChange={(e) => setEditingTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmEditTask(t) } if (e.key === 'Escape') cancelEditTask() }} onBlur={() => confirmEditTask(t)} autoFocus aria-label="Modifier le titre" />
                        ) : (
                          <span className="pdm-task-title">{t.title}</span>
                        )}
                        <div className="pdm-task-meta">
                          <select className={`pdm-priority-select ${priorityClass(t.priority || 'Moyenne')}`} value={t.priority || 'Moyenne'} onChange={(e) => handleTaskPriorityChange(t, e.target.value)} disabled={isSubmitting || editingTaskId === t.id} aria-label="Priorité">
                            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <select className="pdm-assignee-select" value={t.assigneeId || ''} onChange={(e) => handleTaskAssigneeChange(t, e.target.value)} disabled={isSubmitting || editingTaskId === t.id} aria-label="Assigné à">
                            <option value="">— Non assigné</option>
                            {assignableMembers.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="pdm-task-actions">
                        <TaskStatusMenu status={t.status || 'A faire'} onChange={(next) => handleTaskStatusChange(t, next)} disabled={isSubmitting || editingTaskId === t.id} compact />
                        {editingTaskId === t.id ? (
                          <button type="button" className="pdm-task-edit-confirm" onClick={() => confirmEditTask(t)} title="Valider" aria-label="Valider">✓</button>
                        ) : (
                          <button type="button" className="pdm-task-edit-btn" onClick={() => startEditTask(t)} disabled={isSubmitting} title="Modifier" aria-label={`Modifier ${t.title}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                        <button type="button" className="pdm-task-delete" onClick={() => setConfirmState({ type: 'task', task: t })} disabled={isSubmitting || editingTaskId === t.id} aria-label={`Supprimer ${t.title}`} title="Supprimer">×</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pdm-new-task-form">
                <input className="pdm-input" type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Titre de la tâche..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask() } }} />
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

          {/* ── Footer ── */}
          <footer className="pdm-footer">
            <button type="button" className="button button-danger-outline" onClick={() => setConfirmState({ type: 'project' })} disabled={isSubmitting}>🗑 Supprimer le projet</button>
            <div className="pdm-footer-actions">
              <button type="button" className="button button-light" onClick={onClose} disabled={isSubmitting}>Annuler</button>
              <button type="submit" className="button button-primary" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement...' : '✓ Enregistrer'}</button>
            </div>
          </footer>
        </form>
      </div>

      {confirmState?.type === 'project' && <ConfirmDialog message="Supprimer ce projet ?" detail="Toutes les tâches associées seront définitivement supprimées." onConfirm={handleConfirm} onCancel={() => setConfirmState(null)} />}
      {confirmState?.type === 'task' && <ConfirmDialog message={`Supprimer "${confirmState.task.title}" ?`} detail="Cette tâche sera définitivement supprimée." onConfirm={handleConfirm} onCancel={() => setConfirmState(null)} />}
    </div>
  )
}

export default ProjectDetailsModal
