# Sécurité de l'API NEAM — audit et correctifs

Audit de sécurité du code réalisé sur `api/` (revue statique du code, sans attaque du site en ligne).
**Aucune faille critique.** Le code applique déjà les bonnes pratiques. Ce document résume ce qui protège
le site et les durcissements appliqués.

## Déjà solide (vérifié)

- **SSRF** (l'outil télécharge des URL fournies par le visiteur) : `lib/audit/http.php` → `public_target()`
  bloque les IP internes sur **toutes** les IP résolues, épingle l'IP, revalide chaque redirection,
  refuse IP brutes, ports non standard et identifiants dans l'URL.
- **Injection d'en-têtes e-mail** : `clean_line()` retire les retours à la ligne, PHPMailer + Reply-To validé.
- **XSS du chat** : la réponse de l'IA est échappée avant mise en forme ; les boutons passent une liste blanche.
- **Pas de SQL** (fichiers JSON) → pas d'injection SQL.
- **Traversée de dossier** : identifiants d'audit validés par `^[a-f0-9]{24}$`.
- **Secrets** : `config.php`, `mailer.php`, `data/` refusés par `.htaccess`, jamais dans le dépôt.

## Correctifs appliqués

1. **Abus de coût (facturation Google / Anthropic)** — plafonds journaliers globaux, toutes IP confondues,
   en plus de la limite par IP : `config → daily_caps` (`discover`, `site`, `chat`, `mail`).
   Appliqués dans `read_request()` (`mailer.php`), même mécanisme que `places_daily_cap`.
2. **Relais de PDF** — le PDF fourni par le navigateur n'est plus envoyé qu'à **l'équipe** (destinataires de
   confiance), plus jamais vers l'adresse saisie dans le formulaire (`audit.php` étape `mail`, `candidature.php`).
   Le visiteur garde son PDF : il l'a téléchargé depuis la page.
3. **Dossier de données déplaçable hors racine web** — `config → data_dir` (voir action manuelle ci-dessous).
4. **En-têtes** — `Content-Security-Policy` (object-src none, base-uri, frame-ancestors, form-action,
   upgrade-insecure-requests), HSTS complété par `includeSubDomains` (`.htaccess` racine).

## Action manuelle recommandée (sur le serveur, après mise en ligne)

- **Déplacer `data_dir` hors de `public_html`** : dans `api/config.php`, régler
  `'data_dir' => '/home/VOTRECOMPTE/neam-data'` (un dossier **au-dessus** de la racine web), puis le créer et
  lui donner les droits d'écriture. Ainsi, même si `.htaccess` était un jour ignoré, les coordonnées des
  prospects resteraient inaccessibles depuis le web. Les audits déjà présents dans `api/data/audits/` peuvent
  être déplacés dans le nouveau dossier.
- **Surveiller la dépense** des API Google et Anthropic, et relever les `daily_caps` si le trafic légitime grandit.

## Limite connue (non bloquante)

- Une restriction `script-src` complète (meilleure protection anti-XSS) demanderait de sortir les scripts en
  ligne des pages HTML dans des fichiers `.js`. Non fait ici pour ne rien casser ; à envisager plus tard.
- Le contrôle d'origine est sauté quand la requête n'envoie ni `Origin` ni `Referer` (script direct) :
  acceptable pour une API publique, l'abus est couvert par les limites par IP et les plafonds journaliers.
