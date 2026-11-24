import { m0, m1, m2, m3, m4 } from "./modules-a";
import { m5, m6, m7, m8, m9 } from "./modules-b";
import type { Module } from "./types";

export const MODULES: Module[] = [m0, m1, m2, m3, m4, m5, m6, m7, m8, m9];

/** Annexe A — aide-mémoire */
export const CHEATSHEET: { title: string; rows: [string, string][] }[] = [
  {
    title: "Raccourcis",
    rows: [
      ["Shift+Tab", "Changer de mode (normal, acceptation auto, plan)"],
      ["Esc", "Interrompre"],
      ["Esc Esc", "Revenir en arrière (rewind)"],
      ["Shift+Enter", "Nouvelle ligne"],
      ["Ctrl+V", "Coller une image"],
      ["Ctrl+O", "Afficher le détail des échanges"],
      ["Ctrl+C / Ctrl+D", "Annuler la saisie / quitter"],
      ["@ · ! · /", "Fichier · commande shell · commande Claude"],
    ],
  },
  {
    title: "Commandes de session",
    rows: [
      ["/init", "Générer CLAUDE.md"],
      ["/clear · /compact", "Vider · résumer le contexte"],
      ["/context · /cost", "Occupation du contexte · consommation"],
      ["/rewind · /resume", "Revenir en arrière · reprendre une session"],
      ["/model · /config · /status", "Modèle · réglages · état"],
      ["/memory", "Éditer les CLAUDE.md"],
      ["/permissions · /hooks", "Permissions · hooks"],
      ["/agents · /mcp · /plugin", "Sous-agents · serveurs MCP · plugins"],
      ["/code-review · /security-review · /simplify", "Revues et nettoyage"],
      ["/add-dir · /export", "Ajouter un dossier · exporter la conversation"],
      ["/install-github-app", "Claude dans GitHub"],
    ],
  },
  {
    title: "Ligne de commande",
    rows: [
      ["claude", "Session interactive"],
      ["claude \"prompt\"", "Session qui démarre avec ce prompt"],
      ["claude -p \"prompt\"", "Mode non interactif"],
      ["claude -c · claude -r", "Continuer la dernière session · choisir une session"],
      ["claude --permission-mode plan", "Démarrer en mode plan"],
      ["claude mcp add|list|remove", "Gérer les serveurs MCP"],
    ],
  },
  {
    title: "Fichiers de configuration",
    rows: [
      ["~/.claude/CLAUDE.md", "Préférences personnelles"],
      ["~/.claude/settings.json", "Réglages personnels"],
      ["~/.claude/skills/ · agents/", "Skills et agents personnels"],
      ["CLAUDE.md", "Mémoire du projet"],
      [".mcp.json", "Serveurs MCP partagés"],
      [".claude/settings.json", "Permissions et hooks (partagés)"],
      [".claude/settings.local.json", "Réglages perso (non versionné)"],
      [".claude/skills/<nom>/SKILL.md", "Skills du projet"],
      [".claude/commands/<nom>.md", "Commandes du projet"],
      [".claude/agents/<nom>.md", "Sous-agents du projet"],
      [".claude/hooks/", "Scripts des hooks"],
    ],
  },
];

/** Annexe B — glossaire */
export const GLOSSARY: [string, string][] = [
  ["Agent", "Programme qui enchaîne seul lecture, action et vérification pour accomplir une tâche."],
  ["Contexte", "Tout ce que Claude a « sous les yeux » dans une session : messages, fichiers lus, sorties de commandes. Limité en taille."],
  ["Compaction", "Résumé de la session pour libérer du contexte (/compact, ou automatique)."],
  ["CLAUDE.md", "Fichier de mémoire lu au début de chaque session."],
  ["Checkpoint", "Point de sauvegarde automatique avant chaque modification, utilisé par /rewind."],
  ["Mode plan", "Mode où Claude analyse et propose un plan sans rien modifier."],
  ["Skill", "Procédure en Markdown chargée quand la tâche correspond à sa description."],
  ["Commande", "Raccourci /nom défini dans un fichier Markdown, avec $ARGUMENTS."],
  ["Hook", "Commande shell exécutée automatiquement à un événement précis (avant, après une action…)."],
  ["Sous-agent", "Instance spécialisée de Claude avec son propre contexte et ses propres outils."],
  ["MCP", "Model Context Protocol : standard pour connecter des outils externes (Figma, GitHub…)."],
  ["Worktree", "Copie de travail git supplémentaire sur une autre branche, pour travailler en parallèle."],
  ["Headless / -p", "Exécution non interactive, pour scripts et CI."],
  ["Agent SDK", "Bibliothèque pour construire ses propres agents avec le moteur de Claude Code."],
  ["Plugin", "Paquet installable regroupant skills, commandes, agents, hooks et serveurs MCP."],
];
