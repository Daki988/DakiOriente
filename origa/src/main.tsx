import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary, UpdateBar } from './components/AppChrome';
import { seedIfEmpty } from './data/seed';
import { ensureDemoAccounts, ensureDemoExtras, ensureDemoV13 } from './data/demoUsers';
import { apiEnabled, detectServer } from './app/api';
import { db } from './data/db';
import { DEFAULT_SETTINGS } from './domain/defaults';
import { startAutoSync } from './data/sync';
import './styles/app.css';
import { blockPageZoom } from './app/noZoom';

blockPageZoom();

// Le serveur est-il en service ? Sinon, démonstration autonome avec des données fictives.
const boot = detectServer().then(async (mode) => {
  if (mode === 'upgraded') { await db.delete(); location.reload(); await new Promise(() => undefined); } // on repart sur une base vide, côté serveur
  if (mode === 'reset') { await db.delete(); location.reload(); await new Promise(() => undefined); } // démonstration remise à zéro : on reprend tout du serveur, la session reste ouverte
  if (apiEnabled) { if (!(await db.settings.get('global'))) await db.settings.put(DEFAULT_SETTINGS); return; }
  await seedIfEmpty(); await ensureDemoAccounts(); await ensureDemoExtras(); await ensureDemoV13();
});
const shownAt = performance.now();
boot.finally(() => {
  startAutoSync();
  createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App /><UpdateBar /></ErrorBoundary></StrictMode>);
  // L'animation de démarrage reste au moins 0,9 s pour être lisible, puis s'efface en fondu.
  const el = document.getElementById('boot');
  window.setTimeout(() => { el?.classList.add('done'); window.setTimeout(() => el?.remove(), 500); }, Math.max(0, 900 - (performance.now() - shownAt)));
});
