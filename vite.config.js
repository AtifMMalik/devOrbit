import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('englishDictionary')) {
            return 'spellcheck-dictionary';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/react-router/')
          ) {
            return 'vendor-react';
          }
          if (
            id.includes('node_modules/signature_pad') ||
            id.includes('node_modules/canvas-confetti') ||
            id.includes('node_modules/react-activity-calendar')
          ) {
            return 'vendor-utils';
          }
          if (id.includes('src/extensions/themes/')) {
            return 'theme-registry';
          }
        },
      },
    },
  },
})
