import type { MotifLiberation, StatutDetenu, StatutMouvement, TitreDetention, TypeMouvement } from './types';

export const STATUTS_DETENU: Record<StatutDetenu, { libelle: string; ton: 'info' | 'alerte' | 'neutre' }> = {
  PREVENU: { libelle: 'Prévenu', ton: 'alerte' }, CONDAMNE: { libelle: 'Condamné', ton: 'info' }, LIBERE: { libelle: 'Libéré', ton: 'neutre' },
};
export const TITRES: Record<TitreDetention, string> = {
  MANDAT_DEPOT: 'Mandat de dépôt', JUGEMENT: 'Jugement', ARRET: 'Arrêt', CONTRAINTE: 'Contrainte judiciaire',
};
export const TYPES_MOUVEMENT: Record<TypeMouvement, string> = {
  TRANSFERT: 'Transfert', EXTRACTION_JUDICIAIRE: 'Extraction judiciaire', EXTRACTION_MEDICALE: 'Extraction médicale', PERMISSION: 'Permission de sortir',
};
export const STATUTS_MOUVEMENT: Record<StatutMouvement, { libelle: string; ton: 'alerte' | 'info' | 'succes' | 'erreur' | 'neutre' }> = {
  DEMANDE: { libelle: 'À autoriser', ton: 'alerte' }, AUTORISE: { libelle: 'Autorisé', ton: 'info' }, EN_COURS: { libelle: 'Hors établissement', ton: 'alerte' },
  TERMINE: { libelle: 'Terminé', ton: 'succes' }, REFUSE: { libelle: 'Refusé', ton: 'erreur' }, ANNULE: { libelle: 'Annulé', ton: 'neutre' },
};
export const MOTIFS_LIBERATION: Record<MotifLiberation, string> = {
  FIN_DE_PEINE: 'Fin de peine', MAINLEVEE_MANDAT: 'Mainlevée du mandat de dépôt', ACQUITTEMENT_RELAXE: 'Acquittement ou relaxe',
  LIBERTE_CONDITIONNELLE: 'Libération conditionnelle', GRACE: 'Grâce', AUTRE: 'Autre décision judiciaire',
};
export const TYPES_ETABLISSEMENT = { MAISON_ARRET: 'Maison d’arrêt', CENTRE_PENITENTIAIRE: 'Centre pénitentiaire', PRISON_CENTRALE: 'Prison centrale' } as const;
export const LIBELLES_ROLES: Record<string, string> = {
  R16: 'Greffe pénitentiaire', R17: 'Chef d’établissement', R18: 'Direction de l’administration pénitentiaire',
};
