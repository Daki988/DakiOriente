---
name: neam-autorisations
description: Règle ce que l'agence IA de NEAM peut envoyer, publier ou partager sans redemander (mode demander, groupé ou automatique, par catégorie et par client), et valide en une fois la file des envois en attente.
argument-hint: [voir | valider <client> | <catégorie> <mode> [client]]
---

# /neam-autorisations

Fichiers : `.claude/skills/neam/autorisations.md` (règles de l'agence) et `.claude/settings.json` (confirmations de Claude Code).

## Voir
Sans argument ou avec « voir » : affiche le tableau des réglages actuels en quelques lignes et les files `clients/*/envois.md` qui ont des envois en attente.

## Changer un réglage
Exemple : « publications automatique pour Mode Akanda », « envois au client groupé », « tout en demander ».
1. Mets à jour la ligne de la catégorie dans `autorisations.md` (mode et clients concernés). Refuse de passer **Dépenses** ou **Suppressions** en autre chose que « demander », et explique pourquoi.
2. Si une catégorie d'envoi passe en « automatique », ajoute les outils correspondants à `permissions.allow` de `.claude/settings.json` et retire-les de `permissions.ask` (lis le fichier avant, fusionne sans rien écraser, vérifie le JSON avec `jq`). Exemples : envois au client par e-mail → `mcp__Gmail__send_message`, `mcp__Gmail__reply` ; partage Drive → `mcp__Google_Drive__share_file`. Si elle repasse en « demander » ou « groupé », fais l'inverse.
3. Résume le changement en une phrase et rappelle qu'il vaut dès la prochaine action (un redémarrage de la session peut être nécessaire pour les confirmations de Claude Code).

## Valider la file d'envois
Avec « valider <client> » (ou à la fin d'une séance `/neam`) : lis `clients/<slug>/envois.md`, montre la liste (canal, destinataire, contenu, contrôle qualité), puis pose une seule question (AskUserQuestion) : tout envoyer, choisir lesquels (choix multiple), ou reporter. Envoie ceux qui sont validés, mets leur statut à « envoyé » avec la date, et note-les dans `journal.md`.
