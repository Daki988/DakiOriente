# Liens de suivi — test de publicité TikTok (décembre 2026)

Établi le 22 novembre 2026, avant le lancement de « Trouve ta voie » le 1er décembre.

## Les deux liens

Un par groupe d'annonces. **À copier tels quels**, sans rien y ajouter.

**Groupe « parents », 25-45 ans, Gabon**

```
https://navigoal.net/parents/?utm_source=tiktok_parents&utm_medium=cpc&utm_campaign=trouve-ta-voie
```

**Groupe « jeunes », 18-24 ans, Gabon**

```
https://navigoal.net/trouve-ta-voie/?utm_source=tiktok_jeunes&utm_medium=cpc&utm_campaign=trouve-ta-voie
```

Les deux pages répondent en 200 et portent un bouton d'inscription (`/parents/` mène à
`/inscription?profil=parent`).

## Pourquoi deux `utm_source` différents, et pas un `utm_content`

C'est le point à ne pas rater. Navigoal mesure la provenance de **deux** façons, qui n'enregistrent pas la
même chose :

| Mesure | Ce qu'elle lit | Cookie ? |
|---|---|---|
| `ng_acq` (`AcquisitionTracker`) | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `?ref=` | **oui**, et seulement si le visiteur **accepte** les cookies |
| Audience interne (`Audience` → `/api/vu`) | `utm_source` **seulement**, plus le référent | non, et respecte « Ne pas suivre » |

Conséquence : un visiteur qui refuse les cookies n'est pas rattaché à son inscription par `ng_acq`. Seule
l'audience interne le compte — et elle ne connaît que `utm_source`. Si les deux groupes partageaient une même
source distinguée par `utm_content`, on perdrait la distinction pour tous ceux qui refusent, c'est-à-dire une
part inconnue mais sûrement importante du trafic payé.

En mettant la distinction dans `utm_source`, les deux mesures savent séparer les groupes.

## Lire les résultats

- **Comptes créés par source** : `/admin/campagne/`, export CSV. C'est le chiffre qui décide.
- **Arrivées (sans cookie)** : `/admin/audience`, colonne de provenance. Toujours supérieur aux comptes :
  l'écart entre les deux, c'est le taux de transformation.

Le coût par compte se calcule à la main : budget dépensé dans TikTok ÷ comptes de la source correspondante.

**Avertissement sur les chiffres** : le nombre de comptes attribués par `ng_acq` est un **minimum**, jamais un
total. Les refus de cookies ne sont pas comptés. Ne conclus pas « la publicité n'a rien donné » sur ce seul
tableau sans regarder d'abord les arrivées dans `/admin/audience`.

## Règle de décision, au bout de 7 jours

| Coût par compte créé | Décision |
|---|---|
| moins de 2 000 F CFA | excellent, augmenter le budget |
| 2 000 à 5 000 F | correct, garder le groupe qui gagne et couper l'autre |
| plus de 5 000 F | arrêter : les lycées et les créateurs coûteront moins cher |

Pour comparaison : le plus petit format du journal L'Union (10 × 2 colonnes) coûte 214 200 F TTC, une pleine
page en couleur 2 156 200 F, et ni l'un ni l'autre ne se mesure.

## Ce qui a été réglé avant le test

- **Essai de Navi porté de 4 à 15 messages** (`NAVI_ESSAI_VISITEUR`, 22/11/2026). Un visiteur venu d'une
  annonce est payé au clic : le couper au quatrième message gâchait ce clic. À revoir sur les chiffres de
  décembre (`npm run navi-stats`).

## Ce qui reste à surveiller pendant le test

- **Anubis**, le contrôle anti-robots de l'hébergeur, montre une page « Vérification en cours » d'environ une
  seconde à la première visite, puis le bandeau cookies s'affiche. Deux obstacles avant la page, sur un
  trafic payé au clic. À mesurer si le taux de transformation est anormalement bas.
