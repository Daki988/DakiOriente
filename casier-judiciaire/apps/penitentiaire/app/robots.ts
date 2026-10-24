import type { MetadataRoute } from 'next';

import { config } from '@/lib/config';

/** ENV-02 : la démonstration n'est jamais indexée ; en production, l'espace des agents ne l'est pas. */
export default function robots(): MetadataRoute.Robots {
  if (config.modeDemo) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/espace', '/connexion'] } };
}
