#!/bin/sh
# ENV-04 : comptes de démonstration, un par profil, avec des identités FICTIVES (DON-06).
# Le mot de passe vient de l'environnement, jamais du dépôt (SEC-05).
#   docker compose -f infra/docker-compose.yml --env-file infra/.env exec -T \
#     -e CASIER_MOT_DE_PASSE_DEMO keycloak sh < infra/keycloak/creer-comptes-demo.sh
set -eu
: "${CASIER_MOT_DE_PASSE_DEMO:?Renseignez CASIER_MOT_DE_PASSE_DEMO}"
: "${KC_BOOTSTRAP_ADMIN_PASSWORD:?Mot de passe administrateur absent}"
KC=/opt/keycloak/bin/kcadm.sh
$KC config credentials --server http://localhost:8080 --realm master --user admin --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null

creer() { # identifiant prénom nom rôle [attributs...]
  id=$1; prenom=$2; nom=$3; role=$4; shift 4
  if $KC get users -r casier -q username="$id" -q exact=true --fields id | grep -q '"id"'; then
    echo "Compte $id déjà présent"; return
  fi
  set -- "$@"
  $KC create users -r casier -s username="$id" -s enabled=true -s firstName="$prenom" -s lastName="$nom" "$@" >/dev/null
  $KC set-password -r casier --username "$id" --new-password "$CASIER_MOT_DE_PASSE_DEMO" >/dev/null
  $KC add-roles -r casier --uusername "$id" --rolename "$role"
  echo "Compte $id ($role) créé"
}

creer usager.demo      Jean-Pierre "NDONG MBA" R01 -s 'attributes.identite_verifiee=["true"]'
creer agent.greffe     Clarisse    "MOUSSAVOU" R06 -s 'attributes.juridiction=["TPI-LIBREVILLE"]'
creer greffier.chef    Hervé       "OBAME"     R07 -s 'attributes.juridiction=["TPI-LIBREVILLE"]'
creer magistrat.demo   Sylvie      "NZE"       R05 -s 'attributes.juridiction=["TPI-LIBREVILLE"]'
creer direction.demo   Paul        "MBADINGA"  R08
creer auditeur.demo    Marc        "ESSONO"    R12
