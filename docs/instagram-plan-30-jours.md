# Instagram Navigoal — plan de contenu sur 30 jours (1er au 30 décembre 2026)

Premier mois de la campagne **« Trouve ta voie »** (1er déc. 2026 – 28 févr. 2027, objectif 200 comptes au 1er mars).
Cible : élèves de terminale et étudiants du Gabon d'abord, puis Cameroun, Sénégal, Côte d'Ivoire, Congo — et leurs parents,
qui décident du budget.

**À retenir avant de produire**

- Le jeu-concours ne court que du **1er au 21 février 2027** (tirage le 24). En décembre on ne l'annonce pas : on fait
  connaître la plateforme et on fait créer des comptes. Un post « jeu-concours » en décembre serait faux.
- Tout lien porte `?utm_source=instagram&utm_content=<jour>` : le cookie `ng_acq` enregistre la source à l'inscription,
  et `/admin/campagne/` dira exactement combien de comptes chaque post a rapportés. Sans ce paramètre, le post est invisible
  dans le suivi.
- Chaque chiffre de ce plan vient des référentiels du site (103 écoles, 96 métiers, 88 témoignages, coûts recalés en
  novembre 2026). Conversion au taux du 20/11/2026 : **1 MAD ≈ 60 F CFA**. Les montants en F CFA sont arrondis et doivent
  être présentés comme des ordres de grandeur, jamais comme des prix fermes — le devis personnalisé fait foi.
- **Témoignages** : ce sont des personnes réelles, citées sur le site avec leur source et sans photo. Sur Instagram, même
  règle : citation exacte, nom, métier, source visible sur le visuel, aucune photo de la personne. Ne jamais illustrer un
  témoignage avec la photo d'illustration du métier sans dire que c'est une illustration.

**Rythme** : une publication par jour du lundi au samedi, dimanche en repos (26 publications). Les visuels existent déjà
pour l'essentiel : 96 photos de métiers (`web/public/images/metiers/`), photos d'écoles et de villes (`assets/photos/`),
illustrations des guides.

**Quatre piliers, en rotation**

| Pilier | Ce qu'il fait | Part |
|---|---|---|
| **Métier** | donne envie, montre un débouché concret et les écoles qui y préparent | 8 |
| **Argent** | répond à la vraie question des parents : combien, et comment | 7 |
| **Démarches** | visa, dossier, logement, transport, argent sur place | 6 |
| **Preuve** | labels, témoignages, transparence, la plateforme elle-même | 5 |

---

## Avant le lancement — Reel d'annonce (lundi 23 novembre, 19 h, heure de Libreville)

**Vidéo** `docs/videos/navigoal-reel-teaser-1er-decembre.mp4` (19 s, 1080 × 1920), couverture `navigoal-reel-teaser-1er-decembre-couverture.jpg`.
Publié huit jours avant le 1er décembre : le compte a le temps de gagner ses premiers abonnés avant le Reel de lancement.
19 h, heure de Libreville (UTC+1) : sortie des cours, et Dakar, Douala, Abidjan sont dans le même créneau (18 h à 19 h).
Relais : partager le Reel en story le jour même, puis une story « J-3 » (28 nov.) et « Demain » (30 nov.) avec l'autocollant compte à rebours.

**Légende**

> Bac 2027 en vue, et le Maroc dans un coin de ta tête ?
>
> Quelle école est vraiment reconnue par l'État ? Combien ça coûte, logement et voyage compris ? Comment candidater, et où dormir en arrivant ?
>
> Le 1er décembre, toutes les réponses arrivent au même endroit. Gratuitement.
>
> 🔔 Abonne-toi pour ne rien rater, et envoie cette vidéo à quelqu'un qui passe son bac cette année.
>
> #EtudierAuMaroc #Bac2027 #Orientation #Gabon #Libreville #EtudiantAfricain #EtudesSuperieures #Navigoal

**Premier commentaire (épinglé)** : « Le site est déjà ouvert si tu veux jeter un œil 👉 lien en bio. »
**Lien en bio** `navigoal.net/?utm_source=instagram&utm_content=teaser`

---

## Semaine 1 — « On existe, et on est utile » (1–6 décembre)

**Lun 1 — Reel · Preuve · lancement**
Accroche (0–2 s) : « Tu veux étudier au Maroc et tu ne sais pas par où commencer. »
Corps : 103 écoles privées, leur label officiel, leurs frais quand ils sont publiés, le coût total calculé pour ton pays.
Un plan de 15 s, texte à l'écran, pas de voix off obligatoire.
CTA : « Le lien est dans la bio. » → `/?utm_source=instagram&utm_content=j01`
Visuel : montage de 6 photos d'écoles réelles (`assets/photos/`).

**Mar 2 — Carrousel · Argent · payer moins** (revu le 21/11/2026 : pas de fourchettes en millions en ouverture de campagne)
Accroche : « Étudier au Maroc : payer moins, c'est possible »
Slides : 13 écoles avec des bourses jusqu'à 100 % · 37 bourses au mérite et 19 aides sociales · scolarité publiée la moins
chère 960 000 F CFA par an (SUP ISI) · résidence universitaire dès 39 000 F CFA par mois · colocation, abonnement étudiant,
formation courte, paiement en plusieurs fois · « Ton budget, à ta mesure » (devis qui déduit la bourse).
CTA : les bourses → `/bourses/?utm_source=instagram&utm_content=j02` (le devis est à un clic)

**Mer 3 — Post · Métier · infirmier**
Accroche : « Bac+3, et un métier qui recrute partout. »
Infirmier / infirmière : durée, ce qu'on y fait, nombre d'écoles Navigoal qui y préparent.
CTA : fiche métier → `/metiers/met-infirmier/?utm_source=instagram&utm_content=j03`
Visuel : `images/metiers/infirmier.webp`.

**Jeu 4 — Reel · Démarches · visa**
Accroche : « Non, tu n'as pas forcément besoin d'un visa pour le Maroc. »
Selon la nationalité : entrée sans visa, AEVM, e-Visa ou visa consulaire ; puis la carte de séjour dans les 90 jours.
Insister sur « vérifie pour TON pays », sans généraliser.
CTA : guide → `/ressources/visa-carte-de-sejour/?utm_source=instagram&utm_content=j04`

**Ven 5 — Carrousel · Preuve · les labels**
Accroche : « “Reconnu par l'État” et “diplômes homologués”, ce n'est pas la même chose. »
Sur Navigoal : 47 écoles reconnues par l'État, 53 aux diplômes homologués, 3 autorisées (diplômes d'établissement,
non homologués). Expliquer ce que ça change pour une équivalence au retour.
CTA : guide labels → `/ressources/labels-reconnaissance-etat/?utm_source=instagram&utm_content=j05`

**Sam 6 — Post · Métier · témoignage**
Citation exacte de **Nicolas Lombé Nsole**, ingénieur pétrolier chez Total Gabon :
« Nous nous trouvons sur une sorte de petite île flottante et isolée dans l'océan. »
Source affichée sur le visuel, aucune photo de la personne.
CTA : fiche métier → `/metiers/met-ingenieur-petrolier/?utm_source=instagram&utm_content=j06`

---

## Semaine 2 — « Le budget, sans tabou » (8–13 décembre)

**Lun 8 — Reel · Argent · les frais cachés**
Accroche : « La scolarité, ce n'est pas la moitié de la facture. »
Logement, vie quotidienne, installation, voyages, imprévus : les postes que les familles oublient.
CTA : devis détaillé ligne par ligne → `/devis/?utm_source=instagram&utm_content=j08`

**Mar 9 — Carrousel · Preuve · transparence des prix**
Accroche : « 31 écoles sur 103 publient leurs tarifs. On vous dit lesquelles. »
Expliquer : quand l'école publie, on affiche son chiffre ; sinon une fourchette indicative, signalée comme telle.
CTA : `/etablissements/?utm_source=instagram&utm_content=j09`

**Mer 10 — Post · Métier · développeur**
Accroche : « Elle n'aimait pas l'informatique. Elle est développeuse. »
Citation de **Justine**, développeuse web, source affichée.
CTA : `/metiers/met-developpeur-web-mobile/?utm_source=instagram&utm_content=j10`

**Jeu 11 — Reel · Démarches · logement**
Accroche : « Ne paie jamais une caution avant d'avoir vu le contrat. »
Colocation, studio, résidence universitaire : ordres de grandeur et pièges.
CTA : guide logement → `/ressources/logement-etudiant/?utm_source=instagram&utm_content=j11`

**Ven 12 — Carrousel · Argent · bourses**
Accroche : « Trois bourses existent pour toi. Et des dizaines d'écoles en donnent. »
ANBG (État gabonais), bourse de coopération, AMCI (réservée aux établissements publics marocains — le dire clairement,
beaucoup l'ignorent), puis les bourses et réductions annoncées sur leur propre site par 60 écoles privées.
CTA : `/bourses/?utm_source=instagram&utm_content=j12`

**Sam 13 — Post · Preuve · Navi**
Accroche : « Pose ta question à 2 h du matin, tu auras une réponse. »
Navi, l'assistant d'orientation : il cherche dans les 103 écoles et les 96 métiers, pas dans sa mémoire.
CTA : `/?utm_source=instagram&utm_content=j13`

---

## Semaine 3 — « Choisir, pas subir » (15–20 décembre)

**Lun 15 — Reel · Métier · études courtes**
Accroche : « Bac+2, et tu travailles. »
Trois métiers accessibles à Bac+2 avec le nombre d'écoles qui y préparent.
CTA : filtre durée → `/metiers/?utm_source=instagram&utm_content=j15`

**Mar 16 — Carrousel · Démarches · le dossier**
Accroche : « Les 6 pièces à préparer dès maintenant. »
Passeport, relevés des deux dernières années, diplôme ou attestation, photos, CV, lettre de motivation.
CTA : checklist interactive → `/ressources/checklist-candidature/?utm_source=instagram&utm_content=j16`

**Mer 17 — Post · Métier · sage-femme**
Citation de **Massalou Tchonda**, sage-femme à la polyclinique de Tsévié (Togo), source affichée.
CTA : `/metiers/met-sage-femme/?utm_source=instagram&utm_content=j17`

**Jeu 18 — Reel · Argent · transport**
Accroche : « À Rabat, le tram coûte moins qu'un taxi par semaine. »
Abonnements étudiants, tram, bus, train : ce qui est publié et ce qui ne l'est pas (le dire).
CTA : `/ressources/transport-etudiant-maroc/?utm_source=instagram&utm_content=j18`

**Ven 19 — Carrousel · Preuve · les villes**
Accroche : « Casablanca, Rabat, Fès, Marrakech : laquelle est faite pour toi ? »
48 écoles à Casablanca, 16 à Rabat, 8 à Fès, 6 à Marrakech, 6 à Tanger. Coût de la vie, ambiance, distractions —
l'angle qui parle aux parents.
CTA : `/villes/?utm_source=instagram&utm_content=j19`

**Sam 20 — Post · Métier · architecte**
Citation de **Francis Kéré** : « En réalité, c'est le village qui m'a tout donné. » Source affichée.
CTA : `/metiers/met-architecte/?utm_source=instagram&utm_content=j20`

---

## Semaine 4 — « Passe à l'acte » (22–30 décembre)

**Lun 22 — Reel · Démarches · argent sur place**
Accroche : « Comment tes parents t'envoient de l'argent au Maroc, sans y laisser 10 %. »
Transferts depuis la zone CFA, plafonds, portefeuilles mobiles, compte en dirhams convertibles.
CTA : `/ressources/argent-banque-paiement-maroc/?utm_source=instagram&utm_content=j22`

**Mar 23 — Carrousel · Argent · devis d'une famille**
Accroche : « Une année, calculée pour de vrai. »
Un exemple complet : scolarité + logement + vie + un retour au pays, poste par poste, en F CFA.
Préciser « exemple, pas un tarif ».
CTA : `/devis/?utm_source=instagram&utm_content=j23`

**Mer 24 — Post · Preuve · candidatures gratuites**
Accroche : « Candidater sur Navigoal ne coûte rien. Zéro frais de dossier. »
CTA : `/etablissements/?utm_source=instagram&utm_content=j24`

**Jeu 25 — Repos** (Noël).

**Ven 26 — Reel · Métier · test d'orientation**
Accroche : « 10 minutes pour savoir ce qui te correspond. »
Le test donne un profil, des domaines, puis des métiers et les écoles qui y mènent.
CTA : `/orientation/?utm_source=instagram&utm_content=j26`

**Sam 27 — Carrousel · Preuve · parents**
Accroche : « Ce que les parents veulent savoir, en 5 réponses. »
Rôle de garant, sécurité de la ville, coût réel, ce qui est vérifié par l'équipe, à qui parler.
CTA : `/parents/?utm_source=instagram&utm_content=j27`

**Lun 29 — Reel · Argent · comparer**
Accroche : « Deux écoles, même formation, 2 millions d'écart. »
Le comparateur, jusqu'à 4 écoles côte à côte.
CTA : `/comparateur/?utm_source=instagram&utm_content=j29`

**Mar 30 — Post · Preuve · bilan et parrainage**
Accroche : « On a ouvert il y a un mois. Voilà ce que vous avez cherché. »
Les 3 métiers et les 3 villes les plus consultés du mois (chiffres réels tirés de `/admin/audience`).
Annoncer le parrainage : 2 amis inscrits avec ton code = entretien prioritaire avec un conseiller.
CTA : `/espace/?utm_source=instagram&utm_content=j30`

---

## Production — ce qui existe déjà et ce qui reste à faire

| Besoin | État |
|---|---|
| Photos de métiers (96, une par métier, créditées) | ✅ `web/public/images/metiers/` |
| Photos d'écoles, de villes, de résidences | ✅ `assets/photos/` |
| Chiffres (coûts, labels, villes, écoles) | ✅ référentiels, recalés en novembre 2026 |
| Citations de témoignages avec source | ✅ `data/referentiels/temoignages.json` |
| Gabarit visuel Instagram (1080×1350 et 1080×1920) | ❌ à créer — reprendre les couleurs et la typographie du site |
| Voix off ou sous-titres des Reels | ❌ à décider : texte à l'écran suffit pour commencer |

## Mesure

Après deux semaines, `/admin/campagne/` donne les comptes créés par `utm_content`, donc par post. La règle simple :
garder les piliers qui amènent des comptes, pas ceux qui amènent des vues. Un Reel à 10 000 vues et 0 inscription
vaut moins qu'un carrousel à 800 vues et 6 comptes.

---

*Plan rédigé le 20 novembre 2026 à partir des référentiels Navigoal. Les montants en F CFA sont convertis au taux du
20/11/2026 (1 MAD ≈ 60 F CFA) et doivent être revérifiés avant publication.*
