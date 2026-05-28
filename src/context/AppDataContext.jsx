import { createContext, useContext, useMemo, useState } from 'react'

const AppDataContext = createContext(null)

const initialMembers = [
  { id: 1, name: 'Yosra', email: 'yosra@email.com', role: 'Admin' },
  { id: 2, name: 'Rayen', email: 'rayen@email.com', role: 'Membre' },
  { id: 3, name: 'Sarra', email: 'sarra@email.com', role: 'Membre' },
]

const initialProjects = [
  {
    id: 102,
    name: 'To-do collaborative',
    description: 'Liste principale de l equipe',
    members: [1, 2, 3],
  },
]

const initialTasks = [
  {
    id: 1001,
    projectId: 102,
    title: 'Faire la page accueil',
    description: 'Ecrire une presentation simple',
    status: 'A faire',
    priority: 'Haute',
    deadline: '2026-06-02',
    assigneeId: 1,
  },
  {
    id: 1002,
    projectId: 102,
    title: 'Creer la structure des pages',
    description: 'Routes + layout + sidebar',
    status: 'En cours',
    priority: 'Moyenne',
    deadline: '2026-06-05',
    assigneeId: 2,
  },
  {
    id: 1003,
    projectId: 102,
    title: 'Faire le design moderne',
    description: 'Theme dark + cards',
    status: 'Terminee',
    priority: 'Basse',
    deadline: '2026-06-01',
    assigneeId: 3,
  },
]

export function AppDataProvider({ children }) {
  const [members, setMembers] = useState(initialMembers)
  const [projects, setProjects] = useState(initialProjects)
  const [tasks, setTasks] = useState(initialTasks)

  const value = useMemo(
    () => ({
      members,
      setMembers,
      projects,
      setProjects,
      tasks,
      setTasks,
    }),
    [members, projects, tasks],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}

