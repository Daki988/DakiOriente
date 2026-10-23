import path from 'node:path';
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

// Racine du monorepo : design system et référentiels de démonstration sont hors du dossier de l'application.
const racine = path.join(__dirname, '..', '..');

const config: NextConfig = {
  poweredByHeader: false,
  // Serveur autonome (server.js) : installation sur cPanel « Setup Node.js App » ou sur tout serveur Node.
  output: 'standalone',
  outputFileTracingRoot: racine,
  turbopack: { root: racine },
  agentRules: false,
  transpilePackages: ['@casier/design-system'],
  // BUL-08 et RG-09 : dépôt d'un PDF ou d'une pièce (5 Mo au plus, comme le service).
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  async headers() {
    return [{ source: '/:path*', headers: entetes }];
  },
};

export default config;
