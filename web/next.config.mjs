// Politique de sécurité du contenu : ressources du site uniquement (images https autorisées), pas d'objets ni d'intégration
// par un autre site. 'unsafe-inline' reste nécessaire aux scripts d'hydratation de Next.js et au JSON-LD.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://checkout.cinetpay.com",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Paquet autonome (serveur Node seul) pour un hébergement cPanel / VPS : BUILD_STANDALONE=1 npm run build
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
  // Les services serveur utilisent pg, bcryptjs, pdf-lib : exécutés côté Node, non regroupés.
  experimental: { serverComponentsExternalPackages: ["pg", "pdf-lib", "bcryptjs"] },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: CSP },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(self), geolocation=(self)" },
    ] }];
  },
};

export default nextConfig;
