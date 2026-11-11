import { db } from './db';
import { api, apiEnabled } from '../app/api';
import { getSession } from '../app/sessionStore';
import { nextLotIds } from '../domain/ids';
import { signLot } from '../domain/qr';
import type { PresignedLabel } from '../domain/types';

// Étiquettes QR pré-signées : le serveur signe à l'avance les prochains numéros de lot d'une bande.
// Le téléphone garde une petite réserve ; à la cession, même sans réseau, le lot prend la signature de son numéro
// et son QR est valide tout de suite. Le serveur appose ensuite la même signature (Ed25519 est déterministe).

/** Nombre d'étiquettes gardées d'avance sur le téléphone de l'éleveur. */
export const RESERVE = 5;

/** Demande des étiquettes pour les prochains lots de la bande et les range dans la réserve locale. */
export async function requestLabels(bandId: string, count: number): Promise<PresignedLabel[]> {
  const issuedAt = new Date().toISOString();
  let labels: PresignedLabel[];
  if (apiEnabled) {
    const r = await api<{ labels: { lotId: string; signature: string }[] }>('/lots/presign', { method: 'POST', body: JSON.stringify({ bandId, count }) });
    labels = r.labels.map((l) => ({ ...l, bandId, issuedAt }));
  } else {
    // Mode démonstration : la clé de démonstration signe sur l'appareil.
    const used = (await db.lots.where('bandId').equals(bandId).toArray()).map((l) => l.id);
    labels = nextLotIds(used, bandId, count).map((lotId) => ({ lotId, bandId, signature: signLot(lotId), issuedAt }));
  }
  await db.presigned.bulkPut(labels);
  return labels;
}

/** Étiquettes de la bande encore disponibles (leur numéro n'a pas servi), dans l'ordre des numéros. */
export async function availableLabels(bandId: string): Promise<PresignedLabel[]> {
  const used = new Set((await db.lots.where('bandId').equals(bandId).toArray()).map((l) => l.id));
  const all = await db.presigned.where('bandId').equals(bandId).toArray();
  const stale = all.filter((l) => used.has(l.lotId));
  if (stale.length) await db.presigned.bulkDelete(stale.map((l) => l.lotId));
  return all.filter((l) => !used.has(l.lotId)).sort((a, b) => a.lotId.localeCompare(b.lotId));
}

/** Signature pré-émise pour ce numéro de lot, s'il y en a une dans la réserve. */
export async function presignedSignature(lotId: string): Promise<string | undefined> {
  return (await db.presigned.get(lotId))?.signature;
}

/** Complète la réserve de la bande ouverte de l'éleveur connecté (appelé après chaque synchronisation). */
export async function refillReserve(): Promise<number> {
  const s = getSession();
  if (s.role !== 'eleveur' || !s.farmId) return 0;
  const band = (await db.bands.where('farmId').equals(s.farmId).toArray()).find((b) => !b.closedAt);
  if (!band) return 0;
  const have = (await availableLabels(band.id)).length;
  if (have >= RESERVE) return have;
  return (await requestLabels(band.id, RESERVE)).length;
}
