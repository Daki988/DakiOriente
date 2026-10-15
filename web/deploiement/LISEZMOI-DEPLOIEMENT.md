# Déployer Navigoal sur un hébergement LWS cPanel

Ce paquet contient l'application complète (site, espaces connectés, API, back-office) déjà compilée :
aucune compilation n'est nécessaire sur le serveur. Elle s'exécute avec **Node.js** (« Setup Node.js App »)
et une base **PostgreSQL**.

## 0. Vérifications préalables (cPanel)

1. Dans cPanel, rubrique **Logiciels**, l'icône **Setup Node.js App** doit être présente.
   Selon la documentation LWS, elle est incluse dans les offres cPanel **L, XL, 2XL, 3XL et CloudCP**.
   Si elle est absente de votre offre cPanel M, demandez son activation au support LWS ou passez à l'offre supérieure.
2. Rubrique **Bases de données** : **Bases de données PostgreSQL** doit être disponible.
3. Le domaine **navigoal.net** doit pointer vers l'hébergement (et le certificat SSL être actif :
   cPanel › **SSL/TLS Status** › *Run AutoSSL*).

## 1. Base de données PostgreSQL

cPanel › **Bases de données PostgreSQL** :
1. Créez une base, par exemple `navigoal` (cPanel la préfixe : `identifiant_navigoal`).
2. Créez un utilisateur avec un mot de passe fort, puis ajoutez-le à la base avec **tous les privilèges**.
3. Notez l'adresse de connexion :
   `postgres://identifiant_utilisateur:MOT_DE_PASSE@localhost:5432/identifiant_navigoal`
   (encodez les caractères spéciaux du mot de passe : `@` → `%40`, `#` → `%23`, `/` → `%2F`).

## 2. Adresse e-mail contact@navigoal.net

cPanel › **Comptes de messagerie** › *Créer* : `contact@navigoal.net`.
Paramètres d'envoi (cPanel › *Connect Devices*) : serveur `mail.navigoal.net`, port **465** (SSL).
Ces informations vont dans `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
Pour la délivrabilité, vérifiez dans cPanel › **Email Deliverability** que SPF et DKIM sont valides.

## 3. Envoi des fichiers

1. cPanel › **Gestionnaire de fichiers** : placez-vous dans votre dossier personnel `/home/IDENTIFIANT`
   (**pas** dans `public_html`).
2. *Charger* le fichier `navigoal-cpanel-AAAA-MM-JJ.zip`, puis clic droit › *Extract* : un dossier `navigoal/` est créé.
3. Dans `navigoal/`, copiez `.env.example` en `.env` et complétez-le (base, e-mail, adresse du site,
   `STORAGE_DIR=/home/IDENTIFIANT/navigoal/stockage`). Ajoutez aussi, pour la première installation :
   `ADMIN_EMAIL=votre@adresse` et `ADMIN_PASSWORD=un-mot-de-passe-fort` (compte administrateur).

## 4. Création de l'application Node.js

cPanel › **Setup Node.js App** › *Create Application* :
- **Node.js version** : 22 (ou 20 au minimum)
- **Application mode** : Production
- **Application root** : `navigoal`
- **Application URL** : `navigoal.net` (laisser le chemin vide)
- **Application startup file** : `app.js`
- *Create*. Ne cliquez pas sur « Run NPM Install » : les dépendances sont déjà incluses.

Les variables peuvent aussi être saisies dans cette page (« Environment variables ») au lieu du fichier `.env`.

## 5. Initialisation de la base (une seule fois, puis à chaque mise à jour)

cPanel › **Terminal** (ou SSH). En haut de la page Setup Node.js App, copiez la commande
« Enter to the virtual environment » (elle ressemble à `source /home/IDENTIFIANT/nodevenv/navigoal/22/bin/activate && cd /home/IDENTIFIANT/navigoal`), puis :

```bash
npm run migrate   # crée / met à jour les tables
npm run seed      # référentiels : établissements, formations, métiers, articles, compte administrateur
```

Revenez dans Setup Node.js App et cliquez sur **Restart**. Le site est en ligne sur https://navigoal.net.

## 6. Mises à jour

1. Arrêtez l'application (Stop App), remplacez le dossier `navigoal/` par celui du nouveau paquet en conservant
   votre `.env` et le dossier `stockage/`.
2. `npm run migrate && npm run seed` dans le terminal, puis **Restart**.

## Dépannage

- **Erreur 503 / page blanche** : consultez `navigoal/stderr.log` (créé par Passenger) ; vérifiez `DATABASE_URL`.
- **E-mails non reçus** : vérifiez le mot de passe SMTP, le port 465 et la délivrabilité (SPF/DKIM) ; en attendant,
  les envois sont journalisés dans `stderr.log`.
- **Fichiers déposés introuvables après mise à jour** : le dossier `stockage/` (ou `STORAGE_DIR`) doit être conservé.
- Les paiements sont en mode « sandbox » (`PAYMENTS_MODE=sandbox`) pendant l'essai : aucun débit réel.
