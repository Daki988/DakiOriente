# Brancher la base de données (Supabase)

Environ 15 minutes, une seule fois. Tant que ce n'est pas fait, le site tourne en mode démonstration :
catalogue visible, commandes envoyées sur WhatsApp, back-office inaccessible.

## Méthode rapide (depuis Vercel, sans copier de clé)

1. Vercel › projet neam-print › **Storage** › **Create Database** › **Supabase** › région Paris/Frankfurt › reliez-le au projet. Les clés sont ajoutées toutes seules.
2. Ajoutez la variable `SETUP_TOKEN` (longue chaîne aléatoire, type *Sensitive*) et redéployez.
3. Ouvrez `https://<site>/api/installation?cle=<SETUP_TOKEN>` : tables, catalogue et compte super administrateur sont créés. La réponse contient un lien à usage unique (1 h) pour choisir le mot de passe.
4. Supprimez ensuite `SETUP_TOKEN` dans Vercel.

Dans Supabase › Authentication › URL Configuration, mettez l'adresse du site en **Site URL** pour que « Mot de passe oublié » fonctionne.

## Méthode manuelle

## 1. Créer le projet

1. Créez un compte sur https://supabase.com, puis **New project**.
2. Nom : `neam-print`. Région : **West EU (Paris)** ou **Frankfurt** (les plus proches de Libreville).
3. Notez le mot de passe de la base dans un gestionnaire de mots de passe (il ne sert qu'en cas de dépannage).

## 2. Créer les tables

Dans **SQL Editor › New query** :

1. Collez tout le contenu de `supabase/schema.sql`, cliquez **Run**.
2. Nouvelle requête : collez `supabase/seed.sql` (le catalogue de 23 produits), **Run**.

Les deux fichiers peuvent être relancés sans risque : rien n'est effacé ni dupliqué.

## 3. Créer le compte du super administrateur

**Authentication › Users › Add user › Create new user** :

- E-mail : `daki.liaison@gmail.com`
- Mot de passe : choisissez-le vous-même, ici (jamais dans le code ni par message)
- Cochez **Auto Confirm User**

Ce compte a déjà les droits de super administrateur (ligne en fin de `schema.sql`).

## 4. Régler les adresses de connexion

**Authentication › URL Configuration** :

- **Site URL** : l'adresse du site (ex. `https://neamprint.ga`)
- **Redirect URLs** : ajoutez `https://neamprint.ga/auth/callback` (et l'adresse Vercel de prévisualisation si besoin, ex. `https://*.vercel.app/auth/callback`)

Sans ce réglage, le lien « Mot de passe oublié » ne ramène pas sur le site.

## 5. Donner les clés au site

**Project Settings › API** : copiez l'URL du projet et les deux clés.

| Variable | Où la trouver | Secrète ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` | non |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | **oui** : seulement dans Vercel, jamais dans un message ni dans le code |
| `NEXT_PUBLIC_SITE_URL` | l'adresse du site | non |

Sur **Vercel › Project › Settings › Environment Variables**, ajoutez les quatre, puis redéployez.

## 6. Vérifier

En local, copiez `.env.example` en `.env.local`, remplissez-le, puis :

```bash
node --env-file=.env.local scripts/check-supabase.mjs
```

Le script vérifie la connexion, le catalogue, le super administrateur, le dossier des fichiers et la sécurité.

## Ajouter l'équipe

Une fois connecté au back-office en super administrateur : **Équipe › Ajouter une personne**.
La personne se connecte ensuite avec « Mot de passe oublié ou première connexion » et choisit son mot de passe.

- **Administrateur** : commandes + catalogue et prix
- **Atelier** : commandes seulement

## Tester le schéma sans Supabase

Sur une base PostgreSQL de test (elle est remise à zéro) :

```bash
DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
```

Vérifie que le schéma s'installe deux fois sans erreur et que chaque rôle (visiteur, client, atelier, administrateur, super administrateur) ne voit et ne modifie que ce qu'il doit.
