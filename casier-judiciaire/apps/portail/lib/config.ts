import type { Embleme } from '@casier/design-system';

/**
 * Marque blanche (ADM-16) et environnement (ENV-08) : même code partout, seule la configuration change.
 * Bandeau « Démonstration » masqué par défaut (décision de l'utilisateur, 17/10/2026) ; NEXT_PUBLIC_BANDEAU_DEMO=true le rétablit.
 */
export const config = {
  modeDemo: process.env.NEXT_PUBLIC_MODE_DEMO !== 'false',
  bandeauDemo: process.env.NEXT_PUBLIC_BANDEAU_DEMO === 'true',
  /** Logo du Ministère par défaut (décision de l'utilisateur, 17/10/2026) ; « neutre » reste possible. */
  embleme: (['ministere', 'officiel', 'neutre'].includes(process.env.NEXT_PUBLIC_EMBLEME ?? '')
    ? process.env.NEXT_PUBLIC_EMBLEME : 'ministere') as Embleme,
  nomService: process.env.NEXT_PUBLIC_NOM_SERVICE ?? 'Casier judiciaire numérique',
  /** Adresse du service Casier (côté serveur uniquement). Absente : réponses simulées de démonstration (ENV-03). */
  apiCasier: process.env.CASIER_API_URL ?? '',
  supportTelephone: process.env.NEXT_PUBLIC_SUPPORT_TELEPHONE ?? '+241 00 00 00 00',
  adresseVerification: process.env.NEXT_PUBLIC_ADRESSE_VERIFICATION ?? 'casier-judiciaire.neamindustry.com/verifier',
};
