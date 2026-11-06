import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { seedIfEmpty } from './data/seed';
import { apiEnabled } from './app/api';
import { db } from './data/db';
import { DEFAULT_SETTINGS } from './domain/defaults';
import { startAutoSync } from './data/sync';
import './styles/app.css';

const boot = apiEnabled ? db.settings.get('global').then((s) => { if (!s) return db.settings.put(DEFAULT_SETTINGS); }) : seedIfEmpty();
boot.finally(() => {
  startAutoSync();
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
});
