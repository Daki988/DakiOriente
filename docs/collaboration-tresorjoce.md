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

## 3. L'accord — révisé le 23/11/2026

**Ce qu'il a dit** : 150 000 F CFA en temps normal, 100 000 F « au vu de notre relation ».

**Décision : accepter les 100 000 F, et négocier le périmètre, pas le prix.**

Pourquoi la contre-proposition initiale (50 000 F + 1 000 F par compte, plafond 150 000 F) est abandonnée :

1. Elle revenait à demander une **seconde remise** après celle qu'il venait de consentir. Face à un prix
   d'ami, c'est le geste qui fait qu'on ne te rappelle pas.
2. **Le plafond était arithmétiquement décoratif** : à 1 000 F par compte, il fallait 100 comptes créés pour
   l'atteindre, alors que l'objectif de toute la campagne, sur trois mois et tous canaux confondus, est de
   200. Un interlocuteur attentif l'aurait vu immédiatement.

Le « 150 000 F minimum » n'est pas vérifiable, et c'est ce qui en fait un bon ancrage : impossible à
contredire, et le refuser revient à paraître ingrat. La réponse n'est donc pas de discuter le chiffre, mais
de le rendre sans objet en discutant ce qu'il recouvre.

**Ce que les 100 000 F doivent comprendre** (rien de tout cela ne lui demande de travail supplémentaire) :
lien en bio 14 jours au lieu de 7, vidéo qui reste en ligne, un rappel quelques jours après, et le droit de
reprendre la vidéo sur nos comptes et sur le site en le créditant.

**Les deux questions sur ses vues restent à poser**, mais elles ne sont plus une condition de prix : une
fois le tarif accepté, elles deviennent une question de calage entre partenaires, et elles passent mieux.

**Facture obligatoire**, au nom d'OAPS Consulting Group (RCCM GA-LBV-01-2021-B13-00360).

## 4. Le seuil de décision

Rappel de la règle fixée pour tous les canaux payants :

| Coût par compte créé | Décision |
|---|---|
| moins de 2 000 F CFA | excellent, on recommence avec lui |
| 2 000 à 5 000 F | correct |
| plus de 5 000 F | on arrête ce canal |

À 100 000 F, **20 comptes créés = 5 000 F par compte**, soit exactement le seuil d'acceptabilité ; 50 comptes
en feraient une très bonne opération. La vraie question n'est donc pas « 100 000 F, est-ce trop ? » mais
« est-ce que je crois à 20 comptes ? ». Au vu de son engagement (11 000 « j'aime » par vidéo), c'est
plausible.

Et si la première vidéo donne moins de 20 comptes, la décision sur la suivante se prend sur les chiffres,
sans avoir à rediscuter son tarif.

Pour comparaison : le plus petit encart du journal L'Union coûte 214 200 F et ne se mesure pas.
