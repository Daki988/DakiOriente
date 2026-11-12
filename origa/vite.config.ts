import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base relative : le même build sert le web, Android (APK / HarmonyOS 2) et iOS via Capacitor.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // Mise à jour automatique : la nouvelle version s'installe dès qu'elle est publiée et s'applique au prochain
      // affichage, sans attendre que l'utilisateur touche « Mettre à jour ».
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg', 'icons/*.png', 'img/*.webp'],
      manifest: {
        name: 'Origa — Filière avicole du Gabon',
        short_name: 'Origa',
        description: 'Suivi des fermes POUFA et traçabilité des poulets, de la ferme au consommateur.',
        lang: 'fr',
        theme_color: '#0B3D2E',
        background_color: '#F5F7F6',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: { navigateFallback: 'index.html', navigateFallbackDenylist: [/^\/api\//], globPatterns: ['**/*.{js,css,html,svg,woff2,png,webp}'], skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true,
        // Fond de carte : les tuiles déjà vues restent disponibles hors connexion (30 jours, 2 000 tuiles au plus).
        runtimeCaching: [{ urlPattern: /^https:\/\/tile\.openstreetmap\.org\//, handler: 'CacheFirst', options: { cacheName: 'origa-carte', expiration: { maxEntries: 2000, maxAgeSeconds: 30 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } } }] },
    }),
  ],
  test: { environment: 'node', setupFiles: ['src/test/setup.ts'], include: ['src/**/*.test.ts'] },
});
