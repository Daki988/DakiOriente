#!/bin/sh
# Sauvegarde quotidienne chiffrée de la base du casier judiciaire.
# À lancer depuis le dossier infra, par exemple chaque nuit à 2 h :
#   0 2 * * * cd /opt/casier/infra && ./sauvegarde/sauvegarder.sh >> /var/log/casier-sauvegarde.log 2>&1
#
# Variables (fichier .env ou environnement) :
#   CASIER_CLE_SAUVEGARDE      chemin du fichier de clé (32 octets aléatoires ou plus), conservé hors du serveur aussi
#   CASIER_DOSSIER_SAUVEGARDE  dossier local des sauvegardes (défaut : /var/backups/casier)
#   CASIER_RETENTION_JOURS     durée de conservation locale (défaut : 30)
#   CASIER_SAUVEGARDE_DISTANTE copie hors site par rsync, par exemple sauvegarde@serveur-secours:/sauvegardes/casier (facultatif)
set -eu

[ -f .env ] && { set -a; . ./.env; set +a; }
CLE="${CASIER_CLE_SAUVEGARDE:?Renseignez CASIER_CLE_SAUVEGARDE (chemin du fichier de clé)}"
DOSSIER="${CASIER_DOSSIER_SAUVEGARDE:-/var/backups/casier}"
RETENTION="${CASIER_RETENTION_JOURS:-30}"
COMPOSE="docker compose -f docker-compose.complet.yml --env-file .env"

[ -r "$CLE" ] || { echo "Clé de sauvegarde illisible : $CLE" >&2; exit 1; }
mkdir -p "$DOSSIER"
chmod 700 "$DOSSIER"

HORODATAGE=$(date -u +%Y%m%dT%H%M%SZ)
FICHIER="$DOSSIER/casier-$HORODATAGE.dump.enc"
TEMP="$FICHIER.partiel"

# Copie cohérente (format personnalisé, compressé), chiffrée en AES-256 avant d'être écrite sur le disque.
$COMPOSE exec -T postgres pg_dump -U casier -d casier --format=custom --compress=6 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass "file:$CLE" -out "$TEMP"
mv "$TEMP" "$FICHIER"
sha256sum "$FICHIER" > "$FICHIER.sha256"
echo "$(date -u +%FT%TZ) sauvegarde écrite : $FICHIER ($(du -h "$FICHIER" | cut -f1))"

# Rotation locale.
find "$DOSSIER" -name 'casier-*.dump.enc*' -type f -mtime +"$RETENTION" -delete

# Copie hors site.
if [ -n "${CASIER_SAUVEGARDE_DISTANTE:-}" ]; then
  rsync -a --chmod=F600 "$FICHIER" "$FICHIER.sha256" "$CASIER_SAUVEGARDE_DISTANTE/"
  echo "$(date -u +%FT%TZ) copie hors site : $CASIER_SAUVEGARDE_DISTANTE"
fi
