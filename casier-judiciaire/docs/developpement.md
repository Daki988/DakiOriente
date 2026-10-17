# Casier judiciaire numérique — guide de développement

## Décisions du maître d'ouvrage

**Maquettes (17/10/2026)** : l'interface est codée directement à partir des jetons du design system (`design/tokens.json`) ; les écrans codés servent de référence de validation.

**Logo (17/10/2026)** : le logo fourni par le Ministère (drapeau et sceau, `apps/portail/public/emblemes/drapeau-sceau.png`) remplace l'emblème neutre sur le portail, y compris en démonstration. 

**Bandeau (17/10/2026)** : la mention « Démonstration — service non officiel » est retirée par défaut (le site est publié par le Ministère) ; `NEXT_PUBLIC_BANDEAU_DEMO=true` la rétablit. Sans `NEXT_PUBLIC_MODE_DEMO=false`, le portail reste non indexé (ENV-02). Comptes de démonstration et codes de test sont masqués par défaut ; `COMPTES_DEMO=true` (serveur) les réaffiche (présentations : activé sur Vercel ; tests de bout en bout).

## Pile et commandes
- Interfaces : `apps/portail` (Next.js, portail public et espace usager), `packages/design-system` (jetons CSS + composants React). `npm install` puis `npm run dev -w apps/portail` depuis `casier-judiciaire/` (sans `CASIER_API_URL` : mode démonstration, réponses simulées). Tests de bout en bout et d'accessibilité : `npm run test:e2e -w apps/portail` (navigateur local : variable `CHROMIUM_PATH`).
- Service métier : `services/casier` — Java 21, Spring Boot 4.1, Spring Modulith 2.1, PostgreSQL 16, Flyway.
- Compiler et tester : `cd services/casier && mvn -B verify` (Testcontainers : Docker requis ; si le démon est arrêté : `dockerd &`).
- Lancer en local :
  1. `cp infra/.env.exemple infra/.env` et renseigner les mots de passe (fichier non versionné).
  2. `docker compose -f infra/docker-compose.yml --env-file infra/.env up -d` (PostgreSQL 16, Keycloak sur le port 8180, royaume `casier`).
  3. Comptes de démonstration fictifs, un par profil (ENV-04) : `docker compose -f infra/docker-compose.yml --env-file infra/.env exec -T -e CASIER_MOT_DE_PASSE_DEMO keycloak sh < infra/keycloak/creer-comptes-demo.sh` (après `set -a; . infra/.env; set +a`).
  4. Service : `cd services/casier && set -a && . ../../infra/.env && set +a && mvn spring-boot:run -Dspring-boot.run.profiles=local` (référentiels chargés, simulateur de paiement).
  5. Portail branché sur le service : `CASIER_API_URL=http://localhost:8080 npm run dev -w apps/portail`.
- Jeton de test (poste de développement uniquement) : client `outils-developpement`, flux mot de passe, sur `http://localhost:8180/realms/casier/protocol/openid-connect/token`.
- Intégration continue : `.github/workflows/casier-judiciaire.yml` (tests, couverture, parcours, accessibilité, Semgrep, Trivy, gitleaks, SBOM).
- Documentation API : `/swagger-ui.html` (OpenAPI 3.1, API-01).

## Organisation du code
- Un module Spring Modulith par paquet de premier niveau sous `com.neamindustry.casier` : `audit`, `habilitations`, `regles`, `registre`, `identification`, `tarifs`, `demandes`, `bulletins`, `verification`, `commun` (noyau partagé ouvert).
- API publique d'un module = son paquet racine ; tout le reste dans `interne` ou `web`. Le test `ArchitectureModulaireTest` échoue sinon.
- Un schéma PostgreSQL par module (ARC-02) ; aucun module ne lit les tables d'un autre.
- Le module `verification` n'a qu'une copie minimale (jeton haché, statut, identité minimale) alimentée par événements (ARC-01).

## Conventions
- Citer l'identifiant d'exigence (ex. « RG-06 ») dans le code, les tests et les messages de commit.
- Vocabulaire métier en français, identique au cahier des charges (`docs/specs/` quand il sera versé).
- Tests écrits avant le code pour les règles RG, IDT, BUL (section 25).
- Décisions d'architecture : un fichier par décision dans `docs/adr/`.

## Règles non négociables
- Aucun tarif ni paramètre juridique dans le code : ce sont des données versionnées (`regles`, `tarifs`), avec date d'effet et quatre yeux.
- Aucune donnée réelle : jeux de données fictifs uniquement (DON-06, DON-08).
- Aucun secret dans le code ni dans la configuration versionnée (SEC-05).
- Aucune suppression physique dans le registre et le journal (REG-08, SEC-07).
- Toute action sur le casier est journalisée dans la même transaction (ENF-12).
- Aucun service tiers hors du Gabon en production (DON-07).
- Interfaces : composants du design system (`packages/design-system`) uniquement, jetons partagés (VIS-09).

## Définition de « terminé »
- `mvn -B verify` vert : tests, couverture ≥ 85 % sur le cœur métier (ENF-16), structure modulaire vérifiée.
- Analyses de sécurité sans alerte critique (workflow CI : Semgrep, Trivy, gitleaks, SBOM).
- Revue humaine obligatoire pour authentification, habilitations, registre, signature, paiement (SEC-11).
- Documentation et ADR à jour.
