/** Adresse publique des pages QR (configurable) ; par défaut l'adresse courante du web. */
export function publicBase(): string {
  const env = import.meta.env.VITE_PUBLIC_BASE as string | undefined;
  if (env) return env;
  const { origin, pathname } = window.location;
  if (origin.startsWith('http')) return origin + pathname.replace(/index\.html$/, '');
  return 'https://origa.ga/';
}
