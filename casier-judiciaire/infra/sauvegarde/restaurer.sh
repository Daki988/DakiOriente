#!/bin/sh
# Restauration d'une sauvegarde chiffrée.
#
# Test mensuel (recommandé), sans toucher à la base en service :
#   ./sauvegarde/restaurer.sh /var/backups/casier/casier-AAAAMMJJTHHMMSSZ.dump.enc
#   → restaure dans une base séparée « casier_restauration », puis affiche quelques comptages.
#
# Restauration réelle après incident (service arrêté, décision écrite du responsable) :
#   ./sauvegarde/restaurer.sh <fichier> casier
set -eu

[ -f .env ] && { set -a; . ./.env; set +a; }
FICHIER="${1:?Indiquez le fichier de sauvegarde à restaurer}"
BASE="${2:-casier_restauration}"
CLE="${CASIER_CLE_SAUVEGARDE:?Renseignez CASIER_CLE_SAUVEGARDE}"
COMPOSE="docker compose -f docker-compose.complet.yml --env-file .env"

if [ -f "$FICHIER.sha256" ]; then
  sha256sum -c "$FICHIER.sha256"
fi

if [ "$BASE" = "casier" ]; then
  printf "Restaurer sur la base EN SERVICE « casier » ? Tapez RESTAURER pour confirmer : "
  read -r reponse
  [ "$reponse" = "RESTAURER" ] || { echo "Abandon."; exit 1; }
  $COMPOSE stop service portail
fi

$COMPOSE exec -T postgres psql -U casier -d postgres -v ON_ERROR_STOP=1 \
  -c "drop database if exists \"$BASE\" with (force);" -c "create database \"$BASE\" owner casier;"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass "file:$CLE" -in "$FICHIER" \
  | $COMPOSE exec -T postgres pg_restore -U casier -d "$BASE" --no-owner --exit-on-error

$COMPOSE exec -T postgres psql -U casier -d "$BASE" -c "
  select 'demandes' as table, count(*) from demandes.demande
  union all select 'bulletins', count(*) from bulletins.bulletin
  union all select 'journal', count(*) from audit.journal;"

if [ "$BASE" = "casier" ]; then
  $COMPOSE start service portail
  echo "Base restaurée et services relancés. Vérifiez l'intégrité du journal depuis l'espace audit."
else
  echo "Test de restauration réussi dans « $BASE ». Supprimez-la ensuite : drop database $BASE;"
fi
