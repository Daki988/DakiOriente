# Panne : aucun e-mail ne part de la plateforme

Constatée le 27 novembre 2026 (« les nouveaux utilisateurs ne reçoivent pas de mail »), diagnostiquée le
même jour.

## Cause

```
SMTP : REFUSE — Invalid login: 535 Incorrect authentication data
```

Le serveur `mail.navigoal.net:465` répond et le port est joignable, mais **le mot de passe de la boîte est
refusé**. `sendEmail` (`web/src/server/lib/messaging-channels.ts`) attrape l'erreur et se contente d'un
`console.error` : la panne est donc totalement silencieuse côté utilisateur comme côté back-office.

`SMTP_USER` fait 20 caractères, soit exactement `contact@navigoal.net` : l'identifiant est bon, seul le mot
de passe (23 caractères) ne l'est plus. Très probablement changé dans cPanel sans report dans le `.env`.

## Portée

**Tous** les envois sont concernés, pas seulement l'e-mail de bienvenue : codes de vérification à 6
chiffres, notifications de candidature, rappels de rendez-vous et d'échéances de scolarité, invitations aux
parents, identifiants des établissements, alertes `ALERTE_EMAIL`.

## Réparation

1. cPanel → Comptes de messagerie → `contact@navigoal.net` → Gérer → nouveau mot de passe (éviter `"` `'`
   `$` et `\`, qui cassent la lecture du `.env`).
2. Gestionnaire de fichiers → `navigoal/.env` (afficher les fichiers cachés) → remplacer `SMTP_PASS`.
   Ne pas toucher à `SMTP_USER`.
3. Setup Node.js App → Restart.
4. GitHub → Actions → **Diagnostic** → Run workflow : doit afficher « SMTP : connexion et mot de passe
   ACCEPTES ».
5. Créer un compte de test avec une adresse Gmail et vérifier la réception, indésirables compris.

## Ce qui a été corrigé le 27/11/2026 : le silence

Le mot de passe se change dans cPanel (étapes ci-dessus) ; ce qui relevait du code, c'est que la panne
soit passée inaperçue. Désormais :

- `sendEmail` tient un état (envoyés, échecs, dernier message d'erreur) — `etatEmail()` dans
  `web/src/server/lib/messaging-channels.ts` ;
- **au démarrage de l'application**, `verifierEmail()` ouvre une session SMTP sans envoyer d'e-mail ; si
  les identifiants sont refusés, la ligne « E-MAIL HORS SERVICE » apparaît dans le journal ;
- **`/api/sante`** renvoie `email: "ok" | "en échec" | "non configuré"` (état grossier : la page est
  publique, le détail reste dans le workflow « Diagnostic ») ;
- **chaque mise en ligne** lit cet état et affiche un avertissement visible dans le récapitulatif GitHub
  quand les e-mails ne partent plus.

## Ce que le diagnostic sait faire maintenant

`.github/workflows/diagnostic.yml` (lecture seule, lancement manuel) affiche :

- les **noms** des variables du `.env` du serveur et la **longueur** de leur valeur — jamais les valeurs ;
- la présence des cinq variables SMTP et l'ouverture du port ;
- le résultat réel de l'authentification SMTP (`nodemailer.verify()`, aucun e-mail envoyé) ;
- le nombre de comptes créés sur 30 jours avec et sans adresse e-mail (si le secret
  `NAVIGOAL_DATABASE_URL` est configuré).

## Délivrabilité : rien à corriger

Relevé du 27/11/2026 : SPF (`v=spf1 … include:premiumsmtp.dnshostservices.com ~all`), DKIM (sélecteur
`default`) et DMARC (`p=quarantine`) sont tous en place, MX sur `mail.navigoal.net`.

## Deux constats annexes

- **Il n'existe pas d'e-mail de confirmation de compte.** Le compte est `actif` dès l'inscription ; ce qui
  part est un e-mail de bienvenue (« Bienvenue sur Navigoal »), adapté au rôle. La colonne
  `users.email_verified_at` existe mais n'est alimentée que par le code à 6 chiffres demandé séparément.
  Une vraie validation d'adresse à l'inscription reste à décider après le 5 janvier.
- **Les inscrits par téléphone ne reçoivent rien, par construction** : le formulaire propose « E-mail » ou
  « Téléphone » au choix (`components/auth/Signup.tsx`), et `register()` n'exige que l'un des deux. Au
  Gabon, le téléphone est souvent le réflexe.

## À signaler, non traité

Le secret GitHub `NAVIGOAL_DATABASE_URL` n'est pas configuré, et le workflow `accreditations.yml` n'a
**jamais** été exécuté — une planification `schedule` ne se déclenche que sur la branche par défaut du
dépôt, or le travail se fait sur une branche de développement.

## Automatiser : ne plus jamais éditer un fichier à la main

Trois niveaux, du plus utile au plus accessoire.

### 1. Supprimer la cause : une boîte dédiée à l'application (recommandé)

La fragilité de fond, c'est que **l'application s'authentifie avec la boîte d'un humain**. Le jour où
quelqu'un change le mot de passe de `contact@navigoal.net` dans son téléphone ou dans cPanel, toute la
plateforme cesse d'envoyer — exactement ce qui s'est passé.

Créer une boîte **`no-reply@navigoal.net`** utilisée uniquement par le serveur, dont personne ne lit le
courrier et dont le mot de passe ne bouge jamais. On garde `MAIL_REPLY_TO=contact@navigoal.net` : les
réponses des familles continuent d'arriver dans la vraie boîte.

Cinq minutes dans cPanel, aucun changement de code, et le mode de panne disparaît.

*Variante plus solide encore* : passer par un service d'envoi (Brevo, Resend, Mailgun) avec une clé d'API
au lieu d'un mot de passe de boîte. Meilleure délivrabilité et statistiques d'ouverture, mais c'est un
changement de code — à garder pour après le gel.

### 2. Gérer les réglages SMTP depuis les secrets GitHub (en place depuis le 27/11/2026)

La mise en ligne dépose désormais `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` et `SMTP_PASS` dans `.env.github`
s'ils existent comme secrets GitHub, au même titre que `DAILY_API_KEY`.

**Condition à respecter une fois pour toutes** : `.env` est prioritaire sur `.env.github`
(`deploiement/app.js`). Tant que `SMTP_PASS` reste dans le `.env` du serveur, le secret GitHub est ignoré.

Bascule, à faire une seule fois :

1. GitHub → Settings → Secrets and variables → Actions → créer `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
   `SMTP_PASS` avec les bonnes valeurs.
2. Sur le serveur, **supprimer ces quatre lignes** du `navigoal/.env`.
3. Relancer une mise en ligne.

Ensuite, changer le mot de passe se fait **en un seul endroit** : le secret GitHub, puis une mise en ligne.
Plus de gestionnaire de fichiers, plus de FTP, et la valeur n'est jamais visible nulle part.

### 3. Surveillance automatique

Ce qui existe déjà depuis le 27/11 : contrôle au démarrage de l'application, `email` dans `/api/sante`, et
avertissement à la fin de chaque mise en ligne.

Ce qui manque : une vérification **périodique**, qui remarquerait une panne entre deux mises en ligne.

Obstacle à connaître : une planification `schedule` de GitHub Actions **ne se déclenche que sur la branche
par défaut du dépôt** (ici `claude/mcp-server-install-ewj59b`), et non sur la branche de travail. C'est
aussi la raison pour laquelle `accreditations.yml` n'a jamais tourné.

**Mis en place le 27/11/2026** : `.github/workflows/surveillance.yml`, **sur la branche par défaut**
`claude/mcp-server-install-ewj59b` (seul fichier ajouté à cette branche ; elle n'avait aucun `.github/`).

Toutes les heures à la minute 37 — décalée pour éviter l'embouteillage de l'heure pile — il appelle
`/api/sante/` avec un User-Agent de navigateur (l'hébergement refuse les autres, sinon on mesurerait le
filtre anti-robots et non l'application) et vérifie deux choses : le code de réponse, et l'état des
e-mails.

En cas de problème il **ouvre un ticket GitHub**, le commente tant que la panne dure, et **le ferme tout
seul** au premier contrôle réussi. Un ticket et non un e-mail : la panne surveillée est précisément celle
de l'envoi des e-mails.

Première exécution manuelle : « Rien à signaler : site en 200, e-mails « inconnu » » — `inconnu` parce que
la version déployée ne renvoie pas encore le champ `email`. Dès que la nouvelle version sera en ligne, le
ticket s'ouvrira de lui-même, ce qui vaudra preuve que le détecteur fonctionne.

À surveiller : ce fichier vit sur une branche qui n'est pas la branche de travail. Si la branche par défaut
du dépôt change, il faudra l'y déplacer.
