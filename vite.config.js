/**
 * vite.config.js
 * Configuration du bundler Vite pour le projet React.
 *
 * Fonctionnalités configurées :
 *   - Plugin React officiel (@vitejs/plugin-react) pour le support JSX et Fast Refresh.
 *   - Serveur de développement : port 5173, host exposé pour Docker.
 *   - File watcher : mode polling activable via CHOKIDAR_USEPOLLING (compatibilité Docker/VM).
 *   - Vitest : environnement jsdom pour simuler le DOM dans les tests unitaires.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Active le plugin React (JSX transform, Fast Refresh en développement).
  plugins: [react()],

  // Configuration du serveur de développement.
  server: {
    // host: true → écoute sur 0.0.0.0 (nécessaire pour Docker et accès réseau externe).
    host: true,
    // Port par défaut du serveur de développement.
    port: 5173,
    // En environnement Docker/VM, le file watcher natif peut ne pas fonctionner.
    // CHOKIDAR_USEPOLLING=true active le mode polling comme alternative fiable.
    watch: process.env.CHOKIDAR_USEPOLLING
      ? { usePolling: true }
      : undefined,
  },

  // Configuration des tests unitaires avec Vitest.
  test: {
    // jsdom simule un environnement navigateur (document, window, DOM) pour les tests.
    environment: 'jsdom',
    // Active les globals Vitest (describe, it, expect) sans import explicite.
    globals: true,
    // Fichier de setup exécuté avant chaque suite de tests (jest-dom matchers).
    setupFiles: './src/tests/setup.js',
  },
})
