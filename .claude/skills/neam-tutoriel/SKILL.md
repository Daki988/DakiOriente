---
name: neam-tutoriel
description: Rédige le tutoriel pas à pas d'une action qu'un humain doit faire pour un client de NEAM (créer et vérifier une fiche Google Business, ouvrir un compte marchand Mobile Money, acheter un nom de domaine chez LWS, programmer des publications dans Meta Business Suite, tourner une vidéo au smartphone, animer une formation…), avec les vraies données du client, les textes à copier et les vérifications.
argument-hint: <nom du client> <action à réaliser>
---

# /neam-tutoriel

1. Lis `.claude/skills/neam/charte.md` et le modèle de tutoriel dans `.claude/skills/neam/modeles.md`.
2. Ouvre `clients/<slug>/dossier.md` et `plan.md` (ou récupère-les dans Google Drive). Identifie le processus et l'étape 🧑 concernés dans `.claude/skills/neam/processus.md`.
3. Confie la rédaction à l'agent du métier : fiche Google, avis, annuaires, Search Console → `expert-seo` ; comptes de réseaux sociaux et programmation → `community-manager` ; tournage → `videaste` ; mise en ligne, nom de domaine, e-mail, compte marchand → `developpeur-web` ; connexion d'outils → `expert-ia` ; atelier ou formation → `business-analyste` ; réunion client → `chef-de-projet`.
4. Exigences du tutoriel :
   - les valeurs exactes du client (nom, adresse, horaires, textes à coller) déjà remplies ;
   - une action par étape, l'endroit où cliquer, ce qu'on doit voir ensuite ;
   - quand l'interface d'un service a pu changer, vérifier en ligne (Firecrawl, aide officielle du service, avec le lien et la date) et, à défaut, dire quoi chercher plutôt qu'inventer un menu ;
   - les erreurs fréquentes et leur solution, la vérification finale, la durée réaliste.
5. Enregistre dans `clients/<slug>/processus/<Pn>-<action>.md` et note-le dans `journal.md`.
6. Rends à l'utilisateur le tutoriel prêt à suivre, et propose une version courte à envoyer au client par WhatsApp si c'est lui qui doit agir.
