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
