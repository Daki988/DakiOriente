import type { Claims } from './security.js';

export const FARM_TABLES = ['bands', 'entries', 'weighings', 'exits', 'inputs', 'treatments', 'vaccinations', 'reports', 'lots', 'alerts', 'scans'];
export const ALL_TABLES = ['farms', 'operators', 'settings', ...FARM_TABLES];

type Row = Record<string, unknown>;

/** Ferme à laquelle se rattache un enregistrement (identifiants hiérarchiques GA1-0042-B07-L01). */
export function farmOf(tbl: string, row: Row): string | null {
  if (tbl === 'farms') return String(row.id);
  if (typeof row.farmId === 'string') return row.farmId;
  if (typeof row.bandId === 'string') return row.bandId.split('-B')[0];
  if (typeof row.lotId === 'string') return row.lotId.split('-B')[0];
  return null;
}

function farmsOf(u: Claims): string[] {
  if (u.role === 'eleveur') return u.farmId ? [u.farmId] : [];
  if (u.role === 'agent') return u.farmIds ?? [];
  return [];
}

const WIDE = ['dge', 'admin', 'veterinaire'];

/** Lecture : chacun ne voit que ce qui le concerne (§ 8 du cahier des charges). */
export function canRead(u: Claims, tbl: string, farmId: string | null, bcegFarms: Set<string> = new Set()): boolean {
  if (tbl === 'settings' || tbl === 'operators') return true;
  if (WIDE.includes(u.role)) {
    // Les services vétérinaires voient le volet sanitaire et le registre, pas l'économique.
    if (u.role === 'veterinaire') return ['farms', 'bands', 'entries', 'weighings', 'treatments', 'vaccinations', 'reports', 'alerts', 'lots'].includes(tbl);
    return true;
  }
  // BCEG : uniquement les fermes financées dont l'exploitant a donné son consentement.
  if (u.role === 'bceg') return !['reports', 'alerts', 'treatments'].includes(tbl) && !!farmId && bcegFarms.has(farmId);
  return !!farmId && farmsOf(u).includes(farmId);
}

/** Écriture : périmètre et profil vérifiés côté serveur pour chaque enregistrement. */
export function canWrite(u: Claims, tbl: string, farmId: string | null, row: Row, current?: Row): string | null {
  if (!ALL_TABLES.includes(tbl)) return 'table inconnue';
  switch (u.role) {
    case 'admin':
      return null;
    case 'dge':
      if (tbl === 'settings' && current && row.alertDailyMortalityPct !== current.alertDailyMortalityPct) return 'seuil sanitaire réservé aux services vétérinaires';
      return ['farms', 'operators', 'settings', 'inputs'].includes(tbl) ? null : 'profil DGE : lecture seule sur ces données';
    case 'veterinaire':
      if (tbl === 'settings') {
        const keep = ['alertDailyMortalityPct', 'vaccinationCalendar', 'clinicalSigns'];
        const changed = Object.keys(row).filter((k) => JSON.stringify(row[k]) !== JSON.stringify(current?.[k]) && !keep.includes(k));
        return changed.length ? 'seuls les paramètres sanitaires sont modifiables' : null;
      }
      return ['alerts', 'treatments', 'vaccinations', 'reports'].includes(tbl) ? null : 'hors du volet sanitaire';
    case 'eleveur':
    case 'agent': {
      if (tbl === 'settings' || tbl === 'operators') return 'paramétrage réservé';
      if (tbl === 'farms' && u.role === 'eleveur') return 'fiche ferme gérée par l’agent technique';
      if (tbl === 'farms' && u.role === 'agent' && !current) return null; // enrôlement d'une nouvelle ferme
      if (!farmId || !farmsOf(u).includes(farmId)) return 'ferme hors de votre périmètre';
      // Une alerte ne peut être que créée par le terrain ; sa qualification revient aux vétérinaires.
      if (tbl === 'alerts' && (current || row.status !== 'nouvelle')) return 'qualification réservée aux services vétérinaires';
      return null;
    }
    default:
      return 'lecture seule';
  }
}
