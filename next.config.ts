import type { NextConfig } from "next";

/** STATIC_EXPORT=1 → site 100 % statique (dossier `out/`) pour un hébergement mutualisé (LWS, Apache). */
const isStatic = process.env.STATIC_EXPORT === "1";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = isStatic
  ? { output: "export", trailingSlash: true, poweredByHeader: false, images: { unoptimized: true } }
  : {
      poweredByHeader: false,
      images: { formats: ["image/avif", "image/webp"] },
      async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
      },
    };

export default nextConfig;
