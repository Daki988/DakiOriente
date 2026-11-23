# Collaboration Trésor Joce (@tresorjoce1) — lien de suivi et brief

Préparé le 23 novembre 2026, pour la campagne « Trouve ta voie » (1er décembre 2026 – 28 février 2027).

## 1. Le lien de suivi

### Comment fonctionne le parrainage chez nous (à lire avant)

Un code `?ref=` **n'est pas un code libre** : il doit correspondre au code de parrainage d'un compte Navigoal
existant (`users.referral_code`, créé à la première demande, de la forme `TRES-7K3Q`). Il n'est donc pas
possible d'inventer un code à l'avance : il faut un compte.

**Deux étapes, cinq minutes :**

1. **Trésor Joce crée un compte** sur https://navigoal.net/inscription/ — avec son vrai nom et une adresse
   e-mail à lui. C'est préférable à un compte créé par nous en son nom : il doit pouvoir vérifier ses propres
   chiffres, et il devrait de toute façon avoir vu la plateforme avant d'en parler.
2. Son code apparaît dans son espace, encart « Parraine tes amis ». Il te le communique, ou il t'envoie
   directement le lien complet qui s'y affiche.

### Le lien à lui donner

Remplace `TRES-XXXX` par son code réel :

```
https://navigoal.net/inscription/?utm_source=tresorjoce&utm_medium=createur&utm_campaign=trouve-ta-voie&ref=TRES-XXXX
```

**Pourquoi les deux paramètres à la fois**, alors qu'un seul suffirait en apparence :

| Paramètre | Ce qu'il sert à faire | Limite |
|---|---|---|
| `ref=TRES-XXXX` | rattache chaque inscrit à son compte ; il voit lui-même son compteur dans son espace | posé seulement si le visiteur **accepte** les cookies |
| `utm_source=tresorjoce` | apparaît dans `/admin/campagne/` et, surtout, dans la mesure d'audience **sans cookie** | ne rattache pas l'inscrit à son compte |

Autrement dit : `ref` sert à le payer et à lui donner confiance, `utm_source` sert à ne pas sous-compter.
Le libellé « TikTok — Trésor Joce » a été ajouté aux sources connues : la ligne s'affichera en clair dans le
back-office.

**Un détail du code à connaître** : quand un `ref` est présent, la source enregistrée à l'inscription devient
`parrain` et non `tresorjoce`. L'attribution reste exacte (par le code), mais ne cherche pas la ligne
« Trésor Joce » parmi les inscriptions parrainées — regarde le champ `ref`, et la ligne `tresorjoce` dans
l'audience.

### Où lire les résultats

- **Comptes rattachés** : `/admin/campagne/`, export CSV (et lui, de son côté, voit son compteur de filleuls).
- **Arrivées, y compris refus de cookies** : `/admin/audience`, provenance `TikTok — Trésor Joce`.
- Le premier chiffre est un **minimum**. L'écart entre les deux, c'est le taux de transformation.

> Note : à 2 filleuls, notre système envoie automatiquement une notification « Entretien prioritaire
> débloqué ». C'est prévu pour un élève qui parraine ses camarades, pas pour un partenaire. Sans gravité,
> mais ne sois pas surpris, et préviens-le que ce message ne le concerne pas.

## 2. Le brief de la vidéo

### Le sujet imposé

**« Combien coûte VRAIMENT une année d'études au Maroc. »**

Pas une présentation de Navigoal. Le sujet, c'est le prix — et Navigoal est la source qui le donne.

Pourquoi ce sujet et pas un autre : son personnage est de dire ce que les autres taisent. Les agences de
placement ne publient jamais leurs prix, et sur les 103 écoles privées marocaines que nous référençons,
**72 ne publient pas leurs tarifs**. Nous publions ceux des 31 qui le font, avec les sources et les dates.
Dans sa bouche, ce n'est pas une publicité : c'est son format habituel.

### Les chiffres à donner (exacts, relevés le 22 novembre 2026)

- **103** écoles privées marocaines référencées, **31** publient leurs tarifs, **72** ne les publient pas.
- La moitié de celles qui publient demandent **moins de 45 000 MAD par an**.
- Le tarif d'entrée le plus bas relevé : **16 000 MAD par an** (une école d'ingénieurs).
- Les frais d'inscription, de dossier et d'assurance s'ajoutent, et presque personne ne les publie.

Il peut convertir en F CFA à l'antenne s'il veut, mais **qu'il ne cite aucun chiffre qui ne soit pas dans
cette liste.** Un chiffre faux dans sa bouche devient notre problème.

### Déroulé proposé (45 à 60 secondes)

1. **L'accroche (0-5 s)** — « On te dit qu'étudier au Maroc, c'est pour les fils de riches. Je suis allé
   vérifier. »
2. **Le problème (5-20 s)** — Sur 103 écoles privées au Maroc, 72 ne publient même pas leurs prix. Il faut
   appeler, demander, attendre. C'est fait exprès.
3. **La révélation (20-40 s)** — Les 31 qui publient : la moitié sont sous 45 000 dirhams l'an, la moins
   chère à 16 000. Et attention, les frais d'inscription s'ajoutent — ça, personne ne te le dit.
4. **La source (40-50 s)** — Tout est sur Navigoal, une plateforme gabonaise. Gratuit, écoles vérifiées,
   accréditations à jour.
5. **L'appel à l'action (50-60 s)** — « Lien en bio. Crée ton compte, c'est gratuit. »

### Les règles non négociables

- **Le lien en bio pendant 7 jours minimum**, et la vidéo reste en ligne (pas de retrait au bout d'une
  semaine).
- **Mention de partenariat** : la vidéo doit indiquer qu'il s'agit d'une collaboration commerciale. C'est la
  règle de TikTok, et c'est ce qui protège sa crédibilité — donc la nôtre.
- **Aucune promesse d'admission, de bourse ou de visa.** Nous ne garantissons rien de tout cela, et une
  promesse de ce type nous exposerait.
- **Pas de ton politique dans cette vidéo.** Notre public, ce sont des mineurs et leurs parents, et nous
  démarchons des écoles.
- **Aucun chiffre inventé.** Ceux ci-dessus, pas d'autres.

### Ce qu'on lui fournit

- Le lien de suivi complet.
- Les chiffres ci-dessus, et la page `/ressources/frais-scolarite-ecoles-privees-maroc/` où ils sont tous
  détaillés par type d'école, avec les sources.
- Le logo Navigoal, si besoin (`web/public/brand/`).

## 3. L'accord proposé

**Sa demande : 100 000 F CFA.** Contre-proposition :

> **50 000 F à la publication, plus 1 000 F par compte créé via son lien, plafonné à 150 000 F.**

Il gagne jusqu'à 50 % de plus que ce qu'il demande si sa vidéo marche, et nous ne payons la portée que si
elle existe. Le plafond le rassure sur le fait qu'on ne cherche pas à profiter de lui.

**Avant de signer, deux questions à lui poser :**

1. **Combien de vues a fait sa vidéo de partenariat crypto, comparée à ses vidéos habituelles ?** Observation
   publique : cette vidéo a 370 « j'aime », contre 11 000 à 11 500 sur ses vidéos ordinaires — environ 3 % de
   sa portée. Ce n'est qu'une observation, elle peut s'expliquer autrement, mais c'est le risque central :
   payer la portée organique et recevoir la portée sponsorisée.
2. **Les statistiques de ses trois dernières vidéos : vues, pas « j'aime ».** Un créateur de 75 000 abonnés
   qui ne sait pas montrer ses vues ne les a pas.

**Facture obligatoire**, au nom d'OAPS Consulting Group (RCCM GA-LBV-01-2021-B13-00360). Sans facture, la
dépense n'existe pas comptablement et ne pourra pas être comparée aux autres canaux.

## 4. Le seuil de décision

Rappel de la règle fixée pour tous les canaux payants :

| Coût par compte créé | Décision |
|---|---|
| moins de 2 000 F CFA | excellent, on recommence avec lui |
| 2 000 à 5 000 F | correct |
| plus de 5 000 F | on arrête ce canal |

À 100 000 F, il faut **20 comptes** pour rester dans l'acceptable et **50** pour que ce soit un bon
investissement. Avec la contre-proposition à 50 000 F de base, le seuil tombe à 10 comptes : c'est aussi pour
ça qu'elle est préférable.

Pour comparaison : le plus petit encart du journal L'Union coûte 214 200 F et ne se mesure pas.
