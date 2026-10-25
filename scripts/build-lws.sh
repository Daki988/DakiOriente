#!/usr/bin/env bash
# Construit la version statique du site pour un hébergement mutualisé (LWS, Apache/PHP, sans Node.js)
# et la range dans un ZIP prêt à décompresser dans le dossier du sous-domaine.
#
#   bash scripts/build-lws.sh [https://print.neamindustry.com]
#
# Version statique : catalogue, prix, éditeur en ligne et PDF d'impression fonctionnent ;
# les commandes partent sur WhatsApp. Sans serveur Node : pas d'espace admin ni de suivi en ligne.
set -euo pipefail

SITE_URL="${1:-https://print.neamindustry.com}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
OUT_ZIP="$ROOT/dist/neam-print-lws.zip"
trap 'rm -rf "$WORK"' EXIT

echo "→ Copie du projet"
tar -C "$ROOT" --exclude=node_modules --exclude=.next --exclude=.git --exclude=dist --exclude=out -cf - . | tar -C "$WORK" -xf -
ln -s "$ROOT/node_modules" "$WORK/node_modules"

echo "→ Retrait des parties qui demandent un serveur (admin, API, connexion, suivi)"
rm -rf "$WORK/app/admin" "$WORK/app/api" "$WORK/app/auth" "$WORK/app/(site)/suivi" "$WORK/components/admin" "$WORK/middleware.ts"

cat > "$WORK/next.config.ts" <<'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
EOF

echo "→ Construction (adresse : $SITE_URL)"
(
  cd "$WORK"
  env -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_ANON_KEY -u SUPABASE_SERVICE_ROLE_KEY \
    NEXT_PUBLIC_SITE_URL="$SITE_URL" NEXT_TELEMETRY_DISABLED=1 npx next build
)

echo "→ Réglages Apache (.htaccess)"
cat > "$WORK/out/.htaccess" <<'EOF'
# Neam Print · site statique (LWS)
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  # HTTPS obligatoire (activez d'abord le certificat SSL du sous-domaine dans l'espace LWS)
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  # Adresse sans barre finale → avec (pages rangées en dossier/index.html)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME}/index.html -f
  RewriteRule ^(.*[^/])$ /$1/ [L,R=301]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  # Fichiers versionnés de Next.js : cache long ; pages HTML : toujours revalidées
  <FilesMatch "\.(js|css|woff2?|ttf)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(jpg|jpeg|png|webp|avif|svg|ico)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
  <FilesMatch "\.(html|txt)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript application/json image/svg+xml font/ttf
</IfModule>

AddType font/ttf .ttf
AddType image/avif .avif
EOF

echo "→ Archive"
mkdir -p "$ROOT/dist"
rm -f "$OUT_ZIP"
(cd "$WORK/out" && zip -qr -X "$OUT_ZIP" . -x '*.DS_Store')
echo "✓ $OUT_ZIP ($(du -h "$OUT_ZIP" | cut -f1))"
