# Autorisations d'envoi de l'agence

Ce fichier dit ce que l'agence peut faire **sans te redemander**. Tu le modifies toi-même ou avec `/neam-autorisations` (par exemple : « /neam-autorisations publications automatiques pour Mode Akanda »). Une autorisation écrite ici vaut accord explicite au sens de la charte, pour la catégorie et les clients indiqués.

## Les trois modes

- **demander** : l'agent prépare, puis te demande avant chaque envoi.
- **groupé** : l'agent met tous les envois prêts dans la file `clients/<slug>/envois.md` ; en fin de séance, tu valides tout en une seule fois (tout envoyer, choisir, ou reporter).
- **automatique** : l'agent envoie dès que le livrable a passé le contrôle qualité du chef de projet, et le note dans `journal.md` et dans le récapitulatif de fin de séance.

## Réglages actuels

| Catégorie | Exemples | Mode | Clients concernés |
| --- | --- | --- | --- |
| Création interne | Visuels Canva ou Adobe, maquettes Figma, documents Google, fichiers dans `clients/` | automatique | tous |
| Rangement | Copie des livrables dans `NEAM — Clients/<client>/` sur Google Drive | automatique | tous |
| Brouillons | Brouillons Gmail, messages WhatsApp prêts à copier | automatique | tous |
| Envois au client | E-mail au client, partage d'un dossier Drive avec lui | groupé | tous |
| Publications | Posts sur Facebook, Instagram, LinkedIn, TikTok, posts Google Business (dès qu'un connecteur le permet) | groupé | tous |
| Messages aux clients du client | Relances, campagnes WhatsApp, SMS, e-mailing | demander | tous |
| Mise en ligne | Site ou page en ligne (LWS, Netlify, Vercel, Webflow) | demander | tous |
| Dépenses | Lancement ou hausse de budget d'une campagne publicitaire, achat de nom de domaine, abonnement | demander (toujours) | tous |
| Suppressions | Supprimer un fichier, un post, une campagne | demander (toujours) | tous |

Règles fixes, quel que soit le réglage :
- les **dépenses** et les **suppressions** restent toujours en « demander » ;
- un livrable qui n'a pas passé le contrôle qualité ne part jamais, même en « automatique » ;
- en cas de doute sur le destinataire ou sur le contenu, l'agent repasse en « demander » pour cet envoi ;
- le mode « automatique » d'une catégorie d'envoi suppose aussi d'autoriser l'outil correspondant dans `.claude/settings.json` (sinon Claude Code affiche quand même sa demande de confirmation) : `/neam-autorisations` s'en charge.

## Format de la file d'envois (`clients/<slug>/envois.md`)

```markdown
| # | Catégorie | Canal | Destinataire | Contenu (lien ou fichier) | Contrôle qualité | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Publications | Instagram | compte du client | livrables/reseaux/post-03.png + texte | OK | en attente |
```
