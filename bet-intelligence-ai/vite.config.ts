/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
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
});
