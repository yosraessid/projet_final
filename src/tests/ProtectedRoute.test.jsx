/**
 * ProtectedRoute.test.jsx
 * Tests unitaires pour le composant ProtectedRoute.
 *
 * Couvre :
 *   - Affiche "Chargement..." pendant la vérification de session (loading=true)
 *   - Redirige vers /auth si non connecté (loading=false, isLoggedIn=false)
 *   - Rend les enfants si connecté (loading=false, isLoggedIn=true)
 *
 * Stratégie : mock de AuthContext pour contrôler les états sans Firebase.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'

// Mock du module AuthContext — on contrôle isLoggedIn et loading.
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'

/** Helper : rend ProtectedRoute dans un routeur mémoire. */
function renderProtected({ isLoggedIn, loading, children = <p>Contenu protege</p> }) {
  useAuth.mockReturnValue({ isLoggedIn, loading })
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={<ProtectedRoute>{children}</ProtectedRoute>}
        />
        <Route path="/auth" element={<p>Page auth</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ─── État chargement ──────────────────────────────────────────────────────────

describe('ProtectedRoute — chargement', () => {
  it('affiche "Chargement..." pendant la verification de session', () => {
    renderProtected({ isLoggedIn: false, loading: true })
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it("n'affiche pas le contenu pendant le chargement", () => {
    renderProtected({ isLoggedIn: false, loading: true })
    expect(screen.queryByText('Contenu protege')).not.toBeInTheDocument()
  })

  it("n'affiche pas la page auth pendant le chargement", () => {
    renderProtected({ isLoggedIn: false, loading: true })
    expect(screen.queryByText('Page auth')).not.toBeInTheDocument()
  })
})

// ─── Non connecté ─────────────────────────────────────────────────────────────

describe('ProtectedRoute — non connecte', () => {
  it('redirige vers /auth si non connecte', () => {
    renderProtected({ isLoggedIn: false, loading: false })
    expect(screen.getByText('Page auth')).toBeInTheDocument()
  })

  it("n'affiche pas le contenu si non connecte", () => {
    renderProtected({ isLoggedIn: false, loading: false })
    expect(screen.queryByText('Contenu protege')).not.toBeInTheDocument()
  })
})

// ─── Connecté ─────────────────────────────────────────────────────────────────

describe('ProtectedRoute — connecte', () => {
  it('affiche les enfants si connecte', () => {
    renderProtected({ isLoggedIn: true, loading: false })
    expect(screen.getByText('Contenu protege')).toBeInTheDocument()
  })

  it("n'affiche pas la page auth si connecte", () => {
    renderProtected({ isLoggedIn: true, loading: false })
    expect(screen.queryByText('Page auth')).not.toBeInTheDocument()
  })

  it("n'affiche pas le message de chargement si connecte", () => {
    renderProtected({ isLoggedIn: true, loading: false })
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
  })

  it('affiche le contenu enfant personnalise', () => {
    renderProtected({
      isLoggedIn: true,
      loading: false,
      children: <div data-testid="page-dashboard">Dashboard</div>,
    })
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument()
  })
})
