#!/usr/bin/env bash
# Construit l'archive de déploiement pour un hébergement mutualisé (LWS…) : code versionné + bibliothèques Composer.
# Usage : bin/build-zip.sh            → dist/tremplin-lws-AAAAMMJJ.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d)"
WORK="$(mktemp -d)"
OUT="$ROOT/dist/tremplin-lws-$STAMP.zip"
mkdir -p "$ROOT/dist"

# 1. Fichiers suivis par git (dernier commit) : aucun fichier local, base de test ou secret ne part dans l'archive
git -C "$ROOT" archive --format=tar HEAD | tar -x -C "$WORK"

# 2. Bibliothèques PHP de production (dompdf, QR code, SDK Claude, PHPMailer…)
( cd "$WORK" && COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction --no-progress --quiet )

# 3. Fichiers inutiles en ligne
rm -rf "$WORK/.claude" "$WORK/.mcp.json" "$WORK/docs" "$WORK/bin/build-zip.sh" "$WORK/.gitignore"
find "$WORK/vendor" -type d \( -name tests -o -name Tests -o -name docs -o -name .github \) -prune -exec rm -rf {} + 2>/dev/null || true

# 4. Dossiers de données vides mais présents (droits d'écriture)
mkdir -p "$WORK/storage/uploads" "$WORK/storage/logs" "$WORK/storage/cache"
touch "$WORK/storage/uploads/.gitkeep" "$WORK/storage/logs/.gitkeep" "$WORK/storage/cache/.gitkeep"
for d in storage app vendor database bin; do
  printf '<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Deny from all\n</IfModule>\n' > "$WORK/$d/.htaccess"
done

rm -f "$OUT"
( cd "$WORK" && zip -qr -9 "$OUT" . -x '*.DS_Store' )
rm -rf "$WORK"
echo "✔ $OUT ($(du -h "$OUT" | cut -f1))"
