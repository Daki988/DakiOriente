# Alternatives open source aux applis payantes

| Payant | Alternative | Type | Adresse locale |
|---|---|---|---|
| Asana | [Plane](https://github.com/makeplane/plane) | Docker | http://localhost:8081 |
| Calendly | [Cal.com](https://github.com/calcom/cal.com) | Docker | http://localhost:3005 |
| Intercom | [Chatwoot](https://github.com/chatwoot/chatwoot) | Docker | http://localhost:3002 |
| Notion | [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy-Cloud) | Docker | http://localhost:8082 |
| Semrush | [OpenSEO](https://github.com/every-app/open-seo) | Docker | http://localhost:3003 |
| Higgsfield | [Open Higgsfield](https://github.com/Anil-matcha/Open-Higgsfield-AI) | Docker | http://localhost:3004 |
| ElevenLabs | [Chatterbox](https://github.com/resemble-ai/chatterbox) | Python | http://localhost:7860 |
| Wispr Flow | [Handy](https://github.com/cjpais/Handy) | Appli de bureau | [Télécharger](https://github.com/cjpais/Handy/releases) |
| Loom | [Cap](https://github.com/CapSoftware/Cap) | Appli de bureau | [Télécharger](https://github.com/CapSoftware/Cap/releases) |

## Installer

Prérequis : Docker Desktop (ou Docker Engine + Compose), git, openssl. Python 3.10 à 3.12 pour Chatterbox.
Prévoir ~30 Go de disque et 8 Go de RAM pour tout lancer en même temps.

```bash
cd outils-open-source
chmod +x install.sh
./install.sh                    # tout
./install.sh plane calcom       # seulement certaines applis
```

Les dépôts sont clonés dans `~/oss-apps` (modifiable : `OSS_DIR=/chemin ./install.sh`).
Les mots de passe et clés secrètes sont générés au hasard dans le `.env` de chaque appli.
Relancer le script ne réécrit pas les `.env` existants.

## À savoir

- **OpenSEO** a besoin d'une clé DataForSEO (payante, à l'usage) : `DATAFORSEO_API_KEY` dans `~/oss-apps/open-seo/deploy/standalone/.env`.
- **Open Higgsfield** passe par l'API Muapi (payante) pour générer images et vidéos.
- **Chatterbox** télécharge ~3 Go de modèle au premier usage. Lent sans carte graphique NVIDIA.
- **AppFlowy** : le compte admin est dans `~/oss-apps/AppFlowy-Cloud/.env` (`GOTRUE_ADMIN_EMAIL` / `GOTRUE_ADMIN_PASSWORD`). Les applis AppFlowy de bureau/mobile peuvent se connecter à ce serveur.
- **Cal.com** utilise le port 3005, pour laisser le 3000 au site (`npm run dev`).
- Si Docker Hub répond « 429 Too Many Requests », se connecter avec `docker login` ou patienter.

## Arrêter / redémarrer

Dans le dossier de l'appli (`~/oss-apps/<appli>`) : `docker compose stop` / `docker compose start`.
Pour Plane : `~/oss-apps/plane/deployments/cli/community`. Pour Chatwoot : ajouter `-f docker-compose.production.yaml`.
Pour OpenSEO : ajouter `-f deploy/standalone/compose.yaml`.
