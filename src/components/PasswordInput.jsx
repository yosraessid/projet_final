/**
 * PasswordInput.jsx
 * Champ de saisie de mot de passe avec bouton de visibilité (afficher/masquer).
 *
 * Props :
 *   - value        : valeur contrôlée du champ (string)
 *   - onChange     : handler onChange (event) => void
 *   - placeholder  : texte placeholder (défaut : '********')
 *   - maxLength    : longueur maximale (optionnel)
 *   - autoComplete : valeur de l'attribut autocomplete (défaut : 'current-password')
 *   - id           : id HTML de l'input (optionnel, pour les labels)
 *
 * Accessibilité :
 *   - Le bouton toggle a un aria-label qui change selon l'état visible/masqué.
 *   - Les icônes SVG ont aria-hidden="true" pour ne pas être lues par les lecteurs d'écran.
 */

import { useState } from 'react'

/**
 * @param {{ value, onChange, placeholder?, maxLength?, autoComplete?, id? }} props
 */
function PasswordInput({
  value,
  onChange,
  placeholder = '********',
  maxLength,
  autoComplete = 'current-password',
  id,
}) {
  // État local : true = mot de passe visible (type="text"), false = masqué (type="password").
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input-wrap">
      {/* Champ de saisie — bascule entre text et password selon l'état */}
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />

      {/* Bouton pour afficher ou masquer le mot de passe */}
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        title={visible ? 'Masquer' : 'Afficher'}
      >
        {visible ? (
          // Icône "œil barré" — mot de passe visible → clic pour masquer.
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7-1.02 2.28-2.78 4.2-4.97 5.45M6.11 6.11C4.18 7.38 2.71 9.16 2 11c1.73 3.89 6 7 10 7 1.28 0 2.5-.27 3.61-.76"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Icône "œil ouvert" — mot de passe masqué → clic pour afficher.
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default PasswordInput
