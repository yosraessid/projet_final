/**
 * PasswordRequirements.jsx
 * Affiche en temps réel la liste des règles de validation du mot de passe.
 *
 * Chaque règle est affichée avec :
 *   - ✅ et la classe CSS "password-rule-ok" si la règle est respectée.
 *   - ○ et la classe CSS "password-rule-ko" si la règle n'est pas encore satisfaite.
 *
 * Le composant utilise aria-live="polite" pour annoncer les changements
 * aux lecteurs d'écran sans interrompre la navigation.
 *
 * Props :
 *   - password : valeur courante du champ mot de passe (string, défaut : '')
 */

import { getPasswordChecks } from '../utils/passwordValidation'

/**
 * @param {{ password?: string }} props
 */
function PasswordRequirements({ password = '' }) {
  // Calcule l'état (valide/invalide) de chaque règle pour le mot de passe courant.
  const checks = getPasswordChecks(password)

  return (
    // aria-live="polite" : les mises à jour sont annoncées par les lecteurs d'écran.
    <ul className="password-rules" aria-live="polite">
      {checks.map((rule) => (
        <li key={rule.id} className={rule.valid ? 'password-rule-ok' : 'password-rule-ko'}>
          {/* Icône de statut masquée des lecteurs d'écran (aria-hidden) */}
          <span className="password-rule-icon" aria-hidden="true">
            {rule.valid ? '✅' : '○'}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  )
}

export default PasswordRequirements
