import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout des parcours et tests d'accessibilité automatiques (section 25, ERG-01).
 * Le portail tourne en mode démonstration : données fictives uniquement (DON-06).
 */
const port = Number(process.env.PORT_E2E ?? 3100);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'fr-FR',
    timezoneId: 'Africa/Libreville',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
    { name: 'bureau', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: process.env.CI ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_MODE_DEMO: 'true', COMPTES_DEMO: 'true' },
  },
});
