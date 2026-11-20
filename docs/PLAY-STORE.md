# Publier NEAM sur le Google Play Store

Trois applications : **NEAM** (`com.neam.superapp`), **NEAM Partenaire** (`com.neam.partenaire`) et
**NEAM Livreur** (`com.neam.livreur`). Le Play Store demande des fichiers `.aab` signés avec la clé de l'entreprise,
et non les APK de test (signés avec une clé de débogage).

## 1. Prérequis

- Un compte Google Play Console au nom de l'entreprise (25 $, une seule fois, vérification d'identité).
- Le serveur Supabase actif (plan Pro conseillé : pas de mise en pause, sauvegardes quotidiennes).
- Une adresse web publique pour la politique de confidentialité : celle du site NEAM, page `#/confidentialite`
  (exemple : `https://neam.ga/#/confidentialite`). Les textes sont dans `src/pages/Legal.tsx`.

## 2. Créer la clé de signature (une seule fois)

Sur un ordinateur de confiance, avec Java installé :

```bash
keytool -genkeypair -v -keystore neam-upload.jks -alias neam -keyalg RSA -keysize 4096 -validity 10000
```

Gardez `neam-upload.jks` et son mot de passe **en deux endroits sûrs** (coffre de mots de passe et clé USB rangée).
Sans eux, impossible de publier une mise à jour. Avec la signature d'applications Play (activée par défaut),
Google garde la clé finale ; cette clé d'envoi peut être réinitialisée auprès de Google en cas de perte.

## 3. Brancher la clé sur les projets

Créer `android/keystore.properties` (et la même chose dans `native/marchand/android/` et `native/livreur/android/`) :

```properties
storeFile=/chemin/vers/neam-upload.jks
storePassword=…
keyAlias=neam
keyPassword=…
```

Ces fichiers sont ignorés par Git. Sans eux, la construction reste possible mais le `.aab` n'est pas signé.

## 4. Construire

```bash
cp .env.local.example .env.local   # URL du projet et clé publishable Supabase
npm run aab            # → android/app/build/outputs/bundle/release/app-release.aab
npm run aab:marchand   # → native/marchand/android/app/build/outputs/bundle/release/app-release.aab
npm run aab:livreur    # → native/livreur/android/app/build/outputs/bundle/release/app-release.aab
```

À chaque nouvelle version : augmenter `versionCode` (entier) et `versionName` dans `android/app/build.gradle`
(et dans les projets `native/*`).

## 5. Fiche Play Console

**Sécurité des données** (réponses tirées du fonctionnement réel, voir la politique de confidentialité) :

| Donnée | NEAM | Partenaire | Livreur | Usage |
| --- | --- | --- | --- | --- |
| Numéro de téléphone | oui | oui | oui | compte, contact pour la livraison |
| Nom | oui | oui | oui | commande, profil |
| Adresse (texte saisi) | oui | oui | non | livraison |
| Position précise | non | non | oui, pendant le service | suivi par le client |
| Historique d'achats | oui | oui | oui | service, comptabilité |
| Paiement | non (espèces) | non | non | — |

Données chiffrées en transit : oui. Suppression sur demande : oui (adresse e-mail de la politique).
Aucune donnée partagée avec des tiers à des fins publicitaires.

**Autorisations à justifier** :

- Livreur, *position précise* : partager la position avec le client pendant une course. L'app ne la transmet que
  lorsque le livreur est « En ligne ».
- NEAM, *caméra* : scanner les QR codes NEAM (ouvrir un service ou un produit). Si le scanner n'est pas mis en avant
  au lancement, retirer la permission `CAMERA` de `android/app/src/main/AndroidManifest.xml` pour simplifier la revue.

**Public** : 18 ans et plus pour Partenaire et Livreur (applications professionnelles).
