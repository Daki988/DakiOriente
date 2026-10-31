# Maquettes Navigoal (Figma)

Fichier Figma : https://www.figma.com/design/NzAcfIbAFK6tTliGnuE5xq

`build.py` génère des maquettes HTML auto-contenues (données réelles des référentiels, logos, photo, police Plus Jakarta Sans embarquée) importées dans Figma en calques éditables via `html_to_figma`.

```bash
npm i --prefix /tmp/icons lucide-static@0.453.0
python3 design/maquettes/build.py /tmp/icons/node_modules/lucide-static/icons   # → design/maquettes/out/*.html
```

Campagne « Trouve ta voie » (Gabon) : `python3 design/maquettes/campagne.py <polices> <photo détourée>` → `out/campagne.html` (page de campagne ordinateur et mobile, règlement du jeu, parrainage et sources d'inscription).

Évolutions après l'audit fonctionnel : `python3 design/maquettes/evolutions.py` → `out/evolutions.html` (test d'orientation avec réponse oubliée, résumé du logement d'une réservation, bouton WhatsApp conseiller, page Parents ordinateur et mobile, paiement Airtel Money / Moov Money). Import Figma : `html_to_figma` avec `cssSelector: ".frame"`.

Assistant IA (proposition, octobre 2026) : `python3 design/maquettes/chatbot.py <icônes lucide>` → `out/chatbot.html` (accueil et bouton flottant, recherche guidée profil + budget, suivi de dossier connecté, devis express parent et passage à un conseiller, règles de l'assistant). Import Figma : `html_to_figma` avec `cssSelector: ".frame"`.

Écrans : design system & motion, accueil (desktop + mobile), test et résultat d'orientation, recherche de formations, fiche formation, Navilease, tableau de bord étudiant.
Les étiquettes roses sur les maquettes décrivent les animations prévues.

Relais administrateur et Premium établissements (proposition, octobre 2026) : `python3 design/maquettes/premium.py <icônes lucide>` → `out/premium.html` (toutes les candidatures et tous les fils pour l'admin, reprise d'un échange au nom de Navigoal, mode accompagné écoles et bailleurs, filtres Premium résultats / projet / financement, vivier de candidats consentants, campagne de prospection, profil « Mes attentes » et invitations côté élève, offre Gratuit / Premium, règles). Import Figma : `html_to_figma` avec `cssSelector: ".frame"`.
Accès des établissements et guide (octobre 2026) : `python3 design/maquettes/acces.py <icônes lucide>` → `out/acces.html` (gestion des accès par l'administrateur, première connexion avec mot de passe provisoire, guide de la plateforme dans le back-office école).
Offres payantes des établissements (octobre 2026) : `python3 design/maquettes/offres.py <icônes lucide>` → `out/offres.html` (offres et abonnements dans le back-office, activation d'un service, écoles partenaires mises en avant sur le site public, recherche de formations, « Mon offre » côté école).
Témoignages de professionnels (octobre 2026) : `python3 design/maquettes/temoignages.py <icônes lucide>` → `out/temoignages.html` (encart « Ils racontent leur métier » sur la fiche métier, version mobile, page de tous les témoignages, vidéo lue sur Navigoal avec mention de la source).
