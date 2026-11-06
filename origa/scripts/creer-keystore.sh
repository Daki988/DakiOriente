#!/usr/bin/env bash
# Crée le keystore de publication Android d'Origa et affiche les valeurs à enregistrer
# comme secrets GitHub (Settings > Secrets and variables > Actions).
# À exécuter une seule fois, sur un poste de confiance. Conservez le fichier .jks et les mots de passe
# dans un coffre : sans eux, il est impossible de publier une mise à jour de l'application.
set -euo pipefail
ALIAS="${1:-origa}"
OUT="origa-release.jks"
read -rsp "Mot de passe du keystore (12 caractères minimum) : " PASS; echo
keytool -genkeypair -v -keystore "$OUT" -alias "$ALIAS" -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$PASS" -keypass "$PASS" \
  -dname "CN=Origa, OU=Programme POUFA, O=Ministere de l'Agriculture, L=Libreville, C=GA"
echo
echo "Secrets GitHub à créer :"
echo "  ORIGA_KEYSTORE_BASE64  = (contenu ci-dessous)"
echo "  ORIGA_KEYSTORE_PASSWORD = le mot de passe saisi"
echo "  ORIGA_KEY_ALIAS         = $ALIAS"
echo "  ORIGA_KEY_PASSWORD      = le mot de passe saisi"
echo
base64 -w0 "$OUT" 2>/dev/null || base64 "$OUT"
echo
