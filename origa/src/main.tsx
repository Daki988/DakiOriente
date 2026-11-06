import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary, UpdateBar } from './components/AppChrome';
import { seedIfEmpty } from './data/seed';
import { ensureDemoAccounts, ensureDemoExtras } from './data/demoUsers';
import { apiEnabled } from './app/api';
import { db } from './data/db';
import { DEFAULT_SETTINGS } from './domain/defaults';
import { startAutoSync } from './data/sync';
import './styles/app.css';

const boot = apiEnabled ? db.settings.get('global').then((s) => { if (!s) return db.settings.put(DEFAULT_SETTINGS); }) : seedIfEmpty().then(ensureDemoAccounts).then(ensureDemoExtras);
const shownAt = performance.now();
boot.finally(() => {
  startAutoSync();
  createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App /><UpdateBar /></ErrorBoundary></StrictMode>);
  // L'animation de démarrage reste au moins 0,9 s pour être lisible, puis s'efface en fondu.
  const el = document.getElementById('boot');
  window.setTimeout(() => { el?.classList.add('done'); window.setTimeout(() => el?.remove(), 500); }, Math.max(0, 900 - (performance.now() - shownAt)));
});
