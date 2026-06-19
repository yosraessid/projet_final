/**
 * securityLogger.js
 * Logger d'événements de sécurité côté client.
 *
 * Enregistre les actions sensibles dans localStorage pour l'audit :
 *   - Tentatives de connexion (réussies et échouées)
 *   - Tentatives de connexion bloquées par le rate limiter
 *   - Modifications de profil
 *   - Suppression de projets
 *
 * En production, ces logs seraient envoyés à un service de monitoring
 * (Firebase Analytics, Sentry, etc.). Pour le PFE, on les stocke localement.
 *
 * Limite : 100 entrées maximum (FIFO — les plus anciennes sont supprimées).
 */

const STORAGE_KEY = 'security-audit-log'
const MAX_ENTRIES = 100

/**
 * Lit le journal d'audit depuis localStorage.
 * @returns {object[]}
 */
function readLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Écrit le journal d'audit dans localStorage.
 * @param {object[]} entries
 */
function writeLog(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Quota dépassé : on ignore.
  }
}

/**
 * Enregistre un événement de sécurité.
 * @param {'login_success'|'login_failed'|'login_blocked'|'register_success'|'register_failed'|'profile_update'|'project_delete'|'suspicious_input'} action
 * @param {object} details - Détails de l'événement (email, IP, raison, etc.)
 */
export function logSecurityEvent(action, details = {}) {
  const entry = {
    action,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent?.slice(0, 100),
    ...details,
  }

  const log = readLog()
  log.unshift(entry)

  // Limite à MAX_ENTRIES pour éviter une fuite mémoire.
  writeLog(log.slice(0, MAX_ENTRIES))

  // En développement, affiche aussi dans la console pour le debug.
  if (import.meta.env.DEV) {
    console.info(`[SECURITY] ${action}`, details)
  }
}

/**
 * Récupère les derniers événements de sécurité.
 * @param {number} count - Nombre d'entrées à retourner (défaut: 20).
 * @returns {object[]}
 */
export function getSecurityLog(count = 20) {
  return readLog().slice(0, count)
}

/**
 * Vide le journal d'audit.
 */
export function clearSecurityLog() {
  localStorage.removeItem(STORAGE_KEY)
}
