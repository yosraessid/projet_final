/**
 * NotificationsContext.test.jsx
 * Tests unitaires pour le contexte de notifications.
 *
 * Couvre :
 *   - notify() : ajoute une notification avec les bons champs
 *   - unreadCount : se met à jour correctement
 *   - markAllRead() : passe toutes les notifications à read: true
 *   - clearAll() : vide la liste
 *   - Limite à 20 notifications maximum
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationsProvider, useNotifications } from '../context/NotificationsContext'

// Vide le localStorage avant chaque test pour éviter la contamination
// due à la persistance des notifications entre les tests.
beforeEach(() => {
  localStorage.removeItem('app-notifications')
})

/**
 * Composant de test qui expose les actions du contexte via des boutons.
 */
function TestConsumer() {
  const { items, unreadCount, notify, markAllRead, clearAll } = useNotifications()

  return (
    <div>
      <span data-testid="count">{items.length}</span>
      <span data-testid="unread">{unreadCount}</span>
      <button onClick={() => notify('Titre', 'Message test', 'info')}>
        Ajouter info
      </button>
      <button onClick={() => notify('Succès', 'Opération réussie', 'success')}>
        Ajouter success
      </button>
      <button onClick={markAllRead}>Tout lire</button>
      <button onClick={clearAll}>Effacer tout</button>
      {items.map((n) => (
        <div key={n.id} data-testid={`notif-${n.id}`}>
          <span data-testid="notif-title">{n.title}</span>
          <span data-testid="notif-level">{n.level}</span>
          <span data-testid="notif-read">{n.read ? 'lu' : 'non-lu'}</span>
        </div>
      ))}
    </div>
  )
}

function renderWithProvider() {
  return render(
    <NotificationsProvider>
      <TestConsumer />
    </NotificationsProvider>,
  )
}

// ─── notify() ────────────────────────────────────────────────────────────────

describe('notify()', () => {
  it('ajoute une notification à la liste', async () => {
    renderWithProvider()
    expect(screen.getByTestId('count').textContent).toBe('0')
    await userEvent.click(screen.getByText('Ajouter info'))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('la notification a le bon titre et niveau', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    expect(screen.getByTestId('notif-title').textContent).toBe('Titre')
    expect(screen.getByTestId('notif-level').textContent).toBe('info')
  })

  it('la nouvelle notification est non lue par défaut', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    expect(screen.getByTestId('notif-read').textContent).toBe('non-lu')
  })

  it('incrémente le compteur de non-lus', async () => {
    renderWithProvider()
    expect(screen.getByTestId('unread').textContent).toBe('0')
    await userEvent.click(screen.getByText('Ajouter info'))
    expect(screen.getByTestId('unread').textContent).toBe('1')
    await userEvent.click(screen.getByText('Ajouter success'))
    expect(screen.getByTestId('unread').textContent).toBe('2')
  })

  it('ajoute la notification en tête de liste (la plus récente en premier)', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    await userEvent.click(screen.getByText('Ajouter success'))
    const titles = screen.getAllByTestId('notif-title')
    expect(titles[0].textContent).toBe('Succès')
  })
})

// ─── markAllRead() ────────────────────────────────────────────────────────────

describe('markAllRead()', () => {
  it('passe toutes les notifications à read: true', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    await userEvent.click(screen.getByText('Ajouter success'))
    await userEvent.click(screen.getByText('Tout lire'))
    const readStates = screen.getAllByTestId('notif-read')
    readStates.forEach((el) => expect(el.textContent).toBe('lu'))
  })

  it('remet le compteur de non-lus à 0', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    await userEvent.click(screen.getByText('Tout lire'))
    expect(screen.getByTestId('unread').textContent).toBe('0')
  })
})

// ─── clearAll() ───────────────────────────────────────────────────────────────

describe('clearAll()', () => {
  it('vide complètement la liste', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    await userEvent.click(screen.getByText('Ajouter success'))
    expect(screen.getByTestId('count').textContent).toBe('2')
    await userEvent.click(screen.getByText('Effacer tout'))
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('remet le compteur de non-lus à 0', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    await userEvent.click(screen.getByText('Effacer tout'))
    expect(screen.getByTestId('unread').textContent).toBe('0')
  })
})

// ─── Limite 20 notifications ──────────────────────────────────────────────────

describe('Limite de 20 notifications', () => {
  it('ne dépasse pas 20 notifications', async () => {
    renderWithProvider()
    const btn = screen.getByText('Ajouter info')
    for (let i = 0; i < 25; i++) {
      await userEvent.click(btn)
    }
    expect(Number(screen.getByTestId('count').textContent)).toBeLessThanOrEqual(20)
  })
})
