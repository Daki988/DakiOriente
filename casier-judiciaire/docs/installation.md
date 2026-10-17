# Casier judiciaire numérique — paquet d'installation 0.1.0

République gabonaise · Ministère de la Justice · Version du 17 octobre 2026 (lots L0 à L2)

> **Version de démonstration.** Données fictives, paiement simulé, emblème neutre, bandeau « Démonstration — service non officiel ».
> Elle ne doit pas recevoir de données réelles (exigences ENV-01 à ENV-03 et DON-06 du cahier des charges).

## Contenu du paquet

| Dossier | Contenu |
|---|---|
| `portail/` | Portail public (Next.js), **déjà construit**, prêt pour cPanel ou tout serveur Node.js 20.9 ou plus récent |
| `service-casier/` | Service métier (Java 21, Spring Boot) : `service-casier.jar`, `Dockerfile`, inventaire logiciel (SBOM) |
| `infrastructure/` | `docker-compose.complet.yml` (pile complète), configuration Keycloak, script des comptes de démonstration, `.env.exemple` |
| `referentiels/` | Barème provisoire du 25/06/2024 et jeu de règles juridiques **fictif** (à valider par un magistrat) |
| `sources/` | Code source complet, tests et documentation (ADR) |

## Ce que chaque hébergement permet

| | cPanel L (LWS, mutualisé) | Serveur dédié ou VPS (Linux + Docker) |
|---|---|---|
| Portail public | Oui | Oui |
| Service métier (Java 21) | **Non** : Java n'est pas proposé sur l'hébergement mutualisé | Oui |
| Base PostgreSQL 16 | Non | Oui |
| Connexion Keycloak | Non | Oui |
| Résultat | Portail complet en **mode démonstration autonome** (réponses simulées intégrées) | **Plateforme complète** : portail + service + base + connexion |

Sur cPanel seul, toutes les pages du portail fonctionnent (accueil, demande en cinq étapes avec paiement simulé, suivi,
vérification d'un bulletin, tarifs, aide, contact), avec des réponses simulées. Pour le service métier réel, ajoutez un
serveur (option B) et reliez le portail par la variable `CASIER_API_URL`.

## Option A — Portail sur LWS cPanel L

1. Dans le gestionnaire de fichiers cPanel, envoyez le dossier `portail/` (par exemple dans `~/casier-portail`), puis décompressez-le si vous l'avez envoyé en ZIP.
2. cPanel → **Setup Node.js App** → **Create Application** :
   - Node.js version : **22** (ou 20.9 et plus) ;
   - Application mode : **Production** ;
   - Application root : `casier-portail` ;
   - Application URL : votre domaine ou sous-domaine ;
   - Application startup file : `app.js`.
3. Variables d'environnement (même écran) :
   - `NODE_ENV` = `production` ;
   - `CASIER_API_URL` = adresse du service métier (option B), **laisser absent** pour le mode démonstration autonome.
4. **Ne pas** cliquer sur « Run NPM Install » : les dépendances sont déjà incluses dans `portail/node_modules`.
5. Cliquez sur **Restart**, puis ouvrez l'adresse du site. Activez le certificat SSL (cPanel → SSL/TLS Status) : le portail impose HTTPS (HSTS).

Codes de démonstration pour essayer la vérification : `DEMO-VALI-DE26` (valide), `DEMO-REVO-QUE1` (révoqué), `DEMO-EXPI-RE01` (expiré).
Suivi de dossier de démonstration : numéro `CJ-2026-000123`, code `123456`.

## Option B — Plateforme complète sur un serveur (VPS ou datacenter)

Prérequis : Linux 64 bits, 4 Go de mémoire, Docker 24+ avec Docker Compose.

```sh
cd infrastructure
cp .env.exemple .env          # renseigner chaque mot de passe (longs et aléatoires)
docker compose -f docker-compose.complet.yml --env-file .env up -d --build
```

- Portail : `http://<serveur>:3000` (placer un proxy HTTPS devant, par exemple Nginx ou Caddy).
- Service métier : `http://127.0.0.1:8080` (documentation de l'API : `/swagger-ui.html`).
- Keycloak : `http://127.0.0.1:8180` (royaume `casier`, rôles R01 à R14).
- Comptes de démonstration fictifs, un par profil :
  ```sh
  set -a; . ./.env; set +a
  docker compose -f docker-compose.complet.yml --env-file .env exec -T -e CASIER_MOT_DE_PASSE_DEMO keycloak sh < keycloak/creer-comptes-demo.sh
  ```

Au premier démarrage, le service crée la base (migrations), charge le barème et le jeu de règles fictif, et active le simulateur de paiement (profil `demo`).

## Vérifications effectuées sur ce paquet

- Pile complète lancée depuis ce paquet : service démarré, base créée, référentiels chargés ; portail relié au service (tarifs, vérification, toutes les pages).
- 54 tests du service sur base PostgreSQL réelle (parcours complet, journal inaltérable, registre sans suppression), couverture du cœur métier ≥ 85 %.
- 84 tests du portail (parcours et accessibilité WCAG 2.1 AA, mobile et ordinateur).
- Analyses de sécurité (Trivy, gitleaks, Semgrep) sans alerte haute ni critique.

## Avant une mise en service officielle par l'État

Ce paquet est une **démonstration fonctionnelle**, pas la version de production. Restent notamment à réaliser ou à décider :

1. **Hébergement au Gabon** (DON-07) : la production doit tourner dans le datacenter national ; ni LWS (France) ni Vercel ne conviennent pour des données réelles (ENV-05).
2. Textes et paramètres juridiques validés par le Ministère : jeu de règles réel (aujourd'hui fictif), tarifs définitifs (aujourd'hui provisoires), durées de conservation.
3. Bulletin PDF scellé (sceau électronique qualifié et horodatage ANINF, BUL-01) : non encore réalisé.
4. Connexion par l'identité numérique nationale (CNIE) et espaces connectés (usager, agents, administrations, tableaux de bord, back-office) : non encore réalisés dans le portail.
5. Paiement réel par un agrégateur agréé (Airtel Money, Moov Money, carte) ; notifications SMS et e-mail.
6. Reconstruire le portail depuis `sources/` pour chaque installation officielle (`npm ci && npm run build`) : chaque build génère ses propres clés internes Next.js.
7. Reprise de l'existant, audit de sécurité, audit d'accessibilité, formalités auprès de l'autorité de protection des données, homologation.
