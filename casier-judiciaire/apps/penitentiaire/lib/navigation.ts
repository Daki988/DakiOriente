import type { LienEspace } from '@casier/design-system';

import { LIBELLES_ROLES } from './libelles';

export const libelleProfil = (roles: string[]) => roles.map((r) => LIBELLES_ROLES[r]).filter(Boolean).join(', ') || 'Agent';

/** Entrées de l'espace selon le rôle ; le service applique les habilitations, le site masque seulement l'inutile. */
export function liensEspace(roles: string[]): LienEspace[] {
  const liens: LienEspace[] = [
    { href: '/espace', libelle: 'Tableau de bord', icone: 'layout-dashboard' },
    { href: '/espace/registre', libelle: 'Registre d’écrou', icone: 'list-checks' },
  ];
  if (roles.includes('R16')) liens.push({ href: '/espace/ecrou', libelle: 'Nouvel écrou', icone: 'plus' });
  liens.push({ href: '/espace/mouvements', libelle: 'Mouvements', icone: 'arrow-right' });
  return liens;
}
