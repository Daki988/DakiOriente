import type { Embleme } from '@casier/design-system';

/** Configuration par environnement : même code en démonstration et en production. */
export const config = {
  modeDemo: process.env.NEXT_PUBLIC_MODE_DEMO !== 'false',
  /** Comptes de démonstration fictifs sur la page de connexion (serveur). */
  comptesDemo: process.env.COMPTES_DEMO === 'true',
  embleme: (['ministere', 'officiel', 'neutre'].includes(process.env.NEXT_PUBLIC_EMBLEME ?? '')
    ? process.env.NEXT_PUBLIC_EMBLEME : 'ministere') as Embleme,
  nomService: 'Gestion pénitentiaire',
  /** Adresse du service métier (côté serveur). Absente : données fictives de démonstration. */
  apiCasier: process.env.CASIER_API_URL ?? '',
  /** Adresse publique du portail du casier judiciaire, pour les liens entre les deux sites. */
  portailCasier: process.env.NEXT_PUBLIC_PORTAIL_CASIER ?? 'https://casier-judiciaire-demo.vercel.app',
};
