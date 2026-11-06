import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base relative : le même build sert le web, Android (APK / HarmonyOS 2) et iOS via Capacitor.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Origa — Filière avicole du Gabon',
        short_name: 'Origa',
        description: 'Suivi des fermes POUFA et traçabilité des poulets, de la ferme au consommateur.',
        lang: 'fr',
        theme_color: '#0B3D2E',
        background_color: '#F5F7F6',
        display: 'standalone',
        start_url: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { navigateFallback: 'index.html', globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
    }),
  ],
  test: { environment: 'node', setupFiles: ['src/test/setup.ts'] },
});
