/**
 * NewProjectModal.jsx
 * Modal de création d'un nouveau projet.
 *
 * Champs du formulaire :
 *   - Titre du projet (obligatoire)
 *   - Description (optionnelle)
 *   - Date limite / deadline (optionnelle)
 *
 * Comportement :
 *   - Le formulaire est réinitialisé à chaque ouverture (useEffect sur `open`).
 *   - Fermeture possible : clic sur le bouton "×", bouton "Annuler", clic sur le backdrop,
 *     ou touche Escape — sauf si une soumission est en cours (isSubmitting).
 *   - La soumission appelle onSubmit({ title, description, deadline }).
 *
 * Props :
 *   - open         : boolean — contrôle la visibilité de la modal
 *   - onClose      : () => void — appelé pour fermer la modal
 *   - onSubmit     : ({ title, description, deadline }) => void
 *   - isSubmitting : boolean — désactive les boutons pendant la création
 *
 * Accessibilité :
 *   - role="dialog", aria-modal="true", aria-labelledby sur la modal.
 *   - autoFocus sur le champ titre à l'ouverture.
 */

import { useEffect, useState } from 'react'

/** Valeurs initiales du formulaire — utilisées aussi pour le reset. */
const emptyForm = {
  title: '',
  description: '',
  deadline: '',
}

/**
 * @param {{ open, onClose, onSubmit, isSubmitting }} props
 */
function NewProjectModal({ open, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState(emptyForm)

  // Réinitialise le formulaire à chaque fermeture de la modal.
  useEffect(() => {
    if (!open) setForm(emptyForm)
  }, [open])

  // Ne rend rien si la modal est fermée.
  if (!open) return null

  /**
   * Met à jour un champ du formulaire par son nom.
   * @param {'title'|'description'|'deadline'} field
   * @param {string} value
   */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /**
   * Soumet le formulaire : nettoie les espaces et appelle onSubmit.
   */
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline,
    })
  }

  /**
   * Ferme la modal si on clique sur le backdrop (en dehors de la carte).
   * Ne ferme pas si une soumission est en cours.
   */
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) onClose()
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={handleBackdropClick}
      // Fermeture clavier : touche Escape
      onKeyDown={(e) => e.key === 'Escape' && !isSubmitting && onClose()}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
      >
        {/* En-tête de la modal */}
        <header className="modal-header">
          <h2 id="new-project-title">Nouveau projet</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        {/* Formulaire de création */}
        <form className="form modal-form" onSubmit={handleSubmit}>
          {/* Champ titre — obligatoire, avec focus automatique à l'ouverture */}
          <label>
            Titre du projet
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Entrez le titre du projet"
              required
              autoFocus
            />
          </label>

          {/* Champ description — optionnel */}
          <label>
            Description
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Décrivez votre projet..."
            />
          </label>

          {/* Champ date limite — optionnel */}
          <label>
            Limite de date
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
            />
          </label>

          {/* Pied de la modal : boutons Annuler et Créer */}
          <footer className="modal-footer">
            <button
              type="button"
              className="button button-light"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer le projet'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

export default NewProjectModal
