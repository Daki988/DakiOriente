/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  // Les services serveur utilisent pg, bcryptjs, pdf-lib : exécutés côté Node, non regroupés.
  experimental: { serverComponentsExternalPackages: ["pg", "pdf-lib", "bcryptjs"] },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(self), geolocation=(self)" },
    ] }];
  },
};

export default nextConfig;
