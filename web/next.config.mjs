// Politique de sécurité du contenu : ressources du site uniquement (images https autorisées), pas d'objets ni d'intégration
// par un autre site ; seules les vidéos des témoignages et les appels (salles Daily, caméra et micro délégués) sont intégrés. Pour les vidéos : (lecteurs officiels YouTube sans cookies et Onisep TV) sont intégrées. 'unsafe-inline' reste nécessaire aux scripts d'hydratation de Next.js et au JSON-LD.
const CSP = [
  "default-src 'self'",
  // Google Tag Manager / Google Analytics (installé novembre 2026, avec consentement : components/ui/GoogleTagManager.tsx)
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.daily.co wss://*.daily.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "frame-src 'self' https://www.youtube-nocookie.com https://videos.onisep.fr https://*.daily.co",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join("; ");

/** @type {import('next').NextConfig} */
const PRIVES = ["admin", "appel", "bailleur", "compte", "conseiller", "espace", "etablissement", "messages", "notifications", "orientation", "parent", "connexion", "inscription", "mot-de-passe-oublie", "paiement", "premiere-connexion", "verification", "navilease/logements", "navilease/espace", "navilease/reservations"];

const nextConfig = {
  // Paquet autonome (serveur Node seul) pour un hébergement cPanel / VPS : BUILD_STANDALONE=1 npm run build
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" } : {}),
  // Pas d'optimisation à la volée (pas de sharp sur l'hébergement mutualisé) : next/image sert les
  // variantes statiques préparées par scripts/variantes_images.py (voir image-loader.js).
  // Métadonnées (titre, description, canonique, og:image) dans le <head> pour les robots, même sur les pages dynamiques.
  // La liste par défaut de Next.js ne contient pas Googlebot (« il exécute le JavaScript ») : les balises lui arrivaient
  // en fin de page (ex. /orientation/, actualités). Liste par défaut de Next 15.5 + Googlebot.
  htmlLimitedBots: /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i,
  images: { loader: "custom", loaderFile: "./image-loader.js", deviceSizes: [400, 640, 840, 1280], imageSizes: [160] },
  trailingSlash: true,
  // Pages déjà vues (ou préchargées) gardées en mémoire dans le navigateur : retour en arrière et nouveau clic
  // instantanés (60 s pour les pages dynamiques, 5 min pour les pages statiques, comme le cache de l'hébergeur).
  experimental: { staleTimes: { dynamic: 60, static: 300 } },
  // Les services serveur utilisent pg, bcryptjs, pdf-lib : exécutés côté Node, non regroupés.
  serverExternalPackages: ["pg", "pdf-lib", "bcryptjs"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: CSP },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: 'camera=(self "https://*.daily.co"), microphone=(self "https://*.daily.co"), display-capture=(self "https://*.daily.co"), geolocation=(self)' },
    ] },
    // Cache de l'hébergeur (LWS Fastest Cache / Varnish) : Next annonce s-maxage=1 an pour les pages pré-rendues ;
    // CDN-Cache-Control, prioritaire pour Varnish, limite les pages HTML à 5 minutes (les fichiers /_next/static,
    // versionnés, restent en cache long). Les déploiements purgent en plus tout le cache.
    { source: "/((?!_next/static|api/).*)", headers: [{ key: "CDN-Cache-Control", value: "public, max-age=300" }] },
    // Espaces connectés et pages d'authentification : jamais gardés par le cache de l'hébergeur (contenu propre à chaque compte).
    ...PRIVES.map((p) => ({ source: `/${p}/:path*`, headers: [{ key: "CDN-Cache-Control", value: "no-store" }] })),
    ...PRIVES.map((p) => ({ source: `/${p}`, headers: [{ key: "CDN-Cache-Control", value: "no-store" }] })),
    { source: "/api/:path*", headers: [{ key: "CDN-Cache-Control", value: "no-store" }] },
    // robots.txt sert aussi de signal de maintien en éveil (tâche planifiée toutes les 4 min) : il doit atteindre
    // l'application à chaque fois, sinon Varnish répond seul, Passenger arrête l'application inactive et le visiteur
    // suivant attend son redémarrage (≈ 10 s mesurées). Aucune base de données sollicitée.
    { source: "/robots.txt", headers: [{ key: "CDN-Cache-Control", value: "no-store" }] },
    // Images, logos, photos et fichiers de marque : gardés 1 jour par les navigateurs (puis réutilisés pendant la
    // vérification, 7 jours) et 7 jours par Varnish (vidé à chaque mise en ligne). Avec max-age=0 et 5 min de Varnish,
    // presque chaque image repassait par l'application Node.js, qui les servait derrière les pages (jusqu'à 7 s
    // d'attente mesurées pour un logo, novembre 2026).
    ...["images", "photos", "logos", "brand", "fiches", "ressources"].map((d) => ({ source: `/${d}/:path*`, headers: [
      { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
      { key: "CDN-Cache-Control", value: "public, max-age=604800" },
    ] }))];
  },
};

export default nextConfig;
