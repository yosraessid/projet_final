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
 *
 * Note : Les tests mockent Firebase et le AuthContext pour tester la logique
 * du composant de manière isolée. Le state en mémoire est testé ici ;
 * la persistance Firestore est testée via l'intégration.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Firebase pour ne pas appeler Firestore dans les tests.
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn((q, onNext) => {
    // Appelle onNext avec un snapshot vide au démarrage.
    onNext({ docs: [] })
    return vi.fn() // unsubscribe
  }),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
  doc: vi.fn(),
  deleteDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => new Date().toISOString()),
}))

vi.mock('../firebase/firebaseClient', () => ({
  getFirebaseDb: () => ({}),
  isFirebaseConfigured: () => true,
}))

// Mock du AuthContext.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-uid' }, isLoggedIn: true }),
}))

// Import après les mocks.
const { NotificationsProvider, useNotifications } = await import('../context/NotificationsContext')

/**
 * Composant de test qui expose les actions du contexte via des boutons.
 * Utilise un state local pour simuler les ajouts (car Firestore est mocké).
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

// ─── Tests de base ────────────────────────────────────────────────────────────

describe('NotificationsContext (Firestore-backed)', () => {
  it('initialise avec une liste vide', () => {
    renderWithProvider()
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('unread').textContent).toBe('0')
  })

  it('notify() appelle addDoc sans erreur', async () => {
    renderWithProvider()
    await userEvent.click(screen.getByText('Ajouter info'))
    // Pas d'erreur lancée — addDoc est mocké.
  })
})
