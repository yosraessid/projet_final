/**
 * firebaseAppDataService.js
 * Service de gestion des données applicatives dans Firestore.
 *
 * Collections Firestore utilisées :
 *   - users    : profils utilisateurs (uid, name, email, role)
 *   - projects : projets (id, name, description, deadline, memberUids, pendingEmails, memberRoles)
 *   - projects/{projectId}/tasks : tâches d'un projet
 *
 * Fonctions exportées :
 *   - resolveMemberInput(input)           : résout un email ou un nom vers un profil utilisateur
 *   - ensureDefaultProjectForUser(uid)    : crée un projet par défaut si l'utilisateur n'en a pas
 *   - subscribeToAppData(uid, onData, onError) : écoute temps réel des projets/membres/tâches
 *   - createProjectFromEmails(payload)    : crée un projet avec résolution des membres par email
 *   - createTaskInProject(payload)        : crée une tâche dans un projet
 *   - updateTaskInProject(payload)        : met à jour une tâche existante
 *   - deleteTaskInProject(payload)        : supprime une tâche
 *   - updateProjectInFirestore(payload)   : met à jour un projet
 *   - deleteProjectInFirestore(payload)   : supprime un projet et toutes ses tâches
 */

import {
  collection,
  deleteField,
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
import { sanitizeText, isSafeInput } from '../utils/sanitize'

/**
 * Vérifie que Firestore est initialisé et le retourne.
 * @throws {Error} si Firebase n'est pas configuré.
 */
function requireDb() {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase non configuré.')
  return db
}

/**
 * Vérifie qu'une chaîne est une adresse email valide.
 * Regex simple mais suffisante pour détecter les saisies manifestement incorrectes.
 * @param {string} value
 * @returns {boolean}
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Recherche un utilisateur dans Firestore par adresse email.
 * @param {string} email
 * @returns {object|null} Données du profil ou null si introuvable.
 */
async function fetchUserByEmail(email) {
  const db = requireDb()
  const cleanEmail = email.trim().toLowerCase()
  const q = query(collection(db, 'users'), where('email', '==', cleanEmail))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data()
}

/**
 * Recherche un utilisateur dans Firestore par nom exact.
 * @param {string} name
 * @returns {object|null} Données du profil ou null si introuvable.
 */
async function fetchUserByName(name) {
  const db = requireDb()
  const cleanName = name.trim()
  const q = query(collection(db, 'users'), where('name', '==', cleanName))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data()
}

/**
 * Résout une saisie utilisateur (email ou nom) vers un profil Firestore.
 * Si l'entrée contient '@', vérifie le format email avant de rechercher.
 * Sinon, recherche par nom exact.
 * @param {string} input - Email ou nom à résoudre.
 * @returns {object|null} Profil trouvé ou null.
 */
export async function resolveMemberInput(input) {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.includes('@')) {
    if (!isValidEmail(trimmed)) return null
    return fetchUserByEmail(trimmed)
  }
  return fetchUserByName(trimmed)
}

/**
 * Récupère les profils de plusieurs utilisateurs par leurs UIDs.
 * Les UIDs dupliqués ou vides sont filtrés.
 * @param {string[]} uids
 * @returns {object[]} Tableau des profils trouvés (sans les null).
 */
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

/**
 * Transforme un document Firestore "project" en objet projet normalisé.
 * @param {object} data - Données brutes du document Firestore.
 * @returns {object} Projet normalisé.
 */
function mapProjectDoc(data) {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    deadline: data.deadline || null,
    members: data.memberUids || [],
    pendingEmails: data.pendingEmails || [],
    memberRoles: data.memberRoles || {},
    // createdAt est un Timestamp Firestore — on le convertit en ISO string pour éviter
    // les problèmes de sérialisation dans le cache localStorage.
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
  }
}

/**
 * Transforme un document Firestore "task" en objet tâche normalisé.
 * @param {object} data      - Données brutes du document Firestore.
 * @param {number|string} projectId - ID du projet parent.
 * @returns {object} Tâche normalisée.
 */
function mapTaskDoc(data, projectId) {
  return {
    id: data.id,
    projectId,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    deadline: data.deadline,
    assigneeId: data.assigneeUid,  // Renommé : assigneeUid → assigneeId
  }
}

/**
 * Construit la liste des membres à partir des projets de l'utilisateur.
 * Récupère les profils depuis Firestore pour chaque UID unique trouvé dans les projets.
 * Si aucun membre n'est trouvé et que uid est fourni, charge le profil du créateur.
 * @param {object[]} projects
 * @param {string} uid
 * @returns {object[]} Liste de membres { id, name, email, role }.
 */
async function buildMembersFromProjects(projects, uid) {
  // Collecte tous les UIDs uniques présents dans tous les projets.
  const memberUids = Array.from(
    new Set([
      uid, // Inclut toujours l'utilisateur courant.
      ...projects.flatMap((p) => p.members || []),
    ].filter(Boolean)),
  )

  const users = await fetchUsersByUids(memberUids)
  const members = users.map((u) => ({
    id: u.uid,
    name: u.name,
    email: u.email,
    role: u.role || 'Membre',
  }))

  return members
}

/**
 * Crée un projet par défaut "Mon espace" si l'utilisateur n'a aucun projet.
 * Évite que le dashboard soit vide au premier login.
 * @param {string} uid
 * @returns {number|null} ID du projet créé, ou null si l'utilisateur avait déjà des projets.
 */
export async function ensureDefaultProjectForUser(uid) {
  const db = requireDb()
  const projectsQuery = query(collection(db, 'projects'), where('memberUids', 'array-contains', uid))
  const projectsSnap = await getDocs(projectsQuery)
  if (!projectsSnap.empty) return null  // L'utilisateur a déjà des projets.

  const projectId = Date.now()
  await setDoc(doc(db, 'projects', String(projectId)), {
    id: projectId,
    name: 'Mon espace',
    description: 'Projet personnel créé automatiquement',
    memberUids: [uid],
    createdAt: serverTimestamp(),
  })

  return projectId
}

/**
 * Écoute en temps réel les projets, membres et tâches de l'utilisateur.
 * Architecture :
 *   1. Un listener sur la collection "projects" filtrée par UID.
 *   2. Pour chaque projet, un listener sur sa sous-collection "tasks".
 * Retourne une fonction de désabonnement à appeler au démontage du composant.
 *
 * @param {string} uid         - UID de l'utilisateur connecté.
 * @param {Function} onData    - Callback appelé à chaque mise à jour : ({ projects, members, tasks }).
 * @param {Function} onError   - Callback appelé en cas d'erreur Firestore.
 * @returns {Function} Fonction de nettoyage (unsubscribe).
 */
export function subscribeToAppData(uid, onData, onError) {
  const db = requireDb()
  const unsubscribers = []
  let taskUnsubscribers = []

  // Compteur de génération : permet d'ignorer les callbacks obsolètes (race conditions).
  let emitGeneration = 0

  /** Détache et vide tous les listeners de tâches actifs. */
  const cleanupTaskListeners = () => {
    taskUnsubscribers.forEach((unsub) => unsub())
    taskUnsubscribers = []
  }

  /**
   * Reconstruit les listeners de tâches à partir d'une nouvelle liste de projets.
   * @param {import('firebase/firestore').QueryDocumentSnapshot[]} projectDocs
   */
  const emitFromProjects = async (projectDocs) => {
    const generation = ++emitGeneration
    const projects = projectDocs.map((d) => mapProjectDoc(d.data()))

    // Chargement des membres associés aux projets.
    let members = []
    try {
      members = await buildMembersFromProjects(projects, uid)
    } catch (err) {
      onError(err)
      return
    }

    // Si une nouvelle mise à jour a eu lieu pendant le chargement, on abandonne.
    if (generation !== emitGeneration) return

    // Recrée les listeners de tâches pour la nouvelle liste de projets.
    cleanupTaskListeners()
    const tasksById = new Map()  // Clé : "{projectId}-{taskId}"

    /** Émet les données consolidées vers le contexte. */
    const pushData = () => {
      if (generation !== emitGeneration) return
      onData({
        projects,
        members,
        tasks: Array.from(tasksById.values()),
      })
    }

    // Affichage immédiat des projets (sans attendre le chargement des tâches).
    pushData()

    if (projects.length === 0) return

    // Un listener par projet pour ses tâches.
    projects.forEach((project) => {
      const tasksRef = collection(db, 'projects', String(project.id), 'tasks')
      const unsubTasks = onSnapshot(
        tasksRef,
        (tasksSnap) => {
          if (generation !== emitGeneration) return

          // Supprime les tâches obsolètes de ce projet dans la Map.
          Array.from(tasksById.keys())
            .filter((key) => key.startsWith(`${project.id}-`))
            .forEach((key) => tasksById.delete(key))

          // Ajoute les tâches fraîches dans la Map.
          tasksSnap.docs.forEach((t) => {
            const task = mapTaskDoc(t.data(), project.id)
            tasksById.set(`${project.id}-${task.id}`, task)
          })
          pushData()
        },
        () => {
          // En cas d'erreur sur les tâches, on garde quand même les projets visibles.
          pushData()
        },
      )
      taskUnsubscribers.push(unsubTasks)
    })
  }

  // Cas particulier : aucun utilisateur connecté.
  if (!uid) {
    onData({ projects: [], members: [], tasks: [] })
    return () => {}
  }

  // Listener principal sur la collection "projects".
  const projectsQuery = query(collection(db, 'projects'), where('memberUids', 'array-contains', uid))

  const unsubProjects = onSnapshot(
    projectsQuery,
    (projectsSnap) => {
      emitFromProjects(projectsSnap.docs).catch(onError)
    },
    onError,
  )

  unsubscribers.push(unsubProjects)

  // Retourne la fonction de nettoyage globale.
  return () => {
    unsubscribers.forEach((unsub) => unsub())
    cleanupTaskListeners()
  }
}

/**
 * Crée un nouveau projet dans Firestore avec résolution des membres par email.
 * Les emails non trouvés dans Firestore sont placés dans pendingEmails.
 *
 * @param {{ creatorUid, name, description, memberEmails, deadline }}
 * @returns {{ projectId, project, addedMemberCount, pendingEmails, totalMembers, totalWithInvites }}
 */
export async function createProjectFromEmails({
  creatorUid,
  name,
  description,
  memberEmails,
  deadline,
}) {
  const db = requireDb()
  const cleanName = sanitizeText(name, 200)
  if (!cleanName) throw new Error('Nom du groupe manquant.')
  if (!isSafeInput(cleanName)) throw new Error('Le nom contient des caractères non autorisés.')

  const projectId = Date.now()
  // Le créateur est toujours membre.
  const memberUids = new Set([creatorUid])

  // Parse, nettoie et valide la liste d'emails séparés par des virgules.
  const emails = (memberEmails || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && isValidEmail(e))

  const resolvedUsers = []
  const pendingEmails = []

  // Pour chaque email, tente de trouver le compte correspondant dans Firestore.
  for (const email of emails) {
    try {
      const u = await fetchUserByEmail(email)
      if (u?.uid) {
        memberUids.add(u.uid)
        resolvedUsers.push(u)
      } else {
        // Compte introuvable → invitation en attente.
        pendingEmails.push(email)
      }
    } catch {
      pendingEmails.push(email)
    }
  }

  const cleanDeadline = deadline?.trim() || null
  const project = {
    id: projectId,
    name: cleanName,
    description: description || 'Groupe créé depuis la page Équipes',
    deadline: cleanDeadline,
    members: Array.from(memberUids),
    pendingEmails,
  }

  // Sauvegarde dans Firestore.
  await setDoc(doc(db, 'projects', String(projectId)), {
    id: projectId,
    name: cleanName,
    description: project.description,
    ...(cleanDeadline ? { deadline: cleanDeadline } : {}),
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

/**
 * Crée une nouvelle tâche dans la sous-collection "tasks" d'un projet.
 * @param {{ projectId: number|string, task: object }}
 * @returns {number|string} ID de la tâche créée.
 */
export async function createTaskInProject({ projectId, task }) {
  const db = requireDb()
  const taskId = task.id ?? Date.now()
  const cleanTitle = sanitizeText(task.title, 500)
  if (!cleanTitle) throw new Error('Titre de la tâche manquant.')
  if (!isSafeInput(cleanTitle)) throw new Error('Le titre contient des caractères non autorisés.')
  const ref = doc(db, 'projects', String(projectId), 'tasks', String(taskId))
  await setDoc(ref, {
    id: taskId,
    title: cleanTitle,
    description: sanitizeText(task.description || '', 2000),
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    assigneeUid: task.assigneeId,  // Mapping : assigneeId → assigneeUid dans Firestore.
    createdAt: serverTimestamp(),
  })
  return taskId
}

/**
 * Met à jour des champs d'une tâche existante dans Firestore.
 * Gère le renommage assigneeId → assigneeUid et supprime les champs internes.
 * @param {{ projectId, taskId, updates: object }}
 */
export async function updateTaskInProject({ projectId, taskId, updates }) {
  const db = requireDb()
  const ref = doc(db, 'projects', String(projectId), 'tasks', String(taskId))

  const firestoreUpdates = { ...updates }
  // Renomme assigneeId en assigneeUid pour correspondre au schéma Firestore.
  if ('assigneeId' in firestoreUpdates) {
    firestoreUpdates.assigneeUid = firestoreUpdates.assigneeId
    delete firestoreUpdates.assigneeId
  }
  // Supprime les champs internes non stockés dans Firestore.
  delete firestoreUpdates.projectId
  delete firestoreUpdates.id

  await updateDoc(ref, firestoreUpdates)
}

/**
 * Supprime une tâche d'un projet dans Firestore.
 * @param {{ projectId, taskId }}
 */
export async function deleteTaskInProject({ projectId, taskId }) {
  const db = requireDb()
  const ref = doc(db, 'projects', String(projectId), 'tasks', String(taskId))
  await deleteDoc(ref)
}

/**
 * Met à jour les champs d'un projet dans Firestore.
 * Seuls les champs fournis (non undefined) sont mis à jour.
 * La deadline vide est supprimée avec deleteField().
 * @param {{ projectId, name?, description?, deadline?, memberUids?, pendingEmails?, memberRoles? }}
 */
export async function updateProjectInFirestore({ projectId, name, description, deadline, memberUids, pendingEmails, memberRoles }) {
  const db = requireDb()
  const ref = doc(db, 'projects', String(projectId))
  const updates = {}

  if (name !== undefined) {
    const cleanName = name.trim()
    if (!cleanName) throw new Error('Le titre du projet est obligatoire.')
    updates.name = cleanName
  }
  if (description !== undefined) updates.description = description
  if (deadline !== undefined) {
    // Si deadline est vide, on supprime le champ dans Firestore avec deleteField().
    updates.deadline = deadline?.trim() ? deadline.trim() : deleteField()
  }
  if (memberUids !== undefined) updates.memberUids = memberUids
  if (pendingEmails !== undefined) updates.pendingEmails = pendingEmails
  if (memberRoles !== undefined) updates.memberRoles = memberRoles

  await updateDoc(ref, updates)
}

/**
 * Supprime un projet et toutes ses tâches de Firestore.
 * Les tâches sont supprimées en parallèle avant le projet lui-même.
 * @param {{ projectId: number|string }}
 */
export async function deleteProjectInFirestore({ projectId }) {
  const db = requireDb()
  const projectRef = doc(db, 'projects', String(projectId))
  const tasksRef = collection(db, 'projects', String(projectId), 'tasks')

  // Charge toutes les tâches du projet.
  const tasksSnap = await getDocs(tasksRef)

  // Supprime toutes les tâches en parallèle pour optimiser les performances.
  await Promise.all(tasksSnap.docs.map((taskDoc) => deleteDoc(taskDoc.ref)))

  // Supprime ensuite le projet lui-même.
  await deleteDoc(projectRef)
}
