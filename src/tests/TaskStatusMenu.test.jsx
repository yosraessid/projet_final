/**
 * TaskStatusMenu.test.jsx
 * Tests unitaires pour le composant TaskStatusMenu.
 *
 * Couvre :
 *   - Affichage du statut courant sur le bouton déclencheur
 *   - Ouverture/fermeture du menu déroulant
 *   - Sélection d'un nouveau statut → appel de onChange
 *   - Pas d'appel de onChange si on clique sur le statut déjà sélectionné
 *   - Fermeture avec la touche Escape
 *   - Bouton désactivé quand disabled=true
 *   - Les 3 options sont affichées dans le menu
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskStatusMenu from '../components/TaskStatusMenu'

function renderMenu(props = {}) {
  const defaults = { status: 'A faire', onChange: vi.fn() }
  return render(<TaskStatusMenu {...defaults} {...props} />)
}

// ─── Rendu initial ────────────────────────────────────────────────────────────

describe('TaskStatusMenu — rendu initial', () => {
  it('affiche le label du statut courant sur le bouton', () => {
    renderMenu({ status: 'A faire' })
    expect(screen.getByRole('button', { name: /À faire/i })).toBeInTheDocument()
  })

  it('affiche "En cours" pour le statut En cours', () => {
    renderMenu({ status: 'En cours' })
    expect(screen.getByRole('button', { name: /En cours/i })).toBeInTheDocument()
  })

  it('affiche "Terminé" pour le statut Terminee', () => {
    renderMenu({ status: 'Terminee' })
    expect(screen.getByRole('button', { name: /Terminé/i })).toBeInTheDocument()
  })

  it('le menu est ferme par defaut (listbox absent)', () => {
    renderMenu()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Ouverture / fermeture ────────────────────────────────────────────────────

describe('TaskStatusMenu — ouverture et fermeture', () => {
  it('ouvre le menu apres un clic sur le bouton', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('affiche les 3 options dans le menu ouvert', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button'))
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
  })

  it('ferme le menu avec la touche Escape', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ferme le menu apres selection d une option', async () => {
    renderMenu({ status: 'A faire' })
    await userEvent.click(screen.getByRole('button'))
    // Clique sur le bouton interne "En cours"
    await userEvent.click(screen.getByRole('button', { name: /En cours/i }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Sélection ────────────────────────────────────────────────────────────────

describe('TaskStatusMenu — selection', () => {
  it('appelle onChange avec la nouvelle valeur', async () => {
    const onChange = vi.fn()
    renderMenu({ status: 'A faire', onChange })
    await userEvent.click(screen.getByRole('button'))
    // Clique sur l'option "En cours"
    await userEvent.click(screen.getByRole('button', { name: /En cours/i }))
    expect(onChange).toHaveBeenCalledWith('En cours')
  })

  it('appelle onChange avec "Terminee" quand on clique sur Termine', async () => {
    const onChange = vi.fn()
    renderMenu({ status: 'A faire', onChange })
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByRole('button', { name: /Terminé/i }))
    expect(onChange).toHaveBeenCalledWith('Terminee')
  })

  it("n'appelle pas onChange si on clique sur le statut deja selectionne", async () => {
    const onChange = vi.fn()
    renderMenu({ status: 'A faire', onChange })
    await userEvent.click(screen.getByRole('button'))
    // Clique sur "À faire" qui est déjà le statut actuel
    const options = screen.getAllByRole('option')
    await userEvent.click(options[0])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('marque l option courante comme selectionnee (aria-selected)', async () => {
    renderMenu({ status: 'En cours' })
    await userEvent.click(screen.getByRole('button'))
    const selectedOption = screen.getByRole('option', { name: /En cours/i })
    expect(selectedOption).toHaveAttribute('aria-selected', 'true')
  })
})

// ─── Disabled ─────────────────────────────────────────────────────────────────

describe('TaskStatusMenu — disabled', () => {
  it('le bouton est desactive quand disabled=true', () => {
    renderMenu({ disabled: true })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('le menu ne s ouvre pas quand disabled=true', async () => {
    renderMenu({ disabled: true })
    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Accessibilité ────────────────────────────────────────────────────────────

describe('TaskStatusMenu — accessibilite', () => {
  it('le bouton a aria-haspopup="listbox"', () => {
    renderMenu()
    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('aria-expanded est false quand le menu est ferme', () => {
    renderMenu()
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('aria-expanded est true quand le menu est ouvert', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
  })
})
