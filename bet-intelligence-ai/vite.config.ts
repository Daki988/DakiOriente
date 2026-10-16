/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // En local, /api est servi par le backend FastAPI (uvicorn api.index:app --port 8000).
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  build: mode === 'artifact' ? {
    // Version en ligne (Artifact claude.ai) : un seul script IIFE, inliné ensuite dans une page unique.
    outDir: 'dist-artifact',
    cssCodeSplit: false,
    modulePreload: false,
    rolldownOptions: { output: { format: 'iife', codeSplitting: false } },
  } : {
    rolldownOptions: {
      output: {
        // Bibliothèques lourdes isolées dans des chunks dédiés (meilleur cache navigateur).
        codeSplitting: {
          groups: [
            { name: 'charts', test: /node_modules[\\/](recharts|d3-|victory-vendor|decimal\.js|es-toolkit|immer|@reduxjs|redux|reselect)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
