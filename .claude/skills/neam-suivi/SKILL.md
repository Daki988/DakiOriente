---
name: neam-suivi
description: Suivi mensuel d'un client de NEAM en abonnement : relevé des résultats, positions Google, rapport mensuel comparé aux hypothèses de ROI, priorités et calendrier du mois suivant, message d'envoi au client.
argument-hint: <nom du client> <mois> [statistiques du mois]
---

# /neam-suivi

Suis le processus P16 de `.claude/skills/neam/processus.md`, après avoir lu `charte.md`.

1. Ouvre `clients/<slug>/` (ou récupère-le dans Google Drive) : plan, hypothèses de ROI, rapport du mois précédent.
2. **Statistiques Google Business et Meta** : étape 🧑 (tutoriel de relevé en 5 minutes via `/neam-tutoriel` la première fois) ; l'utilisateur colle les chiffres ou une capture.
3. **En parallèle** :
   - `expert-seo` : positions sur les requêtes suivies (Semrush) et contrôle de la fiche Google ;
   - `community-manager` : bilan des publications du mois.
4. `business-analyste` : rapport mensuel (mesures, écarts avec le mois précédent et avec les hypothèses de ROI, lecture simple, 3 actions), sans aucun chiffre inventé.
5. `chef-de-projet` : priorités du mois suivant ; puis `/neam-contenus` pour le calendrier du mois suivant.
6. Rapport en PDF ou Google Docs dans `clients/<slug>/livrables/rapports/`, brouillon du message WhatsApp d'envoi au client, entrée dans `journal.md`. Aucun envoi sans l'accord de l'utilisateur.
