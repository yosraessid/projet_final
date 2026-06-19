/**
 * eslint.config.js
 * Configuration ESLint (format flat config — ESLint v9+).
 *
 * Règles activées :
 *   - @eslint/js : règles JavaScript recommandées (erreurs courantes, bonnes pratiques).
 *   - eslint-plugin-react-hooks : vérifie les règles des hooks React (dépendances, appels conditionnels).
 *   - eslint-plugin-react-refresh : assure la compatibilité avec le Hot Module Replacement de Vite.
 *
 * Fichiers ignorés :
 *   - dist/ : dossier de build (code généré, pas besoin de linting).
 *
 * Fichiers couverts :
 *   - Tous les fichiers .js et .jsx du projet.
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore le dossier de build (dist/).
  globalIgnores(['dist']),
  {
    // Applique les règles à tous les fichiers JavaScript et JSX.
    files: ['**/*.{js,jsx}'],
    extends: [
      // Règles JavaScript recommandées par ESLint (no-undef, no-unused-vars, etc.).
      js.configs.recommended,
      // Vérifie les règles des hooks React (exhaustive-deps, rules-of-hooks).
      reactHooks.configs.flat.recommended,
      // Assure que les composants exportés sont compatibles avec React Fast Refresh.
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // Variables globales du navigateur (window, document, localStorage, etc.).
      globals: globals.browser,
      // Active le parsing JSX dans les fichiers.
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
