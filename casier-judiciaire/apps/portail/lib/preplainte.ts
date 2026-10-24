import type { NaturePreplainte, StatutPreplainte } from './types';

/** Faits pouvant être déclarés en ligne : atteintes aux biens. */
export const NATURES_PREPLAINTE: { code: NaturePreplainte; titre: string; description: string }[] = [
  { code: 'VOL', titre: 'Vol', description: 'Téléphone, sac, portefeuille, objet personnel' },
  { code: 'CAMBRIOLAGE', titre: 'Cambriolage', description: 'Domicile, commerce, bureau' },
  { code: 'VOL_VEHICULE', titre: 'Vol de véhicule', description: 'Voiture, moto, ou objets volés dans un véhicule' },
  { code: 'DEGRADATION', titre: 'Dégradation', description: 'Bien abîmé ou détruit volontairement' },
  { code: 'ESCROQUERIE', titre: 'Escroquerie, arnaque', description: 'Mobile money, achat en ligne, faux placement' },
  { code: 'AUTRE_ATTEINTE_BIENS', titre: 'Autre atteinte à vos biens', description: 'Abus de confiance, chèque sans provision…' },
];
export const libelleNature = (n: NaturePreplainte) => NATURES_PREPLAINTE.find((x) => x.code === n)?.titre ?? n;

/**
 * Services où signer la plainte. Liste de démonstration : la liste officielle des commissariats et brigades
 * raccordés est à fixer avec le Ministère de l'Intérieur.
 */
export const SERVICES_PREPLAINTE = [
  'Commissariat central de Libreville', 'Commissariat d’Owendo', 'Commissariat d’Akanda', 'Commissariat de Port-Gentil',
  'Commissariat de Franceville', 'Brigade de gendarmerie d’Oyem', 'Brigade de gendarmerie de Lambaréné', 'Brigade de gendarmerie de Mouila',
];

export const STATUTS_PREPLAINTE: Record<StatutPreplainte, { ton: 'alerte' | 'info' | 'succes' | 'neutre'; libelle: string; explication: string }> = {
  RECUE: { ton: 'alerte', libelle: 'Reçue', explication: 'Un officier de police judiciaire va vous contacter pour fixer un rendez-vous.' },
  RENDEZ_VOUS_FIXE: { ton: 'info', libelle: 'Rendez-vous fixé', explication: 'Présentez-vous au rendez-vous avec votre pièce d’identité pour signer votre plainte.' },
  PLAINTE_SIGNEE: { ton: 'succes', libelle: 'Plainte signée', explication: 'Votre plainte est enregistrée. Conservez le récépissé remis lors du rendez-vous.' },
  EXPIREE: { ton: 'neutre', libelle: 'Expirée', explication: 'La plainte n’a pas été signée dans le délai. Vous pouvez faire une nouvelle déclaration.' },
};
