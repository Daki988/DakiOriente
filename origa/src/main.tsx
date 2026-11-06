import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { seedIfEmpty } from './data/seed';
import { startAutoSync } from './data/sync';
import './styles/app.css';

seedIfEmpty().finally(() => {
  startAutoSync();
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
});
