import type { Claims } from './security.js';

export const FARM_TABLES = ['bands', 'entries', 'weighings', 'exits', 'inputs', 'treatments', 'vaccinations', 'reports', 'lots', 'alerts', 'scans',
  'diagnostics', 'biosecurity', 'visits', 'charges', 'orders', 'slaughter', 'consultations', 'offers', 'movements'];
export const ALL_TABLES = ['farms', 'operators', 'settings', 'prices', 'publications', ...FARM_TABLES];

type Row = Record<string, unknown>;
type Action = 'consulter' | 'creer' | 'modifier' | 'valider' | 'administrer';

/** Domaine de la matrice des droits auquel appartient chaque table. */
export const DOMAIN: Record<string, string> = {
  farms: 'fermes', operators: 'fermes', visits: 'fermes',
  bands: 'elevage', entries: 'elevage', weighings: 'elevage', exits: 'elevage',
  inputs: 'intrants', orders: 'intrants',
  treatments: 'sanitaire', vaccinations: 'sanitaire', reports: 'sanitaire', alerts: 'sanitaire', diagnostics: 'sanitaire', biosecurity: 'sanitaire', consultations: 'sanitaire',
  charges: 'economie', prices: 'economie',
  lots: 'tracabilite', scans: 'tracabilite', movements: 'tracabilite', slaughter: 'tracabilite', offers: 'tracabilite',
  publications: 'pilotage',
};

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

const SANITARY = ['farms', 'bands', 'entries', 'weighings', 'treatments', 'vaccinations', 'reports', 'alerts', 'lots', 'diagnostics', 'biosecurity', 'consultations', 'visits'];
/** Sérialisation indépendante de l'ordre des clés (PostgreSQL JSONB réordonne les objets stockés). */
const stable = (v: unknown): string => (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : v && typeof v === 'object'
  ? `{${Object.keys(v as Row).sort().filter((k) => (v as Row)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stable((v as Row)[k])}`).join(',')}}` : JSON.stringify(v ?? null));
const changedKeys = (row: Row, current?: Row) => Object.keys({ ...row, ...(current ?? {}) }).filter((k) => k !== 'id' && stable(row[k]) !== stable(current?.[k]));

/** Lecture : chacun ne voit que ce qui le concerne (§ 3 et § 8 du cahier des charges). */
export function canRead(u: Claims, tbl: string, farmId: string | null, bcegFarms: Set<string> = new Set(), row?: Row): boolean {
  if (tbl === 'settings') return true;
  if (u.role === 'aninf') return false; // journal d'audit uniquement, par ses propres routes
  if (u.role === 'maedr') return tbl === 'publications'; // données agrégées seulement
  if (tbl === 'publications') return ['dge', 'admin'].includes(u.role);
  if (tbl === 'operators' || tbl === 'prices') return true;
  if (tbl === 'offers' && row?.status === 'ouverte') return true; // place de marché
  if (u.role === 'operateur') {
    if (!u.operatorId) return false;
    if (tbl === 'lots' || tbl === 'slaughter') return row?.operatorId === u.operatorId;
    return false;
  }
  if (u.role === 'admin' || u.role === 'dge') return true;
  if (u.role === 'veterinaire') return SANITARY.includes(tbl);
  if (u.role === 'bceg') return !['reports', 'alerts', 'treatments', 'diagnostics', 'consultations'].includes(tbl) && !!farmId && bcegFarms.has(farmId);
  return !!farmId && farmsOf(u).includes(farmId);
}

/** Écriture : périmètre et profil vérifiés côté serveur pour chaque enregistrement. */
export function canWrite(u: Claims, tbl: string, farmId: string | null, row: Row, current?: Row): string | null {
  if (!ALL_TABLES.includes(tbl)) return 'table inconnue';
  const changed = changedKeys(row, current);
  if (tbl === 'settings' && 'rights' in row && stable(row.rights) !== stable(current?.rights) && u.role !== 'admin') return 'matrice des droits réservée à l’administrateur';
  switch (u.role) {
    case 'admin':
      return null;
    case 'aninf':
      return 'profil ANINF : lecture du journal uniquement';
    case 'maedr':
      if (tbl !== 'publications' || !current) return 'MAEDR : validation des diffusions uniquement';
      return changed.every((k) => ['status', 'decidedBy', 'decidedAt', 'note'].includes(k)) && ['validee', 'refusee'].includes(String(row.status)) ? null : 'MAEDR : seule la décision est modifiable';
    case 'dge': {
      if (tbl === 'settings') {
        if (!current) return null; // paramétrage initial du programme
        const vetKeys = ['alertDailyMortalityPct', 'vaccinationCalendar', 'clinicalSigns', 'treatmentProducts', 'biosecurityGrid'];
        const k = changed.find((x) => vetKeys.includes(x));
        return k ? (k === 'alertDailyMortalityPct' ? 'seuil sanitaire réservé aux services vétérinaires' : 'paramètre sanitaire réservé aux services vétérinaires') : null;
      }
      if (tbl === 'bands') return current && changed.every((k) => k === 'closedAt') ? null : 'DGE : seule la réouverture d’une bande clôturée est permise';
      if (['orders', 'slaughter'].includes(tbl)) return current && changed.every((k) => ['status', 'decidedBy', 'note'].includes(k)) ? null : 'DGE : validation uniquement';
      return ['farms', 'operators', 'inputs', 'publications', 'prices'].includes(tbl) ? null : 'profil DGE : lecture seule sur ces données';
    }
    case 'veterinaire':
      if (tbl === 'settings') {
        const keep = ['alertDailyMortalityPct', 'vaccinationCalendar', 'clinicalSigns', 'treatmentProducts', 'biosecurityGrid'];
        return changed.filter((k) => !keep.includes(k)).length ? 'seuls les paramètres sanitaires sont modifiables' : null;
      }
      return ['alerts', 'treatments', 'vaccinations', 'reports', 'diagnostics', 'biosecurity', 'consultations'].includes(tbl) ? null : 'hors du volet sanitaire';
    case 'operateur': {
      if (!u.operatorId) return 'opérateur sans structure';
      if (tbl === 'lots') {
        if (!current) return row.parentId && row.operatorId === u.operatorId ? null : 'opérateur : seuls les lots dérivés de vos lots peuvent être créés';
        if (current.operatorId !== u.operatorId) return 'lot destiné à un autre opérateur';
        const allowed = ['receivedAt', 'receivedCount', 'receivedWeightKg', 'receptionNote'];
        const bad = changed.filter((k) => !allowed.includes(k));
        return bad.length ? `champ non modifiable : ${bad[0]}` : null;
      }
      if (tbl === 'movements') return null; // le lot visé est contrôlé par l'appel (lot existant cédé à l'opérateur)
      if (tbl === 'slaughter') return current && current.operatorId === u.operatorId && changed.every((k) => k === 'status') ? null : 'rendez-vous d’un autre abattoir';
      return 'opérateur : réception et traçabilité des lots uniquement';
    }
    case 'eleveur':
    case 'agent': {
      if (['settings', 'operators', 'publications', 'diagnostics'].includes(tbl)) return 'réservé à d’autres profils';
      if (tbl === 'prices') return u.role === 'agent' ? null : 'relevés de prix réservés aux agents et à la DGE';
      if (tbl === 'farms' && u.role === 'eleveur') return 'fiche ferme gérée par l’agent technique';
      if (tbl === 'farms' && u.role === 'agent' && !current) return null; // enrôlement d'une nouvelle ferme
      if (tbl === 'offers' && current && !farmsOf(u).includes(String(current.farmId))) return 'offre d’une autre ferme';
      if (!farmId || !farmsOf(u).includes(farmId)) return 'ferme hors de votre périmètre';
      if (tbl === 'alerts' && (current || row.status !== 'nouvelle')) return 'qualification réservée aux services vétérinaires';
      if (tbl === 'orders' && (current || row.status !== 'demandee')) return 'la validation d’une commande revient à la DGE';
      if (tbl === 'slaughter' && (current || row.status !== 'demande')) return 'la confirmation revient à l’abattoir';
      if (tbl === 'consultations' && (current || row.answer)) return 'la réponse revient aux services vétérinaires';
      if (tbl === 'visits' && u.role !== 'agent') return 'visites réservées aux agents techniques';
      if (tbl === 'biosecurity' && u.role === 'eleveur' && (!current || changed.some((k) => k !== 'actions'))) return 'l’éleveur ne peut que suivre les mesures correctives';
      if (tbl === 'bands' && current?.closedAt) return 'bande clôturée : lecture seule';
      return null;
    }
    default:
      return 'lecture seule';
  }
}

/** Droit d'action selon la matrice paramétrable (en plus des règles de périmètre ci-dessus). */
export function rightsAllow(u: Claims, tbl: string, current: Row | undefined, row: Row, rights?: Record<string, Record<string, Action[]>>): string | null {
  if (u.role === 'admin' || !rights || tbl === 'settings') return null;
  const domain = DOMAIN[tbl];
  if (!domain) return null;
  const validation = (u.role === 'maedr' && tbl === 'publications') || (u.role === 'veterinaire' && tbl === 'alerts' && !!current)
    || (u.role === 'dge' && ['orders', 'slaughter'].includes(tbl)) || (u.role === 'operateur' && tbl === 'slaughter');
  const action: Action = validation ? 'valider' : current ? 'modifier' : 'creer';
  const granted = rights[u.role]?.[domain] ?? [];
  return granted.includes(action) ? null : `droit « ${action} » non accordé au profil ${u.role} sur « ${domain} »`;
}
