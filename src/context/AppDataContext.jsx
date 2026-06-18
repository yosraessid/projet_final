/**
 * AppDataContext.jsx
 * Contexte React pour la synchronisation en temps réel des données de l'application.
 *
 * Responsabilités :
 *   - Écoute Firestore en temps réel (projets, membres, tâches) via subscribeToAppData.
 *   - Met en cache les données dans localStorage pour un affichage instantané au rechargement.
 *   - Expose les actions CRUD (créer, modifier, supprimer) pour les projets et les tâches.
 *
 * Valeurs exposées via useAppData() :
 *   - members        : liste des membres de tous les projets de l'utilisateur
 *   - projects       : liste des projets de l'utilisateur
 *   - tasks          : liste de toutes les tâches de tous les projets
 *   - loading        : boolean — true pendant la première synchronisation
 *   - error          : message d'erreur Firestore ou null
 *   - createProject(payload)
 *   - updateProject(payload)
 *   - deleteProject({ projectId })
 *   - addTask({ projectId, task })
 *   - updateTask({ projectId, taskId, updates })
 *   - deleteTask({ projectId, taskId })
 *   - setTaskStatus({ projectId, taskId, status })
 */

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { isFirebaseConfigured } from '../firebase/firebaseClient'
import {
  createProjectFromEmails,
  createTaskInProject,
  deleteProjectInFirestore,
  deleteTaskInProject,
  subscribeToAppData,
  updateProjectInFirestore,
  updateTaskInProject,
} from '../services/firebaseAppDataService'

const AppDataContext = createContext(null)

/** Préfixe des clés localStorage pour le cache des données par utilisateur. */
const DATA_CACHE_PREFIX = 'workspace-app-data'

/**
 * Lit le cache localStorage pour un utilisateur donné.
 * @param {string} uid
 * @returns {{ members, projects, tasks }|null} Données en cache ou null si absent/invalide.
 */
function readCachedAppData(uid) {
  if (!uid) return null
  try {
    const raw = localStorage.getItem(`${DATA_CACHE_PREFIX}:${uid}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.projects)) return null
    return {
      members: parsed.members || [],
      projects: parsed.projects || [],
      tasks: parsed.tasks || [],
    }
  } catch {
    return null
  }
}

/**
 * Écrit les données dans le cache localStorage pour un utilisateur donné.
 * Les erreurs de quota ou de navigation privée sont silencieusement ignorées.
 * @param {string} uid
 * @param {{ members, projects, tasks }} data
 */
function writeCachedAppData(uid, data) {
  if (!uid) return
  try {
    localStorage.setItem(
      `${DATA_CACHE_PREFIX}:${uid}`,
      JSON.stringify({
        members: data.members,
        projects: data.projects,
        tasks: data.tasks,
      }),
    )
  } catch {
    // Quota dépassé ou navigation privée : on ignore silencieusement.
  }
}

/**
 * Provider du contexte de données applicatives.
 * Lance la synchronisation Firestore dès que l'utilisateur est connecté.
 */
export function AppDataProvider({ children }) {
  const { user, loading: authLoading } = useAuth()

  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Lance ou arrête la synchronisation Firestore selon l'état de la session.
  useEffect(() => {
    // Si Firebase n'est pas configuré, on vide les données et on sort.
    if (!isFirebaseConfigured()) {
      setMembers([])
      setProjects([])
      setTasks([])
      setError(null)
      return undefined
    }

    // On attend que AuthContext ait fini de vérifier la session pour éviter
    // d'effacer les données lors d'un rechargement de page.
    if (authLoading) {
      return undefined
    }

    // Si aucun utilisateur connecté, on réinitialise tout.
    if (!user?.uid) {
      setMembers([])
      setProjects([])
      setTasks([])
      setError(null)
      return undefined
    }

    let active = true
    let unsubscribe = () => {}

    async function startRealtimeSync() {
      setLoading(true)
      setError(null)

      // Affichage instantané : charge les données en cache avant même d'appeler Firestore.
      // Le cache inclut les membres déjà connus → pas de flash vide au rechargement.
      const cached = readCachedAppData(user.uid)
      if (cached) {
        setMembers(cached.members)
        setProjects(cached.projects)
        setTasks(cached.tasks)
        setLoading(false) // On affiche immédiatement le cache, le loading s'arrête.
      }

      if (!active) return

      // Démarre l'écoute Firestore en temps réel.
      // Quand Firestore répond, les données fraîches remplacent le cache.
      unsubscribe = subscribeToAppData(
        user.uid,
        (data) => {
          if (!active) return
          setMembers(data.members)
          setProjects(data.projects)
          setTasks(data.tasks)
          // Met à jour le cache avec les données fraîches de Firestore.
          writeCachedAppData(user.uid, data)
          setError(null)
          setLoading(false)
        },
        (err) => {
          if (!active) return
          const msg = err?.message || ''
          if (msg.includes('permission') || msg.includes('Permission')) {
            setError(
              'Permissions Firestore refusées. Copiez firestore.rules dans Firebase Console > Firestore > Règles > Publier.',
            )
          } else {
            setError(msg || 'Erreur synchronisation temps réel.')
          }
          setLoading(false)
        },
      )
    }

    startRealtimeSync()

    return () => {
      // Nettoyage : désactive les callbacks et se désabonne de Firestore.
      active = false
      unsubscribe()
    }
  }, [user?.uid, authLoading])

  /**
   * Crée un nouveau projet dans Firestore et l'ajoute immédiatement à l'état local.
   * @param {{ name, description, memberEmails, deadline }} payload
   */
  const createProject = useCallback(
    async ({ name, description, memberEmails, deadline }) => {
      if (!user?.uid) throw new Error('Utilisateur non connecté.')
      const result = await createProjectFromEmails({
        creatorUid: user.uid,
        name,
        description,
        memberEmails,
        deadline,
      })

      // Mise à jour optimiste : ajoute le projet immédiatement sans attendre Firestore.
      setProjects((prev) => {
        if (prev.some((p) => p.id === result.project.id)) return prev
        return [result.project, ...prev]
      })

      return result
    },
    [user?.uid],
  )

  /** Ajoute une tâche à un projet existant dans Firestore. */
  const addTask = useCallback(async ({ projectId, task }) => {
    await createTaskInProject({ projectId, task })
  }, [])

  /** Met à jour les champs d'une tâche existante dans Firestore. */
  const updateTask = useCallback(async ({ projectId, taskId, updates }) => {
    await updateTaskInProject({ projectId, taskId, updates })
  }, [])

  /** Supprime une tâche d'un projet dans Firestore. */
  const deleteTask = useCallback(async ({ projectId, taskId }) => {
    await deleteTaskInProject({ projectId, taskId })
  }, [])

  /** Met à jour uniquement le statut d'une tâche dans Firestore. */
  const setTaskStatus = useCallback(async ({ projectId, taskId, status }) => {
    await updateTaskInProject({ projectId, taskId, updates: { status } })
  }, [])

  /** Met à jour les informations d'un projet dans Firestore. */
  const updateProject = useCallback(async (payload) => {
    await updateProjectInFirestore(payload)
  }, [])

  /**
   * Supprime un projet et toutes ses tâches de Firestore.
   * Met à jour l'état local et le cache immédiatement.
   */
  const deleteProject = useCallback(async ({ projectId }) => {
    await deleteProjectInFirestore({ projectId })
    // Suppression optimiste de l'état local.
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId))
    // Met à jour le cache sans le projet supprimé.
    if (user?.uid) {
      writeCachedAppData(user.uid, {
        members,
        projects: projects.filter((p) => p.id !== projectId),
        tasks: tasks.filter((t) => t.projectId !== projectId),
      })
    }
  }, [user?.uid, members, projects, tasks])

  // Mémoïse la valeur du contexte pour éviter des re-renders inutiles.
  const value = useMemo(
    () => ({
      members,
      projects,
      tasks,
      loading: loading || authLoading,
      error,
      createProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      setTaskStatus,
    }),
    [
      members,
      projects,
      tasks,
      loading,
      authLoading,
      error,
      createProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      setTaskStatus,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

/**
 * Hook personnalisé pour accéder au contexte de données applicatives.
 * Doit être utilisé à l'intérieur d'un AppDataProvider.
 * @throws {Error} si utilisé hors du provider.
 */
export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
