import { db } from './db';

// Synchronisation au retour du réseau : la file d'envoi est vidée vers l'API si elle est configurée.
// Règle de conflit documentée : la dernière saisie horodatée l'emporte côté serveur, le conflit est signalé.
const API = import.meta.env.VITE_API_URL as string | undefined;

export async function pendingCount() {
  return db.outbox.count();
}

export async function flushOutbox(): Promise<{ sent: number; error?: string }> {
  if (!API) return { sent: 0, error: 'Serveur non configuré (mode démonstration)' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { sent: 0, error: 'Hors ligne' };
  const batch = await db.outbox.orderBy('id').limit(200).toArray();
  if (!batch.length) return { sent: 0 };
  const res = await fetch(`${API}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: batch }),
  });
  if (!res.ok) return { sent: 0, error: `Erreur serveur ${res.status}` };
  await db.outbox.bulkDelete(batch.map((b) => b.id!));
  return { sent: batch.length };
}

export function startAutoSync() {
  const run = () => { flushOutbox().catch(() => undefined); };
  window.addEventListener('online', run);
  const t = window.setInterval(run, 60_000);
  run();
  return () => { window.removeEventListener('online', run); window.clearInterval(t); };
}
