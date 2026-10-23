# Connecteurs de l'agence

Avant d'utiliser un connecteur, cherche ses outils avec ToolSearch : un connecteur peut être installé mais éteint pour la conversation. S'il manque, produis le livrable autrement et signale-le.

## Déjà branchés

| Connecteur | Pour quoi faire | Agents |
| --- | --- | --- |
| Adobe | Visuels, retouche et détourage (outils de type Photoshop), Firefly, mise en page, animation de designs, rendu et montage vidéo simple, PDF | designer, vidéaste |
| Canva | Génération de designs, modèles de marque, déclinaisons de formats, export, vidéos courtes | designer, community manager, vidéaste |
| Figma | Maquettes de site et d'interfaces, schémas FigJam | designer, développeur web |
| Semrush | Mots-clés, concurrence, positions, publicité Google (PPC) | expert SEO, business analyste |
| Firecrawl, Parallel Search, TinyFish | Recherche et lecture du web, fiches concurrentes, automatisation de navigateur | expert SEO, expert métier, business analyste |
| Google Drive, Docs, Sheets, Slides | Dossiers clients, rapports, tableaux de bord, présentations | tous |
| Gmail, Google Agenda | Brouillons d'e-mails, rendez-vous clients | chef de projet |
| Netlify, Vercel | Mise en ligne de maquettes et de sites de démonstration | développeur web |
| Bird | WhatsApp Business (modèles de messages en brouillon, statistiques), SMS, e-mail, robot WhatsApp | expert IA, community manager |
| Brevo | E-mailing : listes, campagnes créées en brouillon, modèles, statistiques | community manager, expert IA |
| MyChatBot | Assistant de vente IA sur WhatsApp, Instagram, Messenger, Telegram, TikTok et site (proposition validée par carte avant création) | expert IA |
| Make | Automatisations des clients (P13) : choix des applications, scénarios, exécutions | expert IA |
| ClickUp | Tâches, plannings et suivi des projets clients de l'agence | chef de projet |
| Windsor.ai | Vrais résultats des comptes branchés (Instagram, fiche Google Business, Search Console, publicités Meta, Google, TikTok, LinkedIn) pour les rapports mensuels : remplace le relevé manuel des statistiques. Lecture libre ; toute action (publication, budget, campagne) avec accord | business analyste, expert SEO, community manager |
| TikTok for Business | Comptes et résultats des publicités TikTok ; création de campagnes seulement avec accord, et toujours en pause | business analyste, community manager |
| vidIQ | Mots-clés YouTube, vidéos et Reels/TikTok qui performent, titres, miniatures (consomme des crédits vidIQ) | vidéaste, community manager, expert SEO |

Installés mais **connexion à terminer** sur claude.ai : **Adspirer** (Ads & Performance Marketing, et Social Ads), **Microsoft 365**, **Zapier**, **Webflow**, **Stripe**.

## Recommandés (à installer depuis claude.ai, Réglages → Connecteurs)

| Besoin | Connecteur | Ce qu'il apporte | Priorité |
| --- | --- | --- | --- |
| Publicité Google, Meta, LinkedIn, TikTok | Adspirer (terminer la connexion) | Recherche des publicités concurrentes, création de campagnes (lancées en pause), suivi des résultats | 1 |
| Publier et programmer sur les réseaux, relier Telegram | Zapier (terminer la connexion) | Publication et automatisations sur Facebook, Instagram, LinkedIn, Telegram et e-mail, selon les applications disponibles dans Zapier | 1 |
| Microsoft 365 | Microsoft 365 (terminer la connexion) | Recherche dans Outlook, OneDrive, SharePoint et Teams, pour les clients équipés Microsoft | 3 |
| CRM | HubSpot | CRM, campagnes, rapports, pour les clients Growth | 3 |

Envois réels (WhatsApp, SMS, e-mails, campagnes Brevo, messages MyChatBot), soumission d'un modèle WhatsApp à Meta, activation d'un scénario Make, achat d'un numéro : toujours avec l'accord explicite de l'utilisateur (`autorisations.md`), Claude Code le redemande.

Pour ajouter le compte d'un client à Windsor.ai (Instagram, fiche Google, Meta Ads…), utiliser `get_connector_connect_info` : le client ou l'équipe autorise l'accès depuis le lien donné.

Pas de connecteur pour After Effects ou Premiere Pro à ce jour : les animations passent par Adobe (animation de designs, rendu vidéo), Canva, ou le rendu HTML image par image du vidéaste.
