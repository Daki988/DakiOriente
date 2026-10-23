# Carte des processus NEAM

Chaque recommandation du NEAM Digital Score (ou besoin du brief) mène à un **processus standard** (P1 à P16). Chaque processus est découpé en étapes 🤖 (un agent la réalise) ou 🧑 (un humain la fait, en suivant un tutoriel rédigé pour ce client).

**Bilan : 71 étapes 🤖 sur 91, soit 78 %.** Le taux réel d'un client dépend des processus retenus dans son plan ; le chef de projet le calcule dans `plan.md`.

Agents : `chef-de-projet`, `business-analyste`, `expert-metier`, `designer`, `expert-seo`, `community-manager`, `videaste`, `developpeur-web`, `expert-ia`.

## Des recommandations du Digital Score aux processus

| Recommandation (clé du Digital Score) | Processus |
| --- | --- |
| gbp_create, gbp_optimize | P1 Fiche Google Business |
| reviews | P2 Avis clients |
| local_seo, consistency | P3 Référencement local et cohérence des coordonnées |
| create_site, site_structure, cta, contact_form, contact_channels, whatsapp, social_links, offers, legal, social_proof, chat | P4 Site vitrine (création ou refonte) |
| mobile, speed, seo_onpage, seo_tech, prerender, security, accessibility, maintenance | P5 Corrections techniques d'un site existant |
| https, pro_domain, pro_email | P6 Nom de domaine, sécurité et e-mail professionnel |
| branding | P7 Identité visuelle |
| social_setup | P8 Réseaux sociaux |
| video | P9 Vidéo courte |
| content_seo | P10 Contenus SEO (blog, guides) |
| payment, booking | P11 Paiement mobile et commande en ligne |
| mgmt_tool, crm, dashboard | P12 Outil de gestion, CRM, tableau de bord |
| automation, newsletter, backup | P13 Automatisations |
| training | P14 Formation des équipes |
| digital_budget | P15 Budget digital et pilotage |
| (tout client en abonnement) | P16 Suivi mensuel |

Un besoin non couvert par le Digital Score (logiciel métier, application, assistant IA…) est rattaché par le `business-analyste` au processus le plus proche, ou décrit comme processus sur mesure avec le même découpage 🤖 / 🧑.

---

## P1 Fiche Google Business (5 🤖 / 7)
1. 🤖 `expert-seo` : analyse des 5 concurrents locaux les mieux placés (Firecrawl, Semrush) : catégories, nombre d'avis, photos, posts.
2. 🤖 `expert-seo` : contenu complet de la fiche : nom exact, catégorie principale et secondaires, description (750 caractères max.), services, attributs, horaires, questions-réponses, 4 posts.
3. 🤖 `designer` : logo carré, photo de couverture et visuels des posts aux formats Google (Canva ou Adobe).
4. 🧑 Créer ou revendiquer la fiche, puis la faire vérifier (tutoriel : compte Google du client, méthode de vérification, vidéo de l'établissement si demandée).
5. 🧑 Saisir les contenus (tutoriel champ par champ, avec le texte à copier).
6. 🤖 `expert-seo` : contrôle final (cohérence des coordonnées avec le site et les réseaux, conformité aux règles Google).
7. 🤖 `community-manager` : planning des posts Google sur 3 mois.

## P2 Avis clients (4 🤖 / 5)
1. 🤖 `expert-seo` : lien direct vers le formulaire d'avis.
2. 🤖 `designer` : QR code et affiche de comptoir, carte à glisser dans les commandes.
3. 🤖 `community-manager` : messages de demande d'avis (WhatsApp, SMS) au bon moment du parcours.
4. 🧑 Envoyer la demande aux clients récents (tutoriel : liste, ordre, rythme).
5. 🤖 `expert-seo` : modèles de réponses aux avis positifs et négatifs.

## P3 Référencement local et cohérence (4 🤖 / 5)
1. 🤖 `expert-seo` : relevé de toutes les mentions de l'entreprise en ligne (Firecrawl) et des écarts de nom, adresse, téléphone.
2. 🤖 `expert-seo` : liste priorisée des annuaires et plateformes utiles au Gabon et au secteur.
3. 🤖 `expert-seo` : bloc de coordonnées de référence et textes de présentation par plateforme.
4. 🧑 Corriger et inscrire l'entreprise (tutoriel plateforme par plateforme).
5. 🤖 `expert-seo` : suivi des positions sur les requêtes locales (Semrush) à J+30 et J+90.

## P4 Site vitrine (6 🤖 / 9)
1. 🤖 `business-analyste` + `expert-metier` : objectifs, cibles, parcours de conversion, arborescence.
2. 🤖 `expert-seo` : requêtes visées par page, titres, descriptions, maillage.
3. 🤖 `community-manager` (rédaction) et `expert-metier` : textes de toutes les pages.
4. 🤖 `designer` : direction artistique et maquettes (Figma ou Canva), à partir des inspirations du client.
5. 🤖 `developpeur-web` : intégration (HTML/CSS/JS légers, ou CMS si le client doit gérer seul), formulaires, bouton WhatsApp, données structurées, mentions légales.
6. 🤖 `developpeur-web` : recette (mobile, vitesse, accessibilité, liens, formulaires) avec rapport.
7. 🧑 Présenter la maquette au client et recueillir ses retours (tutoriel de réunion et grille de questions).
8. 🧑 Mise en ligne (tutoriel LWS : nom de domaine, hébergement, envoi des fichiers, SSL).
9. 🧑 Déclarer le site à Google Search Console (tutoriel).

## P5 Corrections techniques d'un site existant (3 🤖 / 4)
1. 🤖 `developpeur-web` + `expert-seo` : audit (Firecrawl, mesures mobiles), liste priorisée.
2. 🤖 `developpeur-web` : correctifs prêts à appliquer (code, réglages).
3. 🤖 `developpeur-web` : contrôle après correction.
4. 🧑 Appliquer les correctifs sur l'hébergement du client (tutoriel adapté à son hébergeur).

## P6 Nom de domaine, sécurité, e-mail professionnel (3 🤖 / 5)
1. 🤖 `business-analyste` : 3 propositions de noms de domaine, disponibilité vérifiée.
2. 🧑 Acheter le domaine et activer le SSL (tutoriel LWS).
3. 🧑 Créer les adresses e-mail et les connecter au téléphone (tutoriel).
4. 🤖 `designer` : signature e-mail.
5. 🤖 `community-manager` : message d'annonce de la nouvelle adresse aux clients.

## P7 Identité visuelle (3 🤖 / 4)
1. 🤖 `designer` : audit de l'existant et planche d'inspiration à partir des références du client.
2. 🤖 `designer` : charte (logo et déclinaisons, couleurs, typographies, règles, exemples).
3. 🤖 `designer` : kit de modèles réutilisables (Canva ou Adobe Express) : posts, stories, affiche, carte de visite.
4. 🧑 Validation par le client (tutoriel de présentation).

## P8 Réseaux sociaux (6 🤖 / 8)
1. 🤖 `community-manager` + `expert-metier` : stratégie (réseaux, cibles, piliers de contenu, ton, fréquence).
2. 🤖 `community-manager` : bios, liens, textes d'à-propos optimisés.
3. 🤖 `designer` : photo de profil, bannières, couvertures des stories à la une.
4. 🧑 Créer les comptes ou donner les accès (tutoriel Meta Business Suite, TikTok).
5. 🤖 `community-manager` : calendrier du mois et textes prêts à publier.
6. 🤖 `designer` : visuels du mois (Canva ou Adobe), au style de la charte.
7. 🧑 Programmer les publications (tutoriel Meta Business Suite ; à automatiser dès que l'accès API est obtenu).
8. 🤖 `community-manager` : bilan du mois.

## P9 Vidéo courte (5 🤖 / 6)
1. 🤖 `videaste` + `expert-metier` : concepts et scripts (accroche en 3 secondes).
2. 🤖 `videaste` : storyboard et plan de tournage au smartphone.
3. 🧑 Tourner (tutoriel : cadrage, lumière, son, liste des plans).
4. 🤖 `videaste` : montage, ou vidéo animée sans tournage (Adobe, Canva, ou rendu HTML image par image avec ffmpeg).
5. 🤖 `videaste` : sous-titres, déclinaisons 9:16, 1:1, 16:9, miniature.
6. 🤖 `community-manager` : textes de publication.

## P10 Contenus SEO (5 🤖 / 6)
1. 🤖 `expert-seo` : recherche de mots-clés et questions des clients (Semrush, Firecrawl).
2. 🤖 `expert-seo` : plan éditorial sur 3 mois.
3. 🤖 `expert-seo` + `expert-metier` : articles complets.
4. 🤖 `designer` : visuels des articles.
5. 🧑 Relecture des points métier par le client (tutoriel de relecture en 10 minutes).
6. 🤖 `developpeur-web` : mise en page et publication prête à envoyer.

## P11 Paiement mobile et commande (4 🤖 / 5)
1. 🤖 `business-analyste` : parcours de commande et de paiement.
2. 🧑 Ouvrir le compte marchand Airtel Money / Moov Money (tutoriel : pièces, démarches).
3. 🤖 `developpeur-web` : intégration (lien de paiement, formulaire de commande, WhatsApp).
4. 🤖 `developpeur-web` : tests complets du parcours.
5. 🤖 `expert-ia` : messages automatiques de confirmation et de suivi.

## P12 Outil de gestion, CRM, tableau de bord (6 🤖 / 7)
1. 🤖 `business-analyste` : cartographie des processus actuels et des pertes de temps.
2. 🤖 `business-analyste` : cahier des charges par lots, critères de recette.
3. 🤖 `business-analyste` + `developpeur-web` : comparatif outil existant contre développement sur mesure.
4. 🤖 `developpeur-web` ou `expert-ia` : paramétrage, modèles d'import, tableau de bord (Google Sheets ou outil retenu).
5. 🧑 Atelier de démarrage avec l'équipe du client (tutoriel d'animation).
6. 🤖 `expert-ia` : automatisations entre les outils.
7. 🤖 `business-analyste` : support de prise en main.

## P13 Automatisations (6 🤖 / 7)
1. 🤖 `expert-ia` : inventaire des tâches répétitives et gain attendu (méthode de mesure, sans chiffre inventé).
2. 🤖 `expert-ia` : conception de chaque automatisation (déclencheur, étapes, contrôle humain).
3. 🤖 `community-manager` : textes des messages automatiques.
4. 🤖 `expert-ia` : construction (scénario Make ou n8n, script, assistant IA).
5. 🧑 Connecter les comptes du client (tutoriel de connexion sécurisée).
6. 🤖 `expert-ia` : tests avec cas réels et cas limites.
7. 🤖 `expert-ia` : documentation d'exploitation.

## P14 Formation (4 🤖 / 5)
1. 🤖 `business-analyste` : programme selon les outils livrés.
2. 🤖 `designer` : support de présentation (Canva ou Adobe).
3. 🤖 `business-analyste` : fiches pratiques pas à pas.
4. 🧑 Animer la session (tutoriel de l'animateur, minute par minute).
5. 🤖 `business-analyste` : quiz et attestation.

## P15 Budget digital et pilotage (2 🤖 / 3)
1. 🤖 `business-analyste` : budget recommandé avec la grille NEAM (`api/lib/atelier/offres.php`) et ROI estimé.
2. 🤖 `chef-de-projet` : proposition chiffrée et planning.
3. 🧑 Entretien de décision avec le client (tutoriel : objections fréquentes et réponses).

## P16 Suivi mensuel (5 🤖 / 5)
1. 🤖 `business-analyste` : relevé des statistiques (Instagram, fiche Google Business, Search Console, publicités) avec Windsor.ai. Si un compte du client n'y est pas encore branché : étape 🧑, tutoriel pour l'y ajouter (lien de `get_connector_connect_info`), puis relevé automatique les mois suivants.
2. 🤖 `expert-seo` : positions sur les requêtes suivies (Semrush) et contrôle de la fiche.
3. 🤖 `business-analyste` : rapport mensuel, comparaison au mois précédent et aux hypothèses de ROI.
4. 🤖 `chef-de-projet` : priorités du mois suivant.
5. 🤖 `community-manager` : calendrier du mois suivant.
