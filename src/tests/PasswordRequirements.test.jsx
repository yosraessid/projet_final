/**
 * PasswordRequirements.test.jsx
 * Tests unitaires pour le composant PasswordRequirements.
 *
 * Couvre :
 *   - Affichage des 5 règles
 *   - Statut visuel (ok/ko) selon le mot de passe
 *   - Mise à jour en temps réel lors du changement du prop password
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PasswordRequirements from '../components/PasswordRequirements'

describe('PasswordRequirements', () => {
  it('affiche 5 règles de validation', () => {
    render(<PasswordRequirements password="" />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(5)
  })

  it('affiche toutes les règles en ko pour un mot de passe vide', () => {
    render(<PasswordRequirements password="" />)
    const items = screen.getAllByRole('listitem')
    items.forEach((item) => {
      expect(item.className).toContain('password-rule-ko')
    })
  })

  it('affiche toutes les règles en ok pour un mot de passe valide', () => {
    render(<PasswordRequirements password="Projet@2026" />)
    const items = screen.getAllByRole('listitem')
    items.forEach((item) => {
      expect(item.className).toContain('password-rule-ok')
    })
  })

  it('affiche la règle longueur en ok pour 8+ caractères valides', () => {
    render(<PasswordRequirements password="Projet@2026" />)
    expect(screen.getByText('8 à 16 caractères minimum').closest('li').className).toContain('password-rule-ok')
  })

  it('affiche la règle majuscule en ko si absente', () => {
    render(<PasswordRequirements password="projet@2026" />)
    expect(screen.getByText('1 majuscule').closest('li').className).toContain('password-rule-ko')
  })

  it('affiche la règle chiffre en ko si absent', () => {
    render(<PasswordRequirements password="Projet@abc" />)
    expect(screen.getByText('1 chiffre').closest('li').className).toContain('password-rule-ko')
  })

  it('affiche la règle spécial en ko si absent', () => {
    render(<PasswordRequirements password="Projet2026" />)
    expect(screen.getByText('1 caractère spécial').closest('li').className).toContain('password-rule-ko')
  })

  it('se met à jour quand le prop password change', () => {
    const { rerender } = render(<PasswordRequirements password="" />)
    let items = screen.getAllByRole('listitem')
    expect(items.every((i) => i.className.includes('password-rule-ko'))).toBe(true)

    rerender(<PasswordRequirements password="Projet@2026" />)
    items = screen.getAllByRole('listitem')
    expect(items.every((i) => i.className.includes('password-rule-ok'))).toBe(true)
  })

  it("a aria-live='polite' pour les lecteurs d'ecran", () => {
    render(<PasswordRequirements password="" />)
    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite')
  })
})
