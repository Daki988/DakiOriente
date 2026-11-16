#!/usr/bin/env bash
# Mise à jour de Navigoal sur l'hébergement (cPanel, Passenger), lancée par le déploiement automatique
# (.github/workflows/deploiement.yml) ou à la main : bash mise-a-jour.sh DOSSIER_APPLICATION ARCHIVE.tar.gz [URL_DU_SITE]
# Étapes : sauvegarde → remplacement du code → migrations et données → redémarrage → purge du cache.
# Le fichier .env et les dossiers stockage/, sauvegardes/ et acces/ ne sont jamais touchés.
# Si les migrations échouent, le code précédent est remis en place.
set -euo pipefail

APP="$(cd "${1:?dossier de l application manquant}" && pwd)"
ARCHIVE="$(cd "$(dirname "${2:?archive manquante}")" && pwd)/$(basename "$2")"
URL="${3:-https://navigoal.net}"
ELEMENTS="serveur outils drizzle data app.js package.json .env.example LISEZMOI-DEPLOIEMENT.md"

cd "$APP"
[ -f .env ] || { echo "Fichier .env absent de $APP : faites d'abord l'installation initiale (LISEZMOI-DEPLOIEMENT.md)." >&2; exit 1; }

# Node.js de l'application : celui de « Setup Node.js App » (nodevenv), sinon celui du système.
NODE="${LWS_NODE:-}"
[ -n "$NODE" ] || NODE="$(ls -d "$HOME/nodevenv/$(basename "$APP")"/*/bin/node 2>/dev/null | sort -V | tail -1 || true)"
[ -n "$NODE" ] || NODE="$(command -v node || true)"
[ -x "$NODE" ] || { echo "Node.js introuvable : indiquez son chemin dans la variable LWS_NODE." >&2; exit 1; }
echo "Node.js : $NODE ($("$NODE" --version))"

redemarrer() { mkdir -p tmp && touch tmp/restart.txt; } # Passenger relance l'application à la requête suivante

echo "1/5 Sauvegarde de la base et des fichiers"
if [ -f outils/sauvegarde.mjs ]; then "$NODE" outils/env.cjs outils/sauvegarde.mjs; else echo "  (première version sans outil de sauvegarde : étape ignorée)"; fi

echo "2/5 Remplacement du code"
rm -rf .nouveau .precedent && mkdir .nouveau .precedent
tar -xzf "$ARCHIVE" -C .nouveau --strip-components=1
for e in $ELEMENTS; do [ -e ".nouveau/$e" ] || { echo "Archive incomplète : $e manquant." >&2; rm -rf .nouveau .precedent; exit 1; }; done
for e in $ELEMENTS; do
  if [ -e "$e" ]; then mv "$e" .precedent/; fi
  mv ".nouveau/$e" .
done
rm -rf .nouveau "$ARCHIVE"

echo "3/5 Migrations et données de référence"
if ! { "$NODE" outils/env.cjs outils/migrate.mjs && "$NODE" outils/env.cjs outils/seed.mjs; }; then
  echo "Échec : retour au code précédent." >&2
  for e in $ELEMENTS; do rm -rf "$e"; if [ -e ".precedent/$e" ]; then mv ".precedent/$e" .; fi; done
  rm -rf .precedent
  redemarrer
  exit 1
fi

echo "4/5 Redémarrage"
redemarrer

echo "5/5 Purge du cache de l'hébergeur"
curl -s -m 30 -o /dev/null -X PURGE "$URL/.*" || echo "  (purge non confirmée : le cache se renouvelle seul en 5 minutes)"

echo "Mise à jour terminée : version $(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' package.json)."
