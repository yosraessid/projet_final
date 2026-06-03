import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { isFirebaseConfigured } from '../firebase/firebaseClient'
import {
  createProjectFromEmails,
  createTaskInProject,
  deleteTaskInProject,
  ensureDefaultProjectForUser,
  subscribeToAppData,
  updateTaskInProject,
} from '../services/firebaseAppDataService'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const { user } = useAuth()

  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Temps reel: ecoute Firestore et met a jour l interface automatiquement.
  useEffect(() => {
    if (!isFirebaseConfigured() || !user?.uid) {
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

      try {
        await ensureDefaultProjectForUser(user.uid)
      } catch (err) {
        if (active) {
          setError(err?.message || 'Impossible de preparer le projet par defaut.')
          setLoading(false)
        }
        return
      }

      if (!active) return

      unsubscribe = subscribeToAppData(
        user.uid,
        (data) => {
          if (!active) return
          setMembers(data.members)
          setProjects(data.projects)
          setTasks(data.tasks)
          setError(null)
          setLoading(false)
        },
        (err) => {
          if (!active) return
          const msg = err?.message || ''
          if (msg.includes('permission') || msg.includes('Permission')) {
            setError(
              'Permissions Firestore refusees. Copiez firestore.rules dans Firebase Console > Firestore > Regles > Publier.',
            )
          } else {
            setError(msg || 'Erreur synchronisation temps reel.')
          }
          setLoading(false)
        },
      )
    }

    startRealtimeSync()

    return () => {
      active = false
      unsubscribe()
    }
  }, [user?.uid])

  const createProject = useCallback(
    async ({ name, description, memberEmails }) => {
      if (!user?.uid) throw new Error('Utilisateur non connecte.')
      const result = await createProjectFromEmails({
        creatorUid: user.uid,
        name,
        description,
        memberEmails,
      })

      // Mise a jour immediate de l interface (en plus du temps reel Firestore).
      setProjects((prev) => {
        if (prev.some((p) => p.id === result.project.id)) return prev
        return [result.project, ...prev]
      })

      return result
    },
    [user?.uid],
  )

  const addTask = useCallback(async ({ projectId, task }) => {
    await createTaskInProject({ projectId, task })
  }, [])

  const updateTask = useCallback(async ({ projectId, taskId, updates }) => {
    await updateTaskInProject({ projectId, taskId, updates })
  }, [])

  const deleteTask = useCallback(async ({ projectId, taskId }) => {
    await deleteTaskInProject({ projectId, taskId })
  }, [])

  const setTaskStatus = useCallback(async ({ projectId, taskId, status }) => {
    await updateTaskInProject({ projectId, taskId, updates: { status } })
  }, [])

  const value = useMemo(
    () => ({
      members,
      projects,
      tasks,
      loading,
      error,
      createProject,
      addTask,
      updateTask,
      deleteTask,
      setTaskStatus,
    }),
    [members, projects, tasks, loading, error, createProject, addTask, updateTask, deleteTask, setTaskStatus],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
