// Règles d'accès : les mêmes que celles du serveur national (module partagé), pour n'afficher que les actions permises.
// Le serveur revérifie tout : ces fonctions ne servent qu'à l'affichage et au mode démonstration.
import { BAND_LOCKED, canDelete as serverCanDelete, canEdit as serverCanEdit, farmOf, rightsAllow } from '../../server/src/scope';
import type { Settings } from './types';

export interface Who { role: string; farmId?: string; farmIds?: string[]; operatorId?: string }
type Row = Record<string, unknown>;
type Rights = Parameters<typeof rightsAllow>[4];

/** Raison du refus de modifier cet enregistrement, ou null si la correction est permise. */
export function editDenied(who: Who, table: string, row: Row, rights: Settings['rights'], closedBands: Set<string>): string | null {
  if (locked(who, table, row, closedBands)) return 'bande clôturée : lecture seule';
  if (!serverCanEdit(who, table, row)) return 'modification réservée à un autre profil';
  return rightsAllow(who, table, row, row, rights as Rights);
}

/** Raison du refus de supprimer cet enregistrement, ou null si la suppression est permise. */
export function deleteDenied(who: Who, table: string, row: Row, rights: Settings['rights'], closedBands: Set<string>): string | null {
  if (locked(who, table, row, closedBands)) return 'bande clôturée : lecture seule';
  return serverCanDelete(who, table, farmOf(table, row), row) ?? rightsAllow(who, table, row, row, rights as Rights, 'supprimer');
}

const locked = (who: Who, table: string, row: Row, closed: Set<string>) =>
  BAND_LOCKED.includes(table) && ['eleveur', 'agent'].includes(who.role) && typeof row.bandId === 'string' && closed.has(row.bandId);
