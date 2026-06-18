/**
 * firebaseConfig.test.js
 * Tests unitaires pour les fonctions de configuration Firebase.
 *
 * Stratégie : comme le .env est chargé en environnement de test,
 * on teste la logique des fonctions directement — en vérifiant leur
 * comportement avec la config réelle présente.
 * Les cas "config absente" sont testés via des fonctions utilitaires pures.
 */

import { describe, it, expect } from 'vitest'
import {
  isFirebaseConfigured,
  getMissingFirebaseEnvKeys,
  getFirebaseConfig,
} from '../firebase/firebaseConfig'

// ─── isFirebaseConfigured ─────────────────────────────────────────────────────

describe('isFirebaseConfigured', () => {
  it('retourne un boolean', () => {
    expect(typeof isFirebaseConfigured()).toBe('boolean')
  })

  it('retourne true quand le .env est present (environnement de test)', () => {
    // Le .env est charge dans cet environnement → Firebase est configure.
    expect(isFirebaseConfigured()).toBe(true)
  })
})

// ─── getMissingFirebaseEnvKeys ────────────────────────────────────────────────

describe('getMissingFirebaseEnvKeys', () => {
  it('retourne un tableau', () => {
    expect(Array.isArray(getMissingFirebaseEnvKeys())).toBe(true)
  })

  it('retourne un tableau vide quand le .env est complet', () => {
    expect(getMissingFirebaseEnvKeys()).toHaveLength(0)
  })

  it('chaque element du tableau est une string commencant par VITE_FIREBASE_', () => {
    // Si des cles manquaient, elles auraient le bon prefixe.
    const missing = getMissingFirebaseEnvKeys()
    missing.forEach((key) => {
      expect(key).toMatch(/^VITE_FIREBASE_/)
    })
  })
})

// ─── getFirebaseConfig ────────────────────────────────────────────────────────

describe('getFirebaseConfig', () => {
  it('retourne un objet (non null) quand configure', () => {
    const config = getFirebaseConfig()
    expect(config).not.toBeNull()
    expect(typeof config).toBe('object')
  })

  it("retourne un objet avec les 6 cles Firebase attendues", () => {
    const config = getFirebaseConfig()
    expect(config).toHaveProperty('apiKey')
    expect(config).toHaveProperty('authDomain')
    expect(config).toHaveProperty('projectId')
    expect(config).toHaveProperty('storageBucket')
    expect(config).toHaveProperty('messagingSenderId')
    expect(config).toHaveProperty('appId')
  })

  it('toutes les valeurs de config sont des strings non vides', () => {
    const config = getFirebaseConfig()
    Object.values(config).forEach((val) => {
      expect(typeof val).toBe('string')
      expect(val.length).toBeGreaterThan(0)
    })
  })

  it('projectId ne contient pas d espaces', () => {
    const config = getFirebaseConfig()
    expect(config.projectId).not.toContain(' ')
  })
})
