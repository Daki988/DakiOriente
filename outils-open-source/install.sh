#!/usr/bin/env bash
# Installe en local les alternatives open source à 7 applis payantes.
# Usage : ./install.sh [appli ...]   (sans argument : toutes)
# Applis : plane calcom chatwoot appflowy openseo higgsfield chatterbox
# Prérequis : git, docker (avec compose), openssl ; python3.11 ou 3.12 pour chatterbox.
set -euo pipefail

DIR="${OSS_DIR:-$HOME/oss-apps}"
mkdir -p "$DIR"
cd "$DIR"

say()   { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
rand()  { openssl rand -hex "${1:-32}"; }
clone() { local d="${*: -1}"; [ -d "$d" ] || git clone --depth 1 "$@"; }
need()  { command -v "$1" >/dev/null || { echo "Manquant : $1"; exit 1; }; }

need git; need docker; need openssl
docker compose version >/dev/null

# --- Asana -> Plane : http://localhost:8081
plane() {
  say "Plane (port 8081)"
  clone https://github.com/makeplane/plane.git plane
  cd plane/deployments/cli/community
  [ -f .env ] || {
    cp variables.env .env
    sed -i.bak "s/^LISTEN_HTTP_PORT=.*/LISTEN_HTTP_PORT=8081/;
                s/^LISTEN_HTTPS_PORT=.*/LISTEN_HTTPS_PORT=8443/;
                s/^APP_DOMAIN=.*/APP_DOMAIN=localhost:8081/;
                s/^SECRET_KEY=.*/SECRET_KEY=$(rand 24)/" .env
  }
  docker compose --env-file .env up -d
  cd "$DIR"
}

# --- Calendly -> Cal.com : http://localhost:3005
calcom() {
  say "Cal.com (port 3005)"
  clone https://github.com/calcom/docker.git calcom
  cd calcom
  [ -f .env ] || {
    cp .env.example .env
    sed -i.bak "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$(rand 32)/;
                s/^CALENDSO_ENCRYPTION_KEY=.*/CALENDSO_ENCRYPTION_KEY=$(rand 16)/;
                s/^NEXT_PUBLIC_LICENSE_CONSENT=.*/NEXT_PUBLIC_LICENSE_CONSENT=agree/;
                s#^NEXT_PUBLIC_WEBAPP_URL=.*#NEXT_PUBLIC_WEBAPP_URL=http://localhost:3005#" .env
    # Ports libres : 3000 est pris par le site Next.js, 6379 par d'autres Redis.
    sed -i.bak 's/- 3000:3000/- 3005:3000/;
                s/"${REDIS_PORT:-6379}:6379"/"127.0.0.1:6390:6379"/' docker-compose.yaml
  }
  docker compose up -d --no-build database redis calcom
  cd "$DIR"
}

# --- Intercom -> Chatwoot : http://localhost:3002
chatwoot() {
  say "Chatwoot (port 3002)"
  clone https://github.com/chatwoot/chatwoot.git chatwoot
  cd chatwoot
  local C="docker compose -f docker-compose.production.yaml"
  if [ ! -f .env ]; then
    local pg; pg=$(rand 12)
    cp .env.example .env
    sed -i.bak "s/^SECRET_KEY_BASE=.*/SECRET_KEY_BASE=$(rand 64)/;
                s#^FRONTEND_URL=.*#FRONTEND_URL=http://localhost:3002#;
                s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$(rand 12)/;
                s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$pg/" .env
    sed -i.bak "s/'127.0.0.1:3000:3000'/'127.0.0.1:3002:3000'/;
                s/'127.0.0.1:5432:5432'/'127.0.0.1:5442:5432'/;
                s/'127.0.0.1:6379:6379'/'127.0.0.1:6391:6379'/;
                s/- POSTGRES_PASSWORD=\$/- POSTGRES_PASSWORD=$pg/" docker-compose.production.yaml
    $C up -d postgres redis
    $C run --rm rails bundle exec rails db:chatwoot_prepare
  fi
  $C up -d
  cd "$DIR"
}

# --- Notion -> AppFlowy (version web auto-hébergée) : http://localhost:8082
appflowy() {
  say "AppFlowy Cloud (port 8082)"
  clone https://github.com/AppFlowy-IO/AppFlowy-Cloud.git AppFlowy-Cloud
  cd AppFlowy-Cloud
  [ -f .env ] || {
    cp deploy.env .env
    sed -i.bak "s/^FQDN=.*/FQDN=localhost:8082/;
                s/^NGINX_PORT=.*/NGINX_PORT=8082/;
                s/^NGINX_TLS_PORT=.*/NGINX_TLS_PORT=8444/;
                s/^GOTRUE_ADMIN_PASSWORD=.*/GOTRUE_ADMIN_PASSWORD=$(rand 8)/" .env
    # L'image minio/minio n'est plus publiée sur Docker Hub : on prend le fork compatible.
    sed -i.bak 's#image: minio/minio#image: docker.io/pgsty/silo:RELEASE.2026-09-16T00-00-00Z#' docker-compose.yml
  }
  docker compose up -d
  echo "Compte admin : voir GOTRUE_ADMIN_EMAIL / GOTRUE_ADMIN_PASSWORD dans $DIR/AppFlowy-Cloud/.env"
  cd "$DIR"
}

# --- Semrush -> OpenSEO : http://localhost:3003 (clé DataForSEO payante requise)
openseo() {
  say "OpenSEO (port 3003)"
  clone https://github.com/every-app/open-seo.git open-seo
  cd open-seo
  export COMPOSE_FILE=deploy/standalone/compose.yaml
  [ -f deploy/standalone/.env ] || {
    cp deploy/standalone/.env.example deploy/standalone/.env
    sed -i.bak "s/^STORAGE_SECRET_KEY=.*/STORAGE_SECRET_KEY=$(rand 32)/;
                s/^PORT=.*/PORT=3003/;
                s#^BETTER_AUTH_URL=.*#BETTER_AUTH_URL=http://localhost:3003#" deploy/standalone/.env
  }
  docker compose pull
  docker compose up -d
  unset COMPOSE_FILE
  echo "Renseigne DATAFORSEO_API_KEY dans $DIR/open-seo/deploy/standalone/.env"
  cd "$DIR"
}

# --- Higgsfield -> Open Higgsfield : http://localhost:3004 (clé Muapi payante requise)
higgsfield() {
  say "Open Higgsfield (port 3004) - construction de l'image, plusieurs minutes"
  clone --recurse-submodules https://github.com/Anil-matcha/Open-Higgsfield-AI.git Open-Higgsfield-AI
  cd Open-Higgsfield-AI
  git submodule update --init --recursive
  sed -i.bak 's/"3001:3000"/"3004:3000"/' docker-compose.yml
  docker compose up -d --build
  cd "$DIR"
}

# --- ElevenLabs -> Chatterbox : http://localhost:7860 (interface web, ~3 Go de modèle)
chatterbox() {
  say "Chatterbox (port 7860)"
  local py=""
  for v in python3.12 python3.11 python3.10; do command -v "$v" >/dev/null && { py=$v; break; }; done
  [ -n "$py" ] || { echo "Chatterbox demande Python 3.10 à 3.12 : ignoré."; return; }
  clone https://github.com/resemble-ai/chatterbox.git chatterbox
  [ -d chatterbox-venv ] || "$py" -m venv chatterbox-venv
  chatterbox-venv/bin/pip install -U pip
  chatterbox-venv/bin/pip install ./chatterbox
  sed -i.bak 's/launch(share=True)/launch(server_name="127.0.0.1", server_port=7860)/' chatterbox/gradio_tts_app.py
  cat > chatterbox-start.sh <<EOF
#!/usr/bin/env bash
cd "$DIR/chatterbox" && exec ../chatterbox-venv/bin/python gradio_tts_app.py
EOF
  chmod +x chatterbox-start.sh
  echo "Lancer : $DIR/chatterbox-start.sh  (le modèle se télécharge au premier usage)"
}

ALL=(plane calcom chatwoot appflowy openseo higgsfield chatterbox)
APPS=("${@:-${ALL[@]}}")
for a in "${APPS[@]}"; do
  case " ${ALL[*]} " in *" $a "*) "$a" ;; *) echo "Appli inconnue : $a"; exit 1 ;; esac
done

say "Terminé"
cat <<'EOF'
Plane        http://localhost:8081
Cal.com      http://localhost:3005
Chatwoot     http://localhost:3002
AppFlowy     http://localhost:8082
OpenSEO      http://localhost:3003
Higgsfield   http://localhost:3004
Chatterbox   http://localhost:7860

Applis de bureau à installer à la main :
  Handy (dictée, remplace Wispr Flow) : https://github.com/cjpais/Handy/releases
  Cap (vidéo d'écran, remplace Loom)  : https://github.com/CapSoftware/Cap/releases
EOF
