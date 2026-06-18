/**
 * PasswordInput.test.jsx
 * Tests unitaires pour le composant PasswordInput.
 *
 * Couvre :
 *   - Rendu par défaut : type="password", placeholder par défaut
 *   - Bouton toggle : bascule entre password et text
 *   - aria-label du bouton selon l'état visible/masqué
 *   - Props : placeholder, maxLength, autoComplete, id
 *   - Appel du handler onChange
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PasswordInput from '../components/PasswordInput'

function renderInput(props = {}) {
  const defaults = { value: '', onChange: vi.fn() }
  return render(<PasswordInput {...defaults} {...props} />)
}

// ─── Rendu initial ────────────────────────────────────────────────────────────

describe('PasswordInput — rendu initial', () => {
  it('affiche un champ de type password par defaut', () => {
    renderInput()
    const input = document.querySelector('input')
    expect(input.type).toBe('password')
  })

  it('affiche le placeholder par defaut "********"', () => {
    renderInput()
    expect(document.querySelector('input').placeholder).toBe('********')
  })

  it('affiche un placeholder personnalise', () => {
    renderInput({ placeholder: 'Entrez votre mot de passe' })
    expect(document.querySelector('input').placeholder).toBe('Entrez votre mot de passe')
  })

  it('affiche le bouton "Afficher le mot de passe"', () => {
    renderInput()
    expect(screen.getByRole('button', { name: 'Afficher le mot de passe' })).toBeInTheDocument()
  })
})

// ─── Toggle visibilité ────────────────────────────────────────────────────────

describe('PasswordInput — toggle visibilite', () => {
  it('passe le type a "text" apres un clic sur le bouton', async () => {
    renderInput()
    const btn = screen.getByRole('button', { name: 'Afficher le mot de passe' })
    await userEvent.click(btn)
    expect(document.querySelector('input').type).toBe('text')
  })

  it('repasse a "password" apres un second clic', async () => {
    renderInput()
    const btn = screen.getByRole('button')
    await userEvent.click(btn)
    await userEvent.click(btn)
    expect(document.querySelector('input').type).toBe('password')
  })

  it('change aria-label en "Masquer le mot de passe" apres le clic', async () => {
    renderInput()
    const btn = screen.getByRole('button', { name: 'Afficher le mot de passe' })
    await userEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toBeInTheDocument()
  })

  it('remet aria-label a "Afficher le mot de passe" apres le second clic', async () => {
    renderInput()
    const btn = screen.getByRole('button')
    await userEvent.click(btn)
    await userEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Afficher le mot de passe' })).toBeInTheDocument()
  })
})

// ─── Props ────────────────────────────────────────────────────────────────────

describe('PasswordInput — props', () => {
  it('applique maxLength sur le champ', () => {
    renderInput({ maxLength: 16 })
    expect(document.querySelector('input').maxLength).toBe(16)
  })

  it('applique autoComplete sur le champ', () => {
    renderInput({ autoComplete: 'new-password' })
    expect(document.querySelector('input').autocomplete).toBe('new-password')
  })

  it('applique id sur le champ', () => {
    renderInput({ id: 'mon-champ' })
    expect(document.querySelector('input').id).toBe('mon-champ')
  })

  it('affiche la valeur passee en prop', () => {
    renderInput({ value: 'secret123' })
    expect(document.querySelector('input').value).toBe('secret123')
  })
})

// ─── onChange ─────────────────────────────────────────────────────────────────

describe('PasswordInput — onChange', () => {
  it('appelle onChange quand on tape dans le champ', async () => {
    const onChange = vi.fn()
    render(<PasswordInput value="" onChange={onChange} />)
    const input = document.querySelector('input')
    await userEvent.type(input, 'a')
    expect(onChange).toHaveBeenCalled()
  })
})
