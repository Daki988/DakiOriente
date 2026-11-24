export type ProjectStep = {
  title: string;
  /** Pourquoi cette étape : le principe à comprendre */
  why: string;
  /** Prompt à donner à Claude Code */
  prompt?: string;
  code?: { title: string; text: string }[];
  /** Point de contrôle : comment vérifier que l'étape est réussie */
  check: string;
};

export type Project = {
  id: string;
  level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
  title: string;
  duration: string;
  /** Index du palier qui doit être validé pour ouvrir le projet */
  requires: number;
  pitch: string;
  build: string[];
  prereq: string[];
  steps: ProjectStep[];
  next: string[];
};

export const LEVEL_ORDER: Project["level"][] = ["Débutant", "Intermédiaire", "Avancé", "Expert"];

export const PROJECTS: Project[] = [
  /* ═══════════════════════ DÉBUTANT ═══════════════════════ */
  {
    id: "p1", level: "Débutant", title: "Ta première fonctionnalité de A à Z : la page « À propos »", duration: "45 min", requires: 1,
    pitch: "Le projet idéal pour prendre les bons réflexes : explorer, planifier, coder, vérifier, revenir en arrière et committer, sur une fonctionnalité simple de DakiOriente.",
    build: ["Une page « À propos » accessible depuis le menu", "Un commit propre sur une branche dédiée", "Les réflexes : mode plan, @, !, Esc, /rewind"],
    prereq: ["Claude Code installé et lancé à la racine du repo (module 0)", "Les gestes de base (module 1)"],
    steps: [
      { title: "Créer une branche et lancer Claude", why: "Une branche par tâche : si quelque chose tourne mal, main reste intact.", code: [{ title: "terminal", text: "cd DakiOriente\ngit switch -c feature/page-a-propos\nclaude" }], check: "La ligne d'état de Claude affiche ta branche ; `!git status` est propre." },
      { title: "Explorer sans rien modifier", why: "Claude doit comprendre le routage et la mise en page avant de toucher au code. Tu vérifies que sa compréhension est juste.", prompt: "Passe en lecture seule : explique comment sont organisées les pages et le menu de ce projet. Liste les fichiers que je devrais lire pour ajouter une nouvelle page. Ne modifie rien.", check: "Il cite les bons fichiers (routes, composant de menu, layout). Si une explication est fausse, corrige-la maintenant." },
      { title: "Demander un plan (mode plan)", why: "Shift+Tab jusqu'au mode plan : Claude propose sans toucher. Corriger un plan coûte bien moins cher que corriger du code.", prompt: "Objectif : ajouter une page « À propos » (présentation de DakiOriente en 3 paragraphes) accessible depuis le menu.\nContraintes : réutilise le layout et les composants existants, aucune dépendance nouvelle.\nTerminé quand : la page s'affiche, le lien du menu fonctionne sur mobile et desktop, le build passe.\nPropose un plan étape par étape avec les fichiers modifiés.", check: "Le plan liste 2 à 4 fichiers maximum et n'invente pas de nouvelle librairie." },
      { title: "Implémenter puis vérifier", why: "Une fois le plan validé, Claude code. Tu exiges une preuve : build et rendu réel.", prompt: "Applique le plan. Ensuite lance le build et le serveur de dev, fais une capture de la page à 375 px et 1440 px, et confirme que le lien du menu mène bien à la page.", code: [{ title: "vérifs manuelles", text: "!npm run build\n!git diff --stat" }], check: "Le build passe, `git diff --stat` ne montre que les fichiers prévus, la page s'affiche aux deux tailles." },
      { title: "S'entraîner à revenir en arrière", why: "Tu dois savoir annuler sans panique. /rewind restaure le code modifié par Claude (pas les commandes shell).", prompt: "Change le titre de la page en « Qui sommes-nous ? ».", code: [{ title: "dans Claude", text: "Esc Esc          # ou /rewind\n# choisis le message précédent → restaurer le code\n!git diff --stat # le titre est revenu" }], check: "Après /rewind, le titre d'origine est de retour." },
      { title: "Committer avec un message qui explique le pourquoi", why: "Chaque commit est un point de retour fiable. Le message explique pourquoi, pas seulement quoi.", prompt: "Committe ces changements avec un message clair en français qui explique pourquoi on ajoute cette page.", check: "`git log -1` montre un message lisible ; `git status` est propre." },
    ],
    next: ["Note dans ton journal ce qui a bien marché et ce qui a coincé.", "Refais l'exercice avec une page « Contact » sans relire ce tutoriel."],
  },
  {
    id: "p2", level: "Débutant", title: "Un CLAUDE.md et une bibliothèque de prompts qui travaillent pour toi", duration: "1 h", requires: 3,
    pitch: "Tu écris une fois tes règles et tes meilleurs prompts, et chaque session démarre au bon niveau. C'est l'investissement le plus rentable de la formation.",
    build: ["Un CLAUDE.md projet de moins de 100 lignes", "Un ~/.claude/CLAUDE.md personnel", "docs/prompts.md avec au moins 5 prompts éprouvés"],
    prereq: ["Modules 2 (prompts) et 3 (mémoire) validés", "Ton journal docs/journal-claude.md"],
    steps: [
      { title: "Faire l'inventaire de ce que Claude devine mal", why: "Un bon CLAUDE.md naît des erreurs répétées. Ton journal est la source.", prompt: "Lis @docs/journal-claude.md et @CLAUDE.md. Liste les erreurs qui reviennent et, pour chacune, la règle courte (avec son pourquoi) qui l'aurait évitée. Ne modifie rien.", check: "Tu obtiens une liste de 5 à 10 règles candidates, chacune avec une raison." },
      { title: "Réécrire CLAUDE.md avec le squelette", why: "Communication, stack, commandes, méthode Figma, conventions, interdits, pièges connus : chaque ligne doit changer le comportement de Claude.", prompt: "Réécris CLAUDE.md avec ces sections : Communication, Stack, Commandes, Méthode Figma d'abord, Conventions, À ne pas faire, Pièges connus. Intègre les règles validées ci-dessus. Moins de 100 lignes. Chaque interdit doit avoir sa raison.", check: "Le fichier fait moins de 100 lignes ; aucune ligne générique du type « écris du code propre »." },
      { title: "Créer tes préférences personnelles", why: "Ce qui vaut pour tous tes projets va dans ~/.claude/CLAUDE.md, pas dans le projet.", code: [{ title: "~/.claude/CLAUDE.md", text: "# Préférences de Viorica\n- Réponds en français, de façon concise.\n- Commence par un plan pour toute tâche de plus de deux fichiers.\n- Termine par la liste des vérifications faites (build, tests, capture)." }], check: "`/memory` liste bien les deux fichiers." },
      { title: "Tester la mémoire après un /clear", why: "Si Claude oublie une règle importante, elle est mal formulée ou noyée.", prompt: "/clear\nQuelles sont les règles de ce projet ? Lesquelles te semblent ambiguës ou contradictoires ?", check: "Toutes les règles importantes sont restituées ; tu as corrigé les ambiguïtés signalées." },
      { title: "Amorcer la bibliothèque de prompts", why: "Les prompts qui marchent deviendront des skills et des commandes au module 6.", code: [{ title: "docs/prompts.md", text: "# Bibliothèque de prompts DakiOriente\n## Comprendre\n- Explique comment fonctionne <X> : fichiers clés et flux de données. Ne modifie rien.\n## Nouvelle fonctionnalité\n- Interroge-moi une question à la fois pour écrire SPEC.md sur <X>.\n## Bug\n- <symptôme>. Étapes : <…>. Erreur complète : <…>.\n  Reproduis avec un test qui échoue, corrige, relance les tests.\n## Revue\n- Relis le diff comme un développeur senior exigeant : bugs, cas limites, lisibilité.\n## Maquette → code\n- Implémente <URL Figma node-id> : composants réutilisés d'abord, captures 375/1440 px comparées." }], check: "Au moins 5 prompts classés par situation ; commit du tout." },
    ],
    next: ["Relis ton CLAUDE.md toutes les deux semaines.", "Ajoute un prompt à la bibliothèque chaque fois qu'un prompt marche du premier coup."],
  },

  /* ═══════════════════════ INTERMÉDIAIRE ═══════════════════════ */
  {
    id: "p3", level: "Intermédiaire", title: "Corriger un vrai bug en TDD, sans jamais tricher sur les tests", duration: "1 h", requires: 4,
    pitch: "La méthode qui transforme « c'est corrigé » en preuve : un test qui reproduit le bug, une correction de la cause racine, et un test qui empêche son retour.",
    build: ["Un test qui reproduit un bug réel", "Une correction de la cause racine", "Un historique git qui prouve que le test n'a pas été modifié"],
    prereq: ["Module 4 validé", "Un projet avec une commande de test (npm test)"],
    steps: [
      { title: "Décrire le bug avec des données brutes", why: "Symptôme, étapes, attendu, constaté, erreur complète : ton résumé perdrait l'indice utile.", prompt: "Bug : sur mobile, le menu reste ouvert après avoir cliqué un lien.\nReproduction : viewport 375 px, ouvrir le menu, cliquer « Contact ».\nAttendu : le menu se ferme. Constaté : il reste ouvert, la page change.\nFichiers probables : @src/components/Menu.tsx\nNe corrige rien pour l'instant : formule trois hypothèses.", check: "Trois hypothèses distinctes, chacune vérifiable." },
      { title: "Écrire le test qui échoue, puis committer", why: "Le commit des tests AVANT l'implémentation permet de voir immédiatement si Claude touche aux tests pour les faire passer.", prompt: "Écris un test qui reproduit ce bug, dans le style des tests existants. Ne corrige pas le code. Lance-le et confirme qu'il échoue pour la bonne raison.", code: [{ title: "terminal", text: "!npm test -- Menu\n!git add -A && git commit -m \"test: reproduit le menu mobile qui reste ouvert\"" }], check: "Le test échoue avec un message qui décrit exactement le bug." },
      { title: "Trouver et corriger la cause racine", why: "On corrige la cause, pas le symptôme. Les logs départagent les hypothèses, puis on les retire.", prompt: "Ajoute des logs pour départager tes hypothèses, lance, explique la cause racine, puis corrige-la. Ne modifie pas le test. Retire les logs de débogage à la fin et lance toute la suite.", check: "Toute la suite est verte et `git diff HEAD~1 -- '*.test.*'` est vide." },
      { title: "Relire et committer", why: "Tu restes responsable du code : relecture du diff, puis commit.", code: [{ title: "terminal", text: "!git diff --stat\n/code-review\n!git commit -am \"fix: ferme le menu mobile après navigation\"" }], check: "La revue ne signale rien de bloquant ; deux commits clairs (test puis correctif)." },
    ],
    next: ["Transforme cette méthode en commande /bug (projet 5).", "Ajoute le bug et sa cause aux « Pièges connus » de CLAUDE.md s'il risque de revenir."],
  },
  {
    id: "p4", level: "Intermédiaire", title: "De la maquette Figma à un écran conforme", duration: "1 h 30", requires: 4,
    pitch: "Ta méthode « Figma d'abord » appliquée de bout en bout : récupérer le design, réutiliser le design system, implémenter, puis comparer visuellement jusqu'à la conformité.",
    build: ["Un écran implémenté depuis une maquette validée", "Des captures 375 px et 1440 px comparées à la maquette", "La liste des écarts restants justifiés"],
    prereq: ["Module 4 validé", "Le serveur MCP Figma connecté (/mcp)", "Une maquette validée avec son URL node-id"],
    steps: [
      { title: "Vérifier la connexion Figma", why: "Sans le serveur MCP, Claude ne voit pas la maquette.", code: [{ title: "dans Claude", text: "/mcp            # figma doit être « connected »" }], check: "Le serveur Figma est connecté et authentifié." },
      { title: "Récupérer le design et inventorier les composants", why: "Le code Figma est une référence à adapter : on part de ce qui existe déjà dans le projet.", prompt: "Pour la maquette <URL Figma avec node-id> : récupère le design avec get_design_context et une capture avec get_screenshot. Liste les composants et tokens existants que tu vas réutiliser, et ceux qu'il faut créer. Attends ma validation.", check: "La liste réutilise d'abord tes composants ; aucune valeur inventée (couleur, taille)." },
      { title: "Implémenter avec les tokens", why: "N'invente aucune valeur : couleurs, tailles et espacements viennent des tokens.", prompt: "Implémente l'écran avec les composants validés. Toutes les valeurs viennent des tokens du design system. Lance le build à la fin.", check: "Le build passe ; `git diff` ne contient aucune couleur en dur." },
      { title: "Comparer visuellement et corriger", why: "La comparaison transforme « ça ressemble » en « c'est conforme ». Deux ou trois boucles suffisent.", prompt: "Lance le serveur, capture le rendu à 375 px et 1440 px, compare avec la maquette, corrige les écarts. Termine par la liste des écarts restants et leur raison.", check: "Écarts restants mineurs et justifiés ; captures jointes à la PR." },
    ],
    next: ["Transforme ce déroulé en skill maquette-vers-code (projet 5).", "Ajoute l'agent verif-design (module 7) pour une revue indépendante."],
  },
  {
    id: "p5", level: "Intermédiaire", title: "Ta boîte à outils : une skill, une commande et deux hooks", duration: "1 h 30", requires: 6,
    pitch: "Tu transformes tes routines en outils : une skill qui se déclenche seule, une commande /bug avec argument, un hook qui formate et un hook qui protège tes fichiers sensibles.",
    build: [".claude/skills/maquette-vers-code/SKILL.md", ".claude/commands/bug.md", "Un hook PostToolUse (formatage) et un hook PreToolUse (protection)"],
    prereq: ["Module 6 validé", "jq et prettier disponibles (npx)"],
    steps: [
      { title: "Créer la skill maquette-vers-code", why: "La description décide quand Claude charge la skill : écris-la avec tes mots.", code: [{ title: ".claude/skills/maquette-vers-code/SKILL.md", text: "---\nname: maquette-vers-code\ndescription: Implémente un écran ou un composant à partir d'une URL Figma\n  validée. À utiliser dès qu'une URL figma.com est fournie pour produire du code.\n---\n# Maquette vers code\n1. get_design_context + get_screenshot sur le node-id fourni.\n2. Liste composants et tokens réutilisés / à créer ; attends validation.\n3. Implémente sans valeur inventée.\n4. Captures 375 px et 1440 px comparées à la maquette ; corrige.\n5. npm test et npm run lint ; termine par les écarts restants." }], check: "Donne simplement une URL Figma dans une session neuve : la skill se déclenche sans être appelée." },
      { title: "Créer la commande /bug", why: "Un raccourci que tu lances toi-même, avec $ARGUMENTS.", code: [{ title: ".claude/commands/bug.md", text: "---\ndescription: Corriger un bug avec reproduction par un test\n---\nBug à corriger : $ARGUMENTS\n1. Trouve le code concerné et explique la cause probable.\n2. Écris un test qui reproduit le bug et vérifie qu'il échoue.\n3. Corrige la cause racine, sans modifier le test.\n4. Lance la suite complète et résume en 3 lignes." }], check: "`/bug le menu mobile reste ouvert` lance bien la procédure complète." },
      { title: "Ajouter le hook de formatage", why: "« Toujours formater » ne doit pas dépendre de la mémoire de Claude : c'est un hook.", code: [{ title: ".claude/settings.json", text: "{\n  \"hooks\": {\n    \"PostToolUse\": [{\n      \"matcher\": \"Edit|Write\",\n      \"hooks\": [{ \"type\": \"command\",\n        \"command\": \"jq -r '.tool_input.file_path' | xargs npx prettier --write\" }]\n    }]\n  }\n}" }], check: "Après une modification par Claude, le fichier est automatiquement formaté." },
      { title: "Ajouter le hook de protection", why: "Code de sortie 2 = action bloquée, et le message est transmis à Claude.", code: [{ title: ".claude/hooks/proteger.sh", text: "#!/bin/bash\nfichier=$(jq -r '.tool_input.file_path // empty')\ncase \"$fichier\" in\n  *.env*|*package-lock.json)\n    echo \"Modification interdite : $fichier\" >&2\n    exit 2 ;;\nesac\nexit 0" }, { title: "ajout dans .claude/settings.json → hooks", text: "\"PreToolUse\": [{\n  \"matcher\": \"Edit|Write\",\n  \"hooks\": [{ \"type\": \"command\",\n    \"command\": \"\\\"$CLAUDE_PROJECT_DIR\\\"/.claude/hooks/proteger.sh\" }]\n}]" }], check: "`chmod +x .claude/hooks/proteger.sh`, puis demande de modifier .env : l'action est refusée avec le message." },
      { title: "Versionner et partager", why: "Skills, commandes et hooks du projet profitent à toute l'équipe (et à Claude dans GitHub).", code: [{ title: "terminal", text: "!git add .claude && git commit -m \"chore: skill, commande /bug et hooks du projet\"" }], check: "`/hooks` liste les deux hooks ; tout est commité." },
    ],
    next: ["Transforme ton prompt le plus utilisé de docs/prompts.md en skill.", "Package le tout en plugin pour le réutiliser sur un autre projet."],
  },

  /* ═══════════════════════ AVANCÉ ═══════════════════════ */
  {
    id: "p6", level: "Avancé", title: "Créer ton propre serveur MCP pour brancher Claude sur tes données", duration: "2 h", requires: 7,
    pitch: "Tu donnes à Claude un nouvel outil : un serveur MCP en TypeScript qui expose les données de DakiOriente (recherche et fiche détaillée). Claude Code pourra l'appeler comme Figma ou GitHub.",
    build: ["Un serveur MCP local (stdio) avec deux outils", "Son enregistrement en portée project dans .mcp.json", "Des réponses de Claude fondées sur tes vraies données"],
    prereq: ["Module 7 validé", "Node.js 18+", "Un fichier de données (JSON) ou une API interne à exposer"],
    steps: [
      { title: "Initialiser le projet du serveur", why: "Un serveur MCP est un petit programme : il déclare des outils, Claude les appelle.", code: [{ title: "terminal", text: "mkdir mcp-daki && cd mcp-daki\nnpm init -y\nnpm install @modelcontextprotocol/sdk zod\nnpm install -D typescript tsx @types/node" }], check: "Les dépendances sont installées." },
      { title: "Déclarer les outils", why: "Chaque outil a un nom, une description claire (c'est elle qui guide Claude) et un schéma d'entrée.", prompt: "Écris server.ts : un serveur MCP stdio nommé « daki » avec deux outils, rechercher_annonces(ville, motcle?) et detail_annonce(id), qui lisent data/annonces.json. Descriptions précises en français, schémas Zod, erreurs explicites si rien n'est trouvé. Suis la documentation officielle du SDK MCP TypeScript.", code: [{ title: "server.ts (structure)", text: "import { McpServer } from \"@modelcontextprotocol/sdk/server/mcp.js\";\nimport { StdioServerTransport } from \"@modelcontextprotocol/sdk/server/stdio.js\";\nimport { z } from \"zod\";\nimport annonces from \"./data/annonces.json\" with { type: \"json\" };\n\nconst server = new McpServer({ name: \"daki\", version: \"1.0.0\" });\n\nserver.registerTool(\n  \"rechercher_annonces\",\n  {\n    description: \"Recherche des annonces DakiOriente par ville et mot-clé.\",\n    inputSchema: { ville: z.string(), motcle: z.string().optional() },\n  },\n  async ({ ville, motcle }) => {\n    const res = annonces.filter((a) => a.ville === ville && (!motcle || a.titre.includes(motcle)));\n    return { content: [{ type: \"text\", text: JSON.stringify(res.slice(0, 10)) }] };\n  },\n);\n\nawait server.connect(new StdioServerTransport());" }], check: "`npx tsx server.ts` démarre sans erreur (il attend sur l'entrée standard)." },
      { title: "Brancher le serveur sur Claude Code", why: "Portée project = .mcp.json versionné : toute l'équipe en profite.", code: [{ title: "terminal (racine de DakiOriente)", text: "claude mcp add --scope project daki -- npx tsx ../mcp-daki/server.ts\nclaude mcp list" }], check: "`/mcp` affiche « daki » connecté avec ses deux outils." },
      { title: "Tester avec de vraies questions", why: "La qualité des descriptions se voit ici : Claude doit choisir le bon outil sans aide.", prompt: "Quelles annonces à Toulouse parlent de colocation ? Donne le détail de la plus récente.", check: "Claude appelle rechercher_annonces puis detail_annonce, et sa réponse cite tes vraies données." },
      { title: "Sécuriser", why: "Un serveur MCP agit avec tes accès : lecture seule, résultats limités, aucune donnée sensible.", prompt: "Relis server.ts : vérifie qu'aucun outil n'écrit ni n'expose de donnée personnelle, limite chaque réponse à 10 résultats et ajoute une gestion d'erreur propre.", check: "/security-review ne signale rien de bloquant." },
    ],
    next: ["Ajoute un outil qui interroge ta vraie API au lieu du JSON.", "Publie le serveur en HTTP pour l'utiliser depuis les sessions cloud."],
  },
  {
    id: "p7", level: "Avancé", title: "Automatiser : rapport hebdo, Claude dans GitHub et revue de PR automatique", duration: "2 h", requires: 8,
    pitch: "Claude travaille sans toi : un script qui rédige le rapport de la semaine, des issues traitées par @claude, et une revue automatique de chaque PR, avec des permissions minimales.",
    build: ["scripts/rapport-semaine.sh avec claude -p", "L'application GitHub Claude et un workflow @claude", "Une tâche récurrente (planifiée ou /loop)"],
    prereq: ["Module 8 validé", "Le repo DakiOriente sur GitHub", "Un secret ANTHROPIC_API_KEY dans le repo"],
    steps: [
      { title: "Le rapport hebdomadaire en une commande", why: "claude -p + pipes : Claude devient une commande Unix comme les autres.", code: [{ title: "scripts/rapport-semaine.sh", text: "#!/bin/bash\nset -euo pipefail\nmkdir -p docs/rapports\ngit log --since=\"1 week ago\" --pretty=format:\"%h %s (%an)\" \\\n  | claude -p \"Rédige en français un rapport hebdomadaire de ces commits :\n      fonctionnalités, corrections, points d'attention. Format Markdown.\" \\\n      --max-turns 3 \\\n  > \"docs/rapports/$(date +%Y-%m-%d).md\"" }], check: "`bash scripts/rapport-semaine.sh` produit un fichier Markdown lisible." },
      { title: "Sortie JSON pour les scripts", why: "--output-format json rend la réponse exploitable par un programme ; --allowedTools limite ce que Claude peut faire.", code: [{ title: "terminal", text: "claude -p \"Liste les composants sans test\" \\\n  --output-format json \\\n  --allowedTools \"Read,Grep,Glob\" \\\n  --max-turns 10 | jq -r '.result'" }], check: "Tu récupères le texte de la réponse avec jq." },
      { title: "Installer Claude dans GitHub", why: "Dans une issue ou une PR, @claude implémente ou corrige, depuis GitHub Actions.", code: [{ title: "dans Claude", text: "/install-github-app" }, { title: ".github/workflows/claude.yml (extrait)", text: "- uses: anthropics/claude-code-action@v1\n  with:\n    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}" }], check: "Crée une petite issue et écris « @claude implémente cette issue » : une branche et une PR apparaissent." },
      { title: "Revue automatique des PR", why: "Une revue indépendante à chaque PR, sans fusion automatique : l'humain garde la main.", prompt: "Ajoute un workflow GitHub Actions qui, à chaque pull request, demande à Claude de relire le diff (bugs, sécurité, cas limites) et de commenter la PR. Permissions minimales, aucune fusion automatique.", check: "Ouvre une PR de test : un commentaire de revue apparaît." },
      { title: "Une tâche qui tourne sans toi", why: "Planifiée chaque lundi, ou /loop dans une session pour surveiller la CI.", code: [{ title: "dans Claude", text: "/loop 10m vérifie si la CI de ma PR est verte et préviens-moi" }], check: "La tâche s'exécute et te prévient sans intervention." },
    ],
    next: ["Garde toujours une relecture humaine avant main.", "Ajoute un budget (max-turns) à chaque automatisation."],
  },

  /* ═══════════════════════ EXPERT ═══════════════════════ */
  {
    id: "p8", level: "Expert", title: "Construire un agent IA autonome avec le Claude Agent SDK", duration: "3 h", requires: 8,
    pitch: "Tu crées ton premier agent : un auditeur qualité qui parcourt le site, repère les problèmes (textes alternatifs, meta descriptions, liens cassés) et écrit un rapport, tout seul, avec des outils limités.",
    build: ["Un agent TypeScript basé sur le Claude Agent SDK", "Des outils en lecture seule et un sous-agent spécialisé", "Un rapport Markdown généré et une exécution planifiée"],
    prereq: ["Module 8 validé (claude -p, Agent SDK)", "Node.js 18+ et une clé API ou un compte Claude connecté"],
    steps: [
      { title: "Comprendre ce qu'est un agent", why: "Un agent enchaîne seul lire → agir → vérifier. Le SDK te donne le même moteur que Claude Code : boucle, outils intégrés (Read, Grep, Glob, Bash…), permissions, sous-agents, MCP.", check: "Tu sais expliquer la différence entre un appel à l'API (une question, une réponse) et un agent (une tâche, plusieurs actions)." },
      { title: "Initialiser le projet", why: "Le SDK s'installe comme n'importe quel paquet npm.", code: [{ title: "terminal", text: "mkdir agent-audit && cd agent-audit\nnpm init -y\nnpm install @anthropic-ai/claude-agent-sdk\nnpm install -D typescript tsx @types/node" }], check: "Le paquet est installé." },
      { title: "Écrire l'agent", why: "Un prompt clair, un périmètre en lecture seule (allowedTools) et un nombre de tours limité : un agent sûr par construction.", code: [{ title: "audit.ts", text: "import { query } from \"@anthropic-ai/claude-agent-sdk\";\n\nconst consigne = `Audite le site dans ./site :\n- images sans texte alternatif\n- pages sans meta description\n- liens internes cassés\nRends un rapport Markdown classé par gravité (bloquant, important, mineur),\navec le fichier et la ligne pour chaque problème.`;\n\nfor await (const message of query({\n  prompt: consigne,\n  options: { allowedTools: [\"Read\", \"Grep\", \"Glob\"], maxTurns: 30 },\n})) {\n  if (message.type === \"result\") console.log(message.result);\n}" }], check: "`npx tsx audit.ts > rapport.md` produit un rapport classé par gravité." },
      { title: "Ajouter un sous-agent spécialisé", why: "Un sous-agent a son propre contexte : la lecture de dizaines de pages ne pollue pas l'agent principal.", prompt: "Dans audit.ts, ajoute un sous-agent « verif-liens » (outils Read, Grep, Glob uniquement) chargé de vérifier les liens internes et de ne renvoyer que la liste des liens cassés. L'agent principal lui délègue cette partie. Suis la documentation officielle du Claude Agent SDK (code.claude.com/docs/en/agent-sdk).", check: "Le rapport final intègre la section liens produite par le sous-agent." },
      { title: "Lancer l'agent chaque semaine", why: "Un agent qui tourne seul, avec un rapport versionné et une relecture humaine.", prompt: "Crée un workflow GitHub Actions hebdomadaire qui lance l'agent, enregistre le rapport dans docs/audits/ et ouvre une PR. Secrets dans les secrets GitHub, aucune fusion automatique.", check: "Le workflow s'exécute manuellement (workflow_dispatch) et ouvre une PR avec le rapport." },
    ],
    next: ["Donne-lui un outil d'écriture limité pour proposer les corrections dans la PR.", "Pour un agent hébergé par Anthropic (boucle et conteneur gérés), regarde Claude Managed Agents."],
  },
  {
    id: "p9", level: "Expert", title: "Ta propre IA spécialisée : l'assistant expert DakiOriente", duration: "1 journée", requires: 9,
    pitch: "Tu crées une IA experte de ton domaine, disponible sur le web : elle connaît tes contenus, utilise tes outils, répond dans ton style et est évaluée sur de vraies questions. Le tout construit avec Claude Code, sur l'API Claude.",
    build: [
      "Une IA spécialisée : instructions + base de connaissances + outils",
      "Une API sur Vercel qui appelle Claude (streaming, cache de prompt)",
      "Une interface de chat, un jeu d'évaluation et un suivi des coûts",
    ],
    prereq: ["Les 10 paliers validés (pipeline du module 9)", "Une clé API Anthropic (Console) stockée en variable d'environnement", "Un compte Vercel"],
    steps: [
      { title: "Comprendre ce que veut dire « IA spécialisée »", why: "On n'entraîne pas un nouveau modèle : on spécialise un modèle très capable avec 4 leviers. 1) des instructions système précises (rôle, ton, limites) ; 2) des connaissances fournies à chaque requête (tes documents, mis en cache) ; 3) des outils pour agir sur tes données ; 4) des évaluations pour mesurer et améliorer. C'est plus rapide, moins cher et plus facile à maintenir qu'un entraînement.", check: "Tu sais citer les 4 leviers et pourquoi on n'entraîne pas de modèle." },
      { title: "Écrire la spec par interview", why: "Une IA spécialisée commence par une spec : qui l'utilise, pour quoi, ce qu'elle doit refuser, comment on juge une bonne réponse.", prompt: "Interroge-moi, une question à la fois, pour écrire SPEC-assistant.md : utilisateurs, 10 questions types, sources de connaissances, outils nécessaires, ce que l'assistant doit refuser, ton et format des réponses, critères d'une bonne réponse.", check: "SPEC-assistant.md contient 10 questions types avec la réponse attendue." },
      { title: "Construire la base de connaissances", why: "Les connaissances vont dans le prompt système, avant la question : avec le cache de prompt, elles ne sont facturées plein tarif qu'une fois.", prompt: "Crée knowledge/ : rassemble en Markdown les contenus de référence (FAQ, règles, fiches) à partir de @docs et @content. Un fichier par thème, sans donnée personnelle ni secret.", check: "Tous les fichiers sont relus et ne contiennent aucune donnée sensible." },
      { title: "Créer l'API avec le SDK Anthropic", why: "Une route serveur appelle Claude : la clé reste côté serveur, jamais dans le navigateur. Le streaming affiche la réponse au fil de l'eau.", code: [{ title: "terminal", text: "npm install @anthropic-ai/sdk zod" }, { title: "api/chat.ts (cœur de l'appel)", text: "import Anthropic from \"@anthropic-ai/sdk\";\n\nconst client = new Anthropic(); // lit ANTHROPIC_API_KEY\n\nconst stream = client.messages.stream({\n  model: \"claude-opus-5-5\",\n  max_tokens: 64000,\n  system: [\n    { type: \"text\", text: INSTRUCTIONS },\n    // Connaissances : stables, donc mises en cache\n    { type: \"text\", text: CONNAISSANCES, cache_control: { type: \"ephemeral\" } },\n  ],\n  messages: historique, // [{ role: \"user\", content: \"…\" }, …]\n});\n\nstream.on(\"text\", (t) => envoyerAuNavigateur(t));\nconst final = await stream.finalMessage();\nconsole.log(final.usage.cache_read_input_tokens); // > 0 dès la 2e question" }], check: "Deux questions d'affilée : `cache_read_input_tokens` est supérieur à 0 à la seconde." },
      { title: "Donner des outils à ton IA", why: "Avec des outils, l'IA consulte tes données à jour au lieu de deviner. Le Tool Runner du SDK gère la boucle d'appels pour toi.", code: [{ title: "api/outils.ts", text: "import Anthropic from \"@anthropic-ai/sdk\";\nimport { betaZodTool } from \"@anthropic-ai/sdk/helpers/beta/zod\";\nimport { z } from \"zod\";\n\nconst client = new Anthropic();\n\nconst rechercherAnnonces = betaZodTool({\n  name: \"rechercher_annonces\",\n  description: \"Recherche les annonces DakiOriente par ville et mot-clé.\",\n  inputSchema: z.object({ ville: z.string(), motcle: z.string().optional() }),\n  run: async ({ ville, motcle }) => JSON.stringify(await chercher(ville, motcle)),\n});\n\nconst reponse = await client.beta.messages.toolRunner({\n  model: \"claude-opus-5-5\",\n  max_tokens: 16000,\n  system: INSTRUCTIONS,\n  tools: [rechercherAnnonces],\n  messages: historique,\n});" }], check: "Une question sur une ville déclenche l'outil et la réponse cite des annonces réelles." },
      { title: "Interface de chat et déploiement", why: "Ta méthode s'applique : maquette Figma validée, puis code, puis comparaison visuelle.", prompt: "Implémente l'écran de chat depuis la maquette <URL Figma> avec la skill maquette-vers-code. Branche-le sur /api/chat en streaming. Ajoute ANTHROPIC_API_KEY dans les variables d'environnement Vercel (jamais dans le code), puis déploie en prévisualisation.", check: "L'URL de prévisualisation répond sur mobile et desktop ; la clé n'apparaît nulle part dans le code client." },
      { title: "Évaluer et améliorer", why: "Sans évaluation, tu ne sais pas si un changement améliore ou dégrade ton IA. Les 10 questions de la spec deviennent ton jeu de test.", prompt: "Écris scripts/eval.ts : il pose les 10 questions de SPEC-assistant.md à l'API, compare chaque réponse aux critères attendus et produit un score sur 10 avec les échecs détaillés. Lance-le avant et après chaque modification des instructions.", check: "Tu as un score de référence ; chaque changement d'instructions est mesuré avant d'être gardé." },
      { title: "Maîtriser les coûts et la sécurité", why: "Cache de prompt, limites de tokens, filtrage des entrées : une IA en production doit être fiable et sobre.", prompt: "Ajoute : un plafond de taille des messages utilisateur, une limite de requêtes par IP, la journalisation de usage (tokens, cache) sans contenu personnel, et un message clair si la requête est refusée. Passe /security-review.", check: "/security-review ne signale rien de bloquant ; un tableau de bord simple affiche les tokens consommés." },
    ],
    next: [
      "Ajoute des sources : documents PDF, pages web (outils web search / web fetch de l'API).",
      "Fais-en un agent hébergé avec Claude Managed Agents si elle doit travailler longtemps de façon autonome.",
      "Enrichis le jeu d'évaluation à chaque mauvaise réponse remontée par les utilisateurs.",
    ],
  },
];
