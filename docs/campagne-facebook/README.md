# Campagne Facebook & Instagram — « Les essentiels »

Objectif : faire connaître Secret by N. à Libreville et générer des commandes, **sans violer les règles publicitaires de Meta ni la loi gabonaise**.

## 1. Le cadre, en deux phrases

- **Meta** interdit toute publicité pour les jouets sexuels, les « produits érotiques » et tout message centré sur le plaisir. Il autorise, avec un public de **18 ans et plus**, les préservatifs, les lubrifiants et l'éducation à la santé sexuelle, **si le message parle de santé** (règle « Health and Wellness – Adult Products and Reproductive Health »). Meta vérifie aussi la page d'arrivée.
- **Au Gabon**, une publicité sur Facebook est une communication publique : l'article 313 du Code pénal interdit les images ou messages « contraires aux bonnes mœurs ». La loi n° 025/2021 impose une publicité identifiable (Meta affiche « Sponsorisé »), des prix TTC et interdit la prospection sans consentement.

**Conséquence** : la campagne vend **la protection, le confort et la discrétion**, jamais les jouets. Elle renvoie vers `essentiels.html`, une page qui ne montre que des préservatifs, du lubrifiant, des bougies et des diffuseurs. Les clients découvrent le reste de la boutique par eux-mêmes.

## 2. Réglages de la campagne (Gestionnaire de publicités)

| Réglage | Valeur |
|---|---|
| Objectif | **Trafic** (optimisation : vues de la page de destination). Pas d'objectif « Ventes » : le site n'utilise volontairement aucun pixel Meta (voir la politique de confidentialité). |
| Catégorie spéciale | Aucune |
| Budget | Test : **5 000 FCFA / jour pendant 14 jours** (≈ 70 000 FCFA), budget de campagne (Advantage) |
| Lieu | **Libreville + 20 km** (inclut Akanda et Owendo), « personnes qui vivent dans ce lieu » |
| Âge | **21 – 55 ans** (Meta impose 18 ans minimum ; 21 ans laisse une marge de sécurité vis-à-vis des mineurs) |
| Genre | Tous |
| Ciblage détaillé | Aucun (laisser Meta optimiser). **Ne jamais** cibler des intérêts liés à la sexualité, à la religion ou à la santé d'une personne. |
| Langue | Français |
| Placements | Manuels : fils Facebook et Instagram, Stories Facebook et Instagram, Reels. **Exclure** Audience Network et Messenger. |
| Calendrier | Diffusion continue ; éviter les jours de fête religieuse. |

### Ensembles de publicités

| Ensemble | Publicités | Lien |
|---|---|---|
| A — Essentiels | 1 Protection, 2 Discrétion, 3 Confort, 5 Ambiance | `essentiels.html` |
| B — Conseil santé | 4 Les 3 réflexes | `essentiels.html#protection` |

Liens à utiliser (le paramètre `utm_source=facebook` permet de reconnaître les commandes dans le back-office) :

```
https://secret-by-n.netlify.app/essentiels.html?utm_source=facebook&utm_campaign=essentiels
https://secret-by-n.netlify.app/essentiels.html?utm_source=facebook&utm_campaign=conseils#protection
```
Pour Instagram, remplacez `facebook` par `instagram`.

## 3. Les publicités

Visuels dans `docs/campagne-facebook/visuels/` (carré 1080 × 1080 pour les fils, 1080 × 1920 pour les Stories, avec les zones protégées respectées).

### 1. Protection — `carre-protection.jpg` / `story-protection.jpg`
- **Texte principal** : Protégez-vous, protégez l'autre. Préservatifs Durex, EXS et INTIMY, livrés à Libreville dans un carton neutre. Vous payez à la réception.
- **Titre** : Préservatifs livrés discrètement
- **Description** : À partir de 3 000 FCFA
- **Bouton** : Acheter

### 2. Discrétion — `carre-discretion.jpg` / `story-discretion.jpg`
- **Texte principal** : Des préservatifs sans passer au comptoir : on commande en deux minutes, on reçoit un carton neutre sans logo, et on paie seulement à la réception.
- **Titre** : Un carton neutre, payé à la livraison
- **Description** : Livraison à Libreville en 24 h
- **Bouton** : En savoir plus

### 3. Confort — `carre-confort.jpg`
- **Texte principal** : Une sécheresse intime, c'est fréquent et ça se règle simplement. Gel à base d'eau INTIMY, compatible avec les préservatifs, livré discrètement à Libreville.
- **Titre** : Gel intime INTIMY — 11 000 FCFA
- **Description** : Payé à la livraison
- **Bouton** : Acheter

### 4. Conseil santé — `carre-conseils.jpg`
- **Texte principal** : Un préservatif bien utilisé protège des IST et des grossesses non désirées. Trois réflexes simples à garder en tête, et des préservatifs livrés discrètement si besoin.
- **Titre** : 3 réflexes qui protègent
- **Description** : Conseils de santé intime
- **Bouton** : En savoir plus

### 5. Ambiance — `carre-ambiance.jpg`
- **Texte principal** : Une soirée calme à la maison, ça se prépare. Bougies et parfums d'intérieur livrés à Libreville, payés à la livraison.
- **Titre** : Bougies et diffuseurs dès 10 500 FCFA
- **Description** : Colis neutre
- **Bouton** : Acheter

## 4. Ce qu'il ne faut jamais mettre dans une publicité

- Une photo de jouet, de lingerie portée, de corps nu ou de couple dans une pose suggestive.
- Les mots : plaisir, orgasme, sexy, hot, coquin, érotique, sensuel, « nuit torride », « pimenter », ni d'émojis à double sens (🍆 🍑 💦 🔥).
- Une promesse de performance (« tenir plus longtemps », « agrandir ») ou de résultat médical.
- Un lien vers la page d'accueil, la fiche d'un jouet ou le Guide (il parle de jouets) : **toujours `essentiels.html`**.
- Une question ou une phrase qui suppose quelque chose de la personne qui lit (« Vous souffrez de… ? », « Votre couple s'ennuie ? ») : Meta l'interdit (règle « Personal attributes »). Parlez du produit ou de faits généraux.
- Un message privé envoyé à quelqu'un qui ne vous a pas écrit (art. 50, loi n° 025/2021).

Une publicité refusée ? Ne la relancez pas telle quelle : plusieurs refus peuvent bloquer le compte publicitaire. Corrigez le texte ou l'image, puis demandez un examen.

## 5. La page Facebook

- **Nom** : Secret by N. — **Catégorie** : « Santé et bien-être » (pas « Boutique pour adultes »).
- **Photo de profil** : le logo (point rose + « secret by N. ») ; **couverture** : le visuel « carton neutre ».
- **Présentation** : « Santé intime et bien-être, livrés discrètement à Libreville. Colis neutre, paiement à la livraison. 18 ans et plus. »
- **Bouton** : « Acheter » → lien `essentiels.html`.
- **Ne pas** activer Facebook Shop / catalogue Meta : les règles commerciales de Meta interdisent les produits pour adultes.
- **Modération** : dans les paramètres de la page, masquer automatiquement les commentaires contenant les mots de la liste ci-dessus et les insultes. Répondre aux questions en privé seulement si la personne a écrit en premier.

### Publications gratuites (2 par semaine)
Préservatif : bien choisir sa taille · Lubrifiant : à base d'eau ou de silicone ? · Comment se passe une livraison · Dépistage : où se faire tester à Libreville · Consentement : ce qu'il faut savoir · Prendre soin de soi après une longue journée (bougies) · Questions fréquentes sur la discrétion · Coulisses : on prépare un colis neutre.

## 6. Mesurer les résultats

- **Dans Meta** : coût par clic sur le lien, vues de la page de destination, taux de clic.
- **Dans le back-office** : chaque commande indique son **origine** (« facebook/essentiels ») ; le tableau de bord compte les commandes venues de Facebook ce mois-ci.
- **Coût par commande** = dépense Meta ÷ commandes venues de Facebook.

Au bout de 7 jours : coupez les publicités dont le taux de clic est inférieur à 0,8 %, et transférez le budget vers les meilleures. Au bout de 14 jours, si le coût par commande reste inférieur à votre marge moyenne, augmentez le budget de 20 % par semaine au maximum.

## 7. Mise en ligne, étape par étape

1. Créez la page Facebook (section 5) et reliez le compte Instagram.
2. Dans business.facebook.com : créez le compte publicitaire en **XAF**, fuseau **Africa/Libreville**, ajoutez un moyen de paiement.
3. Gestionnaire de publicités → Créer → **Trafic** → réglages de la section 2.
4. Ajoutez les publicités de la section 3 avec les visuels et les liens UTM.
5. Publiez, puis vérifiez l'état « Active » (l'examen prend en général moins de 24 h).
6. Avant le lancement, complétez les mentions légales dans le back-office (Réglages) : la page d'arrivée y renvoie, et Meta comme la loi gabonaise exigent que l'annonceur soit identifiable.
