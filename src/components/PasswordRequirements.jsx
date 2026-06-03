import { getPasswordChecks } from '../utils/passwordValidation'

function PasswordRequirements({ password = '' }) {
  const checks = getPasswordChecks(password)

  return (
    <ul className="password-rules" aria-live="polite">
      {checks.map((rule) => (
        <li key={rule.id} className={rule.valid ? 'password-rule-ok' : 'password-rule-ko'}>
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
