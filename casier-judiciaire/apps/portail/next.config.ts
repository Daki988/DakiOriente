import type { NextConfig } from 'next';

const demo = process.env.NEXT_PUBLIC_MODE_DEMO !== 'false';
// React exige eval() en développement uniquement ; jamais en production.
const evalDev = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";

/** En-têtes de sécurité stricts (SEC-04) ; aucune ressource tierce (DON-07, PUB-19). */
const entetes = [
  { key: 'Content-Security-Policy', value: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${evalDev}; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(), microphone=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // ENV-02 : la démonstration n'est jamais indexée.
  ...(demo ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
];

const config: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  transpilePackages: ['@casier/design-system'],
  async headers() {
    return [{ source: '/:path*', headers: entetes }];
  },
};

export default config;
