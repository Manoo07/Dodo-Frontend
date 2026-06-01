import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // GitHub Pages deploys to https://user.github.io/<repo-name>/
  // Set VITE_BASE_PATH=/repo-name/ in your GitHub Actions environment
  // Leave unset (or '/') for a custom domain at the root
  base: process.env.VITE_BASE_PATH || '/',

  server: {
    port: 5173,
    proxy: {
      // Only active during local dev (npm run dev)
      '/api': 'http://localhost:3000',
    },
  },
})
