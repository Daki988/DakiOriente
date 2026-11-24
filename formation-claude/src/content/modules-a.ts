import type { Module } from "./types";

export const m0: Module = {
  id: "m0", num: 0, title: "Mise en place", duration: "45 min",
  objectif: "Avoir Claude Code installé, connecté, configuré et lancé sur DakiOriente.",
  pourquoi: "Claude Code n'est pas un chatbot à côté de ton code : c'est un agent qui lit tes fichiers, lance des commandes et modifie le projet. Le lancer depuis la racine du repo, avec les bons réglages, conditionne tout le reste.",
  sections: [
    {
      id: "m0s1", title: "Ce qu'est Claude Code",
      blocks: [
        { t: "p", text: "Claude Code est un **agent de développement**. À chaque demande, il enchaîne une boucle : **comprendre** (lire des fichiers, chercher dans le code), **agir** (modifier des fichiers, lancer des commandes), **vérifier** (lire le résultat des tests ou des commandes), puis recommencer jusqu'à ce que la tâche soit terminée." },
        { t: "callout", tone: "key", title: "Ton nouveau rôle", text: "Tu n'écris plus chaque ligne : tu définis bien la tâche, tu fournis le contexte et tu contrôles le résultat." },
        { t: "p", text: "Plusieurs façons de l'utiliser, avec le même moteur et la même configuration :" },
        { t: "list", items: ["**Terminal (CLI)** : la version la plus complète, celle de cette formation.", "**Extensions VS Code / JetBrains** : Claude voit ta sélection et affiche les modifications dans l'éditeur.", "**Application de bureau et web** (claude.ai/code) : sessions dans le cloud, suivies depuis n'importe quel appareil, y compris le téléphone."] },
      ],
    },
    {
      id: "m0s2", title: "Installer et se connecter",
      blocks: [
        { t: "code", title: "Installation", text: "# macOS / Linux / WSL : installateur natif (mises à jour automatiques)\ncurl -fsSL https://claude.ai/install.sh | bash\n\n# Windows (PowerShell)\nirm https://claude.ai/install.ps1 | iex\n\n# Alternative via npm (Node.js 18+)\nnpm install -g @anthropic-ai/claude-code" },
        { t: "code", title: "Lancer depuis la racine du projet", text: "cd DakiOriente\nclaude" },
        { t: "p", text: "Au premier lancement, connecte-toi avec ton compte Claude (Pro, Max, Team ou Enterprise) ou une clé API de la Console Anthropic. `/login` et `/logout` permettent de changer de compte plus tard." },
      ],
    },
    {
      id: "m0s3", title: "Toujours lancer à la racine du repo",
      blocks: [
        { t: "p", text: "Claude Code travaille dans le dossier où tu le lances. Lancé à la racine, il trouve le `CLAUDE.md`, le dossier `.claude/`, le `package.json` et l'historique git. Lancé ailleurs, il travaille **à l'aveugle**." },
        { t: "callout", tone: "tip", title: "Un autre dossier à inclure ?", text: "Ajoute-le avec `/add-dir ../autre-dossier` ou `claude --add-dir ../autre-dossier`." },
      ],
    },
    {
      id: "m0s4", title: "Premières commandes",
      blocks: [
        { t: "table", head: ["Commande", "Rôle"], rows: [
          ["`/help`", "Liste toutes les commandes disponibles, y compris les tiennes"],
          ["`/init`", "Analyse le repo et génère un premier CLAUDE.md"],
          ["`/model`", "Choisir le modèle : le plus puissant pour planifier et les tâches difficiles, un plus rapide pour les tâches simples"],
          ["`/config`", "Réglages : thème, notifications, éditeur, style de réponse"],
          ["`/status`", "Compte, modèle et configuration actifs"],
          ["`/doctor`", "Diagnostic de l'installation"],
          ["`/terminal-setup`", "Active Shift+Enter pour les retours à la ligne dans certains terminaux"],
        ] },
      ],
    },
    {
      id: "m0s5", title: "Que fait /init ?",
      blocks: [
        { t: "p", text: "`/init` parcourt le projet (structure, scripts, dépendances, conventions visibles) et rédige un **CLAUDE.md** : le fichier que Claude relit au début de chaque session." },
        { t: "p", text: "C'est un **premier jet** : il décrit ce qui se voit dans le code, mais ignore tes règles implicites (ta méthode Figma d'abord, tes choix de nommage, ce qu'il ne faut jamais faire). Tu le compléteras au module 3." },
        { t: "callout", tone: "warn", title: "Piège", text: "Ne pas versionner le CLAUDE.md. Il appartient au projet : committe-le, comme le reste de `.claude/` (sauf `settings.local.json`, personnel)." },
      ],
    },
  ],
  retenir: ["Claude Code est un agent : il lit, agit et vérifie en boucle.", "Toujours le lancer à la racine du repo.", "/init donne un point de départ, pas un CLAUDE.md final."],
  exercice: {
    steps: ["Installe Claude Code et lance `claude` à la racine de DakiOriente.", "Exécute `/doctor` puis `/status` pour vérifier que tout est en ordre.", "Exécute `/init`. Ton CLAUDE.md contient déjà la méthode Figma : vérifie qu'elle est conservée.", "Crée `docs/journal-claude.md` et note trois choses justes et trois choses manquantes dans le CLAUDE.md."],
    resultat: "Un CLAUDE.md enrichi, un journal avec six observations, et aucune erreur dans /doctor.",
  },
  competences: ["Claude Code est installé et se lance dans mon repo", "J'ai exécuté /init et relu le résultat", "Je sais changer de modèle avec /model", "J'ai créé mon journal de bord"],
  questions: [
    { id: "q0-1", section: "m0s1", q: "Quelle boucle Claude Code enchaîne-t-il à chaque demande ?", options: ["Comprendre → agir → vérifier, jusqu'à ce que la tâche soit terminée", "Générer du code → l'afficher → attendre", "Lire le CLAUDE.md → répondre → s'arrêter", "Poser des questions → coder → publier"], explain: "C'est un agent : il lit et cherche, modifie et lance des commandes, puis vérifie le résultat, et recommence." },
    { id: "q0-2", section: "m0s1", q: "Avec Claude Code, quel devient ton rôle principal ?", options: ["Bien définir la tâche, fournir le contexte et contrôler le résultat", "Écrire chaque ligne de code", "Valider chaque caractère qu'il tape", "Ne plus rien vérifier"], explain: "Tu passes d'écrire le code à piloter : tâche claire, contexte, contrôle." },
    { id: "q0-3", section: "m0s2", q: "Quelle commande permet de changer de compte après l'installation ?", options: ["/login et /logout", "/config", "/status", "/doctor"], explain: "/status affiche le compte actif, mais /login et /logout permettent d'en changer." },
    { id: "q0-4", section: "m0s3", q: "Pourquoi lancer Claude Code à la racine du repo ?", options: ["Pour qu'il trouve CLAUDE.md, .claude/, package.json et l'historique git", "Parce qu'il ne fonctionne nulle part ailleurs", "Pour aller plus vite", "Pour éviter de se connecter"], explain: "Lancé ailleurs, il travaille à l'aveugle : sans mémoire de projet ni configuration." },
    { id: "q0-5", section: "m0s3", q: "Ta tâche concerne aussi un dossier voisin. Que fais-tu ?", options: ["/add-dir ../autre-dossier (ou claude --add-dir)", "Je relance Claude dans le dossier parent", "Je copie le dossier dans le repo", "Rien, Claude trouvera tout seul"], explain: "/add-dir ajoute un dossier de travail sans quitter la racine du projet." },
    { id: "q0-6", section: "m0s4", q: "Quelle commande diagnostique l'installation ?", options: ["/doctor", "/status", "/help", "/init"], explain: "/doctor vérifie l'installation ; /status affiche compte, modèle et configuration actifs." },
    { id: "q0-7", section: "m0s4", q: "À quoi sert /model ?", options: ["Choisir le modèle : puissant pour planifier, rapide pour les tâches simples", "Générer un modèle de fichier", "Créer une maquette", "Afficher la consommation"], explain: "On adapte le modèle à la difficulté de la tâche." },
    { id: "q0-8", section: "m0s5", q: "Que contient le CLAUDE.md produit par /init ?", options: ["Un premier jet : ce qui se voit dans le code, sans tes règles implicites", "La version finale de toutes tes règles", "La documentation complète de l'API", "Ton historique de conversations"], explain: "/init ne connaît pas ta méthode Figma, tes nommages ou tes interdits : à compléter au module 3." },
    { id: "q0-9", section: "m0s5", q: "Que faut-il versionner dans git ?", options: ["CLAUDE.md et .claude/, sauf settings.local.json", "Rien de la configuration Claude", "Uniquement settings.local.json", "Seulement le journal de bord"], explain: "La configuration du projet est partagée ; settings.local.json reste personnel." },
  ],
};

export const m1: Module = {
  id: "m1", num: 1, title: "La boucle de base", duration: "1 h 30",
  objectif: "Piloter une session avec aisance, garder le contrôle et revenir en arrière quand il faut.",
  pourquoi: "Les experts ne tapent pas de meilleurs prompts par magie : ils interrompent tôt, reviennent en arrière sans hésiter et gardent un contexte propre. Ces gestes deviennent vite des réflexes.",
  sections: [
    {
      id: "m1s1", title: "Lire l'écran",
      blocks: [
        { t: "p", text: "Pendant qu'il travaille, Claude affiche chaque action : fichiers lus, recherches, commandes lancées, modifications proposées (sous forme de **diff**). Il tient aussi une **liste de tâches** pour les demandes longues." },
        { t: "p", text: "Prends l'habitude de lire ces lignes : c'est là que tu vois s'il part dans la bonne direction. **Ctrl+O** affiche le détail complet des échanges." },
      ],
    },
    {
      id: "m1s2", title: "Les trois modes",
      blocks: [
        { t: "p", text: "**Shift+Tab** fait tourner entre les modes, affichés en bas de l'écran :" },
        { t: "table", head: ["Mode", "Comportement", "Quand l'utiliser"], rows: [
          ["Normal", "Demande ta permission avant chaque modification ou commande sensible", "Par défaut, et sur tout ce qui est délicat"],
          ["Acceptation auto", "Applique les modifications de fichiers sans demander", "Plan validé, et tu relis le diff à la fin"],
          ["Plan", "Lit et analyse, ne modifie rien ; termine par un plan à valider", "Exploration, conception, toute tâche de plus de quelques fichiers"],
        ] },
        { t: "p", text: "Tu peux démarrer directement dans un mode : `claude --permission-mode plan`." },
      ],
    },
    {
      id: "m1s3", title: "Donner du contexte vite",
      blocks: [
        { t: "table", head: ["Geste", "Effet", "Exemple"], rows: [
          ["`@chemin`", "Ajoute un fichier ou un dossier au contexte (autocomplétion)", "Explique @src/pages/Home.tsx"],
          ["`!commande`", "Lance une commande shell ; Claude voit la sortie", "!npm test"],
          ["Ctrl+V / glisser", "Colle une image : capture, maquette, erreur", "Capture d'un bug d'affichage"],
          ["Shift+Enter", "Nouvelle ligne sans envoyer", "Prompts structurés"],
          ["↑", "Rappelle les prompts précédents", "Relancer une variante"],
        ] },
      ],
    },
    {
      id: "m1s4", title: "Garder le contrôle",
      blocks: [
        { t: "list", items: ["**Esc** interrompt Claude immédiatement. Le travail fait reste en place ; tu précises la consigne et il repart de là. Interrompre tôt coûte toujours moins cher que corriger tard.", "**Esc Esc** ou **/rewind** ouvre la liste de tes messages précédents : tu choisis un point de retour et ce que tu restaures (conversation, code, ou les deux). Un point de sauvegarde est créé avant chaque modification de fichier.", "Les **demandes de permission** : « Oui », « Oui et ne plus demander pour cette commande », ou « Non, et dis-lui quoi faire à la place ». Refuser avec une explication est une excellente façon de corriger le tir."] },
        { t: "callout", tone: "warn", title: "Piège", text: "/rewind restaure les fichiers modifiés par Claude, **pas les effets des commandes shell** (base de données modifiée, fichier supprimé par rm, git push). Git reste ton vrai filet de sécurité : committe souvent." },
      ],
    },
    {
      id: "m1s5", title: "Gérer le contexte et les sessions",
      blocks: [
        { t: "p", text: "Tout ce qui se passe dans une session (messages, fichiers lus, sorties de commandes) remplit la **fenêtre de contexte**. Plus elle est pleine, plus Claude risque de perdre le fil, et plus chaque échange coûte cher." },
        { t: "table", head: ["Commande", "Quand l'utiliser"], rows: [
          ["`/clear`", "Tu changes de tâche : repars d'un contexte vide (CLAUDE.md est relu)"],
          ["`/compact [consigne]`", "Même tâche, contexte chargé : Claude résume et repart du résumé"],
          ["`/context`", "Voir ce qui occupe le contexte"],
          ["`/cost`", "Consommation de la session"],
          ["`claude --continue`", "Reprendre la dernière session du dossier"],
          ["`/resume` ou `claude --resume`", "Choisir une session passée dans une liste"],
          ["`/export`", "Exporter la conversation"],
        ] },
        { t: "callout", tone: "tip", title: "Compacte toi-même, avec une consigne", text: "La compaction se déclenche aussi automatiquement. Mieux vaut la lancer au bon moment : `/compact garde les décisions d'architecture, les fichiers modifiés et les tests restants`." },
      ],
    },
  ],
  retenir: ["Shift+Tab pour les modes, Esc pour interrompre, /rewind pour revenir.", "Un contexte propre donne de meilleurs résultats : /clear entre deux sujets.", "Git est le filet de sécurité ultime."],
  exercice: {
    steps: ["Demande : « Explique l'architecture de ce repo et les 3 fichiers les plus importants. » Observe les fichiers qu'il lit.", "Passe en mode plan : « Comment ajouterais-tu une page À propos ? » Ne valide pas le plan.", "En mode normal, demande une petite modification, accepte-la, puis annule-la avec `/rewind` (code). Vérifie avec `!git status`.", "Regarde `/context`, fais `/compact`, puis regarde à nouveau `/context`.", "Quitte (Ctrl+D), puis relance avec `claude --continue`."],
    resultat: "git status propre après le rewind, un contexte allégé après la compaction, et la conversation retrouvée.",
  },
  competences: ["J'utilise @, ! et Esc sans y penser", "Je sais passer en mode plan et en sortir", "J'ai déjà annulé un changement avec /rewind", "Je sais choisir entre /clear et /compact", "Je reprends une session avec --continue ou /resume"],
  questions: [
    { id: "q1-1", section: "m1s1", q: "Quel raccourci affiche le détail complet des échanges ?", options: ["Ctrl+O", "Ctrl+D", "Shift+Tab", "Esc Esc"], explain: "Ctrl+O ouvre le détail ; Ctrl+D quitte, Shift+Tab change de mode, Esc Esc revient en arrière." },
    { id: "q1-2", section: "m1s2", q: "Quelle différence entre le mode plan et le mode acceptation auto ?", options: ["Le mode plan ne modifie rien et propose un plan ; l'acceptation auto applique les modifications sans demander", "Ce sont deux noms du même mode", "Le mode plan code plus vite", "L'acceptation auto ne lit pas les fichiers"], explain: "Plan = analyse sans modification. Acceptation auto = modifications appliquées sans confirmation." },
    { id: "q1-3", section: "m1s2", q: "Comment changer de mode pendant une session ?", options: ["Shift+Tab", "Ctrl+V", "/model", "Esc"], explain: "Shift+Tab fait tourner entre normal, acceptation auto et plan." },
    { id: "q1-4", section: "m1s2", q: "Quand utiliser le mode plan ?", options: ["Exploration, conception, toute tâche de plus de quelques fichiers", "Pour corriger une faute de frappe", "Uniquement pour lancer des tests", "Jamais au début d'une tâche"], explain: "Le plan permet de corriger la direction avant que du code soit écrit." },
    { id: "q1-5", section: "m1s3", q: "Que fait `!npm test` dans le prompt ?", options: ["Lance la commande shell et Claude voit la sortie", "Ajoute le fichier npm au contexte", "Désactive les tests", "Crée une commande personnalisée"], explain: "! lance une commande shell ; @ ajoute un fichier ou un dossier au contexte." },
    { id: "q1-6", section: "m1s3", q: "Comment montrer un bug d'affichage à Claude ?", options: ["Coller une capture d'écran avec Ctrl+V (ou glisser l'image)", "Le décrire vaguement", "Lancer /doctor", "Utiliser @capture"], explain: "Une image vaut mieux qu'une description : Claude la voit directement." },
    { id: "q1-7", section: "m1s4", q: "Claude modifie un fichier que tu ne voulais pas qu'il touche. Meilleur réflexe ?", options: ["Esc tout de suite, /rewind si besoin, puis préciser le périmètre", "Attendre qu'il ait fini", "Fermer le terminal", "Recommencer le projet"], explain: "Interrompre tôt coûte moins cher que corriger tard ; « ne touche pas à X » recadre la suite." },
    { id: "q1-8", section: "m1s4", q: "Qu'est-ce que /rewind NE restaure PAS ?", options: ["Les effets des commandes shell (rm, git push, base de données)", "Les fichiers modifiés par Claude", "La conversation", "Le code et la conversation ensemble"], explain: "D'où l'importance de git : committe souvent." },
    { id: "q1-9", section: "m1s5", q: "Tu as fini une fonctionnalité et tu attaques un bug sans rapport. Que fais-tu ?", options: ["/clear", "/compact", "/cost", "claude --continue"], explain: "Le contexte de la fonctionnalité ne ferait que brouiller le débogage. /compact sert pour la même tâche." },
    { id: "q1-10", section: "m1s5", q: "Même tâche, mais le contexte est très chargé. Quelle commande ?", options: ["/compact avec une consigne de ce qu'il faut garder", "/clear", "/export", "/rewind"], explain: "/compact résume la session et repart du résumé, sans perdre le fil de la tâche." },
    { id: "q1-11", section: "m1s5", q: "Comment reprendre la dernière session du dossier ?", options: ["claude --continue", "claude -p", "/init", "/clear"], explain: "--continue reprend la dernière ; /resume (ou --resume) permet d'en choisir une dans une liste." },
  ],
};

export const m2: Module = {
  id: "m2", num: 2, title: "Rédiger des prompts", duration: "4 h", key: true,
  objectif: "Obtenir le bon résultat du premier coup, et savoir corriger vite quand ce n'est pas le cas.",
  pourquoi: "Claude Code est un collègue très compétent qui découvre ton projet à chaque session. Tout ce qui est dans ta tête mais pas dans le prompt (ou dans CLAUDE.md), il doit le deviner. La qualité du résultat dépend avant tout de la clarté de la demande.",
  sections: [
    {
      id: "m2s1", title: "Le bon état d'esprit",
      blocks: [
        { t: "p", text: "Écris comme si tu briefais un **développeur senior qui arrive aujourd'hui** sur le projet. Il sait coder, mais il ne connaît ni ton historique, ni tes goûts, ni ce que « propre » veut dire pour toi." },
        { t: "callout", tone: "key", title: "Le test", text: "Si tu donnais ce prompt à un humain compétent, pourrait-il le réaliser sans te poser de question ? Si non, complète." },
      ],
    },
    {
      id: "m2s2", title: "Les six ingrédients",
      blocks: [
        { t: "table", head: ["Ingrédient", "Question à se poser", "Exemple"], rows: [
          ["Objectif", "Quoi, et pourquoi ?", "« Ajoute un filtre par ville, les utilisateurs se perdent dans la liste. »"],
          ["Contexte", "Quels fichiers, quelle maquette, quelles contraintes ?", "@src/pages/Liste.tsx, URL Figma"],
          ["Périmètre", "Qu'est-ce qu'il ne faut pas toucher ?", "« Ne modifie pas l'API. »"],
          ["Critère de fin", "Comment savoir que c'est terminé ?", "« Le filtre fonctionne sur mobile et desktop. »"],
          ["Vérification", "Quelle preuve exiger ?", "« Lance npm test et fais une capture d'écran. »"],
          ["Format", "Que veux-tu recevoir ?", "« Un plan d'abord, puis un résumé en 3 lignes. »"],
        ] },
        { t: "p", text: "Petite tâche : deux ou trois ingrédients suffisent. Fonctionnalité : mets les six." },
      ],
    },
    {
      id: "m2s3", title: "La vérification, levier n°1",
      blocks: [
        { t: "p", text: "Le meilleur investissement d'un prompt : donner à Claude **un moyen de vérifier son propre travail** (tests, build, capture comparée à la maquette, sortie attendue). Sans cela, il s'arrête quand le code « a l'air bon ». Avec, il itère jusqu'à ce que ce soit vraiment bon." },
        { t: "code", title: "À ajouter à tes prompts", text: "Vérifie ton travail :\n- npm run build doit passer sans erreur ni avertissement\n- npm test doit être entièrement vert\n- capture d'écran à 375 px et 1440 px, compare-les à la maquette\nNe déclare la tâche terminée qu'une fois ces trois points validés." },
      ],
    },
    {
      id: "m2s4", title: "Le modèle à réutiliser et les avant / après",
      blocks: [
        { t: "code", title: "Modèle", text: "Objectif : <quoi> parce que <pourquoi>\nContexte : @<fichiers>, maquette <URL Figma>\nContraintes : réutiliser <composants / tokens>, ne pas modifier <X>\nTerminé quand : <critère mesurable>\nVérifie avec : <commande, capture d'écran>\nCommence par un plan et attends ma validation." },
        { t: "compare", flou: "Fais la page d'accueil.", precis: "Implémente la page d'accueil depuis la maquette Figma <URL> (frame « Home »). Réutilise les composants de @src/components et les tokens du design system. Ne touche pas au routeur. Terminé quand le rendu desktop et mobile correspond à la maquette : fais une capture des deux et compare. Propose d'abord un plan." },
        { t: "compare", flou: "Il y a un bug, corrige.", precis: "Le formulaire @src/Contact.tsx n'envoie rien quand l'email contient un « + ». Écris d'abord un test qui reproduit le bug, vérifie qu'il échoue, corrige, puis lance npm test. Ne modifie pas le test pour le faire passer." },
        { t: "compare", flou: "Améliore le code.", precis: "Dans @src/utils/, repère les fonctions dupliquées et propose une liste de regroupements, sans rien modifier. Classe-les par gain et par risque." },
        { t: "compare", flou: "Ajoute des tests.", precis: "Écris les tests de @src/utils/prix.ts en couvrant les cas limites : montant nul, négatif, arrondi à deux décimales, devise absente. Suis le style de @src/utils/date.test.ts. Pas de mock." },
      ],
    },
    {
      id: "m2s5", title: "Techniques avancées",
      blocks: [
        { t: "list", items: [
          "**Explorer avant d'agir** : « Lis les fichiers liés à l'authentification sans rien modifier, puis résume comment ça marche. »",
          "**Le faire questionner** : « Avant de commencer, pose-moi les questions dont tu as besoin. »",
          "**L'interview pour écrire une spec** : « Interroge-moi, une question à la fois, pour rédiger la spec de X. Écris ensuite SPEC.md. » Puis `/clear` et : « Implémente @SPEC.md. »",
          "**Montrer un modèle** : « Fais comme @src/components/Card.tsx. »",
          "**Expliquer le pourquoi** : « Pas de librairie externe, le site doit rester léger pour les connexions mobiles » est mieux respecté que « JAMAIS de librairie ».",
          "**Structurer** les longs prompts avec des titres ou des balises : <contexte>, <contraintes>, <exemples>.",
          "**Faire comparer les options** : « Propose trois approches avec avantages, risques et effort, puis recommande-en une. »",
          "**Donner les données brutes** : colle l'erreur complète, les logs, la capture. Ton résumé perd justement l'indice utile.",
          "**Dire ce qui est acceptable** : « Si c'est impossible sans modifier l'API, arrête-toi et explique pourquoi. »",
          "**Découper** : « Étape 1 seulement : le modèle de données. On verra l'interface ensuite. »",
        ] },
      ],
    },
    {
      id: "m2s6", title: "Les formulations qui changent tout",
      blocks: [
        { t: "table", head: ["Au lieu de", "Écris"], rows: [
          ["« Fais un truc joli »", "« Suis la maquette <URL> et les tokens du design system »"],
          ["« Corrige les erreurs »", "« Lance npm run lint et corrige toutes les erreurs, sans désactiver de règle »"],
          ["« Optimise »", "« Le chargement de la liste prend 3 s ; vise moins de 500 ms, mesure avant et après »"],
          ["« Regarde le code »", "« Lis @src/api/ et explique comment les erreurs sont gérées »"],
          ["« Fais des tests »", "« Teste les cas X, Y, Z, dans le style de @fichier.test.ts »"],
        ] },
      ],
    },
    {
      id: "m2s7", title: "Corriger en cours de route",
      blocks: [
        { t: "list", ordered: true, items: ["Dès que ça dérive : **Esc**, puis une précision ciblée (« Non, garde le composant existant et ajoute juste une prop »).", "Si l'état est abîmé : **/rewind** jusqu'au dernier bon point.", "Après **deux corrections ratées** sur le même point : **/clear** et un nouveau prompt de départ qui intègre ce que tu as appris. Un contexte rempli de tentatives ratées tire la qualité vers le bas.", "Note la leçon dans ton journal : si l'erreur risque de revenir, elle ira dans CLAUDE.md."] },
      ],
    },
    {
      id: "m2s8", title: "Écrire durablement et bibliothèque de prompts",
      blocks: [
        { t: "p", text: "Les mêmes règles s'appliquent à CLAUDE.md, aux skills et aux sous-agents : consignes **courtes, concrètes, vérifiables, avec le pourquoi**. Si tu donnes la même consigne **trois fois**, elle doit aller dans l'un de ces fichiers (modules 3 et 6)." },
        { t: "code", title: "docs/prompts.md", text: "# Bibliothèque de prompts DakiOriente\n## Comprendre\n- Explique comment fonctionne <X>, fichiers clés et flux de données. Ne modifie rien.\n## Nouvelle fonctionnalité\n- Interroge-moi une question à la fois pour écrire SPEC.md sur <X>.\n## Bug\n- <symptôme>. Étapes : <…>. Erreur complète : <…>.\n  Reproduis avec un test qui échoue, corrige, relance les tests.\n## Revue\n- Relis le diff comme un développeur senior exigeant : bugs, cas limites, lisibilité." },
        { t: "callout", tone: "warn", title: "Pièges fréquents", text: "Trop vague · pas de critère de fin · plusieurs tâches sans rapport dans un prompt · pas de preuve demandée · consignes contradictoires avec CLAUDE.md · insister dans une session polluée au lieu de repartir de zéro." },
      ],
    },
  ],
  retenir: ["Six ingrédients : objectif, contexte, périmètre, critère de fin, vérification, format.", "Toujours donner un moyen de vérifier.", "Explorer, questionner, planifier avant de coder.", "Corriger tôt ; repartir de zéro après deux échecs."],
  exercice: {
    steps: ["Reprends tes 5 derniers prompts : coche les six ingrédients présents, puis réécris-les avec le modèle.", "Relance deux d'entre eux réécrits, dans une session neuve, et compare.", "Fais une session complète interview → SPEC.md → /clear → implémentation sur une vraie fonctionnalité.", "Crée `docs/prompts.md` avec au moins 5 prompts."],
    resultat: "Moins d'allers-retours, une SPEC.md qu'un humain pourrait suivre, une bibliothèque amorcée.",
  },
  competences: ["Mes prompts contiennent les six ingrédients", "Je demande systématiquement une preuve de vérification", "J'ai fait une session interview → spec → implémentation", "Je sais quand interrompre, revenir en arrière ou repartir de zéro", "J'ai une bibliothèque de prompts"],
  questions: [
    { id: "q2-1", section: "m2s1", q: "À qui faut-il penser en écrivant un prompt ?", options: ["Un développeur senior compétent qui découvre le projet aujourd'hui", "Un débutant qui ne sait pas coder", "Quelqu'un qui connaît tout ton historique", "Un moteur de recherche"], explain: "Il sait coder mais ignore ton contexte : tout ce qui n'est pas écrit, il doit le deviner." },
    { id: "q2-2", section: "m2s2", q: "Quels sont les six ingrédients d'un bon prompt ?", options: ["Objectif, contexte, périmètre, critère de fin, vérification, format", "Objectif, politesse, longueur, exemples, majuscules, format", "Contexte, code, tests, commit, push, PR", "Fichier, ligne, erreur, solution, test, déploiement"], explain: "Pour une petite tâche, 2 ou 3 suffisent ; pour une fonctionnalité, les six." },
    { id: "q2-3", section: "m2s2", q: "« Ne modifie pas l'API » correspond à quel ingrédient ?", options: ["Le périmètre", "Le format", "Le critère de fin", "L'objectif"], explain: "Le périmètre dit ce qu'il ne faut pas toucher." },
    { id: "q2-4", section: "m2s3", q: "Quel ingrédient améliore le plus la qualité du résultat ?", options: ["La vérification : un moyen concret de contrôler son travail", "La longueur du prompt", "La politesse", "Le format de sortie"], explain: "Sans vérification, Claude s'arrête quand c'est « l'air bon » ; avec, il itère jusqu'à ce que ce soit bon." },
    { id: "q2-5", section: "m2s4", q: "Que demande la dernière ligne du modèle de prompt ?", options: ["Commence par un plan et attends ma validation", "Pousse directement en production", "Réponds en une ligne", "Ignore CLAUDE.md"], explain: "Valider le plan coûte beaucoup moins cher que corriger le code." },
    { id: "q2-6", section: "m2s4", q: "Pour corriger un bug, quelle formulation est la meilleure ?", options: ["Décrire le symptôme précis, écrire un test qui le reproduit et échoue, corriger, lancer les tests, sans modifier le test", "« Il y a un bug, corrige. »", "« Corrige tout ce qui ne va pas. »", "« Réécris le fichier entier. »"], explain: "Le test qui échoue prouve le bug et protège contre son retour." },
    { id: "q2-7", section: "m2s5", q: "« N'utilise JAMAIS de librairie » ou « Pas de librairie, le site doit rester léger » ?", options: ["La seconde : la raison aide Claude à appliquer l'esprit de la règle", "La première : les majuscules insistent", "Les deux se valent", "Aucune : il ne faut pas donner de contraintes"], explain: "Avec le pourquoi, Claude sait aussi gérer les cas que tu n'as pas prévus." },
    { id: "q2-8", section: "m2s5", q: "Pourquoi faire /clear entre l'interview et l'implémentation ?", options: ["Pour partir d'un contexte propre contenant seulement la spec finale", "Pour économiser de l'argent uniquement", "Parce que SPEC.md est effacé sinon", "Pour changer de modèle"], explain: "Les hésitations de l'interview n'ont rien à faire dans le contexte de l'implémentation." },
    { id: "q2-9", section: "m2s5", q: "Tu as une erreur longue et confuse. Que donnes-tu à Claude ?", options: ["Le message d'erreur complet et les logs bruts", "Ton résumé en une phrase", "Rien, il trouvera", "Seulement le nom du fichier"], explain: "Ton résumé perd justement l'indice utile." },
    { id: "q2-10", section: "m2s6", q: "Quelle formulation est la plus efficace pour optimiser ?", options: ["« Le chargement prend 3 s ; vise moins de 500 ms, mesure avant et après »", "« Optimise »", "« Fais plus rapide »", "« Rends le code performant »"], explain: "Un objectif chiffré et une mesure donnent une cible vérifiable." },
    { id: "q2-11", section: "m2s7", q: "Deux corrections ont échoué sur le même point. Que faire ?", options: ["/clear et un nouveau prompt de départ enrichi de ce que tu as appris", "Insister avec une troisième correction", "Passer en acceptation auto", "Abandonner la tâche"], explain: "Un contexte rempli de tentatives ratées tire la qualité vers le bas." },
    { id: "q2-12", section: "m2s8", q: "Tu as donné la même consigne trois fois. Qu'en fais-tu ?", options: ["Elle va dans CLAUDE.md, une skill ou un hook", "Tu la répètes une quatrième fois", "Tu l'oublies", "Tu la mets dans le nom de la branche"], explain: "Une consigne répétée doit devenir durable." },
  ],
};

export const m3: Module = {
  id: "m3", num: 3, title: "Contexte et mémoire", duration: "2 h",
  objectif: "Que Claude connaisse ton projet et tes règles dès la première ligne, sans gaspiller de contexte.",
  pourquoi: "Claude ne se souvient pas des sessions précédentes. Ce qui persiste, c'est ce qui est écrit : le code, et surtout CLAUDE.md. Un bon CLAUDE.md, c'est un prompt parfait envoyé automatiquement à chaque session.",
  sections: [
    {
      id: "m3s1", title: "Comment Claude charge la mémoire",
      blocks: [
        { t: "p", text: "Au démarrage, Claude lit les fichiers CLAUDE.md du dossier courant et de ses parents. Ceux des sous-dossiers sont lus quand il travaille dans ces sous-dossiers." },
        { t: "table", head: ["Fichier", "Portée", "Contenu type"], rows: [
          ["`~/.claude/CLAUDE.md`", "Tous tes projets, sur ta machine", "Langue, style de réponse, préférences"],
          ["`./CLAUDE.md`", "Le projet (versionné, partagé)", "Stack, commandes, conventions, workflow Figma"],
          ["`./sous-dossier/CLAUDE.md`", "Une partie du projet", "Règles spécifiques (api/, design-system/)"],
        ] },
        { t: "p", text: "`/memory` liste ces fichiers et les ouvre dans ton éditeur. Tu peux aussi demander : « Ajoute dans CLAUDE.md la règle : … »." },
      ],
    },
    {
      id: "m3s2", title: "Les imports",
      blocks: [
        { t: "p", text: "Un CLAUDE.md peut importer d'autres fichiers avec `@chemin` : pratique pour garder le fichier principal court." },
        { t: "code", text: "# DakiOriente\nVoir @README.md pour la présentation et @package.json pour les scripts.\n## Conventions détaillées\n- Design system : @docs/design-system.md\n- Git : @docs/git.md" },
        { t: "callout", tone: "warn", title: "Piège", text: "Un fichier importé est chargé **à chaque session** : il consomme du contexte à chaque fois. N'importe que ce qui sert souvent. Pour le reste, une mention suffit : « La doc API est dans docs/api.md, lis-la si la tâche touche l'API. »" },
      ],
    },
    {
      id: "m3s3", title: "Que mettre dans CLAUDE.md",
      blocks: [
        { t: "table", head: ["À mettre", "À éviter"], rows: [
          ["Commandes exactes (dev, build, test, lint)", "Ce que Claude découvre seul en lisant le code"],
          ["Conventions non évidentes", "Généralités (« écris du code propre »)"],
          ["Ta méthode de travail (Figma d'abord)", "Longues explications théoriques"],
          ["Interdits et leur raison", "Documentation complète de l'API"],
          ["Pièges connus du projet", "Informations qui changent chaque semaine"],
        ] },
        { t: "callout", tone: "key", title: "Règle d'or", text: "Chaque ligne doit changer le comportement de Claude. Si tu la supprimes et que rien ne change, elle n'avait rien à faire là." },
      ],
    },
    {
      id: "m3s4", title: "Squelette recommandé",
      blocks: [
        { t: "code", title: "CLAUDE.md", text: "# DakiOriente\n## Communication\n- Commencer chaque réponse par « **Demande :** … » en une ligne.\n- Réponses courtes, en français.\n## Stack\n- <framework>, <langage>, <styles>, déployé sur <hébergeur>\n## Commandes\n- Dev : npm run dev · Build : npm run build\n- Tests : npm test (après chaque modification) · Lint : npm run lint\n## Méthode : Figma d'abord, code ensuite\n- Aucune interface codée sans maquette Figma validée.\n- Code produit via get_design_context, en réutilisant le design system.\n- Toujours comparer le rendu à la maquette avant de conclure.\n## Conventions\n- Composants dans src/components, un fichier par composant, PascalCase.\n- Couleurs, typographie, espacements : uniquement via les tokens.\n## À ne pas faire\n- Ne jamais committer .env ni de secret.\n- Pas de dépendance sans demander : le site doit rester léger.\n## Pièges connus\n- <à compléter au fil des erreurs>" },
      ],
    },
    {
      id: "m3s5", title: "Faire vivre CLAUDE.md",
      blocks: [
        { t: "list", items: ["Quand Claude se trompe **deux fois** de la même façon, ajoute une règle. Ton journal de bord est la source.", "Toutes les deux semaines, relis-le : supprime ce qui ne sert plus, clarifie ce qui est ambigu.", "Insiste avec parcimonie : un « IMPORTANT » sur une règle critique aide, sur dix règles il n'aide plus.", "Teste-le : `/clear` puis « Quelles sont les règles de ce projet ? ». S'il oublie une règle, elle est mal formulée ou noyée."] },
      ],
    },
    {
      id: "m3s6", title: "Économiser le contexte",
      blocks: [
        { t: "list", items: ["Une tâche par session.", "Cite les fichiers précis (`@src/pages/Home.tsx`) plutôt que « regarde le projet ».", "Délègue les recherches lourdes à un **sous-agent** : il lit cinquante fichiers dans son propre contexte et ne renvoie que la conclusion (module 7).", "Désactive les serveurs MCP inutiles : leurs outils occupent aussi du contexte (`/context` le montre)."] },
      ],
    },
  ],
  retenir: ["CLAUDE.md = le prompt envoyé à chaque session : court, concret, avec le pourquoi.", "Trois niveaux : personnel, projet, sous-dossier.", "Il s'enrichit des erreurs répétées et se relit régulièrement."],
  exercice: {
    steps: ["Réécris le CLAUDE.md de DakiOriente avec le squelette et les manques notés au module 0.", "Crée ton `~/.claude/CLAUDE.md` personnel : langue, ton, préférences.", "`/clear`, puis : « Quelles sont les règles de ce projet ? Lesquelles te semblent ambiguës ? » Corrige.", "Vérifie le poids de ta mémoire dans `/context`."],
    resultat: "Claude restitue toutes tes règles importantes, et ton CLAUDE.md tient en moins d'une centaine de lignes.",
  },
  competences: ["Mon CLAUDE.md projet contient stack, commandes, conventions et interdits", "J'ai un CLAUDE.md personnel pour mes préférences", "Je surveille le contexte avec /context", "J'ai testé mon CLAUDE.md après un /clear"],
  questions: [
    { id: "q3-1", section: "m3s1", q: "Où mettre « réponds toujours en français » si c'est vrai pour tous tes projets ?", options: ["Dans ~/.claude/CLAUDE.md", "Dans ./CLAUDE.md de chaque projet", "Dans .claude/settings.json", "Dans le README"], explain: "Le CLAUDE.md personnel s'applique à tous tes projets sur ta machine." },
    { id: "q3-2", section: "m3s1", q: "Quand un CLAUDE.md placé dans un sous-dossier est-il lu ?", options: ["Quand Claude travaille dans ce sous-dossier", "Jamais", "À chaque session, comme celui de la racine", "Uniquement avec /init"], explain: "Ceux du dossier courant et des parents sont lus au démarrage ; ceux des sous-dossiers à la demande." },
    { id: "q3-3", section: "m3s1", q: "Quelle commande liste et ouvre tes fichiers CLAUDE.md ?", options: ["/memory", "/context", "/config", "/status"], explain: "/memory liste les fichiers de mémoire et les ouvre dans l'éditeur." },
    { id: "q3-4", section: "m3s2", q: "Faut-il importer toute la documentation du projet dans CLAUDE.md ?", options: ["Non : chaque import consomme du contexte à chaque session ; importer l'essentiel, mentionner le reste", "Oui, plus il y en a mieux c'est", "Oui, mais seulement la doc API", "Non, les imports n'existent pas"], explain: "Un import est chargé à chaque session ; une simple mention suffit pour ce qui sert rarement." },
    { id: "q3-5", section: "m3s3", q: "Comment savoir si une ligne de CLAUDE.md est utile ?", options: ["Si la supprimer ne change pas le comportement de Claude, elle est inutile", "Si elle est en majuscules", "Si elle est longue", "Si elle vient de /init"], explain: "Règle d'or : chaque ligne doit changer le comportement." },
    { id: "q3-6", section: "m3s3", q: "Laquelle de ces lignes a sa place dans CLAUDE.md ?", options: ["« Pas de dépendance sans demander : le site doit rester léger »", "« Écris du code propre »", "La documentation complète de l'API", "Les tâches de la semaine"], explain: "Un interdit avec sa raison change le comportement ; une généralité, non." },
    { id: "q3-10", section: "m3s4", q: "Dans le squelette recommandé, où noter une erreur que Claude a déjà faite sur ce projet ?", options: ["Dans la rubrique « Pièges connus »", "Dans « Stack »", "Dans le README", "Nulle part, il s'en souviendra"], explain: "Claude ne se souvient pas des sessions précédentes : les pièges connus doivent être écrits." },
    { id: "q3-11", section: "m3s4", q: "Comment écrire un interdit dans CLAUDE.md ?", options: ["Avec sa raison : « Pas de dépendance sans demander : le site doit rester léger »", "En majuscules sans explication", "Dans un fichier séparé jamais importé", "Sous forme de question"], explain: "La raison aide Claude à appliquer l'esprit de la règle." },
    { id: "q3-7", section: "m3s5", q: "Quand ajouter une règle à CLAUDE.md ?", options: ["Quand Claude se trompe deux fois de la même façon", "Après chaque message", "Jamais après /init", "Uniquement en fin de projet"], explain: "Les erreurs répétées, notées dans ton journal, alimentent CLAUDE.md." },
    { id: "q3-8", section: "m3s5", q: "Comment tester ton CLAUDE.md ?", options: ["/clear puis « Quelles sont les règles de ce projet ? »", "Le relire en diagonale", "/doctor", "Le mettre en majuscules"], explain: "Si une règle importante est oubliée, elle est mal formulée ou noyée." },
    { id: "q3-9", section: "m3s6", q: "Comment éviter qu'une grosse recherche pollue ta session ?", options: ["La déléguer à un sous-agent, qui ne renvoie que la conclusion", "Tout lire dans la session principale", "Désactiver CLAUDE.md", "Passer en acceptation auto"], explain: "Le sous-agent a son propre contexte (module 7)." },
  ],
};

export const m4: Module = {
  id: "m4", num: 4, title: "Workflows éprouvés", duration: "3 h",
  objectif: "Une méthode fiable pour chaque type de tâche courante.",
  pourquoi: "Laissé sans méthode, Claude a tendance à coder immédiatement. Sur une vraie fonctionnalité, cela produit du code qui marche à moitié et qu'il faut défaire. Les workflows structurent le travail pour que les erreurs soient détectées tôt, quand elles coûtent peu.",
  sections: [
    {
      id: "m4s1", title: "Explorer → Planifier → Coder → Vérifier",
      blocks: [
        { t: "list", ordered: true, items: ["**Explorer** (mode plan) : « Lis ce qui touche à la liste des annonces, ne modifie rien. Résume le fonctionnement et les fichiers clés. »", "**Planifier** : « Propose un plan étape par étape, avec les fichiers et les risques. » Corriger le plan coûte beaucoup moins cher que corriger le code. Gros chantier : plan écrit dans **PLAN.md**, qui survit à un /clear.", "**Coder** : « Applique le plan. » Acceptation auto si le plan est clair et le périmètre limité.", "**Vérifier** : tests, lint, build, capture d'écran, puis toi qui relis le diff.", "**Clore** : commit avec un message clair, et mise à jour de CLAUDE.md si tu as appris quelque chose."] },
        { t: "callout", tone: "tip", title: "Quand sauter le plan ?", text: "Quand tu pourrais décrire le diff en une phrase (corriger une faute, renommer une variable). Au-delà, planifie." },
      ],
    },
    {
      id: "m4s2", title: "Figma → code",
      blocks: [
        { t: "code", title: "Une fois la maquette validée", text: "Implémente l'écran de la maquette <URL Figma avec node-id>.\n1. Récupère le design avec get_design_context et une capture avec get_screenshot.\n2. Liste les composants et tokens existants à réutiliser, et ceux à créer.\n   Attends ma validation.\n3. Implémente. N'invente aucune valeur : tout vient des tokens.\n4. Lance le serveur, capture le rendu à 375 px et 1440 px,\n   compare avec la maquette et corrige les écarts.\n5. Termine par la liste des écarts restants et leur raison." },
        { t: "list", items: ["Donne l'URL avec le **node-id du frame précis**, pas celle du fichier entier : plus fidèle, moins de contexte.", "Le code renvoyé par Figma est une **référence à adapter**, pas du code à coller.", "Exige la **comparaison visuelle** : elle transforme « ça ressemble » en « c'est conforme »."] },
      ],
    },
    {
      id: "m4s3", title: "Développement piloté par les tests",
      blocks: [
        { t: "code", text: "# Étape 1\nÉcris les tests pour <comportement> dans <fichier>.\nNe code pas l'implémentation. Lance-les et confirme qu'ils échouent.\n# (tu relis les tests, puis commit)\n# Étape 2\nImplémente jusqu'à ce que tous les tests passent.\nNe modifie pas les tests. Lance la suite complète à la fin." },
        { t: "callout", tone: "key", title: "Le commit entre les deux étapes", text: "Si Claude touche aux tests pour les faire passer, `git diff` le montre immédiatement." },
      ],
    },
    {
      id: "m4s4", title: "Déboguer",
      blocks: [
        { t: "list", ordered: true, items: ["**Donne tout** : symptôme, étapes pour reproduire, erreur complète, ce que tu as déjà essayé.", "**Fais reproduire** : « Écris un test (ou un script) qui reproduit le bug. »", "**Fais raisonner** : « Formule trois hypothèses, ajoute des logs pour les départager, lance, puis conclus. »", "**Corrige la cause, pas le symptôme** : « Explique la cause racine avant de corriger. »", "**Nettoie** : retirer les logs de débogage, garder le test."] },
        { t: "code", text: "Bug : sur mobile, le menu reste ouvert après avoir cliqué un lien.\nReproduction : viewport 375 px, ouvrir le menu, cliquer « Contact ».\nAttendu : le menu se ferme. Constaté : il reste ouvert, la page change.\nFichiers probables : @src/components/Menu.tsx\nFormule des hypothèses, vérifie-les, explique la cause racine,\npuis corrige et ajoute un test." },
      ],
    },
    {
      id: "m4s5", title: "Comprendre, grosses modifications, visuel",
      blocks: [
        { t: "p", text: "**Comprendre un code inconnu** : « Comment fonctionne le routage ? Trace le parcours d'une requête. » · « Quels fichiers lire en premier ? » · « Pourquoi ce choix ? Regarde l'historique git. » · « Quels sont les points fragiles ? »" },
        { t: "p", text: "**Grosses modifications** (migration, renommage) :" },
        { t: "list", ordered: true, items: ["« Liste toutes les occurrences à modifier dans TODO-migration.md, en cases à cocher. Ne modifie rien. »", "Relis la liste.", "« Traite les 10 premières, coche-les, lance les tests. » Puis le lot suivant."] },
        { t: "p", text: "**Itérer sur du visuel** : colle une capture du rendu (Ctrl+V) et décris l'écart. Deux ou trois boucles capture → correction suffisent en général." },
        { t: "callout", tone: "warn", title: "Pièges", text: "Valider un plan sans le lire · laisser Claude modifier les tests pour qu'ils passent · accepter « c'est corrigé » sans voir le test passer · coder une interface sans maquette validée." },
      ],
    },
  ],
  retenir: ["Explorer → Planifier → Coder → Vérifier pour toute tâche non triviale.", "Maquette validée, puis code, puis comparaison visuelle.", "Un bug corrigé = un test qui le prouve."],
  exercice: {
    steps: ["Prends un écran de DakiOriente dont la maquette Figma est validée.", "Applique le workflow Figma → code en entier, sans sauter la comparaison visuelle.", "Corrige un vrai bug avec la méthode de débogage, test compris.", "Ajoute les deux prompts utilisés à ta bibliothèque."],
    resultat: "Un écran conforme à la maquette en desktop et mobile, un bug corrigé avec un test qui empêche son retour.",
  },
  competences: ["Je fais valider un plan avant chaque tâche importante", "J'ai implémenté un écran depuis Figma avec comparaison visuelle", "J'ai corrigé un bug avec un test qui le reproduit", "J'ai mené une grosse modification par lots avec une liste écrite"],
  questions: [
    { id: "q4-1", section: "m4s1", q: "Quel est l'ordre du workflow de base ?", options: ["Explorer → Planifier → Coder → Vérifier", "Coder → Tester → Planifier → Livrer", "Planifier → Coder → Explorer → Vérifier", "Vérifier → Coder → Explorer → Planifier"], explain: "On comprend d'abord, on planifie, puis on code et on vérifie." },
    { id: "q4-2", section: "m4s1", q: "Pourquoi écrire le plan dans un fichier (PLAN.md) pour un gros chantier ?", options: ["Il survit à /clear et à la compaction, et peut être partagé entre sessions", "Parce que Claude ne lit pas les plans oraux", "Pour le publier sur GitHub", "C'est obligatoire"], explain: "Un plan écrit sert de point de reprise." },
    { id: "q4-3", section: "m4s1", q: "Quand peut-on sauter l'étape du plan ?", options: ["Quand le diff tient en une phrase (faute, renommage)", "Toujours, pour aller vite", "Jamais", "Quand on est en mode plan"], explain: "Au-delà d'une modification triviale, on planifie." },
    { id: "q4-4", section: "m4s2", q: "Quelle URL Figma donner à Claude ?", options: ["Celle du frame précis, avec le node-id", "Celle du fichier entier", "Une capture de la maquette uniquement", "N'importe laquelle"], explain: "Le résultat est plus fidèle et consomme moins de contexte." },
    { id: "q4-5", section: "m4s2", q: "Que faire du code renvoyé par get_design_context ?", options: ["Le traiter comme une référence à adapter aux composants et conventions du projet", "Le coller tel quel", "L'ignorer", "Le mettre dans CLAUDE.md"], explain: "Claude doit le traduire avec le design system existant." },
    { id: "q4-6", section: "m4s2", q: "Quelle étape transforme « ça ressemble » en « c'est conforme » ?", options: ["La comparaison visuelle des captures (375 px et 1440 px) avec la maquette", "Le lint", "Le commit", "Le mode plan"], explain: "Sans comparaison, on ne sait pas si l'écran respecte la maquette." },
    { id: "q4-7", section: "m4s3", q: "Pourquoi committer les tests avant l'implémentation en TDD ?", options: ["Pour détecter immédiatement si Claude modifie les tests au lieu du code", "Pour aller plus vite", "Parce que les tests sont plus importants que le code", "Pour déclencher le déploiement"], explain: "git diff révèle toute modification des tests." },
    { id: "q4-8", section: "m4s4", q: "Que donner à Claude pour un bug d'affichage ?", options: ["Une capture, la taille d'écran, les étapes, le résultat attendu (idéalement la maquette)", "Seulement « ça ne marche pas »", "Le nom du composant uniquement", "Le CLAUDE.md"], explain: "Plus les données sont brutes et complètes, plus le diagnostic est juste." },
    { id: "q4-9", section: "m4s4", q: "Quelle étape vient avant toute correction de bug ?", options: ["Le reproduire (test ou script) et expliquer la cause racine", "Modifier le code au hasard", "Supprimer les tests", "Faire un push"], explain: "On corrige la cause, pas le symptôme." },
    { id: "q4-10", section: "m4s5", q: "Comment mener une migration qui touche des dizaines de fichiers ?", options: ["Liste écrite en cases à cocher, relue, puis traitement par lots avec tests", "Tout faire en un seul prompt", "Laisser Claude décider seul", "Le faire à la main"], explain: "La liste permet de reprendre après /clear ou de répartir entre sessions." },
  ],
};
