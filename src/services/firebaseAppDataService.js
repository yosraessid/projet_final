import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore'
import { getFirebaseDb } from '../firebase/firebaseClient'

function requireDb() {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase non configure.')
  return db
}

async function fetchUserByEmail(email) {
  const db = requireDb()
  const cleanEmail = email.trim().toLowerCase()
  const q = query(collection(db, 'users'), where('email', '==', cleanEmail))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data()
}

async function fetchUsersByUids(uids) {
  const db = requireDb()
  const unique = Array.from(new Set(uids)).filter(Boolean)
  const results = await Promise.all(
    unique.map(async (uid) => {
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) return null
      return snap.data()
    }),
  )
  return results.filter(Boolean)
}

function mapProjectDoc(data) {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    members: data.memberUids || [],
    pendingEmails: data.pendingEmails || [],
  }
}

function mapTaskDoc(data, projectId) {
  return {
    id: data.id,
    projectId,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    deadline: data.deadline,
    assigneeId: data.assigneeUid,
  }
}

async function buildMembersFromProjects(projects, uid) {
  const memberUids = Array.from(
    new Set(projects.flatMap((p) => p.members || []).filter(Boolean)),
  )
  const users = await fetchUsersByUids(memberUids)
  let members = users.map((u) => ({
    id: u.uid,
    name: u.name,
    email: u.email,
    role: u.role || 'Membre',
  }))

  if (members.length === 0 && uid) {
    const meRef = doc(requireDb(), 'users', uid)
    const meSnap = await getDoc(meRef)
    if (meSnap.exists()) {
      const me = meSnap.data()
      members = [{ id: uid, name: me.name, email: me.email, role: me.role || 'Admin' }]
    }
  }

  return members
}

export async function ensureDefaultProjectForUser(uid) {
  const db = requireDb()
  const projectsQuery = query(collection(db, 'projects'), where('memberUids', 'array-contains', uid))
  const projectsSnap = await getDocs(projectsQuery)
  if (!projectsSnap.empty) return null

  const projectId = Date.now()
  await setDoc(doc(db, 'projects', String(projectId)), {
    id: projectId,
    name: 'Mon espace',
    description: 'Projet personnel cree automatiquement',
    memberUids: [uid],
    createdAt: serverTimestamp(),
  })

  return projectId
}

/**
 * Ecoute en temps reel les projets, membres et taches de l utilisateur.
 * Retourne une fonction pour se desabonner.
 */
export function subscribeToAppData(uid, onData, onError) {
  const db = requireDb()
  const unsubscribers = []
  let taskUnsubscribers = []
  let emitGeneration = 0

  const cleanupTaskListeners = () => {
    taskUnsubscribers.forEach((unsub) => unsub())
    taskUnsubscribers = []
  }

  const emitFromProjects = async (projectDocs) => {
    const generation = ++emitGeneration
    const projects = projectDocs.map((d) => mapProjectDoc(d.data()))

    let members = []
    try {
      members = await buildMembersFromProjects(projects, uid)
    } catch (err) {
      onError(err)
      return
    }

    if (generation !== emitGeneration) return

    cleanupTaskListeners()
    const tasksById = new Map()

    const pushData = () => {
      if (generation !== emitGeneration) return
      onData({
        projects,
        members,
        tasks: Array.from(tasksById.values()),
      })
    }

    // Affiche les groupes tout de suite (sans attendre les taches).
    pushData()

    if (projects.length === 0) return

    projects.forEach((project) => {
      const tasksRef = collection(db, 'projects', String(project.id), 'tasks')
      const unsubTasks = onSnapshot(
        tasksRef,
        (tasksSnap) => {
          if (generation !== emitGeneration) return

          Array.from(tasksById.keys())
            .filter((key) => key.startsWith(`${project.id}-`))
            .forEach((key) => tasksById.delete(key))

          tasksSnap.docs.forEach((t) => {
            const task = mapTaskDoc(t.data(), project.id)
            tasksById.set(`${project.id}-${task.id}`, task)
          })
          pushData()
        },
        () => {
          // Erreur taches: on garde quand meme la liste des groupes visible.
          pushData()
        },
      )
      taskUnsubscribers.push(unsubTasks)
    })
  }

  if (!uid) {
    onData({ projects: [], members: [], tasks: [] })
    return () => {}
  }

  const projectsQuery = query(collection(db, 'projects'), where('memberUids', 'array-contains', uid))

  const unsubProjects = onSnapshot(
    projectsQuery,
    (projectsSnap) => {
      emitFromProjects(projectsSnap.docs).catch(onError)
    },
    onError,
  )

  unsubscribers.push(unsubProjects)

  return () => {
    unsubscribers.forEach((unsub) => unsub())
    cleanupTaskListeners()
  }
}

export async function createProjectFromEmails({ creatorUid, name, description, memberEmails }) {
  const db = requireDb()
  const cleanName = name.trim()
  if (!cleanName) throw new Error('Nom du groupe manquant.')

  const projectId = Date.now()
  const memberUids = new Set([creatorUid])

  const emails = (memberEmails || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const resolvedUsers = []
  const pendingEmails = []

  for (const email of emails) {
    try {
      const u = await fetchUserByEmail(email)
      if (u?.uid) {
        memberUids.add(u.uid)
        resolvedUsers.push(u)
      } else {
        pendingEmails.push(email)
      }
    } catch {
      pendingEmails.push(email)
    }
  }

  const project = {
    id: projectId,
    name: cleanName,
    description: description || 'Groupe cree depuis la page Equipes',
    members: Array.from(memberUids),
    pendingEmails,
  }

  await setDoc(doc(db, 'projects', String(projectId)), {
    id: projectId,
    name: cleanName,
    description: project.description,
    memberUids: project.members,
    pendingEmails,
    createdAt: serverTimestamp(),
  })

  return {
    projectId,
    project,
    addedMemberCount: resolvedUsers.length,
    pendingEmails,
    totalMembers: memberUids.size,
    totalWithInvites: memberUids.size + pendingEmails.length,
  }
}

export async function createTaskInProject({ projectId, task }) {
  const db = requireDb()
  const taskId = task.id ?? Date.now()
  const ref = doc(db, 'projects', String(projectId), 'tasks', String(taskId))
  await setDoc(ref, {
    id: taskId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    assigneeUid: task.assigneeId,
    createdAt: serverTimestamp(),
  })
  return taskId
}

export async function updateTaskInProject({ projectId, taskId, updates }) {
  const db = requireDb()
  const ref = doc(db, 'projects', String(projectId), 'tasks', String(taskId))

  const firestoreUpdates = { ...updates }
  if ('assigneeId' in firestoreUpdates) {
    firestoreUpdates.assigneeUid = firestoreUpdates.assigneeId
    delete firestoreUpdates.assigneeId
  }
  delete firestoreUpdates.projectId
  delete firestoreUpdates.id

  await updateDoc(ref, firestoreUpdates)
}

export async function deleteTaskInProject({ projectId, taskId }) {
  const db = requireDb()
  const ref = doc(db, 'projects', String(projectId), 'tasks', String(taskId))
  await deleteDoc(ref)
}
