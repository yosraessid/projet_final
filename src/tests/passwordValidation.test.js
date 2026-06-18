/**
 * passwordValidation.test.js
 * Tests unitaires pour les utilitaires de validation du mot de passe.
 *
 * Couvre :
 *   - isStrongPassword() : détecte les mots de passe valides et invalides
 *   - getPasswordChecks() : vérifie chaque règle individuellement
 *   - getPasswordErrorMessage() : retourne null si valide, message sinon
 *   - Constantes : PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH
 */

import { describe, it, expect } from 'vitest'
import {
  isStrongPassword,
  getPasswordChecks,
  getPasswordErrorMessage,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '../utils/passwordValidation'

// ─── isStrongPassword ────────────────────────────────────────────────────────

describe('isStrongPassword', () => {
  it('retourne true pour un mot de passe valide', () => {
    expect(isStrongPassword('Projet@2026')).toBe(true)
  })

  it('retourne true pour un mot de passe avec caractère spécial différent', () => {
    expect(isStrongPassword('Hello#123!')).toBe(true)
  })

  it('retourne false si le mot de passe est trop court (< 8 caractères)', () => {
    expect(isStrongPassword('Ab1!')).toBe(false)
  })

  it('retourne false si le mot de passe est trop long (> 16 caracteres)', () => {
    expect(isStrongPassword('Abcdefgh12345678!')).toBe(false)
  })

  it('retourne false si pas de majuscule', () => {
    expect(isStrongPassword('projet@2026')).toBe(false)
  })

  it('retourne false si pas de minuscule', () => {
    expect(isStrongPassword('PROJET@2026')).toBe(false)
  })

  it('retourne false si pas de chiffre', () => {
    expect(isStrongPassword('Projet@abc')).toBe(false)
  })

  it('retourne false si pas de caractère spécial', () => {
    expect(isStrongPassword('Projet2026')).toBe(false)
  })

  it('retourne false pour une chaîne vide', () => {
    expect(isStrongPassword('')).toBe(false)
  })
})

// ─── getPasswordChecks ───────────────────────────────────────────────────────

describe('getPasswordChecks', () => {
  it('retourne 5 règles', () => {
    const checks = getPasswordChecks('Projet@2026')
    expect(checks).toHaveLength(5)
  })

  it('toutes les règles sont valides pour un bon mot de passe', () => {
    const checks = getPasswordChecks('Projet@2026')
    expect(checks.every((c) => c.valid)).toBe(true)
  })

  it('règle longueur invalide pour mot de passe trop court', () => {
    const checks = getPasswordChecks('Ab1!')
    const lengthRule = checks.find((c) => c.id === 'length')
    expect(lengthRule.valid).toBe(false)
  })

  it('règle majuscule invalide si absent', () => {
    const checks = getPasswordChecks('projet@2026')
    const upperRule = checks.find((c) => c.id === 'upper')
    expect(upperRule.valid).toBe(false)
  })

  it('règle chiffre invalide si absent', () => {
    const checks = getPasswordChecks('Projet@abc')
    const digitRule = checks.find((c) => c.id === 'digit')
    expect(digitRule.valid).toBe(false)
  })

  it('règle spécial invalide si absent', () => {
    const checks = getPasswordChecks('Projet2026')
    const specialRule = checks.find((c) => c.id === 'special')
    expect(specialRule.valid).toBe(false)
  })

  it('chaque règle a les propriétés id, label, valid', () => {
    const checks = getPasswordChecks('Projet@2026')
    checks.forEach((rule) => {
      expect(rule).toHaveProperty('id')
      expect(rule).toHaveProperty('label')
      expect(rule).toHaveProperty('valid')
    })
  })
})

// ─── getPasswordErrorMessage ─────────────────────────────────────────────────

describe('getPasswordErrorMessage', () => {
  it('retourne null pour un mot de passe valide', () => {
    expect(getPasswordErrorMessage('Projet@2026')).toBeNull()
  })

  it('retourne un message pour un mot de passe invalide', () => {
    const msg = getPasswordErrorMessage('faible')
    expect(msg).toBeTypeOf('string')
    expect(msg.length).toBeGreaterThan(0)
  })

  it('le message mentionne les règles manquantes', () => {
    const msg = getPasswordErrorMessage('faible')
    expect(msg).toContain('Mot de passe invalide')
  })
})

// ─── Constantes ──────────────────────────────────────────────────────────────

describe('Constantes de validation', () => {
  it('PASSWORD_MIN_LENGTH vaut 8', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8)
  })

  it('PASSWORD_MAX_LENGTH vaut 16', () => {
    expect(PASSWORD_MAX_LENGTH).toBe(16)
  })

  it('MIN est inférieur à MAX', () => {
    expect(PASSWORD_MIN_LENGTH).toBeLessThan(PASSWORD_MAX_LENGTH)
  })
})
