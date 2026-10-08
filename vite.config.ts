import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' : chemins relatifs, indispensable pour Capacitor (Android/iOS)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: true },
})
