export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 16

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: '8 à 16 caractères minimum',
    test: (password) =>
      password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  },
  { id: 'upper', label: '1 majuscule', test: (password) => /[A-Z]/.test(password) },
  { id: 'lower', label: '1 minuscule', test: (password) => /[a-z]/.test(password) },
  { id: 'digit', label: '1 chiffre', test: (password) => /\d/.test(password) },
  {
    id: 'special',
    label: '1 caractère spécial',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

export function getPasswordChecks(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    valid: rule.test(password),
  }))
}

export function isStrongPassword(password) {
  return getPasswordChecks(password).every((rule) => rule.valid)
}

export function getPasswordErrorMessage(password) {
  const missing = getPasswordChecks(password).filter((rule) => !rule.valid)
  if (missing.length === 0) return null
  return `Mot de passe invalide : ${missing.map((rule) => rule.label).join(', ')}.`
}
