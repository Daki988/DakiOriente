# Tutoriel pas à pas — Lancer la campagne « Opération 10 PME » sur Meta (Facebook + Instagram)

Objectif : faire tourner les annonces pendant 14 jours pour remplir les 10 places de l'essai gratuit,
en envoyant les gens vers `www.neamindustry.com/offre-essai.html` et vers WhatsApp.
Budget prévu : 50 000 à 100 000 FCFA (exemple ici : 75 000 FCFA).

Tout se fait depuis un ordinateur, dans **Gestionnaire de publicités Meta** (adsmanager.facebook.com).
Comptez 30 à 45 min la première fois.

---

## Étape 0 — Ce qu'il faut avoir avant de commencer

1. **La Page Facebook de NEAM** (pas un profil personnel). Vous devez en être administrateur.
2. **Le compte Instagram de NEAM** en compte **professionnel**, relié à la Page Facebook
   (dans Instagram : Paramètres → Professionnel ; puis Meta Business Suite → Paramètres → Comptes).
3. **Un compte professionnel Meta (Business Manager)** : business.facebook.com → créer l'entreprise
   « NEAM Softwares Industry » si ce n'est pas déjà fait.
4. **Un compte publicitaire** avec un **moyen de paiement**. Au Gabon, Meta accepte surtout la
   **carte bancaire Visa/Mastercard** (y compris cartes prépayées/virtuelles type carte en devises).
   Meta Ads ne se paie pas directement en Mobile Money : prévoyez une carte.
5. **La page en ligne** : `offre-essai.html` doit être accessible sur le site (voir la note de mise en ligne).
6. **Les 6 visuels** (dossier `campagne/essai-pme/`) et **les textes** (fichier `KIT-CAMPAGNE.md`) sous la main.

> Astuce : vérifiez d'abord que `www.neamindustry.com/offre-essai.html` s'ouvre bien sur votre téléphone
> et que le formulaire envoie un message. Si la page n'est pas encore en ligne, lancez d'abord la mise en ligne.

---

## Étape 1 — Ouvrir le Gestionnaire de publicités

1. Allez sur **adsmanager.facebook.com** (ou Meta Business Suite → menu → Gestionnaire de publicités).
2. Vérifiez en haut à gauche que le bon **compte publicitaire** (celui de NEAM) est sélectionné.
3. Cliquez sur le bouton vert **+ Créer**.

---

## Étape 2 — La campagne (le niveau du haut)

1. **Objectif :** choisissez **Trafic** (« Trafic » = envoyer un maximum de gens vers la page).
   *Variante possible : « Prospects » si vous préférez un formulaire intégré à Facebook, mais ici on
   utilise notre propre page, donc Trafic est le plus simple et le moins cher pour démarrer.*
2. **Nom de la campagne :** `Opération 10 PME — Essai 2 sem`.
3. **Catégories de publicités spéciales :** laissez **vide** (on n'est pas dans crédit/emploi/logement/politique).
4. **Budget de campagne (Advantage) :** vous pouvez le laisser **désactivé** pour garder la main
   ensemble par ensemble (on règle le budget à l'étape suivante). Cliquez **Suivant**.

---

## Étape 3 — Premier ensemble de publicités : « Trafic → Page »

1. **Nom de l'ensemble :** `Trafic - Page offre`.
2. **Destination de la conversion :** **Site web**.
3. **Budget et calendrier :**
   - Budget **quotidien** : **3 500 FCFA**.
   - Date de début : aujourd'hui (ou demain matin). Date de fin : **+14 jours**.
4. **Audience (ciblage) :**
   - **Lieu :** Libreville. Cliquez sur « Libreville », puis élargissez le rayon à **+25 km**
     (inclut Akanda et Owendo). *Astuce : vérifiez que le mode est « Personnes vivant à cet endroit ».*
   - **Âge :** 25 – 55 ans.
   - **Langue :** Français.
   - **Centres d'intérêt (détaillé) :** essayez d'ajouter *Petites entreprises*, *Entrepreneuriat*,
     *Marketing numérique*, *Administrateurs de Page Facebook*. Si Meta en propose peu au Gabon,
     **laissez large** (pas d'intérêt du tout) : les visuels et le texte feront le tri.
5. **Placements :** laissez **Placements Advantage (automatiques)**. C'est pour ça qu'on a fait
   un format carré ET un format story.
6. Cliquez **Suivant**.

---

## Étape 4 — La publicité (on va en créer 3 : A, B, C)

Pour la première publicité :
1. **Nom :** `Pub A - 0 FCFA`.
2. **Identité :** sélectionnez la **Page Facebook NEAM** et le **compte Instagram NEAM**.
3. **Configuration :** **Créer une publicité** → format **Image unique**.
4. **Contenu multimédia :**
   - Cliquez **Ajouter un média → Ajouter une image**, importez **`NEAM_essai_A-sq.png`** (le carré).
   - Dans la section des placements/recadrage, pour les **Stories/Reels**, remplacez l'image par la
     version verticale **`NEAM_essai_A-st.png`** (bouton « Modifier par placement » / « Remplacer »).
5. **Texte principal :** copiez-collez le **Texte principal de la Variante A** (fichier `KIT-CAMPAGNE.md`).
6. **Titre :** `10 PME · 2 semaines · 0 FCFA`.
7. **Description :** `Essai gratuit, sans engagement — Libreville`.
8. **Destination :**
   - **Site web** → URL :
     `https://www.neamindustry.com/offre-essai.html?utm_source=meta&utm_medium=cpc&utm_campaign=essai10pme&utm_content=varianteA`
   - **Appel à l'action (bouton) :** **En savoir plus**.
9. Vérifiez l'aperçu à droite (fil, stories). Si tout est bon, **ne publiez pas encore** :
   dupliquez pour créer B et C.

### Dupliquer pour B et C
- En bas, **Publier** fera partir la pub A. Pour ajouter B et C **dans le même ensemble** :
  après publication, dans le tableau, sélectionnez la pub A → **Dupliquer** → même ensemble.
  - Pub **B** : images `NEAM_essai_B-sq.png` / `B-st.png`, texte **Variante B**, titre
    `Testez NEAM 2 semaines, gratuitement`, `utm_content=varianteB`.
  - Pub **C** : images `NEAM_essai_C-sq.png` / `C-st.png`, texte **Variante C**, titre
    `Votre présence en ligne, boostée en 2 semaines`, `utm_content=varianteC`.

---

## Étape 5 — Deuxième ensemble : « Messages → WhatsApp » (optionnel mais conseillé)

Pour capter ceux qui préfèrent discuter tout de suite :
1. Revenez au niveau **Campagne** → sélectionnez votre campagne → **Créer un ensemble de publicités**
   (ou créez une 2e campagne avec l'objectif **Interactions/Messages**).
2. **Objectif/Destination :** **WhatsApp**. Reliez le numéro **+241 077 45 31 67**
   (le numéro doit être un compte **WhatsApp Business** relié à la Page).
3. **Budget quotidien :** **2 000 FCFA**. Même ciblage qu'à l'étape 3.
4. **Publicité :** reprenez le visuel **A** ou **C**, texte court, bouton **Envoyer un message**.
   Préparez le message de bienvenue automatique (voir `KIT-CAMPAGNE.md` § 6).

---

## Étape 6 — Vérifier et publier

1. Relisez : budget total prévu ≈ **(3 500 + 2 000) × 14 = 77 000 FCFA** sur 2 semaines. Ajustez si besoin.
2. Vérifiez que **chaque** pub a bien le carré **et** la story, le bon texte et le bon lien UTM.
3. Cliquez **Publier**. Les pubs passent « En cours d'examen » (de quelques minutes à quelques heures).

> Si une pub est **refusée** : souvent à cause d'un mot. Nos textes évitent les promesses exagérées,
> mais si ça arrive, retirez les émojis en trop, évitez « garanti », et redemandez un examen.

---

## Étape 7 — Suivre, tous les jours (5 min)

- Regardez, par publicité : **Coût par résultat** (par clic/visite) et le **nombre de clics**.
- Comptez les **vraies inscriptions** : e-mails reçus (sujet « Essai 2 semaines — Opération 10 PME »)
  + messages WhatsApp. C'est ça le vrai résultat, pas seulement les clics.
- **Après 3–4 jours :** mettez en pause la ou les variantes qui coûtent le plus cher par clic,
  et laissez le budget sur la meilleure.
- **À 10 inscrits confirmés :** mettez la campagne en pause (ou gardez-la pour une liste d'attente).

---

## Rappels utiles (contexte Gabon)

- **Paiement :** carte Visa/Mastercard obligatoire ; prévoyez une petite limite dépassant 77 000 FCFA.
- **Ciblage par intérêt limité :** normal au Gabon. Un ciblage « Libreville + âge + français » large
  fonctionne très bien quand la créa est claire, comme ici.
- **Formats :** on a fourni carré (fil) + vertical (stories/reels) exprès — importez toujours les deux.
- **Ne rien promettre de faux :** l'offre est vraie (gratuite, sans engagement, 10 places). On n'invente
  aucun chiffre de résultat.
