/**
 * TaskStatusMenu.jsx
 * Menu déroulant pour changer le statut d'une tâche.
 *
 * Statuts disponibles :
 *   - 'A faire'  → rouge
 *   - 'En cours' → orange
 *   - 'Terminee' → vert
 *
 * Comportement :
 *   - Affiche un bouton stylisé selon le statut courant.
 *   - Ouvre une liste déroulante (role="listbox") au clic.
 *   - Ferme la liste si on clique en dehors (mousedown sur document) ou avec Escape.
 *   - Appelle onChange(newStatus) uniquement si le statut change réellement.
 *
 * Props :
 *   - status   : statut courant de la tâche (string)
 *   - onChange : callback appelé avec le nouveau statut (string) => void
 *   - disabled : désactive le bouton (boolean, défaut : false)
 *   - compact  : réduit la taille du déclencheur (boolean, défaut : false)
 *
 * Accessibilité :
 *   - aria-haspopup="listbox", aria-expanded, aria-controls sur le bouton.
 *   - role="listbox" sur la liste, role="option" et aria-selected sur chaque option.
 *   - useId() pour un ID unique du menu (important en cas de multiples instances).
 */

import { useEffect, useId, useRef, useState } from 'react'

/** Options de statut disponibles avec leur libellé et classe CSS. */
export const TASK_STATUS_OPTIONS = [
  { value: 'A faire',  label: 'À faire',  optionClass: 'status-menu-option-todo' },
  { value: 'En cours', label: 'En cours', optionClass: 'status-menu-option-progress' },
  { value: 'Terminee', label: 'Terminé',  optionClass: 'status-menu-option-done' },
]

/**
 * Retourne la classe CSS du bouton déclencheur selon le statut courant.
 * @param {string} status
 * @returns {string}
 */
function statusTriggerClass(status) {
  if (status === 'Terminee') return 'status-trigger-done'
  if (status === 'En cours') return 'status-trigger-progress'
  return 'status-trigger-todo'
}

/**
 * @param {{ status, onChange, disabled?, compact? }} props
 */
function TaskStatusMenu({ status, onChange, disabled = false, compact = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // Génère un ID unique pour lier le bouton à sa liste (aria-controls).
  const menuId = useId()

  // Trouve l'option correspondant au statut courant (fallback sur la première option).
  const current =
    TASK_STATUS_OPTIONS.find((o) => o.value === status) || TASK_STATUS_OPTIONS[0]

  // Gestion de la fermeture du menu : clic extérieur ou touche Escape.
  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      // Ferme si le clic est en dehors du composant.
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  /**
   * Sélectionne un statut, notifie le parent si le statut change, puis ferme le menu.
   * @param {string} value - Nouveau statut sélectionné.
   */
  const handleSelect = (value) => {
    if (value !== status) onChange(value)
    setOpen(false)
  }

  return (
    <div
      className={`task-status-menu ${compact ? 'task-status-menu-compact' : ''}`}
      ref={rootRef}
    >
      {/* Bouton déclencheur — stylisé selon le statut courant */}
      <button
        type="button"
        className={`task-status-trigger ${statusTriggerClass(status)}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
      >
        {current.label}
        {/* Chevron indicateur de menu déroulant */}
        <span className="task-status-chevron" aria-hidden="true">▾</span>
      </button>

      {/* Liste déroulante des statuts */}
      {open && (
        <ul className="task-status-dropdown" id={menuId} role="listbox">
          {TASK_STATUS_OPTIONS.map((option) => {
            const selected = option.value === status
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`task-status-option ${option.optionClass} ${
                    selected ? 'task-status-option-selected' : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {/* Coche de sélection — visible uniquement pour l'option active */}
                  <span className="task-status-check" aria-hidden="true">
                    {selected ? '✓' : ''}
                  </span>
                  <span>{option.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default TaskStatusMenu
