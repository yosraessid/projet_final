import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite du projet React.
export default defineConfig({
  // Active le support React.
  plugins: [react()],
  server: {
    // Autorise l'acces depuis Docker (pas seulement localhost interne).
    host: true,
    port: 5173,
    // Active un mode de surveillance plus fiable en conteneur.
    watch: process.env.CHOKIDAR_USEPOLLING
      ? { usePolling: true }
      : undefined,
  },
})
