import type { NomIcone } from '@casier/design-system';

/** Textes partagés du portail, regroupés pour la gestion de contenu (PUB-17) et la traduction (ERG-07). */
export const navigation = [
  { libelle: 'Faire une demande', href: '/demande' },
  { libelle: 'Suivre', href: '/suivi' },
  { libelle: 'Vérifier', href: '/verifier' },
  { libelle: 'Tarifs', href: '/tarifs' },
  { libelle: 'Aide', href: '/aide' },
];

export type CodeProfil = 'GABONAIS_NE_AU_GABON' | 'GABONAIS_NE_A_L_ETRANGER' | 'ETRANGER_RESIDENT';

export const profils: { code: CodeProfil; titre: string; description: string; icone: NomIcone }[] = [
  { code: 'GABONAIS_NE_AU_GABON', titre: 'Je suis Gabonais, né au Gabon', description: 'Traitement par le greffe de votre lieu de naissance.', icone: 'house' },
  { code: 'GABONAIS_NE_A_L_ETRANGER', titre: 'Je suis Gabonais, né à l’étranger', description: 'Traitement par l’administration centrale, en ligne ou au consulat.', icone: 'globe' },
  { code: 'ETRANGER_RESIDENT', titre: 'Je suis étranger et je réside au Gabon', description: 'Traitement par l’administration centrale.', icone: 'id-card' },
];

export const libellesActes: Record<string, string> = {
  BULLETIN_N3: 'Bulletin n°3',
  RELEVE_CONDAMNATIONS: 'Relevé de condamnations',
  RELEVE_PERIODIQUE: 'Relevé périodique de condamnations',
  RECHERCHE_ARCHIVES: 'Recherche dans les archives',
};

export const libellesProfils: Record<string, string> = {
  GABONAIS_NE_AU_GABON: 'Gabonais nés au Gabon',
  GABONAIS_NE_A_L_ETRANGER: 'Gabonais nés à l’étranger',
  ETRANGER_RESIDENT: 'Étrangers résidant au Gabon',
  NATIONAL: 'Nationaux',
  NON_NATIONAL: 'Non-nationaux',
  TOUS: 'Tous publics',
};

export function fcfa(montant: number) {
  return montant === 0 ? 'Gratuit' : `${montant.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}
