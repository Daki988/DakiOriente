/** Comptes de démonstration du site pénitentiaire. Identités FICTIVES. */
export const PROFILS_DEMO = [
  { id: 'greffe', sujet: 'demo-greffe-pen', nom: 'Armel MBINA', roles: ['R16'], juridiction: 'LBV-PC-01', libelle: 'Greffe pénitentiaire',
    detail: 'Écrou, situation pénale, mouvements — Prison centrale de Libreville' },
  { id: 'chef', sujet: 'demo-chef-pen', nom: 'Odette NZIGOU', roles: ['R17'], juridiction: 'LBV-PC-01', libelle: 'Chef d’établissement',
    detail: 'Autorisation des mouvements, libérations — Prison centrale de Libreville' },
  { id: 'direction', sujet: 'demo-dap', nom: 'Roger OBIANG', roles: ['R18'], libelle: 'Direction de l’administration pénitentiaire',
    detail: 'Vue nationale de tous les établissements' },
] as const;

export type ProfilDemo = (typeof PROFILS_DEMO)[number];
