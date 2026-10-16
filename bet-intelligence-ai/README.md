# BET INTELLIGENCE AI — Version 1 (démonstration)

Prototype frontend interactif d’analyse footballistique : exploration de rencontres simulées, analyses statistiques de démonstration, génération et suivi de **tickets virtuels**.

> ⚠️ **Mode démonstration.** Toutes les compétitions, équipes, cotes, probabilités et résultats sont **synthétiques**.
> Aucune API n’est appelée, aucun pari n’est placé, les tickets n’ont **aucune valeur financière**
> et rien de ce qui est affiché ne constitue une information sportive actuelle ou un conseil de pari.

## Démarrer

Prérequis : Node.js 20+ (testé avec Node 22).

```bash
cd bet-intelligence-ai
npm install
npm run dev        # http://localhost:5173
npm test           # tests des fonctions de calcul (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
npm run preview    # sert le build de production
```

## Version en ligne (claude.ai)

L'application est publiée comme Artifact claude.ai : https://claude.ai/artifact/Nvw3gts9tLL5T4Nj2EhtmM
(privé par défaut ; le partage se règle depuis le menu Partager de la page).

```bash
npm run build:artifact   # → artifact/bet-intelligence-ai.html (page unique, CSS et JS inlinés)
```

En ligne, l'application utilise les connecteurs claude.ai **de la personne qui l'ouvre**, avec son accord, et uniquement sur clic :

| Connecteur | Action | Où |
|---|---|---|
| Google Calendar (`create_event`) | Ajoute un match à l'agenda, titre préfixé `[DÉMO]`, description rappelant que le match est fictif | Fenêtre de détails d'un match ; détails d'un ticket (une action par sélection) |
| Gmail (`create_draft`) | Crée un **brouillon** récapitulant un ticket (jamais envoyé) | Détails d'un ticket |
| Google Drive (`create_file`) | Exporte les tickets affichés en CSV, converti en feuille Google Sheets | Mes tickets |

Chaque erreur est traduite selon son code (connecteur absent, connexion expirée, accès refusé, délai dépassé…) ;
une écriture n'est jamais relancée automatiquement. Les tickets et paramètres sont aussi sauvegardés dans
l'espace privé de chaque utilisateur de l'artefact (`data/users/<id>/state`, 80 tickets au plus), en plus du localStorage.
Les données réelles passent par le backend (voir ci-dessous), que la version claude.ai ne peut pas joindre : elle reste en mode démonstration. En local (`npm run dev`),
les boutons de connecteurs sont désactivés.

## Données réelles : backend Python + API-Football

Fournisseur retenu : **[API-Football](https://www.api-football.com)** (api-sports.io). Il fournit en une seule API
les matchs, les résultats, les statistiques et les cotes pré-match de 15 bookmakers, dont **1xBet**, Bet365,
Pinnacle et Unibet (cotes rafraîchies toutes les 3 h). Offre gratuite : 100 requêtes/jour, mais les saisons
accessibles y sont limitées ; pour la saison en cours, compter l’offre Pro (19 $/mois, 7 500 requêtes/jour).

Le backend (`api/`, FastAPI) :
- récupère les matchs à venir (7 jours) et les résultats de la saison des ligues suivies ;
- calcule les probabilités avec un **modèle statistique** (forces offensives/défensives domicile/extérieur
  rétrécies vers la moyenne, puis loi de Poisson) — ce n’est pas de l’IA et rien n’est garanti ;
- associe à chaque marché la cote du premier bookmaker disponible dans l’ordre 1xBet → Bet365 → Pinnacle → Unibet ;
- règle les tickets sur le score final (temps réglementaire) ; un match reporté ou annulé annule le ticket ;
- met en cache (mémoire + CDN 30 min) pour préserver le quota ; une ligue en erreur n’empêche pas les autres.

Le frontend interroge `/api/health` au démarrage : si le backend répond avec une clé configurée, il affiche
« DONNÉES RÉELLES » ; sinon il reste en **mode démonstration** (cas de la version claude.ai, qui ne peut pas
joindre de serveur extérieur). Tickets réels et tickets de démonstration sont comptés séparément dans Performances.

| Variable | Rôle | Défaut |
|---|---|---|
| `API_FOOTBALL_KEY` | Clé API-Football (**secrète**, jamais dans le code) | — (sans clé : démo) |
| `LEAGUES` | Ligues suivies (ids API-Football) | `39,140,135,78,61` (PL, Liga, Serie A, Bundesliga, Ligue 1) |
| `BOOKMAKERS` | Ordre de préférence des bookmakers | `11,8,4,16` (1xBet, Bet365, Pinnacle, Unibet) |
| `SEASON` | Forcer une saison | saison en cours |
| `TIMEZONE` | Fuseau des horaires | `Africa/Libreville` |
| `DAYS_AHEAD` | Horizon des matchs à venir | `7` |

En local :
```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
API_FOOTBALL_KEY=... .venv/bin/uvicorn api.index:app --port 8000   # backend
npm run dev                                                          # frontend, /api relayé vers :8000
.venv/bin/python -m pytest tests                                     # tests backend (sans réseau)
```

Deux implémentations identiques du backend (mêmes routes `/api/health`, `/api/matches`, `/api/results`) :
- **Netlify** (recommandé) : fonction TypeScript `netlify/functions/api.mts` + logique dans `server/`
  (`netlify.toml` fourni, dossier de base `bet-intelligence-ai`). Clé : Project configuration →
  Environment variables → `API_FOOTBALL_KEY`, portée « Functions ». Projet créé : `bet-intelligence-ai`
  (équipe DakiOriente) → https://bet-intelligence-ai.netlify.app
- **Python / FastAPI** (`api/`) : pour Vercel ou tout hébergeur Python.

Déploiement Vercel : importer le dossier `bet-intelligence-ai/` comme projet (`vercel.json` fourni :
build Vite + fonction Python `api/index.py`), puis ajouter `API_FOOTBALL_KEY` dans Settings → Environment Variables.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Lucide React · Recharts · Vitest. Aucune autre dépendance d’exécution.

## Fonctionnalités

| Écran | Contenu |
|---|---|
| **Dashboard** | 4 indicateurs (matchs analysés, sélections admissibles, tickets générés, prédictions en attente), meilleures opportunités selon les règles configurées, répartition par marché, probabilité estimée vs implicite, évolution des résultats simulés (vide tant qu’aucun ticket n’est réglé). |
| **Matchs** | Recherche (insensible aux accents), filtres compétition / date / marché / cote min-max / probabilité minimale, tri par heure, probabilité ou cote. Clic → fenêtre de détails (forme récente, stats offensives/défensives, xG simulés, probabilités par marché, arguments, risques, confiance). |
| **Analyse IA** | Analyse détaillée d’une rencontre : résumé, statistiques, domicile/extérieur, tableau probabilités/cotes/écart, graphique de comparaison, arguments, risques, niveau de confiance. |
| **Générateur de tickets** | Mode prudent, probabilité minimale, cotes min/max, nombre de sélections min/max, cote totale cible facultative, marchés autorisés ; aperçu en direct des exclusions ; génération avec raisons et risques. |
| **Mes tickets** | Historique (localStorage), recherche, filtres statut/marché, détails, changement de statut, règlement simulé, suppression et réinitialisation avec confirmation. |
| **Performances** | Prédictions enregistrées/réglées, taux de réussite, cote moyenne, ROI simulé, Brier Score ; bankroll virtuelle, résultats par marché, distribution des probabilités, probabilités estimées vs résultats observés. En dessous de 5 tickets réglés : « Données insuffisantes pour évaluer la performance. » |
| **Paramètres** | Règles de sélection, affichage des avertissements, préférences d’interface, sources de données (démo active ; API football, bot Telegram et backend **non connectés**), réinitialisation. |

Navigation latérale sur grand écran, barre d’onglets + menu « Plus » sur mobile. La page courante est conservée dans l’URL (`#/matchs`, `#/generateur`…).

## Ce qui est simulé (et comment)

- **Données** (`src/data/`) : 4 compétitions et 28 équipes fictives, 20 rencontres positionnées à partir du lendemain de la date d’ouverture, profils de force fictifs.
- **Probabilités** : *moteur déterministe*, pas d’IA. Buts attendus = moyenne de ligue × attaque × défense adverse × avantage du terrain, puis loi de Poisson → probabilités des 9 marchés (1, X, 2, 1X, X2, +1,5, +2,5, −3,5, BTTS).
- **Cotes de démonstration** : `1 / (p × (1 + marge))` avec un bruit pseudo-aléatoire de ±7 %. Le bouton « Actualiser » change la graine du bruit.
- **Analyses** : textes pré-rédigés choisis par des règles à partir des statistiques simulées.
- **Qualité des données** : élevée / moyenne / faible selon une taille d’échantillon simulée ; les sélections à données faibles sont exclues.
- **Règlement des tickets** : bouton « Simuler le résultat » → tirage pseudo-aléatoire reproductible de chaque sélection selon sa probabilité synthétique. Le statut peut aussi être modifié manuellement. Aucun résultat réel n’est consulté et aucun historique n’est pré-rempli.
- **Montants** : mise virtuelle fixe de 1 000 FCFA fictifs par ticket, bankroll virtuelle de départ de 100 000 FCFA fictifs.

## Règles du générateur

1. Lecture des paramètres (le **mode prudent** impose en plus : données de qualité élevée, marchés volatils exclus — nul, BTTS, +2,5 —, probabilité ≥ 78 %, 3 sélections au plus).
2. Filtrage : marché autorisé, données suffisantes, match non commencé, cote dans la plage, probabilité ≥ seuil.
3. Tri par probabilité estimée décroissante, **une seule sélection par match**.
4. Le minimum de sélections est requis ; des sélections supplémentaires ne sont ajoutées que pour approcher la cote cible, sans dépasser le maximum ni assouplir les critères.
5. Un ticket identique à un ticket déjà en attente n’est jamais recréé.
6. **Cote totale = produit des cotes ; probabilité indicative = produit des probabilités** (hypothèse d’indépendance, signalée à l’écran).
7. Si aucune combinaison ne convient : « Aucune combinaison ne satisfait actuellement les critères définis. Modifiez vos paramètres ou réessayez ultérieurement. »

## Architecture

```
src/
  components/
    layout/       Sidebar, MobileNav, TopBar, Logo
    dashboard/    OpportunityList, graphiques du dashboard
    matches/      MatchFilters, MatchList, MatchDetailsModal
    analysis/     StatBlocks, MarketTable, ArgumentsRisks, ConfidenceMeter
    tickets/      CriteriaForm, TicketView
    performance/  BankrollChart, PerformanceCharts
    ui/           Card, Button, Badge, Modal, ConfirmDialog, Fields, Notice…
  pages/          un composant par écran
  data/           demoMatches.ts, demoStatistics.ts (données fictives uniquement)
  services/
    matchService.ts        accès aux matchs + éligibilité des sélections
    ticketService.ts       génération, règlement simulé, persistance
    performanceService.ts  indicateurs et séries
    analysisService.ts     analyse déterministe
    settingsService.ts     paramètres + validation
    demoEngine.ts          fabrique du jeu de données de démonstration
    storage.ts             accès sécurisé à localStorage
  hooks/          useAppStore (état global), useHashRoute, useEligible
  types/          interfaces Match, TeamStats, Selection, Ticket, Settings…
  utils/          calculs (math, poisson), formats fr-FR, filtres de matchs
  __tests__/      tests Vitest des calculs
```

### Brancher un backend Python plus tard

Les écrans ne consomment que des objets typés (`src/types`). Pour passer aux vraies données, remplacer le corps de
`fetchMatches()` / `fetchCompetitions()` dans `src/services/matchService.ts` par des appels HTTP (ex. `fetch('/api/matches')`)
renvoyant des `Match[]`, et de même pour la persistance des tickets dans `ticketService.ts`. Les probabilités et cotes
seraient alors fournies par le backend ; les fonctions de filtrage, de composition et d’évaluation restent valables.
Ne jamais placer de clé d’API dans ce frontend.

## Persistance

Clés `localStorage` préfixées `bia:v1:` (`settings`, `tickets`, `oddsSeed`). Les données lues sont validées
(paramètres bornés, tickets mal formés ignorés). Si le stockage est indisponible (navigation privée, quota), un bandeau le signale.

## Tests

`npm test` couvre : produit des cotes et des probabilités, probabilité implicite, Brier Score, cohérence du modèle de Poisson,
formats français, filtres et tris du centre des matchs, éligibilité (seuils, marchés, mode prudent, matchs commencés),
composition (une sélection par match, minimum, cote cible, maximum), refus de forcer un ticket, anti-doublon,
règlement simulé reproductible, normalisation des paramètres et indicateurs de performance.
