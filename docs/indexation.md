# Se faire indexer — état réel et plan

Relevé du 22 novembre 2026. **La note du 19 novembre (« navigoal.net absent des index ») est périmée.**

## Ce que j'ai vérifié aujourd'hui

| Contrôle | Résultat |
|---|---|
| Pages présentes dans un index de recherche | **Oui** — une recherche sur « navigoal » renvoie l'accueil, `/pourquoi/`, `/actualites/`, `/formations/`, `/metiers/`, `/pays/`, le comparateur et des fiches formation, avec leurs vrais titres et descriptions |
| Pages récentes (guide transport, publié le 20/11) | **Pas encore** — l'indexation a du retard sur les publications |
| `robots.txt` | correct : Google, Bing et les robots de recherche des IA autorisés ; robots d'entraînement refusés ; `Sitemap:` déclaré |
| `sitemap.xml` | 200, 58 Ko, **335 adresses** (103 écoles, 96 métiers, 49 formations, 17 villes, 14 résidences, 11 guides…) |
| Adresses du sitemap qui répondent | **40 tirées au hasard, 40 en code 200**, aucune morte |
| Balises d'indexation | `index, follow` et canonique propre sur les pages contrôlées |
| Filtre anti-robots de l'hébergeur | fonctionne : un faux Googlebot est refusé par LWS avant même notre application (« identifying as from a known bot but is not received from the correct network ») |

**Conclusion : il n'y a pas de blocage technique.** Le site est découvert, mais lentement, et les nouvelles pages
mettent du temps à suivre. C'est le comportement normal d'un domaine récent **sans aucun lien entrant**.

## Ce que je ne peux pas faire, et qui pèse le plus

Ces deux actions demandent un accès que je n'ai pas. Elles valent plus que tout le reste réuni.

1. **Google Search Console** — https://search.google.com/search-console
   - Ajouter la propriété `navigoal.net` (validation par enregistrement DNS chez le registraire, ou par le
     fichier HTML à déposer dans `web/public/`, que je peux préparer).
   - Menu **Sitemaps** → envoyer `sitemap.xml`.
   - Menu **Inspection de l'URL** → tester `https://navigoal.net/`, puis `/etablissements/` et
     `/ressources/visa-carte-de-sejour/` → **« Demander une indexation »** pour chacune.
   - Cet écran dira aussi, noir sur blanc, si Googlebot est bloqué par l'hébergeur — c'est le seul moyen fiable
     de le savoir, puisque depuis l'extérieur on ne peut pas se faire passer pour Google.
2. **Bing Webmaster Tools** — https://www.bing.com/webmasters (le fichier `BingSiteAuth.xml` est déjà en place).
   Bing alimente aussi la recherche de ChatGPT. IndexNow lui signale déjà chaque mise en ligne.

## Des liens entrants : le vrai manque

Le site n'a, à ma connaissance, **aucun lien entrant**. C'est ce qui explique la lenteur : Google n'a aucune
raison de passer souvent. Par ordre de facilité, avec ce qu'on possède déjà :

1. **Les profils sociaux** : lien dans la bio TikTok (compte Business, gratuit et immédiat) et Instagram.
2. **Les écoles** : 103 établissements ont une fiche chez nous. Celles qui deviennent partenaires peuvent
   ajouter un lien « Retrouvez-nous sur Navigoal ». C'est aussi un argument commercial.
3. **Le roll-up et les supports imprimés** : ils portent déjà un QR `utm_source=rollup` — sans effet sur le
   référencement, mais ils amènent du trafic direct, que Google observe.
4. **La presse gabonaise** : OAPS Consulting Group est une société réelle (RCCM GA-LBV-01-2021-B13-00360). Un
   article sur le lancement de la campagne vaut plus, pour le référencement comme pour la crédibilité, que des
   semaines de publications.
5. **Les annuaires d'orientation et les associations d'étudiants** gabonais au Maroc.

**À ne pas faire** : acheter des liens. C'est détecté, sanctionné, et irréversible pour un domaine neuf.

## Ce qui est déjà en place et qu'il ne faut pas casser

- IndexNow signale toutes les pages du plan du site à chaque mise en ligne (étape de `deploiement.yml`).
- Les titres reprennent des recherches réelles relevées dans les suggestions Google (« frais de scolarité »,
  « écoles privées, prix »…).
- JSON-LD `Organization`, `WebSite`, `BreadcrumbList`, `Course` ; chaque page déclare sa propre canonique.
- `audit-publication.mjs` contrôle en continu titres, descriptions, canoniques, h1, liens cassés.
- La limitation anti-aspiration posée le 22/11 **exclut explicitement les robots admis** (Google, Bing, IA) :
  elle ne gêne pas l'indexation. À vérifier si on durcit un jour les seuils.

## Mesure

Dans un mois, la question n'est pas « combien de pages indexées » mais **« combien de visites venues de la
recherche »**, visible dans `/admin/audience` (provenance d'arrivée) et dans Search Console. Un site indexé qui
n'amène personne ne vaut pas mieux qu'un site absent.
