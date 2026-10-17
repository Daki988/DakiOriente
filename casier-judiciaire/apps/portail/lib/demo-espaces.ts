import 'server-only';
import { randomUUID } from 'node:crypto';

import { tarifsDemo } from './demo';
import type { Session } from './session';
import { SPECIMEN_B3 } from './specimen-b3';
import { SPECIMENS_IMPRESSION } from './specimens-impression';
import type {
  AccesDonnees, BulletinAImprimer, DemandeUsager, DossierAgent, EntreeJournal, Indicateurs, InscriptionEnAttente, JeuDeRegles, ProfilIdentite,
  SaisieCondamnation, TarifComplet,
} from './types';

/**
 * Espaces en mode démonstration (ENV-03, ENV-04) : données FICTIVES en mémoire, réinitialisées au redémarrage.
 * Les actions modifient ces données et alimentent un journal simulé, pour présenter les parcours sans service métier.
 */
const iso = (decalageHeures: number) => new Date(Date.now() + decalageHeures * 3600_000).toISOString();

type Etat = {
  demandes: DemandeUsager[]; file: DossierAgent[]; candidats: Record<string, ProfilIdentite[]>;
  attente: InscriptionEnAttente[]; tarifs: TarifComplet[]; regles: JeuDeRegles[]; journal: EntreeJournal[];
  impressions: BulletinAImprimer[];
};

function initial(): Etat {
  const tarifs: TarifComplet[] = tarifsDemo().map((t, i) => ({ ...t, id: `demo-tarif-${i}`, statut: 'VALIDE', proposePar: 'import:referentiel', validePar: 'import:referentiel' }));
  tarifs.push({ id: 'demo-tarif-proposition', acte: 'BULLETIN_N3', profil: 'GABONAIS_NE_A_L_ETRANGER', montantFcfa: 1500,
    dateEffet: iso(24 * 30).slice(0, 10), provisoire: true, libelle: 'Bulletin n°3, Gabonais nés à l’étranger (proposition fictive)',
    source: 'Proposition de démonstration', statut: 'PROPOSE', proposePar: 'demo-admin', validePar: null });
  return {
    demandes: [
      { id: 'demo-d-87', numeroDossier: 'CJ-2026-000087', statut: 'DELIVREE', libelle: 'Bulletin disponible dans votre espace',
        creeLe: '2026-10-14T09:05:00Z', echeance: '2026-10-15T09:11:00Z', montantFcfa: 1500, tarifProvisoire: true,
        bulletinId: 'demo-b3-412', bulletinNumero: 'B3-2026-0000412', pieceDemandee: null, motifRejet: null,
        frise: [
          { horodatage: '2026-10-14T09:05:00Z', statut: 'EN_ATTENTE_PAIEMENT', libelle: 'Demande enregistrée, en attente de paiement' },
          { horodatage: '2026-10-14T09:11:00Z', statut: 'EN_TRAITEMENT', libelle: 'Paiement confirmé, demande en cours de traitement' },
          { horodatage: '2026-10-14T09:12:00Z', statut: 'DELIVREE', libelle: 'Bulletin disponible dans votre espace' },
        ],
        avis: [
          { horodatage: '2026-10-14T09:05:00Z', canal: 'SMS', message: 'Casier judiciaire : demande CJ-2026-000087 enregistrée. Code de suivi : 482913. Le casier judiciaire ne vous demandera jamais de code par téléphone.' },
          { horodatage: '2026-10-14T09:12:00Z', canal: 'SMS', message: 'Casier judiciaire : votre bulletin (dossier CJ-2026-000087) est disponible dans votre espace. Le casier judiciaire ne vous demandera jamais de code par téléphone.' },
        ] },
      { id: 'demo-d-123', numeroDossier: 'CJ-2026-000123', statut: 'EN_ATTENTE_PIECE', libelle: 'Pièce complémentaire demandée',
        creeLe: '2026-10-16T09:58:00Z', echeance: iso(14), montantFcfa: 1500, tarifProvisoire: true, bulletinId: null, bulletinNumero: null,
        pieceDemandee: 'Pièce demandée : copie intégrale de l’acte de naissance', motifRejet: null,
        frise: [
          { horodatage: '2026-10-16T09:58:00Z', statut: 'EN_ATTENTE_PAIEMENT', libelle: 'Demande enregistrée, en attente de paiement' },
          { horodatage: '2026-10-16T10:04:00Z', statut: 'EN_TRAITEMENT', libelle: 'Paiement confirmé, demande en cours de traitement' },
          { horodatage: '2026-10-16T10:04:00Z', statut: 'A_TRAITER_PAR_AGENT', libelle: 'Vérification en cours par un agent du casier' },
          { horodatage: '2026-10-16T14:20:00Z', statut: 'EN_ATTENTE_PIECE', libelle: 'Pièce complémentaire demandée : copie intégrale de l’acte de naissance' },
        ],
        avis: [{ horodatage: '2026-10-16T14:20:00Z', canal: 'SMS', message: 'Casier judiciaire : une pièce est demandée pour le dossier CJ-2026-000123. Déposez-la depuis votre espace. Le casier judiciaire ne vous demandera jamais de code par téléphone.' }] },
    ],
    file: [
      { id: 'demo-f-131', numeroDossier: 'CJ-2026-000131', statut: 'A_TRAITER_PAR_AGENT', profil: 'GABONAIS_NE_AU_GABON',
        identite: { nom: 'ESSONO FICTIF', prenoms: 'Jean', dateNaissance: '1981-01-15', lieuNaissance: 'Oyem', nomPere: 'ESSONO Pierre' },
        motif: 'Homonyme : même nom et même prénom qu’une fiche existante, date de naissance différente (RG-06).',
        explicationRapprochement: 'Candidat ESSONO FICTIF Jean (Oyem) : noms identiques, date de naissance différente — cas douteux.',
        echeance: iso(5), restant: 'PT5H', alerte: false, enRetard: false },
      { id: 'demo-f-134', numeroDossier: 'CJ-2026-000134', statut: 'A_TRAITER_PAR_AGENT', profil: 'GABONAIS_NE_AU_GABON',
        identite: { nom: 'MAGANGA FICTIF', prenoms: 'Rose', dateNaissance: '1995-12-01', lieuNaissance: 'Port-Gentil' },
        motif: 'Identité non vérifiée : contrôle des pièces par un agent (IDT-07).',
        explicationRapprochement: 'Aucune fiche proche : absence certaine.', echeance: iso(2.5), restant: 'PT2H30M', alerte: true, enRetard: false },
      { id: 'demo-f-123', numeroDossier: 'CJ-2026-000123', statut: 'EN_ATTENTE_PIECE', profil: 'GABONAIS_NE_AU_GABON',
        identite: { nom: 'NDONG MBA', prenoms: 'Jean-Pierre', dateNaissance: '1988-03-14', lieuNaissance: 'Libreville' },
        motif: 'Pièce demandée : copie intégrale de l’acte de naissance', explicationRapprochement: null,
        echeance: iso(14), restant: 'PT14H', alerte: false, enRetard: false },
    ],
    candidats: {
      'ESSONO FICTIF': [{ reference: 'demo-p-essono', nom: 'ESSONO FICTIF', prenoms: 'Jean', dateNaissance: '1979-09-09', lieuNaissance: 'Oyem',
        nomPere: null, nomMere: null, numeroCnie: null, numeroPasseport: null, alias: [] }],
    },
    attente: [
      { id: 'demo-c-1', personneId: 'demo-p-nguema', nom: 'NGUEMA FICTIF', prenoms: 'Éric', dateNaissance: '1980-02-02', version: 1, remplaceId: null,
        juridiction: 'TPI-LIBREVILLE', dateDecision: '2024-01-15', numeroDecision: 'JUG-2024-0112', infraction: 'Vol simple (fictif)',
        qualification: 'DELIT', peines: [{ nature: 'EMPRISONNEMENT', dureeMois: 2, montantFcfa: null, sursis: 'AUCUN', dureeSursisMois: null }],
        saisiePar: 'demo-agent', saisieLe: iso(-3), saisieParMoi: false },
      { id: 'demo-c-2', personneId: 'demo-p-bivigou', nom: 'BIVIGOU FICTIF', prenoms: 'Alain', dateNaissance: '1990-06-20', version: 2, remplaceId: 'demo-c-0',
        juridiction: 'TPI-LIBREVILLE', dateDecision: '2023-05-03', numeroDecision: 'JUG-2023-0457', infraction: 'Abus de confiance (fictif) — correction de la peine',
        qualification: 'DELIT', peines: [{ nature: 'AMENDE', dureeMois: null, montantFcfa: 200000, sursis: 'AUCUN', dureeSursisMois: null }],
        saisiePar: 'demo-agent', saisieLe: iso(-26), saisieParMoi: false },
    ],
    tarifs,
    regles: [
      { id: 'demo-r-2', version: 2, dateEffet: iso(24 * 15).slice(0, 10), statut: 'PROPOSE', proposePar: 'demo-direction', proposeLe: iso(-48),
        validePar: null, valideLe: null, motifRejet: null, fictif: true, contenu: { reference: 'FICTIF — proposition de démonstration' },
        casDeTest: [{ libelle: 'B3 : une amende délictuelle n’apparaît pas' }, { libelle: 'B3 : un emprisonnement ferme figure' }] },
      { id: 'demo-r-1', version: 1, dateEffet: '2026-01-01', statut: 'PUBLIE', proposePar: 'import:regles-bulletins-fictives.json',
        proposeLe: '2026-10-01T08:00:00Z', validePar: 'import:regles-bulletins-fictives.json', valideLe: '2026-10-01T08:00:00Z',
        motifRejet: null, fictif: true, contenu: { reference: 'FICTIF — démonstration, sans valeur juridique' },
        casDeTest: [{ libelle: 'B3 : une amende délictuelle n’apparaît pas (néant)' }, { libelle: 'B3 : un emprisonnement ferme pour délit figure' },
          { libelle: 'B3 : sursis total exclu' }, { libelle: 'B2 : amende délictuelle retenue, contravention exclue' }, { libelle: 'B1 : la réhabilitation ne retire pas la condamnation' }] },
    ],
    journal: [],
    impressions: [
      { id: 'demo-imp-431', numero: 'B3-2026-0000431', nom: 'KOUMBA FICTIF', prenoms: 'Aline', dateNaissance: '1993-04-11',
        dateEmission: '2026-10-17T08:40:00Z', etat: 'A_VALIDER', validePar: null, valideLe: null, imprimeLe: null, feuillet: null, impressions: 0,
        paiement: 'Trésor public · quittance TP-2026-104498' },
      { id: 'demo-imp-433', numero: 'B3-2026-0000433', nom: 'MBOUMBA FICTIF', prenoms: 'Serge', dateNaissance: '1985-11-02',
        dateEmission: '2026-10-17T09:15:00Z', etat: 'A_VALIDER', validePar: null, valideLe: null, imprimeLe: null, feuillet: null, impressions: 0,
        paiement: 'Airtel Money' },
      { id: 'demo-imp-412', numero: 'B3-2026-0000412', nom: 'NDONG MBA', prenoms: 'Jean-Pierre', dateNaissance: '1988-03-14',
        dateEmission: '2026-10-14T09:12:00Z', etat: 'A_IMPRIMER', validePar: 'demo-validateur', valideLe: iso(-2), imprimeLe: null, feuillet: null,
        impressions: 0, paiement: 'Trésor public · quittance TP-2026-104377' },
      { id: 'demo-imp-420', numero: 'B3-2026-0000420', nom: 'ELLA FICTIF', prenoms: 'Nadège', dateNaissance: '1990-01-25',
        dateEmission: '2026-10-16T14:05:00Z', etat: 'IMPRIME', validePar: 'demo-validateur', valideLe: '2026-10-16T15:00:00Z',
        imprimeLe: '2026-10-16T15:02:00Z', feuillet: 'FS-2026-000118', impressions: 1, paiement: 'Moov Money' },
    ],
  };
}

const etat: Etat & { creeLe?: number } = ((globalThis as { __cjDemoEspaces?: Etat }).__cjDemoEspaces ??= initial());

/** La démonstration est réinitialisée toutes les heures, pour que chaque visiteur retrouve des dossiers à traiter. */
function rafraichir() {
  const maintenant = Date.now();
  if (etat.creeLe && maintenant - etat.creeLe < 3600_000) return;
  Object.assign(etat, initial(), { creeLe: maintenant });
}

function tracer(s: Session, action: string, objetType: string, objetId: string | null, finalite: string | null = null) {
  etat.journal.unshift({ numero: etat.journal.length + 1, horodatage: new Date().toISOString(), empreinte: randomUUID().replace(/-/g, '').padEnd(64, '0'),
    evenement: { acteurId: s.sujet, roles: s.roles.join(','), action, objetType, objetId, personneConcernee: null, finalite, details: {} } });
}

/** Avis de satisfaction de la démonstration : base fictive plus les avis donnés pendant la présentation. */
const avis: { notes: number[] } = ((globalThis as { __cjAvis?: { notes: number[] } }).__cjAvis ??= { notes: [] });
const BASE_AVIS = { somme: 412 * 4.6, nombre: 412 };
function avisDemo() {
  const nombre = BASE_AVIS.nombre + avis.notes.length;
  const somme = BASE_AVIS.somme + avis.notes.reduce((a, b) => a + b, 0);
  return { noteMoyenne: Math.round((somme / nombre) * 10) / 10, nombreAvis: nombre };
}
export function donnerAvisDemo(note: number) {
  avis.notes.push(note);
}

const ACCES_USAGER: AccesDonnees[] = [
  { horodatage: '2026-10-14T09:05:00Z', action: 'DEMANDE_B3_DEPOSEE', auteur: 'Vous', finalite: null },
  { horodatage: '2026-10-14T09:11:00Z', action: 'PAIEMENT_CONFIRME', auteur: 'Opérateur de paiement', finalite: null },
  { horodatage: '2026-10-14T09:11:30Z', action: 'RAPPROCHEMENT_AUTOMATIQUE', auteur: 'Traitement automatique', finalite: null },
  { horodatage: '2026-10-14T09:12:00Z', action: 'BULLETIN_EMIS', auteur: 'Traitement automatique', finalite: 'Bulletin n°3 au profit de la personne' },
  { horodatage: '2026-10-14T10:02:00Z', action: 'BULLETIN_TELECHARGE', auteur: 'Vous', finalite: null },
  { horodatage: '2026-10-16T09:58:00Z', action: 'DEMANDE_B3_DEPOSEE', auteur: 'Vous', finalite: null },
  { horodatage: '2026-10-16T14:18:00Z', action: 'FICHE_CONSULTEE', auteur: 'Agent du casier (greffe)', finalite: 'Traitement de la demande CJ-2026-000123' },
  { horodatage: '2026-10-16T14:20:00Z', action: 'PIECE_DEMANDEE', auteur: 'Agent du casier (greffe)', finalite: 'Copie intégrale de l’acte de naissance' },
];

export const demoEspaces = {
  acces: (s: Session) => {
    tracer(s, 'ACCES_DONNEES_CONSULTES', 'Demande', null);
    return s.roles.includes('R01') ? [...ACCES_USAGER].reverse() : [];
  },
  mesDemandes: (s: Session) => (rafraichir(), (s.roles.includes('R01') ? etat.demandes : [])),
  deposerPiece(s: Session, id: string) {
    const d = etat.demandes.find((x) => x.id === id && x.statut === 'EN_ATTENTE_PIECE');
    if (!d) return;
    d.statut = 'A_TRAITER_PAR_AGENT';
    d.libelle = 'Vérification en cours par un agent du casier';
    d.pieceDemandee = null;
    d.frise.push({ horodatage: new Date().toISOString(), statut: 'A_TRAITER_PAR_AGENT', libelle: 'Pièce reçue, vérification en cours' });
    const f = etat.file.find((x) => x.numeroDossier === d.numeroDossier);
    if (f) { f.statut = 'A_TRAITER_PAR_AGENT'; f.motif = 'Pièce reçue : à vérifier'; }
    tracer(s, 'PIECE_DEPOSEE', 'Demande', id);
  },
  file: () => (rafraichir(), etat.file),
  dossier: (id: string) => etat.file.find((x) => x.id === id) ?? null,
  candidats: (nom: string) => etat.candidats[nom.toUpperCase()] ?? [],
  deciderIdentite(s: Session, id: string, personne: string | null, motivation: string) {
    etat.file = etat.file.filter((x) => x.id !== id);
    tracer(s, 'IDENTITE_DECIDEE_PAR_AGENT', 'Demande', id, motivation);
    return personne;
  },
  demanderPiece(s: Session, id: string, piece: string) {
    const f = etat.file.find((x) => x.id === id);
    if (f) { f.statut = 'EN_ATTENTE_PIECE'; f.motif = `Pièce demandée : ${piece}`; }
    tracer(s, 'PIECE_DEMANDEE', 'Demande', id, piece);
  },
  rejeterDemande(s: Session, id: string, motif: string) {
    etat.file = etat.file.filter((x) => x.id !== id);
    tracer(s, 'DEMANDE_REJETEE', 'Demande', id, motif);
  },
  saisir(s: Session, c: SaisieCondamnation) {
    const id = `demo-c-${randomUUID().slice(0, 8)}`;
    etat.attente.push({ id, personneId: c.personneId ?? `demo-p-${randomUUID().slice(0, 6)}`, nom: c.nouvellePersonne?.nom ?? '—',
      prenoms: c.nouvellePersonne?.prenoms ?? '—', dateNaissance: c.nouvellePersonne?.dateNaissance ?? null, version: 1, remplaceId: null,
      juridiction: c.juridiction, dateDecision: c.dateDecision, numeroDecision: c.numeroDecision, infraction: c.infraction,
      qualification: c.qualification, peines: c.peines, saisiePar: s.sujet, saisieLe: new Date().toISOString(), saisieParMoi: false });
    tracer(s, 'CONDAMNATION_SAISIE', 'Condamnation', id);
    return id;
  },
  enAttente: (s: Session) => (rafraichir(), etat.attente.map((x) => ({ ...x, saisieParMoi: x.saisiePar === s.sujet }))),
  validerInscription(s: Session, id: string) {
    const c = etat.attente.find((x) => x.id === id);
    if (!c) return 'Inscription introuvable.';
    if (c.saisiePar === s.sujet) return 'Une seconde personne doit valider : vous ne pouvez pas valider votre propre saisie (HAB-02).';
    etat.attente = etat.attente.filter((x) => x.id !== id);
    tracer(s, 'CONDAMNATION_VALIDEE', 'Condamnation', id);
    return null;
  },
  rejeterInscription(s: Session, id: string, motif: string) {
    etat.attente = etat.attente.filter((x) => x.id !== id);
    tracer(s, 'CONDAMNATION_REJETEE', 'Condamnation', id, motif);
  },
  indicateurs: (): Indicateurs => ({
    demandes: { parStatut: { DELIVREE: 1284, A_TRAITER_PAR_AGENT: etat.file.filter((x) => x.statut === 'A_TRAITER_PAR_AGENT').length + 37,
      EN_ATTENTE_PIECE: 12, EN_TRAITEMENT: 4, EN_ATTENTE_PAIEMENT: 58, REJETEE: 9 }, total: 1406, delivrees: 1284,
      delivreesAutomatiquement: 1093, delaiMoyenHeures: 3.4, enRetard: 2, recettesFcfa: 1926000,
      satisfaction: avisDemo() },
    bulletins: { B3_EMIS: 1271, B3_REVOQUE: 3, B2_EMIS: 214 }, verifications: 2952,
  }),
  tarifs: () => (rafraichir(), etat.tarifs),
  proposerTarif(s: Session, t: Omit<TarifComplet, 'id' | 'statut' | 'proposePar' | 'validePar' | 'source'> & { source?: string }) {
    etat.tarifs.unshift({ ...t, source: t.source ?? 'Proposition', id: `demo-tarif-${randomUUID().slice(0, 6)}`, statut: 'PROPOSE', proposePar: s.sujet, validePar: null });
    tracer(s, 'TARIF_PROPOSE', 'Tarif', null);
  },
  validerTarif(s: Session, id: string) {
    const t = etat.tarifs.find((x) => x.id === id && x.statut === 'PROPOSE');
    if (!t) return 'Tarif introuvable ou déjà traité.';
    if (t.proposePar === s.sujet) return 'Une seconde personne doit valider ce tarif (ADM-04).';
    t.statut = 'VALIDE';
    t.validePar = s.sujet;
    tracer(s, 'TARIF_VALIDE', 'Tarif', id);
    return null;
  },
  regles: () => (rafraichir(), etat.regles),
  decisionRegles(s: Session, id: string, valider: boolean, motif?: string) {
    const r = etat.regles.find((x) => x.id === id && x.statut === 'PROPOSE');
    if (!r) return 'Version introuvable ou déjà traitée.';
    if (r.proposePar === s.sujet) return 'Une seconde personne doit valider (HAB-02).';
    r.statut = valider ? 'PUBLIE' : 'REJETE';
    r.validePar = s.sujet;
    r.valideLe = new Date().toISOString();
    r.motifRejet = valider ? null : motif ?? null;
    tracer(s, valider ? 'PARAMETRES_JURIDIQUES_PUBLIES' : 'PARAMETRES_JURIDIQUES_REJETES', 'JeuDeRegles', id);
    return null;
  },
  fileImpression: (s: Session) => {
    rafraichir();
    tracer(s, 'FILE_IMPRESSION_CONSULTEE', 'Bulletin', null);
    return etat.impressions;
  },
  validerImpression(s: Session, id: string) {
    const b = etat.impressions.find((x) => x.id === id);
    if (!b) return 'Bulletin introuvable.';
    if (b.etat !== 'A_VALIDER') return 'Ce bulletin est déjà validé pour l’impression.';
    Object.assign(b, { etat: 'A_IMPRIMER', validePar: s.sujet, valideLe: new Date().toISOString() });
    tracer(s, 'BULLETIN_VALIDE_POUR_IMPRESSION', 'Bulletin', b.numero);
    return null;
  },
  /** Renvoie le PDF scellé à imprimer, ou un message de refus. */
  imprimer(s: Session, id: string, feuillet: string, motif: string | null): { pdf: Buffer } | { erreur: string } {
    const b = etat.impressions.find((x) => x.id === id);
    if (!b) return { erreur: 'Bulletin introuvable.' };
    if (b.etat === 'A_VALIDER') return { erreur: 'Validez le bulletin avant de l’imprimer.' };
    if (b.etat === 'REVOQUE') return { erreur: 'Ce bulletin est révoqué : il ne peut pas être imprimé.' };
    const numeroFeuillet = feuillet.trim().toUpperCase();
    if (!numeroFeuillet) return { erreur: 'Indiquez le numéro du feuillet sécurisé.' };
    if (etat.impressions.some((x) => x.feuillet === numeroFeuillet)) return { erreur: 'Ce feuillet a déjà été utilisé.' };
    const reimpression = b.impressions > 0;
    if (reimpression && !motif?.trim()) return { erreur: 'Le motif de la réimpression est obligatoire.' };
    Object.assign(b, { etat: 'IMPRIME', imprimeLe: new Date().toISOString(), feuillet: numeroFeuillet, impressions: b.impressions + 1 });
    tracer(s, reimpression ? 'BULLETIN_REIMPRIME' : 'BULLETIN_IMPRIME', 'Bulletin', b.numero, reimpression ? motif : null);
    return { pdf: Buffer.from(SPECIMENS_IMPRESSION[b.numero] ?? SPECIMEN_B3, 'base64') };
  },
  journal: (s: Session) => {
    tracer(s, 'JOURNAL_CONSULTE', 'Journal', null);
    return etat.journal.slice(0, 50);
  },
};
