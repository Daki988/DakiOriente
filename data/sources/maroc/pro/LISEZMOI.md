# Écoles professionnelles privées du Maroc — relevés des sites officiels

Relevé du texte des sites officiels (novembre 2026), base vérifiable pour le futur référentiel
`etablissements_professionnels_ma.json` : chaque information retenue doit figurer mot pour mot dans
ces fichiers, avec l'adresse de la page.

Généré par : `python3 scripts/crawl_sites.py` (adapté à une liste d'URL, voir l'historique de session).

Ce qui ressort de ces relevés (novembre 2026) :

- Les neuf écoles joignables se déclarent toutes « accréditées par l'État » ou « reconnues par l'État » ;
  **aucune ne publie son numéro d'arrêté ni sa décision d'accréditation**. L'accréditation est donc
  *annoncée par l'école*, pas vérifiée sur une liste officielle (voir aussi : aucun répertoire public
  récent des EFPP accrédités, cf. CLAUDE.md § Coûts de scolarité et la recherche de novembre 2026).
- Beaucoup vendent, à côté du diplôme d'État (technicien, technicien spécialisé), des titres
  **étrangers ou privés** : licence CNAM (IFIAG), titres FEDE (MIAGE, IPIAB), « bachelor » et « MBA »
  maison. Ces titres ne sont pas des diplômes marocains et n'ont pas d'équivalence automatique :
  la fiche Navigoal doit séparer clairement les deux.
- Les frais de scolarité ne sont presque jamais publiés (seul IPIAB affiche un montant).

| Fichier | École | Villes citées | Site |
|---|---|---|---|
| ifiag.txt | IFIAG — École de formation professionnelle (depuis 1986) | Casablanca, Rabat | ifiag.ma |
| miage.txt | Groupe MIAGE | Kénitra, Casablanca, Tanger | groupemiage.net |
| omnia.txt | OMNIA School (OSBT) | Casablanca | osbt.ma |
| ipiab.txt | IPIAB | Kénitra, Rabat | ipiabkenitra.ma |
| ietp.txt | IETP (depuis 1999) | Kénitra | ietpgroupe.ma |
| ecga.txt | ECGA — commerce et gestion administrative | (non précisées) | ecga.ma |
| ordiciel.txt | Ordiciel | Rabat | ordiciel.ma |
| digitis.txt | Digitis School | Casablanca | digitisschool.ma |
| ts-ma.txt | Technicien-specialise.ma | Casablanca | technicien-specialise.ma |

Sites non joignables lors du relevé : efet.ma, pigier.ma, isgi.ma, esig.ma, itusp.ma, centre-arraid.com, ecostig.com.
