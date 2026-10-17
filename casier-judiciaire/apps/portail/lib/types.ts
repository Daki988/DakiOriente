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
};

export type DemandeDeposee = { numeroDossier: string; codeSuivi: string; montantFcfa: number; tarifProvisoire: boolean; demo: boolean };

export type ObjetReclamation = 'SUIVI' | 'PAIEMENT' | 'CONTENU_CASIER' | 'BULLETIN' | 'AUTRE';

export type NouvelleReclamation = {
  objet: ObjetReclamation; numeroDossier?: string; nom: string; telephone?: string; email?: string; message: string;
};

export type ReclamationDeposee = { reference: string; demo: boolean };
