import type { MetadataRoute } from 'next';

import { config } from '@/lib/config';

/** ENV-02 : la démonstration n'est jamais indexée ; en production, les adresses de vérification et de suivi ne le sont pas. */
export default function robots(): MetadataRoute.Robots {
  if (config.modeDemo) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/v/', '/suivi', '/demande', '/connexion'] } };
}
