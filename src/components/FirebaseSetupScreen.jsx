import { getMissingFirebaseEnvKeys } from '../firebase/firebaseConfig'

function FirebaseSetupScreen() {
  const missingKeys = getMissingFirebaseEnvKeys()

  return (
    <section className="firebase-setup">
      <article className="card">
        <h2>Configuration Firebase requise</h2>
        <p>
          L application ne peut pas demarrer car le fichier <code>.env</code> est
          manquant ou incomplet. Sans cela, l ecran reste vide (seul le fond s affiche).
        </p>

        <ol className="firebase-setup-steps">
          <li>
            Copie le fichier <code>.env.example</code> vers <code>.env</code>
          </li>
          <li>
            Remplis les valeurs depuis la console Firebase (Parametres du projet →
            Vos applications → Config)
          </li>
          <li>
            Redemarre le serveur : <code>npm run dev</code>
          </li>
        </ol>

        {missingKeys.length > 0 && (
          <div className="firebase-setup-missing">
            <p>Variables manquantes :</p>
            <ul>
              {missingKeys.map((key) => (
                <li key={key}>
                  <code>{key}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </section>
  )
}

export default FirebaseSetupScreen
