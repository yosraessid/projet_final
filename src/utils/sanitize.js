/**
 * sanitize.js
 * Utilitaires de nettoyage des entrées utilisateur.
 *
 * Protection contre :
 *   - Injection de scripts HTML/JS (XSS)
 *   - Caractères de contrôle invisibles
 *   - Espaces excessifs
 *
 * Utilisation :
 *   import { sanitizeText } from '../utils/sanitize'
 *   const cleanTitle = sanitizeText(userInput)
 */

/**
 * Échappe les caractères HTML dangereux pour prévenir les attaques XSS.
 * Remplace < > & " ' par leurs entités HTML.
 * @param {string} text - Texte brut à nettoyer.
 * @returns {string} Texte sécurisé.
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Supprime les caractères de contrôle invisibles (sauf les retours à la ligne).
 * @param {string} text
 * @returns {string}
 */
export function removeControlChars(text) {
  if (!text || typeof text !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Nettoie un texte utilisateur : supprime les caractères de contrôle,
 * normalise les espaces multiples, et trim.
 * Ne supprime PAS le HTML (React fait déjà l'échappement au rendu).
 * @param {string} text - Entrée utilisateur brute.
 * @param {number} maxLength - Longueur maximale autorisée (défaut: 500).
 * @returns {string} Texte nettoyé et tronqué si nécessaire.
 */
export function sanitizeText(text, maxLength = 500) {
  if (!text || typeof text !== 'string') return ''
  let clean = removeControlChars(text)
  // Normalise les espaces multiples en un seul espace.
  clean = clean.replace(/\s{3,}/g, '  ')
  // Trim les extrémités.
  clean = clean.trim()
  // Tronque si trop long.
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength)
  }
  return clean
}

/**
 * Valide qu'une entrée ne contient pas de patterns d'injection suspects.
 * @param {string} text
 * @returns {boolean} true si le texte semble sûr.
 */
export function isSafeInput(text) {
  if (!text) return true
  // Détecte les tentatives d'injection de script.
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,      // onclick=, onerror=, etc.
    /data:text\/html/i,
  ]
  return !dangerousPatterns.some((pattern) => pattern.test(text))
}
