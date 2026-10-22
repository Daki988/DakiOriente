# Mise en production NEAM — phase 1 (Market + Express, Libreville)

Quatre applications partagent le même code et le même serveur (Supabase) :

| Application | Pour qui | Où |
| --- | --- | --- |
| **NEAM** | Clients | Web + APK Android + iOS (`com.neam.superapp`) |
| **NEAM Partenaire** | Marchands NEAM Market | Web `/marchand` + APK (`com.neam.partenaire`) |
| **NEAM Livreur** | Livreurs salariés NEAM | APK (`com.neam.livreur`), GPS |
| **NEAM Admin** | Équipe NEAM | Web `/admin` |

Paiement : **à la livraison uniquement** (espèces encaissées par le livreur). Mobile Money et carte bancaire sont affichés « À venir ».

## 1. Créer le projet Supabase (10 min)

1. Créer un compte sur https://supabase.com puis un projet (région la plus proche : Europe).
2. **SQL Editor** → coller tout le contenu de `supabase/deploy.sql` → Run.
   Cela crée les tables, les règles d'accès, les fonctions métier et 4 boutiques de départ (facultatif).
3. **Authentication → Sign In / Providers → Phone** : activer, puis choisir un fournisseur SMS
   (Twilio, Vonage, MessageBird…) et renseigner ses identifiants. Les SMS sont payants chez le fournisseur.
   Pour tester avant d'avoir un fournisseur : *Test phone numbers* (numéro + code fixe).
4. **Project Settings → API** : noter l'URL du projet et la clé publique `anon`.

## 2. Configurer et construire

```bash
cp .env.local.example .env.local      # puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm install
npm run build          # app client  → dist/
npm run build:admin    # admin seul  → dist-admin/  (ou utiliser /admin dans l'app web)
npm run apk            # APK client
npm run apk:marchand   # APK NEAM Partenaire
npm run apk:livreur    # APK NEAM Livreur
```

Sans ces variables, l'application tourne en **mode démonstration** (données sur l'appareil, aucune commande réelle).

## 3. Premier administrateur

1. Ouvrir l'app (ou `/admin`) et se connecter avec son numéro.
2. Dans le SQL Editor : `update public.profiles set role = 'admin' where phone = '241XXXXXXXX';`
3. Recharger : l'espace admin s'ouvre. Les admins suivants peuvent être promus de la même façon.

## 4. Fonctionnement au quotidien

1. **Marchands et livreurs** installent leur app, se connectent par SMS et envoient leur candidature.
2. **L'admin** valide la candidature (onglet Candidatures) : la boutique ou le compte livreur est créé.
3. **Le marchand** remplit son catalogue, ouvre sa boutique et reçoit les commandes avec une alerte sonore.
   Il accepte, prépare, puis signale « Commande prête ».
4. **L'admin** affecte un livreur en ligne (Accueil → À affecter).
5. **Le livreur** récupère la commande, livre, encaisse les espèces et valide avec le **code à 4 chiffres** donné par le client.
6. **Argent** : l'admin enregistre les espèces remises par chaque livreur (onglet Livreurs) et les versements
   aux marchands (onglet Boutiques). Commission NEAM par défaut : 10 % des articles, modifiable par boutique.
7. **Tarifs** (onglet Paramètres) : frais de livraison Market, seuil de livraison offerte, grille NEAM Express.

## 5. Développement local

```bash
npm run db:start       # Supabase local (Docker requis)
npm run db:reset       # applique les migrations + données de départ
npm run test:backend   # 47 vérifications du serveur (parcours complet + règles d'accès)
npm run dev            # http://localhost:5173 (utilise .env.development.local)
```

Numéros de test en local : `+241 07 00 00 01` à `+241 07 00 00 05`, code `123456`.

## Sécurité — ce qui est garanti par le serveur

- Les prix et frais sont **recalculés côté serveur** : un client ne peut pas modifier un prix.
- Chacun ne voit que ses données : un client ses commandes, un marchand celles de sa boutique,
  un livreur ses courses affectées.
- Le **code de remise** n'est visible que par le client : le livreur doit le lui demander.
- Les changements d'étape suivent un ordre strict (pas de « livrée » avant « récupérée », etc.)
  et chaque étape est journalisée (qui, quand).
- Les fonctions d'administration refusent tout compte non admin.

## Limites de la phase 1

- Position du livreur partagée **quand l'app est ouverte** (pas encore en arrière-plan).
- Pas encore de notifications push (le suivi est en direct dans l'app, avec un son côté marchand et livreur).
- Affectation des livreurs **manuelle** par l'admin (salariés NEAM) ; l'affectation automatique viendra ensuite.
- Les autres services (Food, Health…) restent visibles en **aperçu** (« Bientôt disponible à Libreville »).
