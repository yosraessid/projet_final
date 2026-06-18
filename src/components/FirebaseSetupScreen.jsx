/**
 * FirebaseSetupScreen.jsx
 * Écran d'aide affiché quand Firebase n'est pas configuré (fichier .env absent ou incomplet).
 *
 * Contenu :
 *   - Explication du problème (variables d'environnement manquantes).
 *   - Guide étape par étape pour configurer Firebase.
 *   - Liste dynamique des variables manquantes pour faciliter le débogage.
 *
 * Ce composant est rendu à la place de l'application entière dans main.jsx
 * si isFirebaseConfigured() retourne false.
 */

import { getMissingFirebaseEnvKeys } from '../firebase/firebaseConfig'

function FirebaseSetupScreen() {
  // Récupère la liste des variables d'environnement manquantes.
  const missingKeys = getMissingFirebaseEnvKeys()

  return (
    <section className="firebase-setup">
      <article className="card">
        <h2>Configuration Firebase requise</h2>
        <p>
          L'application ne peut pas démarrer car le fichier <code>.env</code> est
          manquant ou incomplet. Sans cela, l'écran reste vide (seul le fond s'affiche).
        </p>

        {/* Guide de configuration en 3 étapes */}
        <ol className="firebase-setup-steps">
          <li>
            Copie le fichier <code>.env.example</code> vers <code>.env</code>
          </li>
          <li>
            Remplis les valeurs depuis la console Firebase (Paramètres du projet →
            Vos applications → Config)
          </li>
          <li>
            Redémarre le serveur : <code>npm run dev</code>
          </li>
        </ol>

        {/* Affiche la liste des variables manquantes si applicable */}
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
