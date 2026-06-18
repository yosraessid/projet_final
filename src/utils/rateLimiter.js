/**
 * rateLimiter.js
 * Utilitaire de rate limiting côté client.
 *
 * Empêche un utilisateur de déclencher une action trop fréquemment
 * (ex : tentatives de connexion répétées, création de projets en masse).
 *
 * Fonctionnement :
 *   - Chaque "clé" identifie une action (ex: 'login', 'createProject').
 *   - On enregistre les timestamps des dernières tentatives dans un Map en mémoire.
 *   - Si le nombre de tentatives dans la fenêtre de temps dépasse le maximum, on bloque.
 *   - La limite se réinitialise automatiquement quand la fenêtre expire.
 *
 * Usage :
 *   const limiter = createRateLimiter({ maxAttempts: 5, windowMs: 60000 })
 *   if (!limiter.isAllowed('login')) {
 *     // bloquer l'action
 *   }
 *   limiter.record('login') // enregistrer une tentative
 *
 *   // Ou en une seule ligne :
 *   if (!limiter.tryConsume('login')) {
 *     // bloqué
 *   }
 */

/**
 * Crée un rate limiter avec une configuration donnée.
 *
 * @param {{ maxAttempts: number, windowMs: number }} options
 *   - maxAttempts : nombre maximum d'actions autorisées dans la fenêtre
 *   - windowMs    : durée de la fenêtre en millisecondes
 * @returns {{ isAllowed, record, tryConsume, reset, getRemainingTime }}
 */
export function createRateLimiter({ maxAttempts, windowMs }) {
  // Map : clé → tableau de timestamps des tentatives récentes.
  const attempts = new Map()

  /**
   * Nettoie les tentatives expirées pour une clé donnée.
   * @param {string} key
   */
  function cleanup(key) {
    const now = Date.now()
    const list = attempts.get(key) || []
    const fresh = list.filter((ts) => now - ts < windowMs)
    if (fresh.length === 0) {
      attempts.delete(key)
    } else {
      attempts.set(key, fresh)
    }
  }

  /**
   * Vérifie si une action est autorisée (sans l'enregistrer).
   * @param {string} key - Identifiant de l'action.
   * @returns {boolean} true si l'action est autorisée.
   */
  function isAllowed(key) {
    cleanup(key)
    const list = attempts.get(key) || []
    return list.length < maxAttempts
  }

  /**
   * Enregistre une tentative pour une clé donnée.
   * @param {string} key
   */
  function record(key) {
    cleanup(key)
    const list = attempts.get(key) || []
    list.push(Date.now())
    attempts.set(key, list)
  }

  /**
   * Tente de consommer un "crédit" pour une clé.
   * Enregistre la tentative ET retourne si elle est autorisée.
   * Pratique pour une vérification + enregistrement en une ligne.
   *
   * @param {string} key
   * @returns {boolean} true si autorisé, false si bloqué.
   */
  function tryConsume(key) {
    if (!isAllowed(key)) return false
    record(key)
    return true
  }

  /**
   * Réinitialise toutes les tentatives pour une clé (ex: après connexion réussie).
   * @param {string} key
   */
  function reset(key) {
    attempts.delete(key)
  }

  /**
   * Retourne le temps restant en secondes avant que la fenêtre expire.
   * Utile pour afficher "Réessayez dans X secondes".
   * @param {string} key
   * @returns {number} secondes restantes (0 si pas de limite active).
   */
  function getRemainingTime(key) {
    cleanup(key)
    const list = attempts.get(key) || []
    if (list.length < maxAttempts) return 0
    const oldest = Math.min(...list)
    const remaining = Math.ceil((oldest + windowMs - Date.now()) / 1000)
    return Math.max(0, remaining)
  }

  return { isAllowed, record, tryConsume, reset, getRemainingTime }
}

/**
 * Instances partagées pour les actions critiques de l'application.
 *
 * login        : 5 tentatives maximum par minute.
 * register     : 3 tentatives maximum par 5 minutes.
 * createProject: 10 projets maximum par minute.
 * resetPassword: 3 demandes maximum par 10 minutes.
 */
export const authLimiter = createRateLimiter({ maxAttempts: 5, windowMs: 60_000 })
export const registerLimiter = createRateLimiter({ maxAttempts: 3, windowMs: 5 * 60_000 })
export const projectLimiter = createRateLimiter({ maxAttempts: 10, windowMs: 60_000 })
export const resetPasswordLimiter = createRateLimiter({ maxAttempts: 3, windowMs: 10 * 60_000 })
