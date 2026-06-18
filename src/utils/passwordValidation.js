/**
 * passwordValidation.js
 * Utilitaires de validation du mot de passe.
 *
 * Règles appliquées :
 *   - Entre 8 et 16 caractères
 *   - Au moins 1 lettre majuscule
 *   - Au moins 1 lettre minuscule
 *   - Au moins 1 chiffre
 *   - Au moins 1 caractère spécial (non alphanumérique)
 *
 * Fonctions exportées :
 *   - getPasswordChecks(password)    : retourne le résultat de chaque règle
 *   - isStrongPassword(password)     : true si toutes les règles sont respectées
 *   - getPasswordErrorMessage(pass)  : message d'erreur lisible, ou null si valide
 */

/** Longueur minimale acceptée pour un mot de passe. */
export const PASSWORD_MIN_LENGTH = 8

/** Longueur maximale acceptée pour un mot de passe. */
export const PASSWORD_MAX_LENGTH = 16

/**
 * Tableau des règles de validation du mot de passe.
 * Chaque règle contient :
 *   - id     : identifiant unique de la règle
 *   - label  : description lisible par l'utilisateur
 *   - test   : fonction (password: string) => boolean
 */
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: '8 à 16 caractères minimum',
    test: (password) =>
      password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: 'upper',
    label: '1 majuscule',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lower',
    label: '1 minuscule',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'digit',
    label: '1 chiffre',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: '1 caractère spécial',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

/**
 * Évalue chaque règle de validation pour le mot de passe donné.
 * @param {string} password - Le mot de passe à vérifier.
 * @returns {Array<{id: string, label: string, valid: boolean}>}
 *   Tableau de règles enrichi d'un booléen `valid`.
 */
export function getPasswordChecks(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    valid: rule.test(password),
  }))
}

/**
 * Vérifie si le mot de passe respecte toutes les règles de sécurité.
 * @param {string} password
 * @returns {boolean} true si le mot de passe est fort.
 */
export function isStrongPassword(password) {
  return getPasswordChecks(password).every((rule) => rule.valid)
}

/**
 * Génère un message d'erreur listant les règles non respectées.
 * @param {string} password
 * @returns {string|null} Message d'erreur lisible, ou null si le mot de passe est valide.
 */
export function getPasswordErrorMessage(password) {
  const missing = getPasswordChecks(password).filter((rule) => !rule.valid)
  if (missing.length === 0) return null
  return `Mot de passe invalide : ${missing.map((rule) => rule.label).join(', ')}.`
}
