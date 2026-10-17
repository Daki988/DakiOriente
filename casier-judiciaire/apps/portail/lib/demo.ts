import 'server-only';
import { createHash, randomInt } from 'node:crypto';

import bulletinsJson from '../../../referentiels/demo/bulletins-demo.json';
import tarifsJson from '../../../referentiels/tarifs-proposition-2024-06-25.json';

import { SPECIMEN_B3_SHA256 } from './specimen-b3';

import type { DemandeDeposee, NouvelleDemande, PaiementTresorEnregistre, ReclamationDeposee, ResultatVerification, SuiviDemande, Tarif } from './types';

/**
 * Mode démonstration (ENV-03) : réponses simulées à partir des référentiels et des données FICTIVES
 * de `casier-judiciaire/referentiels/`. Aucune donnée réelle, aucune somme encaissée.
 */
// Données intégrées au build : le portail se déploie seul (Vercel, cPanel), sans accès au dossier des référentiels.
const REFERENTIELS: Record<string, unknown> = {
  'tarifs-proposition-2024-06-25.json': tarifsJson,
  'demo/bulletins-demo.json': bulletinsJson,
};

function lire<T>(fichier: string): T {
  return structuredClone(REFERENTIELS[fichier]) as T;
}

export function tarifsDemo(): Tarif[] {
  const r = lire<{ source: string; dateEffet: string; provisoire: boolean; tarifs: Omit<Tarif, 'source' | 'dateEffet' | 'provisoire'>[] }>(
    'tarifs-proposition-2024-06-25.json');
  return r.tarifs.map((t) => ({ ...t, source: r.source, dateEffet: r.dateEffet, provisoire: r.provisoire }));
}

type BulletinDemo = { jeton: string; code: string; statut: ResultatVerification['statut']; type: 'B3'; numero: string;
  dateEmission: string; dateExpiration: string; nom: string; prenoms: string; dateNaissance: string };

function bulletins(): BulletinDemo[] {
  return lire<{ bulletins: BulletinDemo[] }>('demo/bulletins-demo.json').bulletins;
}

const INCONNU: ResultatVerification = { authentique: false, statut: 'INCONNU', type: null, numero: null, dateEmission: null,
  dateExpiration: null, nom: null, prenoms: null, dateNaissance: null };

function versResultat(b?: BulletinDemo): ResultatVerification {
  if (!b) return INCONNU;
  const { jeton: _j, code: _c, ...reste } = b;
  return { authentique: true, ...reste };
}

export function verifierJetonDemo(jeton: string) {
  return versResultat(bulletins().find((b) => b.jeton === jeton));
}

export function verifierCodeDemo(code: string) {
  const canon = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  return versResultat(bulletins().find((b) => canon(b.code) === canon(code)));
}

/** BUL-08 en démonstration : seul le spécimen scellé fourni par le portail est reconnu, octet pour octet. */
export function verifierDocumentDemo(pdf: Buffer) {
  const integre = createHash('sha256').update(pdf).digest('hex') === SPECIMEN_B3_SHA256;
  return { integre, resultat: integre ? verifierCodeDemo('DEMO-VALI-DE26') : INCONNU };
}

// Dossiers déposés pendant la démonstration : mémoire du processus, effacée au redémarrage (ENV-02 : réinitialisation).
const dossiers = new Map<string, { code: string; suivi: SuiviDemande }>();

dossiers.set('CJ-2026-000123', {
  code: '123456',
  suivi: {
    numeroDossier: 'CJ-2026-000123', statut: 'EN_ATTENTE_PIECE', libelle: 'Pièce complémentaire demandée',
    echeance: '2026-10-18T10:30:00Z', numeroBulletin: null,
    frise: [
      { horodatage: '2026-10-16T09:58:00Z', statut: 'EN_ATTENTE_PAIEMENT', libelle: 'Demande enregistrée, en attente de paiement' },
      { horodatage: '2026-10-16T10:04:00Z', statut: 'EN_TRAITEMENT', libelle: 'Paiement confirmé, demande en cours de traitement' },
      { horodatage: '2026-10-16T10:04:00Z', statut: 'A_TRAITER_PAR_AGENT', libelle: 'Vérification en cours par un agent du casier' },
      { horodatage: '2026-10-16T14:20:00Z', statut: 'EN_ATTENTE_PIECE', libelle: 'Pièce complémentaire demandée : copie intégrale de l’acte de naissance' },
    ],
  },
});

export function suiviDemo(numero: string, code: string): SuiviDemande | null {
  const d = dossiers.get(numero.trim().toUpperCase());
  return d && d.code === code.trim() ? d.suivi : null;
}

/** Dépôt simulé : paiement simulé (PAY-07) et délivrance immédiate d'un bulletin fictif. */
export function deposerDemo(demande: NouvelleDemande): DemandeDeposee {
  const tarif = tarifsDemo().find((t) => t.acte === 'BULLETIN_N3' && t.profil === demande.profil);
  if (!tarif) {
    throw new Error('Le tarif du bulletin n°3 pour ce profil n’est pas encore fixé par le Ministère : la demande en ligne n’est pas ouverte.');
  }
  const numero = `CJ-2026-${String(randomInt(200_000, 999_999))}`;
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const maintenant = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  if (demande.paiementTresor) {
    dossiers.set(numero, { code, suivi: enAttenteTresor(numero, maintenant) });
    return { numeroDossier: numero, codeSuivi: code, montantFcfa: tarif.montantFcfa, tarifProvisoire: tarif.provisoire, demo: true, paiementTresor: true };
  }
  dossiers.set(numero, {
    code,
    suivi: {
      numeroDossier: numero, statut: 'DELIVREE', libelle: 'Bulletin disponible dans votre espace',
      echeance: iso(maintenant + 24 * 3600_000), numeroBulletin: `B3-2026-${String(randomInt(1000, 9999)).padStart(7, '0')}`,
      frise: [
        { horodatage: iso(maintenant), statut: 'EN_ATTENTE_PAIEMENT', libelle: 'Demande enregistrée, en attente de paiement' },
        { horodatage: iso(maintenant + 60_000), statut: 'EN_TRAITEMENT', libelle: 'Paiement confirmé (simulateur de démonstration)' },
        { horodatage: iso(maintenant + 65_000), statut: 'DELIVREE', libelle: 'Bulletin disponible dans votre espace' },
      ],
    },
  });
  return { numeroDossier: numero, codeSuivi: code, montantFcfa: tarif.montantFcfa, tarifProvisoire: tarif.provisoire, demo: true };
}

function enAttenteTresor(numero: string, depuis: number): SuiviDemande {
  return {
    numeroDossier: numero, statut: 'EN_ATTENTE_PAIEMENT', libelle: 'En attente du paiement au Trésor public',
    echeance: null, numeroBulletin: null,
    frise: [{ horodatage: new Date(depuis).toISOString(), statut: 'EN_ATTENTE_PAIEMENT', libelle: 'Demande enregistrée, à payer au Trésor public' }],
  };
}

/** Dossier fictif à payer au Trésor, pour les présentations (DON-06). */
export const DOSSIER_TRESOR_DEMO = { numero: 'CJ-2026-000140', code: '654321' };
if (!dossiers.has(DOSSIER_TRESOR_DEMO.numero)) {
  dossiers.set(DOSSIER_TRESOR_DEMO.numero, { code: DOSSIER_TRESOR_DEMO.code, suivi: enAttenteTresor(DOSSIER_TRESOR_DEMO.numero, Date.parse('2026-10-17T07:30:00Z')) });
}
const quittances = new Map<string, string>();

/**
 * Paiement au Trésor simulé : le numéro de dossier et le code de suivi identifient la demande ; l'identifiant de
 * paiement (quittance) ne peut servir qu'une fois. Le bulletin fictif est alors délivré.
 */
export function payerTresorDemo(numero: string, code: string, quittance: string): PaiementTresorEnregistre | null {
  const dossier = dossiers.get(numero);
  if (!dossier || dossier.code !== code) return null;
  const deja = quittances.get(quittance);
  if (deja && deja !== numero) throw new Error('Cet identifiant de paiement a déjà été utilisé.');
  const s = dossier.suivi;
  if (s.statut === 'EN_ATTENTE_PAIEMENT') {
    const maintenant = Date.now();
    quittances.set(quittance, numero);
    s.statut = 'DELIVREE';
    s.libelle = 'Bulletin disponible';
    s.numeroBulletin = 'B3-2026-0000412';
    s.frise.push(
      { horodatage: new Date(maintenant).toISOString(), statut: 'EN_TRAITEMENT', libelle: `Paiement au Trésor confirmé (quittance ${quittance})` },
      { horodatage: new Date(maintenant + 5_000).toISOString(), statut: 'DELIVREE', libelle: 'Bulletin disponible' },
    );
  } else if (!deja) {
    throw new Error('Ce dossier est déjà payé.');
  }
  return { numeroDossier: numero, statut: s.statut, numeroBulletin: s.numeroBulletin, demo: true };
}

/** Bulletin téléchargeable après paiement (démonstration) : dossier délivré, code de suivi exact. */
export function dossierDelivreDemo(numero: string, code: string) {
  const dossier = dossiers.get(numero);
  return !!dossier && dossier.code === code && dossier.suivi.statut === 'DELIVREE';
}

/** Réclamation simulée : aucune donnée conservée, seule une référence fictive est rendue. */
export function reclamerDemo(): ReclamationDeposee {
  return { reference: `REC-2026-${String(randomInt(1, 999_999)).padStart(6, '0')}`, demo: true };
}
