export type StatutDetenu = 'PREVENU' | 'CONDAMNE' | 'LIBERE';
export type TitreDetention = 'MANDAT_DEPOT' | 'JUGEMENT' | 'ARRET' | 'CONTRAINTE';
export type TypeMouvement = 'TRANSFERT' | 'EXTRACTION_JUDICIAIRE' | 'EXTRACTION_MEDICALE' | 'PERMISSION';
export type StatutMouvement = 'DEMANDE' | 'AUTORISE' | 'EN_COURS' | 'TERMINE' | 'REFUSE' | 'ANNULE';
export type MotifLiberation = 'FIN_DE_PEINE' | 'MAINLEVEE_MANDAT' | 'ACQUITTEMENT_RELAXE' | 'LIBERTE_CONDITIONNELLE' | 'GRACE' | 'AUTRE';

export type Etablissement = { code: string; nom: string; ville: string; province: string; type: 'MAISON_ARRET' | 'CENTRE_PENITENTIAIRE' | 'PRISON_CENTRALE'; capacite: number };

export type Detenu = {
  id: string; numeroEcrou: string; nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string; nationalite: string;
  etablissement: string; quartier: string | null; statut: StatutDetenu; titreDetention: TitreDetention; referenceTitre: string; juridiction: string;
  infraction: string; dateEcrou: string; dateDebutPeine: string | null; dureePeineMois: number | null; reductionJours: number;
  dateLiberationPrevue: string | null; dateLiberation: string | null; motifLiberation: string | null; ecroueLe: string;
};

export type Mouvement = {
  id: string; detenuId: string; numeroEcrou: string; nomDetenu: string; type: TypeMouvement; origine: string; destination: string; motif: string;
  prevuLe: string; retourPrevu: string | null; statut: StatutMouvement; demandeParMoi: boolean; departLe: string | null; retourLe: string | null; observation: string | null;
};

export type TableauDeBord = {
  etablissements: { code: string; nom: string; ville: string; capacite: number; population: number; tauxOccupation: number }[];
  prevenus: number; condamnes: number; liberationsSous30Jours: number; mouvementsAAutoriser: number; mouvementsDuJour: number; enDehors: number;
  prochainesLiberations: Detenu[];
};

export type NouvelEcrou = {
  nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string; nationalite: string; quartier: string | null; titreDetention: TitreDetention;
  referenceTitre: string; juridiction: string; infraction: string; dateEcrou: string; dateDebutPeine: string | null; dureePeineMois: number | null;
};
