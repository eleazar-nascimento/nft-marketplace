import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('msw') || id.includes('@mswjs')) return 'vendor-msw'
            if (id.includes('@tanstack')) return 'vendor-tanstack'
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
            if (id.includes('socket.io') || id.includes('engine.io')) return 'vendor-socket'
          }
          return undefined
        },
      },
    },
  },
})
