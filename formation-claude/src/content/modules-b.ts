import type { Module } from "./types";

export const m5: Module = {
  id: "m5", num: 5, title: "Git, qualité et sécurité", duration: "2 h",
  objectif: "Livrer du code relu, versionné proprement, sans risque pour ton projet ni ta machine.",
  pourquoi: "Claude écrit vite. Sans discipline git et sans relecture, les erreurs s'accumulent aussi vite. Et un agent qui peut lancer des commandes doit avoir des limites claires.",
  sections: [
    {
      id: "m5s1", title: "Git avec Claude",
      blocks: [
        { t: "p", text: "Claude manie git très bien. Tu peux tout lui confier en langage naturel : créer une branche, committer avec un message qui explique le pourquoi, pousser et ouvrir une PR, résoudre un conflit, résumer ce qui a changé." },
        { t: "callout", tone: "key", title: "Discipline recommandée", text: "Une branche par tâche, un commit par étape validée, jamais de travail directement sur main. Chaque commit est un point de retour plus fiable que /rewind." },
      ],
    },
    {
      id: "m5s2", title: "Relire le diff",
      blocks: [
        { t: "p", text: "Tu restes responsable du code. Avant chaque commit ou PR :" },
        { t: "list", items: ["`!git diff --stat` : quels fichiers ont bougé ? Un fichier inattendu est un signal d'alerte.", "`!git diff` : lis les changements, ou fais-toi expliquer ceux que tu ne comprends pas.", "Vérifie qu'aucun secret, log de débogage ou code commenté ne traîne."] },
      ],
    },
    {
      id: "m5s3", title: "Commandes de revue",
      blocks: [
        { t: "table", head: ["Commande", "Rôle", "Quand"], rows: [
          ["`/code-review`", "Cherche les bugs dans les changements en cours ou une PR", "Avant chaque PR"],
          ["`/security-review`", "Revue de sécurité (injections, secrets, données exposées)", "PR touchant formulaires, API, authentification"],
          ["`/simplify`", "Simplifie et nettoie le code modifié", "Après une fonctionnalité qui a demandé plusieurs itérations"],
        ] },
        { t: "callout", tone: "tip", title: "Astuce", text: "Une revue faite dans une **session neuve** (ou par un sous-agent) est plus critique : elle n'est pas influencée par les choix faits pendant l'écriture." },
      ],
    },
    {
      id: "m5s4", title: "Les permissions",
      blocks: [
        { t: "p", text: "Les règles de permission autorisent d'avance ce qui est sûr et interdisent ce qui est dangereux. Gère-les avec `/permissions` ou dans les fichiers de réglages :" },
        { t: "table", head: ["Fichier", "Portée"], rows: [
          ["`~/.claude/settings.json`", "Toi, tous projets"],
          ["`.claude/settings.json`", "Le projet, versionné et partagé"],
          ["`.claude/settings.local.json`", "Le projet, sur ta machine seulement (non versionné)"],
        ] },
        { t: "code", title: ".claude/settings.json", text: "{\n  \"permissions\": {\n    \"allow\": [\n      \"Bash(npm run test:*)\",\n      \"Bash(npm run lint)\",\n      \"Bash(npm run build)\",\n      \"Bash(git diff:*)\",\n      \"Bash(git status)\"\n    ],\n    \"deny\": [\n      \"Read(./.env)\",\n      \"Read(./.env.*)\",\n      \"Bash(git push --force:*)\",\n      \"Bash(rm -rf:*)\"\n    ]\n  }\n}" },
        { t: "callout", tone: "key", title: "deny gagne toujours", text: "Les règles deny l'emportent sur allow. Commence restrictif, puis autorise au fil de l'eau ce que tu valides souvent (`/fewer-permission-prompts` peut proposer une liste à partir de ton historique)." },
      ],
    },
    {
      id: "m5s5", title: "Mode sans permission et hygiène de sécurité",
      blocks: [
        { t: "p", text: "`claude --dangerously-skip-permissions` supprime toutes les demandes. Utile pour les tâches longues et autonomes, mais **seulement dans un environnement isolé** (conteneur, session cloud, machine virtuelle) sans accès à tes données ni à tes identifiants. Jamais sur ta machine principale." },
        { t: "list", items: ["Jamais de secret dans le code, les prompts partagés ou CLAUDE.md : utilise des variables d'environnement.", "Interdis la lecture de `.env` dans les permissions.", "Méfie-toi des contenus externes : une page web, une issue ou un fichier peuvent contenir des **instructions cachées**. Si Claude propose soudain une action inattendue après avoir lu un contenu externe, arrête et vérifie.", "N'installe que des serveurs MCP et plugins de sources de confiance."] },
      ],
    },
  ],
  retenir: ["Une branche par tâche, un commit par étape validée.", "Relire chaque diff ; /code-review et /security-review avant les PR.", "Permissions : autoriser le sûr, interdire le dangereux, isoler le mode sans permission."],
  exercice: {
    steps: ["Crée `.claude/settings.json` avec les permissions, adaptées à tes scripts.", "Sur une branche, implémente une petite fonctionnalité, puis passe `/code-review` et `/security-review`.", "Corrige ce qui est pertinent, committe, fais ouvrir une PR par Claude.", "Vérifie que `!cat .env` demandé par Claude est bien refusé."],
    resultat: "Une PR propre, moins de demandes de permission pour les commandes sûres, et .env inaccessible.",
  },
  competences: ["Je relis chaque diff avant de valider", "Mes permissions sont configurées (allow / deny)", "J'utilise /code-review avant chaque PR", "J'ai fait ouvrir une PR complète par Claude"],
  questions: [
    { id: "q5-1", section: "m5s1", q: "Quelle discipline git recommande la formation ?", options: ["Une branche par tâche, un commit par étape validée, jamais directement sur main", "Tout sur main pour aller vite", "Un seul commit en fin de projet", "Une branche par fichier"], explain: "Chaque commit devient un point de retour fiable." },
    { id: "q5-2", section: "m5s2", q: "`git diff --stat` montre un fichier que tu n'attendais pas. Qu'en penses-tu ?", options: ["C'est un signal d'alerte : vérifier pourquoi il a été modifié", "C'est normal, on committe", "Il faut supprimer le fichier", "Il faut faire un force push"], explain: "Un fichier inattendu peut révéler une modification hors périmètre." },
    { id: "q5-3", section: "m5s3", q: "Quelle commande passer avant une PR qui touche un formulaire ou l'authentification ?", options: ["/security-review", "/simplify", "/compact", "/init"], explain: "Elle cherche injections, secrets et données exposées." },
    { id: "q5-4", section: "m5s3", q: "Pourquoi faire la revue dans une session neuve ?", options: ["Le relecteur n'est pas influencé par le raisonnement de l'écriture", "C'est moins cher", "La session principale ne peut pas lire le diff", "Pour éviter git"], explain: "Un regard neuf trouve ce que l'auteur ne voit plus." },
    { id: "q5-5", section: "m5s4", q: "Où mettre une permission que toute l'équipe doit avoir ?", options: [".claude/settings.json (versionné)", ".claude/settings.local.json", "~/.claude/settings.json", "CLAUDE.md"], explain: "settings.local.json est personnel ; ~/.claude est global à ta machine." },
    { id: "q5-6", section: "m5s4", q: "Une règle allow et une règle deny visent la même commande. Laquelle gagne ?", options: ["deny", "allow", "La dernière écrite", "Celle du fichier personnel"], explain: "deny l'emporte toujours." },
    { id: "q5-7", section: "m5s4", q: "Comment empêcher Claude de lire ton fichier .env ?", options: ["Une règle deny `Read(./.env)` dans les permissions", "Le renommer", "Le mettre dans CLAUDE.md", "Le demander poliment dans le prompt"], explain: "Une règle de permission est une garantie, pas une simple consigne." },
    { id: "q5-8", section: "m5s5", q: "Où peut-on utiliser `--dangerously-skip-permissions` ?", options: ["Uniquement dans un environnement isolé (conteneur, cloud, VM) sans tes données ni identifiants", "Partout, c'est plus rapide", "Sur ta machine principale le week-end", "Jamais, l'option n'existe pas"], explain: "Sans aucune confirmation, l'agent doit être isolé." },
    { id: "q5-9", section: "m5s5", q: "Après avoir lu une page web, Claude propose une action inattendue. Que fais-tu ?", options: ["J'arrête et je vérifie : le contenu externe peut contenir des instructions cachées", "J'accepte, il sait ce qu'il fait", "Je passe en acceptation auto", "Je relance la même demande"], explain: "Les contenus externes sont une source d'instructions malveillantes possibles." },
  ],
};

export const m6: Module = {
  id: "m6", num: 6, title: "Skills, commandes et hooks", duration: "3 h",
  objectif: "Transformer tes routines en outils réutilisables et tes règles critiques en garanties.",
  pourquoi: "Un débutant retape les mêmes consignes. Un expert les a transformées en skills (des procédures que Claude applique au bon moment) et en hooks (des automatismes qui s'exécutent à coup sûr).",
  sections: [
    {
      id: "m6s1", title: "Skills : des procédures à la demande",
      blocks: [
        { t: "p", text: "Une skill est un dossier contenant un fichier **SKILL.md** : un en-tête (nom et description) puis des instructions. Au démarrage, Claude ne charge que le **nom et la description** de chaque skill. Quand une tâche correspond à la description, il charge les instructions complètes. Tu peux aussi l'appeler avec `/nom-de-la-skill`." },
        { t: "table", head: ["Emplacement", "Portée"], rows: [["`.claude/skills/<nom>/SKILL.md`", "Le projet (versionné)"], ["`~/.claude/skills/<nom>/SKILL.md`", "Tous tes projets"]] },
        { t: "code", title: ".claude/skills/maquette-vers-code/SKILL.md", text: "---\nname: maquette-vers-code\ndescription: Implémente un écran ou un composant à partir d'une URL Figma\n  validée. À utiliser dès qu'une URL figma.com est fournie pour produire du code.\n---\n# Maquette vers code\n## Étapes\n1. Récupère le design (get_design_context) et une capture (get_screenshot).\n2. Liste les composants et tokens réutilisés et ceux à créer ; attends validation.\n3. Implémente dans src/components ou src/pages.\n4. Capture le rendu à 375 px et 1440 px, compare à la maquette.\n5. Corrige les écarts, lance npm test et npm run lint." },
        { t: "callout", tone: "key", title: "La description est décisive", text: "C'est elle qui permet à Claude de savoir quand utiliser la skill. Dis ce qu'elle fait et quand l'utiliser, avec les mots que tu emploies naturellement. Le dossier peut contenir d'autres fichiers (exemples, scripts), lus seulement si nécessaire." },
      ],
    },
    {
      id: "m6s2", title: "Commandes avec arguments",
      blocks: [
        { t: "p", text: "Pour un raccourci que tu appelles toujours toi-même, un fichier Markdown dans `.claude/commands/` suffit. `$ARGUMENTS` reçoit le texte tapé après la commande." },
        { t: "code", title: ".claude/commands/bug.md", text: "---\ndescription: Corriger un bug avec reproduction par un test\n---\nBug à corriger : $ARGUMENTS\n1. Trouve le code concerné et explique la cause probable.\n2. Écris un test qui reproduit le bug et vérifie qu'il échoue.\n3. Corrige la cause racine, sans modifier le test.\n4. Lance la suite de tests complète et résume en 3 lignes." },
        { t: "p", text: "Utilisation : `/bug le menu mobile reste ouvert après un clic`." },
      ],
    },
    {
      id: "m6s3", title: "Hooks : des automatismes garantis",
      blocks: [
        { t: "p", text: "Une consigne dans CLAUDE.md est une **demande** : Claude la suit presque toujours. Un **hook** est une commande shell exécutée par Claude Code lui-même à un moment précis : **à chaque fois, sans exception**." },
        { t: "table", head: ["Événement", "Moment", "Usage typique"], rows: [
          ["PreToolUse", "Avant une action (peut la bloquer)", "Interdire l'écriture dans certains fichiers"],
          ["PostToolUse", "Après une action", "Formater ou linter le fichier modifié"],
          ["UserPromptSubmit", "À l'envoi de ton prompt", "Ajouter du contexte automatiquement"],
          ["Stop", "Quand Claude a fini de répondre", "Lancer les tests, notifier"],
          ["SessionStart", "Au démarrage d'une session", "Installer les dépendances, charger l'état"],
          ["Notification", "Quand Claude attend ton accord", "Notification sur le bureau"],
        ] },
      ],
    },
    {
      id: "m6s4", title: "Deux hooks à connaître",
      blocks: [
        { t: "code", title: "Formater chaque fichier modifié (PostToolUse)", text: "{\n  \"hooks\": {\n    \"PostToolUse\": [{\n      \"matcher\": \"Edit|Write\",\n      \"hooks\": [{\n        \"type\": \"command\",\n        \"command\": \"jq -r '.tool_input.file_path' | xargs npx prettier --write\"\n      }]\n    }]\n  }\n}" },
        { t: "p", text: "Le hook reçoit sur son **entrée standard un JSON** décrivant l'action (ici, le chemin du fichier dans `tool_input.file_path`)." },
        { t: "code", title: "Bloquer les fichiers sensibles (PreToolUse)", text: "#!/bin/bash\n# .claude/hooks/proteger.sh\nfichier=$(jq -r '.tool_input.file_path // empty')\ncase \"$fichier\" in\n  *.env*|*package-lock.json)\n    echo \"Modification interdite : $fichier\" >&2\n    exit 2 ;;\nesac\nexit 0" },
        { t: "callout", tone: "key", title: "Code de sortie 2", text: "Un hook qui se termine avec le code **2** bloque l'action, et son message d'erreur est transmis à Claude. `/hooks` permet de les consulter et de les configurer." },
        { t: "callout", tone: "warn", title: "Piège", text: "Un hook exécute des commandes avec tes droits, automatiquement. Relis toujours un hook avant de l'activer, surtout s'il vient d'ailleurs, et garde-le rapide : un hook lent ralentit chaque action." },
      ],
    },
    {
      id: "m6s5", title: "Choisir le bon outil",
      blocks: [
        { t: "table", head: ["Besoin", "Outil"], rows: [
          ["Règle courte, toujours vraie", "CLAUDE.md"],
          ["Procédure détaillée, utile pour certaines tâches", "Skill"],
          ["Raccourci que tu lances toi-même, avec argument", "Commande"],
          ["Action qui doit arriver à chaque fois, sans exception", "Hook"],
          ["Spécialiste avec son propre contexte", "Sous-agent (module 7)"],
        ] },
        { t: "p", text: "Autres personnalisations : **plugins** (`/plugin`) pour installer et partager des lots de skills, commandes, agents, hooks et serveurs MCP ; **style de réponse** via `/config` ; **ligne d'état** (`/statusline`)." },
      ],
    },
  ],
  retenir: ["Skill = procédure chargée au bon moment, guidée par sa description.", "Commande = raccourci avec $ARGUMENTS.", "Hook = garantie exécutée à chaque fois."],
  exercice: {
    steps: ["Crée la skill `maquette-vers-code` et teste-la en donnant simplement une URL Figma : vérifie qu'elle se déclenche seule.", "Crée la commande `/bug` et utilise-la sur un vrai bug.", "Ajoute le hook de formatage et le hook de protection ; vérifie que modifier .env est bloqué.", "Transforme ton prompt le plus utilisé en skill ou commande."],
    resultat: "Une skill qui se déclenche sans être appelée, une commande avec argument, des fichiers formatés automatiquement et des fichiers sensibles protégés.",
  },
  competences: ["J'ai créé au moins une skill que j'utilise vraiment", "J'ai une commande personnalisée avec argument", "J'ai un hook qui formate ou vérifie automatiquement", "Je sais choisir entre CLAUDE.md, skill, commande et hook"],
  questions: [
    { id: "q6-1", section: "m6s1", q: "Que charge Claude au démarrage pour chaque skill ?", options: ["Seulement son nom et sa description", "Toutes les instructions et fichiers", "Rien du tout", "Uniquement les scripts"], explain: "Les instructions complètes ne sont chargées que si la tâche correspond à la description." },
    { id: "q6-2", section: "m6s1", q: "Ta skill ne se déclenche jamais toute seule. Que corriger en premier ?", options: ["Sa description : dire ce qu'elle fait et dans quelles situations l'utiliser", "Son nom de dossier", "Le nombre d'étapes", "Le modèle utilisé"], explain: "C'est la description qui permet à Claude de choisir la skill." },
    { id: "q6-3", section: "m6s1", q: "Où placer une skill réservée à ce projet ?", options: [".claude/skills/<nom>/SKILL.md", "~/.claude/skills/<nom>/SKILL.md", "CLAUDE.md", ".mcp.json"], explain: "Dans le projet, versionnée ; ~/.claude/skills vaut pour tous tes projets." },
    { id: "q6-4", section: "m6s2", q: "Dans une commande personnalisée, que contient $ARGUMENTS ?", options: ["Le texte tapé après la commande", "La liste des fichiers du projet", "Le contenu de CLAUDE.md", "Le modèle actif"], explain: "/bug le menu reste ouvert → $ARGUMENTS = « le menu reste ouvert »." },
    { id: "q6-5", section: "m6s3", q: "« Toujours lancer prettier après modification » : CLAUDE.md ou hook ?", options: ["Hook : l'action doit arriver à chaque fois, sans dépendre de la mémoire de Claude", "CLAUDE.md, c'est suffisant", "Une skill", "Une commande"], explain: "CLAUDE.md est une demande ; un hook est une garantie." },
    { id: "q6-6", section: "m6s3", q: "Quel événement permet de bloquer une action avant qu'elle ait lieu ?", options: ["PreToolUse", "PostToolUse", "Stop", "Notification"], explain: "PostToolUse s'exécute après ; Stop quand Claude a fini de répondre." },
    { id: "q6-7", section: "m6s4", q: "Comment un hook PreToolUse bloque-t-il une action ?", options: ["En se terminant avec le code de sortie 2 ; son message est transmis à Claude", "En renvoyant « non »", "En supprimant le fichier", "En se terminant avec le code 0"], explain: "Le code 0 laisse passer ; le code 2 bloque." },
    { id: "q6-8", section: "m6s4", q: "Comment le hook connaît-il le fichier modifié ?", options: ["Il reçoit un JSON sur son entrée standard (ex. tool_input.file_path)", "Il le devine", "Il lit CLAUDE.md", "Par une variable $FICHIER fixe"], explain: "jq extrait les champs utiles du JSON reçu." },
    { id: "q6-9", section: "m6s5", q: "Une procédure détaillée, utile seulement pour certaines tâches : quel outil ?", options: ["Une skill", "CLAUDE.md", "Un hook", "Une règle deny"], explain: "CLAUDE.md pour les règles courtes toujours vraies ; skill pour les procédures." },
    { id: "q6-10", section: "m6s5", q: "Comment partager un lot de skills, commandes, agents et hooks ?", options: ["Avec un plugin (/plugin)", "En copiant CLAUDE.md", "Par /export", "Avec /statusline"], explain: "Un plugin regroupe et distribue ces éléments." },
  ],
};

export const m7: Module = {
  id: "m7", num: 7, title: "MCP, sous-agents et parallélisme", duration: "2 h 30",
  objectif: "Brancher Claude sur tes outils et faire travailler plusieurs agents en même temps.",
  pourquoi: "Seul dans ton terminal, Claude ne voit que ton code. Connecté à Figma, GitHub et ton hébergeur, il couvre toute la chaîne de la maquette à la mise en ligne. Avec plusieurs agents, tu passes d'un assistant à une petite équipe.",
  sections: [
    {
      id: "m7s1", title: "MCP : connecter des outils",
      blocks: [
        { t: "p", text: "**MCP** (Model Context Protocol) est le standard qui permet de brancher des outils externes sur Claude : Figma, GitHub, une base de données, un navigateur, Vercel, Netlify… Chaque serveur MCP ajoute des outils que Claude peut appeler." },
        { t: "code", text: "# Serveur distant (HTTP)\nclaude mcp add --transport http figma https://mcp.figma.com/mcp\n# Serveur local lancé par une commande\nclaude mcp add mon-serveur -- npx -y <paquet-du-serveur>\n# Gérer\nclaude mcp list\nclaude mcp remove figma\n/mcp        # dans une session : état, connexion, authentification" },
        { t: "table", head: ["Portée (--scope)", "Où c'est enregistré", "Pour qui"], rows: [
          ["local (défaut)", "Ta configuration, pour ce projet", "Toi, ce projet"],
          ["project", "`.mcp.json` à la racine (versionné)", "Toute l'équipe"],
          ["user", "Ta configuration globale", "Toi, tous projets"],
        ] },
        { t: "callout", tone: "warn", title: "Piège", text: "Chaque serveur ajoute des outils qui occupent du contexte. Garde actifs ceux qui servent au projet, et n'installe que des serveurs de confiance : ils agissent avec tes accès." },
      ],
    },
    {
      id: "m7s2", title: "Sous-agents : des spécialistes",
      blocks: [
        { t: "p", text: "Un **sous-agent** est une instance de Claude lancée par la session principale, avec ses propres instructions, ses propres outils et surtout **son propre contexte**. Il fait le travail et ne renvoie qu'un résumé." },
        { t: "list", items: ["**Protéger le contexte principal** : une recherche qui lit cinquante fichiers ne pollue pas ta session.", "**Spécialiser** : un relecteur, un testeur, un vérificateur design, chacun avec des consignes précises et des outils limités."] },
        { t: "code", title: ".claude/agents/verif-design.md (créé avec /agents ou à la main)", text: "---\nname: verif-design\ndescription: Compare le rendu d'un écran à sa maquette Figma et liste les écarts.\n  À utiliser après l'implémentation de toute interface.\ntools: Read, Grep, Glob, Bash\n---\nTu es un relecteur design exigeant. Tu ne modifies aucun fichier.\n1. Récupère la maquette Figma indiquée.\n2. Prends une capture du rendu à 375 px et 1440 px.\n3. Liste chaque écart avec sa gravité : bloquant, important, mineur.\n4. Termine par un verdict : conforme ou non conforme." },
        { t: "callout", tone: "tip", title: "Limiter les outils", text: "`tools:` rend l'agent plus sûr et plus concentré : un relecteur n'a pas besoin d'écrire. Claude délègue de lui-même quand la description correspond, ou à ta demande." },
      ],
    },
    {
      id: "m7s3", title: "Travailler en parallèle",
      blocks: [
        { t: "p", text: "Deux sessions qui modifient les mêmes fichiers se marchent dessus. Pour travailler en parallèle, **isole chaque tâche** :" },
        { t: "code", title: "Worktrees git", text: "git worktree add ../daki-filtre -b feature/filtre-ville\ncd ../daki-filtre && claude\n# … une autre session dans le dossier principal sur une autre tâche\ngit worktree remove ../daki-filtre   # une fois la branche fusionnée" },
        { t: "list", items: ["**Sessions cloud** (claude.ai/code ou application) : chaque session a son propre conteneur ; tu les suis depuis le téléphone, chacune pousse sa branche.", "**Commandes longues en arrière-plan** : serveur de dev ou tests lancés en arrière-plan pendant que Claude continue."] },
      ],
    },
    {
      id: "m7s4", title: "Schémas multi-agents",
      blocks: [
        { t: "table", head: ["Schéma", "Fonctionnement"], rows: [
          ["Écrivain / relecteur", "Une session code ; une autre, au contexte vierge, relit et commente ; la première corrige."],
          ["Testeur / implémenteur", "Une session écrit les tests ; une autre écrit le code qui les fait passer."],
          ["Éventail", "Une liste de tâches indépendantes (TODO.md) répartie entre plusieurs sessions, une branche chacune."],
          ["Explorer puis agir", "Un sous-agent cartographie le code, la session principale planifie avec ce résumé."],
        ] },
      ],
    },
  ],
  retenir: ["MCP branche Claude sur tes outils ; n'active que ce qui sert.", "Sous-agents = spécialistes au contexte séparé, outils limités.", "Parallèle = une tâche, une branche, un espace isolé."],
  exercice: {
    steps: ["Vérifie tes serveurs MCP avec `/mcp`. Partage ceux utiles à l'équipe via `.mcp.json`.", "Crée l'agent `verif-design` et utilise-le après l'implémentation d'un écran.", "Lance deux tâches en parallèle : une dans un worktree (ou une session cloud), une dans le dossier principal.", "Fais relire le travail de l'une par une session neuve."],
    resultat: "Un rapport d'écarts design exploitable, deux branches avancées en même temps sans conflit, une revue indépendante.",
  },
  competences: ["Je sais ajouter, vérifier et partager un serveur MCP", "J'ai créé un sous-agent spécialisé", "J'ai mené deux tâches en parallèle", "J'ai utilisé le schéma écrivain / relecteur"],
  questions: [
    { id: "q7-1", section: "m7s1", q: "Que signifie MCP ?", options: ["Model Context Protocol : le standard pour brancher des outils externes", "Multi Claude Process", "Main Control Panel", "Model Code Plugin"], explain: "Chaque serveur MCP ajoute des outils (Figma, GitHub, Vercel…)." },
    { id: "q7-2", section: "m7s1", q: "Comment partager un serveur MCP avec toute l'équipe ?", options: ["En portée project, enregistrée dans .mcp.json versionné", "En portée local", "En portée user", "Par e-mail"], explain: "local = toi et ce projet ; user = toi, tous projets ; project = l'équipe." },
    { id: "q7-3", section: "m7s1", q: "Pourquoi ne pas garder tous les serveurs MCP actifs ?", options: ["Leurs outils occupent du contexte, et ils agissent avec tes accès", "Ils ralentissent l'installation", "Ils sont payants", "Ils effacent CLAUDE.md"], explain: "N'active que ce qui sert, et seulement des sources de confiance." },
    { id: "q7-4", section: "m7s2", q: "Principal avantage d'un sous-agent pour une grosse recherche ?", options: ["Son contexte est séparé : seule la conclusion revient dans la session principale", "Il est plus intelligent", "Il ne coûte rien", "Il peut pousser sur main"], explain: "La session principale reste propre." },
    { id: "q7-5", section: "m7s2", q: "Pourquoi limiter les outils d'un agent relecteur (tools: Read, Grep…) ?", options: ["Il est plus sûr et plus concentré : un relecteur n'a pas besoin d'écrire", "Pour qu'il aille plus vite à coder", "C'est obligatoire pour tous les agents", "Pour qu'il ignore la maquette"], explain: "Des outils limités = un rôle clair et moins de risques." },
    { id: "q7-6", section: "m7s3", q: "Pourquoi ne pas lancer deux sessions dans le même dossier sur deux tâches ?", options: ["Elles modifieraient les mêmes fichiers et la même branche", "Claude refuse", "Cela double le coût", "Le CLAUDE.md serait effacé"], explain: "Il faut un worktree ou une session cloud par tâche." },
    { id: "q7-7", section: "m7s3", q: "Que crée `git worktree add ../daki-filtre -b feature/filtre-ville` ?", options: ["Une copie de travail du repo sur une nouvelle branche, dans un autre dossier", "Un nouveau repo GitHub", "Un sous-agent", "Une sauvegarde de CLAUDE.md"], explain: "Chaque worktree est un espace isolé pour une session." },
    { id: "q7-8", section: "m7s4", q: "Le schéma « écrivain / relecteur », c'est :", options: ["Une session code, une autre au contexte vierge relit, la première corrige", "Un agent qui écrit la doc", "Deux sessions qui codent le même fichier", "Claude qui relit ses propres messages"], explain: "Le regard neuf du relecteur détecte ce que l'écrivain ne voit plus." },
  ],
};

export const m8: Module = {
  id: "m8", num: 8, title: "Automatiser", duration: "2 h 30",
  objectif: "Faire travailler Claude sans être devant l'écran.",
  pourquoi: "Tout ce que tu fais en session peut tourner dans un script, une CI ou une tâche planifiée. C'est là que le gain de temps devient vraiment important.",
  sections: [
    {
      id: "m8s1", title: "Le mode non interactif : claude -p",
      blocks: [
        { t: "p", text: "Avec **-p** (print), Claude exécute la demande, affiche le résultat et s'arrête. Il se combine avec les pipes Unix." },
        { t: "code", text: "claude -p \"Résume les changements depuis le dernier tag\"\ncat erreurs.log | claude -p \"Trouve la cause principale de ces erreurs\"\ngit diff main | claude -p \"Relis ce diff et liste les risques\"\nclaude -p \"Liste les composants sans test\" --output-format json\nclaude -p \"Corrige les erreurs de lint\" \\\n  --allowedTools \"Read,Edit,Bash(npm run lint:*)\"\nclaude -p \"…\" --max-turns 10" },
        { t: "table", head: ["Option", "Rôle"], rows: [
          ["`--output-format text|json|stream-json`", "Format de sortie (json pour les scripts)"],
          ["`--allowedTools` / `--disallowedTools`", "Outils autorisés ou interdits sans confirmation"],
          ["`--permission-mode`", "Mode de permission de départ"],
          ["`--append-system-prompt`", "Ajouter des consignes au prompt système"],
          ["`--max-turns`", "Nombre maximum de tours de l'agent"],
          ["`--model`", "Modèle à utiliser"],
        ] },
        { t: "code", title: "scripts/rapport-semaine.sh", text: "#!/bin/bash\ngit log --since=\"1 week ago\" --pretty=format:\"%h %s (%an)\" \\\n  | claude -p \"Rédige en français un rapport hebdomadaire de ces commits :\n      fonctionnalités, corrections, points d'attention. Format Markdown.\" \\\n  > docs/rapports/$(date +%Y-%m-%d).md" },
      ],
    },
    {
      id: "m8s2", title: "Claude dans GitHub",
      blocks: [
        { t: "list", items: ["Dans une session : **/install-github-app** installe l'application GitHub et crée le workflow.", "Dans une issue ou une PR, écris **@claude** suivi de ta demande : « @claude implémente cette issue », « @claude corrige les retours de revue ».", "Claude travaille dans **GitHub Actions**, pousse une branche et répond dans le fil."] },
        { t: "code", title: ".github/workflows/claude.yml (extrait)", text: "- uses: anthropics/claude-code-action@v1\n  with:\n    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}" },
        { t: "callout", tone: "tip", title: "CLAUDE.md s'applique aussi dans GitHub", text: "Il est lu depuis le repo : une raison de plus de le soigner. Tu peux aussi ajouter un workflow qui relit automatiquement chaque PR." },
      ],
    },
    {
      id: "m8s3", title: "Tâches récurrentes et Agent SDK",
      blocks: [
        { t: "list", items: ["**/loop** : répète une commande à intervalle dans la session, ex. `/loop 10m vérifie si la CI de ma PR est verte`.", "**Tâches planifiées** (sessions cloud) : un prompt lancé selon un calendrier, ex. chaque lundi « mets à jour les dépendances mineures, lance les tests, ouvre une PR si tout passe ».", "**CI classique** : `claude -p` dans n'importe quel pipeline (GitHub Actions, GitLab, cron)."] },
        { t: "p", text: "Le **Claude Agent SDK** (TypeScript et Python) donne accès au même moteur que Claude Code pour construire tes propres agents : outils, permissions, sous-agents, MCP." },
        { t: "code", text: "// npm install @anthropic-ai/claude-agent-sdk\nimport { query } from \"@anthropic-ai/claude-agent-sdk\";\nfor await (const message of query({\n  prompt: \"Liste les pages sans meta description et propose un texte\",\n  options: { allowedTools: [\"Read\", \"Grep\", \"Glob\"] },\n})) {\n  if (message.type === \"result\") console.log(message.result);\n}" },
        { t: "callout", tone: "warn", title: "Pièges", text: "Automatiser avec des permissions trop larges (en non interactif, personne ne confirme) · oublier la limite de tours ou de budget · laisser un agent fusionner seul : garde toujours une relecture humaine avant main." },
      ],
    },
  ],
  retenir: ["claude -p + pipes = Claude dans tous tes scripts.", "@claude dans GitHub pour les issues et les PR.", "Automatisation = permissions minimales et relecture humaine avant fusion."],
  exercice: {
    steps: ["Écris `scripts/rapport-semaine.sh` et lance-le.", "Installe l'application GitHub sur DakiOriente, crée une petite issue et fais-la traiter avec @claude.", "Mets en place une tâche récurrente (planifiée ou /loop).", "Bonus : un mini-agent avec le SDK qui audite les textes alternatifs des images."],
    resultat: "Un rapport généré automatiquement, une PR ouverte par Claude depuis une issue, une tâche qui tourne sans toi.",
  },
  competences: ["J'utilise claude -p dans un script", "Claude répond aux mentions @claude sur mon repo", "J'ai une tâche récurrente automatisée", "J'ai écrit un premier agent avec le SDK"],
  questions: [
    { id: "q8-1", section: "m8s1", q: "Que fait `claude -p` ?", options: ["Exécute la demande, affiche le résultat et s'arrête (non interactif)", "Ouvre une session en mode plan", "Publie le projet", "Affiche les permissions"], explain: "-p (print) est fait pour les scripts et les pipes." },
    { id: "q8-2", section: "m8s1", q: "Quelle option pour exploiter la réponse de Claude dans un script ?", options: ["--output-format json", "--max-turns", "--model", "--continue"], explain: "Le JSON se lit facilement par un programme." },
    { id: "q8-3", section: "m8s1", q: "Comment limiter ce qu'un Claude automatisé peut faire ?", options: ["--allowedTools (et --disallowedTools), plus --max-turns", "En lui demandant d'être prudent", "--output-format text", "En supprimant CLAUDE.md"], explain: "En non interactif, personne ne confirme : on restreint outils et nombre de tours." },
    { id: "q8-4", section: "m8s2", q: "Comment faire traiter une issue GitHub par Claude ?", options: ["Installer l'app avec /install-github-app, puis écrire @claude dans l'issue", "Copier l'issue dans CLAUDE.md", "Lancer /mcp", "Ouvrir un worktree"], explain: "Claude travaille dans GitHub Actions et répond dans le fil." },
    { id: "q8-5", section: "m8s2", q: "Le CLAUDE.md s'applique-t-il quand Claude travaille dans GitHub Actions ?", options: ["Oui, il est lu depuis le repo", "Non, jamais", "Seulement s'il est importé dans le workflow", "Seulement en mode plan"], explain: "Une raison de plus de le soigner." },
    { id: "q8-6", section: "m8s3", q: "Quelle commande répète une vérification à intervalle dans la session ?", options: ["/loop 10m …", "/compact", "/rewind", "/cost"], explain: "Ex. : vérifier toutes les 10 minutes si la CI est verte." },
    { id: "q8-7", section: "m8s3", q: "Que permet le Claude Agent SDK ?", options: ["Construire tes propres agents avec le moteur de Claude Code (TypeScript, Python)", "Installer Claude Code", "Créer des maquettes Figma", "Gérer les permissions de GitHub"], explain: "Outils, permissions, sous-agents, MCP : tout y est." },
    { id: "q8-8", section: "m8s3", q: "Un agent automatisé peut-il fusionner seul sur main ?", options: ["Non : toujours une relecture humaine avant main", "Oui, si les tests passent", "Oui, la nuit", "Oui, avec --max-turns"], explain: "Règle d'or : aucun agent ne fusionne seul." },
  ],
};

export const m9: Module = {
  id: "m9", num: 9, title: "Projet final et certification", duration: "1 à 2 jours",
  objectif: "Livrer une vraie fonctionnalité de DakiOriente avec un pipeline complet, de la spec à la production.",
  pourquoi: "C'est en enchaînant toutes les étapes sur un vrai projet que les réflexes deviennent une méthode. Le pipeline réutilise tout ce que tu as appris.",
  sections: [
    {
      id: "m9s1", title: "Le pipeline complet",
      blocks: [
        { t: "table", head: ["Étape", "Outil", "Livrable"], rows: [
          ["1. Spec", "Interview (module 2)", "SPEC.md"],
          ["2. Maquette", "Figma, validée par toi", "Frames desktop et mobile"],
          ["3. Plan", "Mode plan (module 4)", "PLAN.md"],
          ["4. Implémentation", "Skill maquette-vers-code", "Code et tests"],
          ["5. Contrôle design", "Agent verif-design", "Rapport d'écarts à zéro bloquant"],
          ["6. Qualité", "Hooks, /code-review, /security-review", "Tests verts, revue traitée"],
          ["7. PR", "Git, GitHub", "PR documentée, revue automatique"],
          ["8. Prévisualisation", "Vercel ou Netlify", "URL vérifiée sur mobile et desktop"],
          ["9. Bilan", "Journal, CLAUDE.md", "Leçons intégrées"],
        ] },
      ],
    },
    {
      id: "m9s2", title: "Déroulé et bilan",
      blocks: [
        { t: "list", items: ["**Matin, jour 1** : spec par interview, puis maquette Figma et validation.", "**Après-midi, jour 1** : plan, implémentation, contrôle design.", "**Jour 2** : qualité, PR, prévisualisation, corrections, bilan."] },
        { t: "callout", tone: "tip", title: "Tes indicateurs", text: "Chronomètre chaque étape et note le nombre de corrections de prompt." },
        { t: "p", text: "**Le bilan** dans ton journal : Où Claude s'est-il trompé (prompt, contexte ou méthode) ? Quelle consigne as-tu répétée (→ CLAUDE.md, skill ou hook) ? Quelle étape a pris le plus de temps, comment l'automatiser ?" },
      ],
    },
    {
      id: "m9s3", title: "Grille de certification et règles d'or",
      blocks: [
        { t: "list", items: ["Une fonctionnalité réelle livrée de bout en bout avec ce pipeline", "Moins de **deux corrections de prompt** par tâche en moyenne", "CLAUDE.md, skills, commandes, hooks et agents versionnés", "Bibliothèque d'au moins **15 prompts** éprouvés", "Au moins une automatisation qui tourne sans moi", "Expliquer ce workflow à quelqu'un en 10 minutes"] },
        { t: "callout", tone: "key", title: "Les 5 règles d'or", text: "1. Plan avant le code. 2. Toujours une preuve de vérification. 3. Une tâche, un contexte propre. 4. Consigne répétée trois fois : CLAUDE.md, skill ou hook. 5. Relire chaque diff ; aucun agent ne fusionne seul." },
        { t: "p", text: "**Continuer à progresser** : relis ton CLAUDE.md et tes skills chaque mois, consulte la documentation officielle (code.claude.com/docs) et les notes de version, partage tes skills et agents via un plugin." },
      ],
    },
  ],
  retenir: ["Spec → maquette → plan → code → contrôle design → qualité → PR → préprod → bilan.", "Moins de deux corrections de prompt par tâche.", "Les 5 règles d'or."],
  exercice: {
    steps: ["Choisis une vraie fonctionnalité de DakiOriente.", "Déroule les 9 étapes du pipeline en chronométrant chacune.", "Note le nombre de corrections de prompt.", "Rédige le bilan dans ton journal et mets à jour CLAUDE.md, skills et hooks."],
    resultat: "Une fonctionnalité en production, livrée avec le pipeline complet, et des leçons intégrées dans ta configuration.",
  },
  competences: ["Une fonctionnalité réelle livrée de bout en bout", "Moins de deux corrections de prompt par tâche", "Configuration complète versionnée", "Bibliothèque d'au moins 15 prompts", "Une automatisation qui tourne sans moi", "Je peux expliquer ce workflow en 10 minutes"],
  questions: [
    { id: "q9-1", section: "m9s1", q: "Quelle étape vient juste après la spec dans le pipeline ?", options: ["La maquette Figma validée", "L'implémentation", "La PR", "Le bilan"], explain: "Spec → maquette → plan → implémentation : la maquette précède toujours le code." },
    { id: "q9-2", section: "m9s1", q: "Quel est le livrable du contrôle design ?", options: ["Un rapport d'écarts avec zéro écart bloquant", "Une PR fusionnée", "SPEC.md", "Un hook"], explain: "Il est produit par l'agent verif-design." },
    { id: "q9-3", section: "m9s1", q: "Quel outil pour la prévisualisation ?", options: ["Vercel ou Netlify, avec une URL vérifiée sur mobile et desktop", "/rewind", "Le mode plan", "/compact"], explain: "On vérifie le rendu réel avant la mise en production." },
    { id: "q9-4", section: "m9s2", q: "Quels indicateurs suivre pendant le projet final ?", options: ["Le temps de chaque étape et le nombre de corrections de prompt", "Le nombre de lignes de code", "Le nombre de commits", "Le nombre de fichiers"], explain: "Ils mesurent ta progression réelle." },
    { id: "q9-5", section: "m9s3", q: "Quel est l'objectif de corrections de prompt par tâche pour la certification ?", options: ["Moins de deux en moyenne", "Zéro", "Moins de dix", "Aucun objectif"], explain: "C'est un signe de prompts précis et d'un bon CLAUDE.md." },
    { id: "q9-6", section: "m9s3", q: "Laquelle est une des 5 règles d'or ?", options: ["Relire chaque diff ; aucun agent ne fusionne seul", "Toujours coder avant de planifier", "Garder une seule longue session pour tout", "Désactiver les permissions pour aller vite"], explain: "Les autres : plan avant le code, preuve de vérification, une tâche un contexte, consigne répétée → CLAUDE.md/skill/hook." },
  ],
};
