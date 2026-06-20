/**
 * eslint.config.js
 * Configuration ESLint (format flat config — ESLint v9+).
 *
 * Règles activées :
 *   - @eslint/js : règles JavaScript recommandées (erreurs courantes, bonnes pratiques).
 *   - eslint-plugin-react-hooks : vérifie les règles des hooks React (dépendances, appels conditionnels).
 *   - eslint-plugin-react-refresh : assure la compatibilité avec le Hot Module Replacement de Vite.
 *
 * Règles désactivées/assouplies :
 *   - react-hooks/set-state-in-effect : faux positif pour les patterns de synchronisation de props.
 *   - react-hooks/preserve-manual-memoization : contrainte trop stricte sur useCallback.
 *   - react-refresh/only-export-components : incompatible avec les fichiers contextes (Provider + hook).
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
      globals: { ...globals.browser, ...globals.node },
      // Active le parsing JSX dans les fichiers.
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Permet de setState dans useEffect (pattern courant pour synchroniser les props).
      'react-hooks/set-state-in-effect': 'off',
      // Permet les dépendances manuelles dans useCallback/useMemo.
      'react-hooks/preserve-manual-memoization': 'off',
      // Permet d'exporter des hooks et des providers depuis le même fichier.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Autorise les variables préfixées par _ à ne pas être utilisées.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
])
