import type { Embleme } from '@casier/design-system';

/**
 * Marque blanche (ADM-16) et environnement (ENV-08) : même code partout, seule la configuration change.
 * En démonstration, emblème neutre et bandeau imposés (ENV-01, VIS-02).
 */
export const config = {
  modeDemo: process.env.NEXT_PUBLIC_MODE_DEMO !== 'false',
  embleme: (process.env.NEXT_PUBLIC_EMBLEME === 'officiel' && process.env.NEXT_PUBLIC_MODE_DEMO === 'false'
    ? 'officiel' : 'neutre') as Embleme,
  nomService: process.env.NEXT_PUBLIC_NOM_SERVICE ?? 'Casier judiciaire numérique',
  /** Adresse du service Casier (côté serveur uniquement). Absente : réponses simulées de démonstration (ENV-03). */
  apiCasier: process.env.CASIER_API_URL ?? '',
  supportTelephone: process.env.NEXT_PUBLIC_SUPPORT_TELEPHONE ?? '+241 00 00 00 00',
  adresseVerification: process.env.NEXT_PUBLIC_ADRESSE_VERIFICATION ?? 'casier-judiciaire.neamindustry.com/verifier',
};
