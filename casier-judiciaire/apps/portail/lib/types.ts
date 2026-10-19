/** Contrats de l'API du service Casier (OpenAPI : /v3/api-docs), côté portail. */
export type Tarif = {
  acte: string; profil: string; montantFcfa: number; dateEffet: string; provisoire: boolean; libelle: string; source: string;
};

export type StatutVerification = 'VALIDE' | 'EXPIRE' | 'REVOQUE' | 'INCONNU';

export type ResultatVerification = {
  authentique: boolean; statut: StatutVerification; type: 'B1' | 'B2' | 'B3' | null; numero: string | null;
  dateEmission: string | null; dateExpiration: string | null; nom: string | null; prenoms: string | null; dateNaissance: string | null;
};

export type StatutDemande = 'EN_ATTENTE_PAIEMENT' | 'EN_TRAITEMENT' | 'A_TRAITER_PAR_AGENT' | 'EN_ATTENTE_PIECE' | 'DELIVREE' | 'REJETEE';

export type SuiviDemande = {
  numeroDossier: string; statut: StatutDemande; libelle: string; echeance: string | null; numeroBulletin: string | null;
  frise: { horodatage: string; statut: StatutDemande; libelle: string }[];
};

export type NouvelleDemande = {
  profil: string;
  identite: {
    nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string; paysNaissance?: string;
    nomPere?: string; nomMere?: string; nationalite?: string; numeroCnie?: string; numeroPasseport?: string;
  };
  telephone?: string; email?: string;
  /** Paiement au Trésor public : la demande reste en attente de paiement jusqu'à la saisie de la quittance. */
  paiementTresor?: boolean;
};

export type DemandeDeposee = {
  numeroDossier: string; codeSuivi: string; montantFcfa: number; tarifProvisoire: boolean; demo: boolean; paiementTresor?: boolean;
  /** Paiement électronique en attente de la confirmation de l'opérateur (service réel sans simulateur). */
  paiementEnAttente?: boolean;
};

/** Résultat de la saisie de l'identifiant de paiement du Trésor. */
export type PaiementTresorEnregistre = { numeroDossier: string; statut: StatutDemande; numeroBulletin: string | null; demo: boolean };

export type ObjetReclamation = 'SUIVI' | 'PAIEMENT' | 'CONTENU_CASIER' | 'BULLETIN' | 'AUTRE';

export type NouvelleReclamation = {
  objet: ObjetReclamation; numeroDossier?: string; nom: string; telephone?: string; email?: string; message: string;
};

export type ReclamationDeposee = { reference: string; demo: boolean };

// ---------- Espaces connectés (DSH-01 à DSH-11) ----------
export type Etape = { horodatage: string; statut: StatutDemande; libelle: string };

export type DemandeUsager = {
  id: string; numeroDossier: string; statut: StatutDemande; libelle: string; creeLe: string; echeance: string | null;
  montantFcfa: number; tarifProvisoire: boolean; bulletinId: string | null; bulletinNumero: string | null;
  pieceDemandee: string | null; motifRejet: string | null; frise: Etape[]; avis: { horodatage: string; canal: string; message: string }[];
};

export type IdentiteDeclaree = {
  nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string; paysNaissance?: string | null;
  nomPere?: string | null; nomMere?: string | null; nationalite?: string | null; numeroCnie?: string | null; numeroPasseport?: string | null;
};

export type DossierAgent = {
  id: string; numeroDossier: string; statut: StatutDemande; identite: IdentiteDeclaree; profil: string; motif: string | null;
  explicationRapprochement: string | null; echeance: string | null; restant: string | null; alerte: boolean; enRetard: boolean;
};

export type ProfilIdentite = {
  reference: string; nom: string; prenoms: string; dateNaissance: string | null; lieuNaissance: string | null;
  nomPere: string | null; nomMere: string | null; numeroCnie: string | null; numeroPasseport: string | null; alias: string[];
};

export type Peine = { nature: string; dureeMois: number | null; montantFcfa: number | null; sursis: string; dureeSursisMois: number | null };

export type InscriptionEnAttente = {
  id: string; personneId: string; nom: string; prenoms: string; dateNaissance: string | null; version: number; remplaceId: string | null;
  juridiction: string; dateDecision: string; numeroDecision: string; infraction: string; qualification: string; peines: Peine[];
  saisiePar: string; saisieLe: string; saisieParMoi: boolean;
};

export type Indicateurs = {
  demandes: { parStatut: Record<string, number>; total: number; delivrees: number; delivreesAutomatiquement: number;
    delaiMoyenHeures: number | null; enRetard: number; recettesFcfa: number;
    satisfaction?: { noteMoyenne: number | null; nombreAvis: number } };
  bulletins: Record<string, number>; verifications: number;
};

export type TarifComplet = Tarif & { id: string; statut: 'PROPOSE' | 'VALIDE' | 'REJETE'; proposePar: string; validePar: string | null };

export type JeuDeRegles = {
  id: string; version: number; dateEffet: string; statut: 'PROPOSE' | 'PUBLIE' | 'REJETE'; proposePar: string; proposeLe: string;
  validePar: string | null; valideLe: string | null; motifRejet: string | null; fictif: boolean;
  contenu: { reference: string }; casDeTest: { libelle: string }[];
};

export type ResultatIntegrite = { integre: boolean; entreesVerifiees: number; premiereAlteration: number | null };

export type EntreeJournal = {
  numero: number; horodatage: string; empreinte: string;
  evenement: { acteurId: string; roles: string | null; action: string; objetType: string | null; objetId: string | null;
    personneConcernee: string | null; finalite: string | null; details: Record<string, string> };
};

export type SaisieCondamnation = {
  personneId: string | null;
  nouvellePersonne: { nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string; paysNaissance: string;
    nomPere: string | null; nomMere: string | null; nationalites: string[]; numeroCnie: string | null; numeroPasseport: string | null; alias: string[] } | null;
  juridiction: string; dateDecision: string; numeroDecision: string; infraction: string; qualification: string; peines: Peine[];
  dateDefinitive: string | null; referencePieceSource: string;
};

/** Tableau de bord du validateur : bulletin n°3 émis et état de son impression au guichet. */
export type EtatImpression = 'A_VALIDER' | 'A_IMPRIMER' | 'IMPRIME' | 'REVOQUE';
export type BulletinAImprimer = {
  id: string; numero: string; nom: string; prenoms: string; dateNaissance: string | null; dateEmission: string; etat: EtatImpression;
  validePar: string | null; valideLe: string | null; imprimeLe: string | null; feuillet: string | null; impressions: number;
  /** Démonstration seulement : moyen de paiement (le service ne l'expose pas encore). */
  paiement?: string;
};

/** « Qui a consulté mes données » : action tracée, auteur désigné par sa qualité. */
export type AccesDonnees = { horodatage: string; action: string; auteur: string; finalite: string | null };

export type ParcoursAvis = 'DEMANDE' | 'SUIVI' | 'TRESOR' | 'VERIFICATION';
