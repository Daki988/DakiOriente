import 'server-only';
import { randomUUID } from 'node:crypto';

import { tarifsDemo } from './demo';
import type { Session } from './session';
import { SPECIMEN_B3 } from './specimen-b3';
import { SPECIMENS_IMPRESSION } from './specimens-impression';
import type {
  AccesDonnees, BulletinAImprimer, CategorieReclamation, CompteAgent, CompteCree, DemandeUsager, DossierAgent, EcartRapprochement, EntreeJournal,
  EtapeParcours, Indicateurs, NouvellePreplainte, Preplainte, PreplainteDeposee, SuiviPreplainte, InscriptionEnAttente, JeuDeRegles, PaiementEncaisse, ParcoursDossier, ProfilIdentite, Reclamation,
  ResultatRapprochement, SaisieCondamnation, SyntheseRecettes, TarifComplet,
} from './types';

/**
 * Espaces en mode démonstration (ENV-03, ENV-04) : données FICTIVES en mémoire, réinitialisées au redémarrage.
 * Les actions modifient ces données et alimentent un journal simulé, pour présenter les parcours sans service métier.
 */
const iso = (decalageHeures: number) => new Date(Date.now() + decalageHeures * 3600_000).toISOString();
const jour = (decalageJours: number) => new Date(Date.now() - decalageJours * 86_400_000).toISOString().slice(0, 10);

type Etat = {
  demandes: DemandeUsager[]; file: DossierAgent[]; candidats: Record<string, ProfilIdentite[]>;
  attente: InscriptionEnAttente[]; tarifs: TarifComplet[]; regles: JeuDeRegles[]; journal: EntreeJournal[];
  impressions: BulletinAImprimer[]; reclamations: (Reclamation & { demandeur: string })[]; agents: CompteAgent[]; preplaintes: (Preplainte & { code: string })[];
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
          { libelle: 'B3 : sursis total exclu' }] },
    ],
    journal: [],
    reclamations: [
      { id: 'demo-rec-1', numero: 'RC-2026-000014', demandeur: 'demo-usager', numeroDossier: 'CJ-2026-000087', categorie: 'BULLETIN_NON_RECU',
        message: 'Je n’ai pas reçu le SMS m’annonçant que mon bulletin était prêt.', statut: 'TRAITEE', creeLe: '2026-10-14T11:20:00Z',
        prisEnChargeLe: '2026-10-14T13:02:00Z', reponse: 'Votre bulletin est bien disponible dans votre espace depuis le 14 octobre à 9 h 12. Le SMS a été envoyé au numéro déclaré ; vérifiez-le dans votre profil.',
        traiteLe: '2026-10-14T13:10:00Z' },
      { id: 'demo-rec-2', numero: 'RC-2026-000021', demandeur: 'demo-autre-1', numeroDossier: 'CJ-2026-000138', categorie: 'PAIEMENT',
        message: 'J’ai payé 1 500 FCFA par Airtel Money, l’argent est débité mais le dossier est toujours en attente de paiement.', statut: 'OUVERTE',
        creeLe: iso(-5), prisEnChargeLe: null, reponse: null, traiteLe: null },
      { id: 'demo-rec-3', numero: 'RC-2026-000022', demandeur: 'demo-autre-2', numeroDossier: null, categorie: 'ERREUR_CASIER',
        message: 'Mon bulletin mentionne une condamnation qui ne me concerne pas : il s’agit d’un homonyme né à Oyem.', statut: 'EN_COURS',
        creeLe: iso(-26), prisEnChargeLe: iso(-20), reponse: null, traiteLe: null },
    ],
    preplaintes: [
      { id: 'demo-pp-1', numero: 'PP-2026-000031', code: '271828', nature: 'VOL', dateFaits: jour(2), heureFaits: 'vers 19 h', ville: 'Libreville',
        lieu: 'Carrefour Rio, arrêt de taxi', description: 'Deux individus à moto m’ont arraché mon téléphone et mon sac en passant, puis sont partis vers Nzeng-Ayong.',
        auteurConnu: false, auteurInfos: 'Deux hommes, moto rouge sans plaque visible', biens: 'Téléphone portable, sac à main, 25 000 FCFA en espèces',
        prejudiceFcfa: 210000, declarant: { nom: 'MBOUMBA FICTIF', prenoms: 'Laure', dateNaissance: '1996-02-14', telephone: '+24177000101', email: null, adresse: 'Libreville', entreprise: null },
        service: 'Commissariat central de Libreville', statut: 'RECUE', creeLe: iso(-20), expireLe: iso(24 * 29), rendezVousLe: null, rendezVousLieu: null, signeeLe: null, numeroProcedure: null },
      { id: 'demo-pp-2', numero: 'PP-2026-000029', code: '314159', nature: 'ESCROQUERIE', dateFaits: jour(5), heureFaits: null, ville: 'Owendo',
        lieu: 'Achat en ligne sur un réseau social', description: 'J’ai payé 85 000 FCFA par mobile money pour un téléphone jamais livré ; le vendeur ne répond plus.',
        auteurConnu: true, auteurInfos: 'Compte « Bonnes affaires Libreville », numéro +241 66 00 00 00 (fictif)', biens: null, prejudiceFcfa: 85000,
        declarant: { nom: 'OBIANG FICTIF', prenoms: 'Serge', dateNaissance: '1988-09-30', telephone: '+24166000202', email: 'serge.obiang@exemple.ga', adresse: null, entreprise: null },
        service: 'Commissariat d’Owendo', statut: 'RENDEZ_VOUS_FIXE', creeLe: iso(-96), expireLe: iso(24 * 26), rendezVousLe: iso(26), rendezVousLieu: 'Commissariat d’Owendo, bureau des plaintes', signeeLe: null, numeroProcedure: null },
    ],
    agents: [
      { identifiant: 'demo-agent', login: 'clarisse.moussavou', prenom: 'Clarisse', nom: 'MOUSSAVOU', email: 'clarisse.moussavou@exemple.ga', role: 'R06', juridiction: 'TPI-LIBREVILLE', actif: true, creeLe: '2026-09-02T08:00:00Z' },
      { identifiant: 'demo-greffier', login: 'herve.obame', prenom: 'Hervé', nom: 'OBAME', email: 'herve.obame@exemple.ga', role: 'R07', juridiction: 'TPI-LIBREVILLE', actif: true, creeLe: '2026-09-02T08:05:00Z' },
      { identifiant: 'demo-validateur', login: 'jeanne-marie.ndong', prenom: 'Jeanne-Marie', nom: 'NDONG', email: 'jm.ndong@exemple.ga', role: 'R07', juridiction: 'TPI-LIBREVILLE', actif: true, creeLe: '2026-09-03T09:00:00Z' },
      { identifiant: 'demo-magistrat', login: 'sylvie.nze', prenom: 'Sylvie', nom: 'NZE', email: 'sylvie.nze@exemple.ga', role: 'R05', juridiction: 'TPI-LIBREVILLE', actif: true, creeLe: '2026-09-04T10:00:00Z' },
      { identifiant: 'demo-direction', login: 'paul.mbadinga', prenom: 'Paul', nom: 'MBADINGA', email: 'paul.mbadinga@exemple.ga', role: 'R08', juridiction: null, actif: true, creeLe: '2026-09-01T08:00:00Z' },
      { identifiant: 'demo-comptable', login: 'gisele.nziengui', prenom: 'Gisèle', nom: 'NZIENGUI', email: 'gisele.nziengui@exemple.ga', role: 'R10', juridiction: null, actif: true, creeLe: '2026-09-05T08:00:00Z' },
      { identifiant: 'demo-support', login: 'patrick.mouele', prenom: 'Patrick', nom: 'MOUELE', email: 'patrick.mouele@exemple.ga', role: 'R11', juridiction: null, actif: true, creeLe: '2026-09-05T08:30:00Z' },
      { identifiant: 'demo-auditeur', login: 'marc.essono', prenom: 'Marc', nom: 'ESSONO', email: 'marc.essono@exemple.ga', role: 'R12', juridiction: null, actif: true, creeLe: '2026-09-06T08:00:00Z' },
      { identifiant: 'demo-ancien', login: 'luc.bekale', prenom: 'Luc', nom: 'BEKALE', email: 'luc.bekale@exemple.ga', role: 'R06', juridiction: 'TPI-PORT-GENTIL', actif: false, creeLe: '2026-05-10T08:00:00Z' },
    ],
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


// ---------- Données de démonstration : comptabilité et suivi de dossier ----------
const MOYENS = ['TRESOR', 'AIRTEL_MONEY', 'MOOV_MONEY', 'TRESOR', 'CARTE', 'AIRTEL_MONEY'] as const;
const PREFIXES: Record<string, string> = { TRESOR: 'TRESOR-TP-2026-', AIRTEL_MONEY: 'AIRTEL-', MOOV_MONEY: 'MOOV-', CARTE: 'CARTE-' };

/** Paiements fictifs des 30 derniers jours, stables d'un affichage à l'autre. */
function paiementsFictifs(): PaiementEncaisse[] {
  const liste: PaiementEncaisse[] = [];
  for (let j = 0; j < 30; j++) {
    const nombre = 3 + ((j * 7) % 5);
    for (let k = 0; k < nombre; k++) {
      const n = 104300 + j * 10 + k;
      const moyen = MOYENS[(j + k) % MOYENS.length];
      const heure = String(8 + ((k * 3 + j) % 9)).padStart(2, '0');
      liste.push({ numeroDossier: `CJ-2026-${String(900 - j * 10 - k).padStart(6, '0')}`, reference: `${PREFIXES[moyen]}${n}`, moyen,
        montantFcfa: 1500, payeLe: `${jour(j)}T${heure}:${String((k * 13) % 60).padStart(2, '0')}:00Z`, tarifProvisoire: true });
    }
  }
  return liste.sort((a, b) => a.payeLe.localeCompare(b.payeLe));
}
const dansPeriode = (p: PaiementEncaisse, du: string, au: string) => p.payeLe.slice(0, 10) >= du && p.payeLe.slice(0, 10) <= au;

function lireReleve(releve: string): Map<string, number> | string {
  const lignes = new Map<string, number>();
  const brutes = releve.split(/\r?\n/);
  for (let i = 0; i < brutes.length; i++) {
    const ligne = brutes[i].trim();
    if (!ligne) continue;
    const champs = ligne.split(/[;,\t]/);
    if (champs.length < 2) return `Ligne ${i + 1} du relevé illisible : « référence;montant » attendu.`;
    const montant = champs[1].replace(/[\s  ]/g, '');
    if (!/^\d{1,12}$/.test(montant)) {
      if (i === 0) continue;
      return `Ligne ${i + 1} du relevé : montant invalide.`;
    }
    const cle = champs[0].trim().toUpperCase();
    if (lignes.has(cle)) return `La référence ${cle} figure deux fois dans le relevé.`;
    lignes.set(cle, Number(montant));
  }
  return lignes.size ? lignes : 'Le relevé ne contient aucune ligne de paiement.';
}

const LIBELLES_ROLES_AGENTS: Record<string, string> = {
  R02: 'Agent consulaire', R05: 'Magistrat, Parquet', R06: 'Agent du casier (greffe)', R07: 'Greffier en chef',
  R08: 'Direction centrale (affaires pénales)', R09: 'Décideur', R10: 'Comptable, régisseur', R11: 'Support usagers', R12: 'Auditeur', R14: 'Vérificateur public',
};
const AVEC_JURIDICTION = ['R05', 'R06', 'R07'];

/** Parcours fictifs : un dossier délivré automatiquement puis imprimé et vérifié, un dossier traité par un agent avec pièce. */
function etape(depuis: string, h: string, phase: EtapeParcours['phase'], action: string, libelle: string, acteur: string, precision: string | null = null): EtapeParcours {
  return { horodatage: h, phase, action, libelle, acteur, precision, minutes: Math.round((Date.parse(h) - Date.parse(depuis)) / 60000) };
}
const PARCOURS: Record<string, ParcoursDossier> = {
  'CJ-2026-000087': { verifications: 2, dossier: { numeroDossier: 'CJ-2026-000087', statut: 'DELIVREE', profil: 'GABONAIS_NE_AU_GABON',
    deposeLe: '2026-10-14T09:05:00Z', payeLe: '2026-10-14T09:11:00Z', moyenPaiement: 'Trésor public', montantFcfa: 1500, bulletinNumero: 'B3-2026-0000412',
    delaiDelivranceMinutes: 1, etapes: [
      etape('2026-10-14T09:05:00Z', '2026-10-14T09:05:00Z', 'DEMANDE', 'DEMANDE_B3_DEPOSEE', 'Demande déposée en ligne', 'Usager'),
      etape('2026-10-14T09:05:00Z', '2026-10-14T09:11:00Z', 'PAIEMENT', 'PAIEMENT_CONFIRME', 'Paiement au Trésor confirmé (quittance TP-2026-104377)', 'Trésor public'),
      etape('2026-10-14T09:05:00Z', '2026-10-14T09:11:30Z', 'TRAITEMENT', 'RAPPROCHEMENT_AUTOMATIQUE', 'Identité rapprochée automatiquement du registre', 'Traitement automatique', 'Identité certaine : aucune intervention humaine'),
      etape('2026-10-14T09:05:00Z', '2026-10-14T09:12:00Z', 'DELIVRANCE', 'B3_EMIS', 'Bulletin n°3 scellé émis', 'Traitement automatique', 'B3-2026-0000412'),
      etape('2026-10-14T09:05:00Z', '2026-10-14T10:02:00Z', 'DELIVRANCE', 'BULLETIN_TELECHARGE', 'Bulletin téléchargé', 'Usager'),
      etape('2026-10-14T09:05:00Z', '2026-10-15T08:40:00Z', 'IMPRESSION', 'BULLETIN_VALIDE_POUR_IMPRESSION', 'Bulletin validé pour l’impression', 'Greffier en chef', 'Pièce d’identité contrôlée au guichet'),
      etape('2026-10-14T09:05:00Z', '2026-10-15T08:42:00Z', 'IMPRESSION', 'BULLETIN_IMPRIME', 'Bulletin imprimé sur feuillet sécurisé', 'Greffier en chef', 'Feuillet FS-2026-000101'),
    ] } },
  'CJ-2026-000123': { verifications: 0, dossier: { numeroDossier: 'CJ-2026-000123', statut: 'EN_ATTENTE_PIECE', profil: 'GABONAIS_NE_AU_GABON',
    deposeLe: '2026-10-16T09:58:00Z', payeLe: '2026-10-16T10:04:00Z', moyenPaiement: 'Opérateur de paiement (Airtel Money)', montantFcfa: 1500,
    bulletinNumero: null, delaiDelivranceMinutes: null, etapes: [
      etape('2026-10-16T09:58:00Z', '2026-10-16T09:58:00Z', 'DEMANDE', 'DEMANDE_B3_DEPOSEE', 'Demande déposée en ligne', 'Usager'),
      etape('2026-10-16T09:58:00Z', '2026-10-16T10:04:00Z', 'PAIEMENT', 'PAIEMENT_CONFIRME', 'Paiement confirmé', 'Opérateur de paiement'),
      etape('2026-10-16T09:58:00Z', '2026-10-16T10:04:30Z', 'TRAITEMENT', 'RAPPROCHEMENT_AUTOMATIQUE', 'Identité rapprochée automatiquement du registre', 'Traitement automatique', 'Identité incertaine : dossier confié à un agent'),
      etape('2026-10-16T09:58:00Z', '2026-10-16T14:18:00Z', 'TRAITEMENT', 'FICHE_CONSULTEE', 'Fiche du casier consultée', 'Agent du casier (greffe)', 'Traitement de la demande CJ-2026-000123'),
      etape('2026-10-16T09:58:00Z', '2026-10-16T14:20:00Z', 'TRAITEMENT', 'PIECE_DEMANDEE', 'Pièce complémentaire demandée', 'Agent du casier (greffe)', 'Copie intégrale de l’acte de naissance — délai de 24 heures suspendu'),
    ] } },
};

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
    bulletins: { B3_EMIS: 1271, B3_REVOQUE: 3 }, verifications: 2952,
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
  /** RG-09 : contrôle du fichier comme le service (type réel, 5 Mo au plus), puis reprise du traitement. */
  deposerFichier(s: Session, id: string, nom: string, c: Uint8Array): string | null {
    if (!c.length) return 'Le fichier est vide.';
    if (c.length > 5 * 1024 * 1024) return 'Le fichier dépasse 5 Mo.';
    const pdf = c[0] === 0x25 && c[1] === 0x50 && c[2] === 0x44 && c[3] === 0x46;
    const jpeg = c[0] === 0xff && c[1] === 0xd8 && c[2] === 0xff;
    const png = c[0] === 0x89 && c[1] === 0x50 && c[2] === 0x4e && c[3] === 0x47;
    if (!pdf && !jpeg && !png) return 'Format non accepté : déposez un PDF, une photo JPEG ou PNG.';
    const d = etat.demandes.find((x) => x.id === id && x.statut === 'EN_ATTENTE_PIECE');
    if (!d) return 'Aucune pièce n’est attendue pour ce dossier.';
    demoEspaces.deposerPiece(s, id);
    d.frise[d.frise.length - 1].libelle = `Pièce reçue (${nom.replace(/^.*[\\/]/, '').slice(0, 80)}), vérification en cours`;
    return null;
  },

  // ---------- Réclamations ----------
  mesReclamations: (s: Session): Reclamation[] => (rafraichir(), etat.reclamations.filter((r) => r.demandeur === s.sujet)),
  deposerReclamation(s: Session, r: { categorie: CategorieReclamation; numeroDossier: string | null; message: string }) {
    const numero = `RC-2026-${String(23 + etat.reclamations.length).padStart(6, '0')}`;
    etat.reclamations.unshift({ id: `demo-rec-${randomUUID().slice(0, 6)}`, numero, demandeur: s.sujet, numeroDossier: r.numeroDossier?.toUpperCase() ?? null,
      categorie: r.categorie, message: r.message, statut: 'OUVERTE', creeLe: new Date().toISOString(), prisEnChargeLe: null, reponse: null, traiteLe: null });
    tracer(s, 'RECLAMATION_DEPOSEE', 'Reclamation', numero);
  },
  fileReclamations: (s: Session): Reclamation[] => {
    rafraichir();
    tracer(s, 'RECLAMATIONS_CONSULTEES', 'Reclamation', null);
    return [...etat.reclamations].sort((a, b) => Number(a.statut === 'TRAITEE') - Number(b.statut === 'TRAITEE') || a.creeLe.localeCompare(b.creeLe));
  },
  prendreEnCharge(s: Session, id: string): string | null {
    const r = etat.reclamations.find((x) => x.id === id);
    if (!r) return 'Réclamation introuvable.';
    if (r.statut !== 'OUVERTE') return 'Cette réclamation est déjà prise en charge.';
    Object.assign(r, { statut: 'EN_COURS', prisEnChargeLe: new Date().toISOString() });
    tracer(s, 'RECLAMATION_PRISE_EN_CHARGE', 'Reclamation', r.numero);
    return null;
  },
  repondreReclamation(s: Session, id: string, reponse: string): string | null {
    const r = etat.reclamations.find((x) => x.id === id);
    if (!r) return 'Réclamation introuvable.';
    if (r.statut === 'TRAITEE') return 'Cette réclamation a déjà reçu une réponse.';
    if (reponse.trim().length < 10) return 'La réponse à l’usager doit être rédigée (10 caractères au moins).';
    const maintenant = new Date().toISOString();
    Object.assign(r, { statut: 'TRAITEE', reponse: reponse.trim(), traiteLe: maintenant, prisEnChargeLe: r.prisEnChargeLe ?? maintenant });
    tracer(s, 'RECLAMATION_TRAITEE', 'Reclamation', r.numero);
    return null;
  },

  // ---------- Comptabilité ----------
  paiements: (du: string, au: string) => paiementsFictifs().filter((p) => dansPeriode(p, du, au)),
  synthese(du: string, au: string): SyntheseRecettes {
    const liste = demoEspaces.paiements(du, au);
    const totalParMoyen: Record<string, number> = {};
    const nombreParMoyen: Record<string, number> = {};
    for (const p of liste) {
      totalParMoyen[p.moyen] = (totalParMoyen[p.moyen] ?? 0) + p.montantFcfa;
      nombreParMoyen[p.moyen] = (nombreParMoyen[p.moyen] ?? 0) + 1;
    }
    return { du, au, nombre: liste.length, totalFcfa: liste.reduce((n, p) => n + p.montantFcfa, 0), totalParMoyen, nombreParMoyen };
  },
  rapprocher(s: Session, du: string, au: string, releve: string): ResultatRapprochement | { erreur: string } {
    const lignes = lireReleve(releve);
    if (typeof lignes === 'string') return { erreur: lignes };
    const plateforme = new Map(demoEspaces.paiements(du, au).map((p) => [p.reference.toUpperCase(), p.montantFcfa]));
    const ecarts: EcartRapprochement[] = [];
    let concordantes = 0;
    for (const [reference, montant] of lignes) {
      const m = plateforme.get(reference);
      if (m === undefined) ecarts.push({ reference, montantPlateforme: null, montantReleve: montant, nature: 'ABSENT_DE_LA_PLATEFORME' });
      else if (m !== montant) ecarts.push({ reference, montantPlateforme: m, montantReleve: montant, nature: 'MONTANT_DIFFERENT' });
      else concordantes++;
    }
    for (const [reference, m] of plateforme) {
      if (!lignes.has(reference)) ecarts.push({ reference, montantPlateforme: m, montantReleve: null, nature: 'ABSENT_DU_RELEVE' });
    }
    tracer(s, 'RAPPROCHEMENT_PAIEMENTS', 'Paiements', `${du}/${au}`);
    return { du, au, lignesReleve: lignes.size, concordantes, totalReleveFcfa: [...lignes.values()].reduce((a, b) => a + b, 0),
      totalPlateformeFcfa: [...plateforme.values()].reduce((a, b) => a + b, 0), ecarts };
  },
  exporter(s: Session, du: string, au: string): string {
    tracer(s, 'PAIEMENTS_EXPORTES', 'Paiements', `${du}/${au}`);
    return 'numero_dossier;reference;moyen;montant_fcfa;paye_le;tarif_provisoire\n' + demoEspaces.paiements(du, au)
      .map((p) => `${p.numeroDossier};${p.reference};${p.moyen};${p.montantFcfa};${p.payeLe};${p.tarifProvisoire ? 'oui' : 'non'}`).join('\n') + '\n';
  },

  // ---------- Agents ----------
  agents: (): CompteAgent[] => (rafraichir(), [...etat.agents].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))),
  rolesAttribuables: () => LIBELLES_ROLES_AGENTS,
  creerAgent(s: Session, a: { login: string; prenom: string; nom: string; email: string; role: string; juridiction: string | null }): CompteCree | { erreur: string } {
    const login = a.login.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(login)) return { erreur: 'Identifiant invalide : 3 à 50 caractères, lettres minuscules, chiffres, point ou tiret.' };
    if (!LIBELLES_ROLES_AGENTS[a.role]) return { erreur: 'Ce rôle ne s’attribue pas depuis la plateforme.' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email.trim())) return { erreur: 'Adresse électronique invalide.' };
    const juridiction = AVEC_JURIDICTION.includes(a.role) ? (a.juridiction ?? '').trim().toUpperCase() : null;
    if (juridiction !== null && !/^[A-Z0-9-]{3,40}$/.test(juridiction)) return { erreur: 'La juridiction de rattachement est obligatoire pour ce rôle (par exemple TPI-LIBREVILLE).' };
    if (etat.agents.some((x) => x.login === login || x.email === a.email.trim().toLowerCase())) return { erreur: 'Cet identifiant ou cette adresse électronique est déjà utilisé.' };
    const compte: CompteAgent = { identifiant: `demo-agent-${randomUUID().slice(0, 8)}`, login, prenom: a.prenom.trim(), nom: a.nom.trim().toUpperCase(),
      email: a.email.trim().toLowerCase(), role: a.role, juridiction, actif: true, creeLe: new Date().toISOString() };
    etat.agents.push(compte);
    tracer(s, 'AGENT_CREE', 'Compte', compte.identifiant);
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const motDePasse = Array.from(crypto.getRandomValues(new Uint8Array(16)), (o) => alphabet[o % alphabet.length]).join('');
    return { compte, motDePasseProvisoire: motDePasse };
  },
  changerRoleAgent(s: Session, id: string, role: string, juridiction: string | null): string | null {
    if (id === s.sujet) return 'Vous ne pouvez pas modifier votre propre compte.';
    const c = etat.agents.find((x) => x.identifiant === id);
    if (!c) return 'Compte introuvable.';
    if (!LIBELLES_ROLES_AGENTS[role]) return 'Ce rôle ne s’attribue pas depuis la plateforme.';
    const j = AVEC_JURIDICTION.includes(role) ? (juridiction ?? c.juridiction ?? '').trim().toUpperCase() : null;
    if (j !== null && !/^[A-Z0-9-]{3,40}$/.test(j)) return 'La juridiction de rattachement est obligatoire pour ce rôle (par exemple TPI-LIBREVILLE).';
    Object.assign(c, { role, juridiction: j });
    tracer(s, 'AGENT_ROLE_MODIFIE', 'Compte', id);
    return null;
  },
  activerAgent(s: Session, id: string, actif: boolean, motif: string | null): string | null {
    if (id === s.sujet) return 'Vous ne pouvez pas modifier votre propre compte.';
    if (!actif && !motif?.trim()) return 'Le motif de la désactivation est obligatoire.';
    const c = etat.agents.find((x) => x.identifiant === id);
    if (!c) return 'Compte introuvable.';
    if (c.actif === actif) return actif ? 'Ce compte est déjà actif.' : 'Ce compte est déjà désactivé.';
    c.actif = actif;
    tracer(s, actif ? 'AGENT_REACTIVE' : 'AGENT_DESACTIVE', 'Compte', id, motif);
    return null;
  },

  // ---------- Suivi d'un dossier ----------
  parcours(s: Session, numero: string): ParcoursDossier | null {
    const p = PARCOURS[numero.trim().toUpperCase()] ?? null;
    if (p) tracer(s, 'PARCOURS_CONSULTE', 'Demande', p.dossier.numeroDossier);
    return p;
  },
  exemplesParcours: () => Object.keys(PARCOURS),

  // ---------- Pré-plaintes (officier de police judiciaire) ----------
  preplaintes(s: Session): Preplainte[] {
    rafraichir();
    tracer(s, 'PREPLAINTES_CONSULTEES', 'Preplainte', null);
    const ordre = { RECUE: 0, RENDEZ_VOUS_FIXE: 1, PLAINTE_SIGNEE: 2, EXPIREE: 3 } as const;
    return listePreplaintes().map(({ code: _c, ...p }) => p).sort((a, b) => ordre[a.statut] - ordre[b.statut] || a.creeLe.localeCompare(b.creeLe));
  },
  fixerRendezVous(s: Session, id: string, le: string, lieu: string): string | null {
    const p = listePreplaintes().find((x) => x.id === id);
    if (!p) return 'Pré-plainte introuvable.';
    if (p.statut !== 'RECUE' && p.statut !== 'RENDEZ_VOUS_FIXE') return 'Cette pré-plainte n’attend plus de rendez-vous.';
    if (!le || Date.parse(le) < Date.now()) return 'Le rendez-vous doit être fixé dans le futur.';
    if (!lieu.trim()) return 'Indiquez le lieu du rendez-vous.';
    Object.assign(p, { statut: 'RENDEZ_VOUS_FIXE', rendezVousLe: new Date(le).toISOString(), rendezVousLieu: lieu.trim() });
    tracer(s, 'PREPLAINTE_RENDEZ_VOUS_FIXE', 'Preplainte', p.numero);
    return null;
  },
  constaterSignature(s: Session, id: string, numeroProcedure: string): string | null {
    const p = listePreplaintes().find((x) => x.id === id);
    if (!p) return 'Pré-plainte introuvable.';
    if (p.statut !== 'RECUE' && p.statut !== 'RENDEZ_VOUS_FIXE') return 'Cette pré-plainte est déjà close.';
    if (!numeroProcedure.trim()) return 'Indiquez le numéro de procédure de la plainte signée.';
    Object.assign(p, { statut: 'PLAINTE_SIGNEE', signeeLe: new Date().toISOString(), numeroProcedure: numeroProcedure.trim() });
    tracer(s, 'PREPLAINTE_SIGNEE', 'Preplainte', p.numero, numeroProcedure.trim());
    return null;
  },
};

/** Les pré-plaintes de démonstration (état partagé avec l'espace de l'officier de police judiciaire). */
function listePreplaintes() {
  return (etat.preplaintes ??= initial().preplaintes);
}

/** Dépôt public d'une pré-plainte en démonstration : mêmes contrôles que le service, numéro et code fictifs. */
export function deposerPreplainteDemo(p: NouvellePreplainte): PreplainteDeposee {
  const liste = listePreplaintes();
  const numero = `PP-2026-${String(32 + liste.length).padStart(6, '0')}`;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const maintenant = new Date();
  const expireLe = new Date(maintenant.getTime() + 30 * 86_400_000).toISOString();
  liste.push({ ...p, id: `demo-pp-${randomUUID().slice(0, 6)}`, numero, code, declarant: { ...p.declarant, nom: p.declarant.nom.toUpperCase() },
    statut: 'RECUE', creeLe: maintenant.toISOString(), expireLe, rendezVousLe: null, rendezVousLieu: null, signeeLe: null, numeroProcedure: null });
  return { numero, code, expireLe, service: p.service };
}

export function suiviPreplainteDemo(numero: string, code: string): SuiviPreplainte | null {
  const p = listePreplaintes().find((x) => x.numero === numero.trim().toUpperCase() && x.code === code.trim());
  return p ? { numero: p.numero, statut: p.statut, deposeeLe: p.creeLe, expireLe: p.expireLe, service: p.service,
    rendezVousLe: p.rendezVousLe, rendezVousLieu: p.rendezVousLieu, signeeLe: p.signeeLe } : null;
}
