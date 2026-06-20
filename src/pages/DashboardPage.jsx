/**
 * DashboardPage.jsx
 * Page principale du tableau de bord.
 *
 * Fonctionnalités :
 *   1. Barre d'outils : titre + bouton "Nouveau projet" + champ de recherche.
 *   2. Grille de cartes projets : filtrées par la recherche, cliquables pour ouvrir les détails.
 *   3. Modal "Nouveau projet" (NewProjectModal) : création rapide d'un projet.
 *   4. Modal "Détails du projet" (ProjectDetailsModal) : édition complète, gestion des membres et tâches.
 *   5. Vue Kanban : tâches regroupées par statut (À faire, En cours, Terminé).
 *
 * Navigation via URL :
 *   - ?nouveau-projet=1        → ouvre la modal de création.
 *   - ?project={id}            → ouvre la modal de détails du projet correspondant.
 *   Ces paramètres permettent le partage d'URL et la navigation arrière.
 *
 * Route protégée — accessible uniquement aux utilisateurs connectés (ProtectedRoute).
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import NewProjectModal from '../components/NewProjectModal'
import ProjectDetailsModal from '../components/ProjectDetailsModal'
import { resolveMemberInput } from '../services/firebaseAppDataService'
import { projectLimiter } from '../utils/rateLimiter'


/**
 * Formate une date ISO (YYYY-MM-DD) en format français localisé.
 * @param {string|null} deadline
 * @returns {string|null}
 */
function formatProjectDeadline(deadline) {
  if (!deadline) return null
  try {
    // Ajoute T12:00:00 pour éviter les décalages horaires lors du parsing.
    return new Date(`${deadline}T12:00:00`).toLocaleDateString('fr-FR')
  } catch {
    return deadline
  }
}

/**
 * Génère la liste des avatars (initiales) pour les membres d'un projet.
 * Limite à 4 avatars maximum.
 * @param {object} project
 * @param {object[]} membersList
 * @returns {{ id, initial, name }[]}
 */
function getMemberAvatars(project, membersList) {
  const uids = project.members || []
  return uids.slice(0, 4).map((uid) => {
    const member = membersList.find((m) => m.id === uid)
    const name = member?.name || '?'
    return { id: uid, initial: name.charAt(0).toUpperCase(), name }
  })
}

/**
 * Convertit le paramètre URL "project" en nombre ou string selon sa valeur.
 * @param {string|null} value
 * @returns {number|string|null}
 */
function parseProjectIdFromParam(value) {
  if (!value) return null
  const asNumber = Number(value)
  return Number.isNaN(asNumber) ? value : asNumber
}

function DashboardPage() {
  const { notify } = useNotifications()
  const { user } = useAuth()

  // searchParams permet de lire/écrire les paramètres URL sans recharger la page.
  const [searchParams, setSearchParams] = useSearchParams()

  // Données temps réel depuis Firestore via AppDataContext.
  const {
    projects,
    tasks,
    members,
    loading: dataLoading,
    error: dataError,
    deleteTask,
    setTaskStatus,
    updateTask,
    createProject,
    updateProject,
    deleteProject,
    addTask,
  } = useAppData()

  // État local de la barre de recherche.
  const [searchQuery, setSearchQuery] = useState('')

  // État de chargement des modals pour bloquer la fermeture pendant une requête.
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isSavingProject, setIsSavingProject] = useState(false)

  // Normalise la recherche (trim + lowercase) une seule fois.
  const normalizedSearch = searchQuery.trim().toLowerCase()

  // Projets filtrés selon la recherche (mémoïsé pour éviter les recalculs inutiles).
  const filteredProjects = useMemo(() => {
    if (!normalizedSearch) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedSearch) ||
        (p.description || '').toLowerCase().includes(normalizedSearch),
    )
  }, [projects, normalizedSearch])

  // Lit l'ID du projet sélectionné depuis l'URL (?project=...).
  const selectedProjectId = useMemo(
    () => parseProjectIdFromParam(searchParams.get('project')),
    [searchParams],
  )

  // Trouve le projet correspondant à l'ID de l'URL.
  const selectedProject = useMemo(
    () => projects.find((p) => String(p.id) === String(selectedProjectId)) || null,
    [projects, selectedProjectId],
  )

  // Tâches du projet sélectionné pour la modal de détails.
  const selectedProjectTasks = useMemo(
    () => (selectedProject ? tasks.filter((t) => t.projectId === selectedProject.id) : []),
    [tasks, selectedProject],
  )

  // Détermine si la modal de création doit être ouverte.
  const showNewProjectModal = searchParams.get('nouveau-projet') === '1'

  /** Ouvre la modal de création en ajoutant ?nouveau-projet=1 à l'URL. */
  const openNewProjectModal = () => {
    setSearchParams((params) => {
      params.delete('project')
      params.set('nouveau-projet', '1')
      return params
    })
  }

  /** Supprime le paramètre nouveau-projet de l'URL (fermeture sans rechargement). */
  const clearNewProjectFromUrl = () => {
    setSearchParams(
      (params) => {
        params.delete('nouveau-projet')
        return params
      },
      { replace: true },
    )
  }

  /** Ferme la modal de création — bloqué si une création est en cours. */
  const closeNewProjectModal = () => {
    if (isCreatingProject) return
    clearNewProjectFromUrl()
  }

  /** Ouvre la modal de détails du projet en ajoutant ?project={id} à l'URL. */
  const openProjectDetails = (projectId) => {
    setSearchParams((params) => {
      params.delete('nouveau-projet')
      params.set('project', String(projectId))
      return params
    })
  }

  /** Supprime le paramètre project de l'URL (fermeture de la modal). */
  const clearProjectFromUrl = () => {
    setSearchParams(
      (params) => {
        params.delete('project')
        return params
      },
      { replace: true },
    )
  }

  /** Ferme la modal de détails — bloqué si une sauvegarde est en cours. */
  const closeProjectDetails = () => {
    if (isSavingProject) return
    clearProjectFromUrl()
  }

  /**
   * Crée un nouveau projet via AppDataContext.
   * @param {{ title, description, deadline }}
   */
  const handleCreateProject = async ({ title, description, deadline }) => {
    if (!title) {
      notify('Erreur', 'Merci de saisir un titre de projet.', 'warning')
      return
    }

    // Rate limiting : max 10 projets par minute.
    if (!projectLimiter.tryConsume('createProject')) {
      const wait = projectLimiter.getRemainingTime('createProject')
      notify('Sécurité', `Trop de créations. Réessayez dans ${wait}s.`, 'warning')
      return
    }

    setIsCreatingProject(true)
    try {
      await createProject({
        name: title,
        description: description || 'Projet créé depuis le dashboard',
        memberEmails: '',
        deadline: deadline || null,
      })
      notify('Projet', `Projet "${title}" créé avec succès.`, 'success')
      clearNewProjectFromUrl()
    } catch (err) {
      const msg = err?.message || 'Échec création projet.'
      // Message d'aide si les règles Firestore sont bloquantes.
      const friendly =
        msg.includes('permission') || msg.includes('Permission')
          ? 'Permissions refusées. Publiez firestore.rules dans Firebase.'
          : msg
      notify('Erreur', friendly, 'warning')
    } finally {
      setIsCreatingProject(false)
    }
  }

  /**
   * Résout, valide ET sauvegarde immédiatement un membre dans Firestore.
   * Ainsi l'ajout est persisté même si l'utilisateur rafraîchit sans cliquer "Enregistrer".
   */
  const handleAddMemberToProject = async ({ input, role, memberUids, pendingEmails, projectId }) => {
    // Vérifie d'abord dans la liste locale des membres connus.
    const existing = members.find(
      (m) =>
        m.name.toLowerCase() === input.toLowerCase() ||
        m.email?.toLowerCase() === input.toLowerCase(),
    )

    let newUid = null
    let newPending = null

    if (existing) {
      if (memberUids.includes(existing.id)) {
        notify('Membre', 'Cette personne fait déjà partie du projet.', 'info')
        return { ok: false }
      }
      newUid = existing.id
    } else {
      // Tente de résoudre via Firestore.
      try {
        const resolved = await resolveMemberInput(input)
        if (resolved?.uid) {
          if (memberUids.includes(resolved.uid)) {
            notify('Membre', 'Cette personne fait déjà partie du projet.', 'info')
            return { ok: false }
          }
          newUid = resolved.uid
        }
      } catch {
        // Firestore inaccessible : on continue vers l'invitation en attente.
      }

      if (!newUid) {
        // Membre introuvable → invitation en attente.
        const pendingValue = input.includes('@') ? input.toLowerCase() : input
        if (pendingEmails.includes(pendingValue)) {
          notify('Membre', 'Déjà en attente dans ce projet.', 'info')
          return { ok: false }
        }
        newPending = pendingValue
      }
    }

    // Sauvegarde immédiate dans Firestore.
    try {
      const updatedUids = newUid ? [...memberUids, newUid] : memberUids
      const updatedPending = newPending ? [...pendingEmails, newPending] : pendingEmails
      const updatedRoles = newUid ? { ...Object.fromEntries(memberUids.map((uid) => [uid, selectedProject?.memberRoles?.[uid] || 'Membre'])), [newUid]: role } : undefined

      await updateProject({
        projectId,
        memberUids: updatedUids,
        pendingEmails: updatedPending,
        ...(updatedRoles ? { memberRoles: updatedRoles } : {}),
      })

      notify('Membre', newPending ? `Invitation envoyée à ${newPending}.` : 'Membre ajouté.', 'success')
    } catch (err) {
      notify('Erreur', err?.message || 'Échec ajout membre.', 'warning')
      return { ok: false }
    }

    if (newUid) return { ok: true, uid: newUid, role }
    return { ok: true, pendingValue: newPending }
  }

  /**
   * Sauvegarde les modifications d'un projet (infos + membres + nouvelles tâches).
   * Résout les pendingEmails en UIDs Firestore si possible.
   */
  const handleSaveProjectDetails = async ({
    projectId,
    name,
    description,
    deadline,
    memberUids,
    pendingEmails,
    memberRoles,
    newTasks,
  }) => {
    setIsSavingProject(true)
    try {
      const resolvedUids = [...memberUids]
      const resolvedPending = []
      const rolesCopy = { ...memberRoles }

      // S'assure que le créateur/admin est toujours membre.
      if (user?.uid && !resolvedUids.includes(user.uid)) {
        resolvedUids.push(user.uid)
        if (!rolesCopy[user.uid]) rolesCopy[user.uid] = 'Administrateur'
      }

      // Tente de résoudre les emails en attente en UIDs Firestore.
      for (const entry of pendingEmails) {
        try {
          const resolvedUser = await resolveMemberInput(entry)
          if (resolvedUser?.uid && !resolvedUids.includes(resolvedUser.uid)) {
            resolvedUids.push(resolvedUser.uid)
            if (!rolesCopy[resolvedUser.uid]) rolesCopy[resolvedUser.uid] = 'Membre'
          } else {
            resolvedPending.push(entry)
          }
        } catch {
          resolvedPending.push(entry)
        }
      }

      // Met à jour le projet dans Firestore.
      await updateProject({
        projectId,
        name,
        description,
        deadline: deadline || null,
        memberUids: resolvedUids,
        pendingEmails: resolvedPending,
        memberRoles: rolesCopy,
      })

      // Crée les nouvelles tâches (brouillons) dans Firestore.
      for (const draft of newTasks) {
        await addTask({
          projectId,
          task: {
            id: Date.now() + Math.floor(Math.random() * 1000),
            title: draft.title,
            description: 'Sans description',
            status: draft.status || 'A faire',
            priority: draft.priority || 'Moyenne',
            deadline: '—',
            assigneeId: draft.assigneeId || members[0]?.id || '',
          },
        })
      }

      notify('Projet', 'Projet enregistré avec succès.', 'success')
      clearProjectFromUrl()
    } catch (err) {
      const msg = err?.message || 'Échec enregistrement projet.'
      notify('Erreur', msg, 'warning')
    } finally {
      setIsSavingProject(false)
    }
  }

  /**
   * Crée une tâche immédiatement dans Firestore (sans attendre "Enregistrer").
   * Appelé depuis la modal quand on clique "+ Ajouter".
   */
  const handleAddTask = async ({ projectId, title, priority, assigneeId }) => {
    try {
      await addTask({
        projectId,
        task: {
          id: Date.now() + Math.floor(Math.random() * 1000),
          title,
          description: 'Sans description',
          status: 'A faire',
          priority: priority || 'Moyenne',
          deadline: '—',
          assigneeId: assigneeId || '',
        },
      })
      // Pas de notification — l'ajout est silencieux pour ne pas surcharger l'UI.
      return { ok: true }
    } catch (err) {
      notify('Erreur', err?.message || 'Échec création tâche.', 'warning')
      return { ok: false }
    }
  }

  /**
   * Supprime un projet et toutes ses tâches.
   */
  const handleDeleteProject = async (projectId) => {
    setIsSavingProject(true)
    try {
      await deleteProject({ projectId })
      notify('Projet', 'Projet supprimé.', 'warning')
      clearProjectFromUrl()
    } catch (err) {
      notify('Erreur', err?.message || 'Échec suppression projet.', 'warning')
    } finally {
      setIsSavingProject(false)
    }
  }

  /**
   * Supprime une tâche d'un projet.
   */
  const handleDeleteTask = async (task) => {
    try {
      await deleteTask({ projectId: task.projectId, taskId: task.id })
      notify('Tâche', 'Tâche supprimée.', 'warning')
    } catch (err) {
      notify('Erreur', err?.message || 'Échec suppression tâche.', 'warning')
    }
  }

  /**
   * Change le statut, le titre ou la priorité d'une tâche dans Firestore.
   * newTitle et newPriority sont optionnels.
   */
  const handleStatusChange = async (task, nextStatus, newTitle, newPriority, newAssigneeId) => {
    try {
      const updates = {}

      // Toujours inclure le statut.
      if (nextStatus) updates.status = nextStatus

      // Titre modifié.
      if (newTitle && newTitle !== task.title) updates.title = newTitle

      // Priorité modifiée.
      if (newPriority && newPriority !== (task.priority || 'Moyenne')) {
        updates.priority = newPriority
      }

      // Assigné modifié (newAssigneeId peut être null pour désassigner).
      if (newAssigneeId !== undefined && newAssigneeId !== task.assigneeId) {
        updates.assigneeId = newAssigneeId
      }

      if (Object.keys(updates).length === 0) return

      // Un seul champ status → setTaskStatus (plus léger).
      if (Object.keys(updates).length === 1 && updates.status) {
        await setTaskStatus({ projectId: task.projectId, taskId: task.id, status: nextStatus })
        notify('Statut', `Statut mis à jour : ${nextStatus}`, 'info')
      } else {
        // Plusieurs champs → updateTask.
        await updateTask({ projectId: task.projectId, taskId: task.id, updates })
        if (updates.priority && !updates.title && !updates.assigneeId) {
          notify('Priorité', `Priorité : ${updates.priority}`, 'info')
        } else if (updates.assigneeId !== undefined && !updates.title && !updates.priority) {
          const assigneeName = members.find((m) => m.id === updates.assigneeId)?.name
          notify('Assignation', assigneeName ? `Assigné à ${assigneeName}` : 'Tâche désassignée.', 'info')
        } else {
          notify('Tâche', 'Tâche modifiée.', 'success')
        }
      }
    } catch (err) {
      notify('Erreur', err?.message || 'Échec modification tâche.', 'warning')
    }
  }

  return (
    <section className="stack">
      {/* ─── Barre d'outils : bienvenue + recherche + bouton nouveau projet ─── */}
      <header className="dashboard-toolbar card">
        <div className="dashboard-toolbar-head">
          <div className="dashboard-welcome">
            <h2>
              Bonjour,{' '}
              <span className="dashboard-welcome-name">
                {user?.name?.split(' ')[0] || 'vous'}
              </span>{' '}
              👋
            </h2>
            <p className="dashboard-welcome-sub">
              {projects.length === 0
                ? 'Créez votre premier projet pour commencer.'
                : `Vous avez ${projects.length} projet${projects.length > 1 ? 's' : ''} en cours.`}
            </p>
          </div>
          <button
            type="button"
            className="button button-primary"
            onClick={openNewProjectModal}
          >
            Nouveau projet
          </button>
        </div>

        {/* Champ de recherche filtrant les projets et tâches */}
        <label className="dashboard-search">
          <span className="dashboard-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un projet ou une tâche..."
            aria-label="Rechercher"
          />
        </label>
      </header>

      {/* Erreur Firestore globale */}
      {dataError && <p className="form-error">{dataError}</p>}

      {/* ─── Grille des cartes projets ─── */}
      <div className="project-cards-grid">
        {dataLoading && projects.length === 0 ? (
          <>
            {/* Skeleton loading — 3 cartes fantômes animées */}
            {[1, 2, 3].map((i) => (
              <article key={i} className="skeleton-card" aria-hidden="true">
                <div className="skeleton-bar" />
                <div className="skeleton-body">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-desc" />
                  <div className="skeleton-line skeleton-desc-short" />
                  <div className="skeleton-row">
                    <div className="skeleton-pill" />
                    <div className="skeleton-pill" />
                  </div>
                  <div className="skeleton-progress" />
                  <div className="skeleton-row">
                    <div className="skeleton-dot" />
                    <div className="skeleton-dot" />
                    <div className="skeleton-dot" />
                  </div>
                </div>
                <div className="skeleton-footer">
                  <div className="skeleton-avatars" />
                  <div className="skeleton-line skeleton-members" />
                </div>
              </article>
            ))}
          </>
        ) : filteredProjects.length === 0 ? (
          <article className="project-card-v2-empty">
            <span className="project-card-v2-empty-icon" aria-hidden="true">
              {normalizedSearch ? '🔍' : '📂'}
            </span>
            <p>
              {normalizedSearch
                ? 'Aucun projet ne correspond à votre recherche.'
                : 'Aucun projet pour le moment. Cliquez sur « Nouveau projet » pour commencer.'}
            </p>
          </article>
        ) : (
          // Affichage des cartes projets filtrées.
          filteredProjects.map((project) => {
            const avatars = getMemberAvatars(project, members)
            const memberCount =
              (project.members?.length || 0) + (project.pendingEmails?.length || 0)
            const deadlineLabel = formatProjectDeadline(project.deadline)

            // Statistiques des tâches du projet.
            const projectTasks = tasks.filter((t) => t.projectId === project.id)
            const taskTodo = projectTasks.filter((t) => (t.status || 'A faire') === 'A faire').length
            const taskProgress = projectTasks.filter((t) => t.status === 'En cours').length
            const taskDone = projectTasks.filter((t) => t.status === 'Terminee').length
            const taskTotal = projectTasks.length
            const completion = taskTotal === 0 ? 0 : Math.round((taskDone / taskTotal) * 100)

            // Priorités des tâches non terminées.
            const activeTasks = projectTasks.filter((t) => t.status !== 'Terminee')
            const highCount = activeTasks.filter((t) => t.priority === 'Haute').length
            const mediumCount = activeTasks.filter((t) => (t.priority || 'Moyenne') === 'Moyenne').length
            const lowCount = activeTasks.filter((t) => t.priority === 'Basse').length

            // Date de création du projet.
            const createdLabel = project.createdAt
              ? new Date(project.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
              : null

            return (
              <article
                key={project.id}
                className="project-card-v2"
                onClick={() => openProjectDetails(project.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openProjectDetails(project.id)
                  }
                }}
                role="button"
                tabIndex={0}
                title="Voir les détails du projet"
              >
                {/* Bande de couleur en haut de la carte */}
                <div className="project-card-v2-bar" aria-hidden="true" />

                {/* Corps de la carte */}
                <div className="project-card-v2-body">
                  {/* Titre + description */}
                  <h3 className="project-card-v2-title">{project.name}</h3>
                  {project.description && (
                    <p className="project-card-v2-desc">{project.description}</p>
                  )}

                  {/* Deadline */}
                  {deadlineLabel && (
                    <p className="project-card-v2-deadline">
                      <span aria-hidden="true">📅</span> {deadlineLabel}
                    </p>
                  )}

                  {/* Date de création */}
                  {createdLabel && (
                    <p className="project-card-v2-created">
                      <span aria-hidden="true">🗓</span> Créé le {createdLabel}
                    </p>
                  )}

                  {/* Priorités des tâches actives */}
                  {activeTasks.length > 0 && (
                    <div className="project-card-v2-priorities">
                      {highCount > 0 && (
                        <span className="project-priority-pill priority-high">
                          {highCount} haute{highCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {mediumCount > 0 && (
                        <span className="project-priority-pill priority-medium">
                          {mediumCount} moyenne{mediumCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {lowCount > 0 && (
                        <span className="project-priority-pill priority-low">
                          {lowCount} basse{lowCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Barre de progression */}
                  <div className="project-card-v2-progress-wrap">
                    <div className="project-card-v2-progress-bar">
                      <div
                        className="project-card-v2-progress-fill"
                        style={{ width: `${completion}%` }}
                        role="progressbar"
                        aria-valuenow={completion}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progression ${completion}%`}
                      />
                    </div>
                    <span className="project-card-v2-progress-label">{completion}%</span>
                  </div>

                  {/* Stats tâches */}
                  <div className="project-card-v2-stats">
                    <span className="project-card-v2-stat">
                      <span className="stat-dot stat-dot-todo" />
                      {taskTodo}
                    </span>
                    <span className="project-card-v2-stat">
                      <span className="stat-dot stat-dot-progress" />
                      {taskProgress}
                    </span>
                    <span className="project-card-v2-stat">
                      <span className="stat-dot stat-dot-done" />
                      {taskDone}
                    </span>
                    <span className="project-card-v2-total">
                      {taskTotal} tâche{taskTotal > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Pied de carte : membres */}
                <div className="project-card-v2-footer">
                  <div className="member-avatars" aria-hidden="true">
                    {avatars.map((a) => (
                      <span key={a.id} className="member-avatar" title={a.name}>
                        {a.initial}
                      </span>
                    ))}
                  </div>
                  <span className="project-card-v2-members">
                    {memberCount} membre{memberCount > 1 ? 's' : ''}
                  </span>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* ─── Modal : création de projet ─── */}
      <NewProjectModal
        open={showNewProjectModal}
        onClose={closeNewProjectModal}
        onSubmit={handleCreateProject}
        isSubmitting={isCreatingProject}
      />

      {/* ─── Modal : détails et édition du projet ─── */}
      <ProjectDetailsModal
        open={Boolean(selectedProjectId && selectedProject)}
        project={selectedProject}
        globalMembers={members}
        projectTasks={selectedProjectTasks}
        onClose={closeProjectDetails}
        onSave={handleSaveProjectDetails}
        onDelete={handleDeleteProject}
        onAddMember={handleAddMemberToProject}
        onAddTask={handleAddTask}
        onTaskStatusChange={(task, nextStatus, newTitle, newPriority, newAssigneeId) => handleStatusChange(task, nextStatus, newTitle, newPriority, newAssigneeId)}
        onTaskDelete={handleDeleteTask}
        isSubmitting={isSavingProject}
      />
    </section>
  )
}

export default DashboardPage
