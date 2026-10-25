# Installer Neam Print sur LWS (print.neamindustry.com)

Version statique pour l'hébergement mutualisé LWS (sans Node.js). Le ZIP se fabrique avec :

```bash
npm ci && bash scripts/build-lws.sh https://print.neamindustry.com
# → dist/neam-print-lws.zip
```

## 1. Créer le sous-domaine
Espace client LWS › votre domaine **neamindustry.com** › **Sous-domaines** › créer `print`.
Noter le dossier associé (en général `/htdocs/print` ou `/public_html/print`).

## 2. Activer le HTTPS
Même espace › **Certificat SSL** (Let's Encrypt, gratuit) › l'activer pour `print.neamindustry.com`.
Attendre qu'il soit actif avant l'étape 4 : le site redirige vers https.

## 3. Envoyer le ZIP
**Gestionnaire de fichiers** LWS › ouvrir le dossier du sous-domaine › le vider (fichier d'accueil par défaut) ›
**Envoyer** `neam-print-lws.zip` › clic droit **Extraire** dans ce dossier, puis supprimer le ZIP.
Vérifier qu'on voit directement `index.html`, `.htaccess`, `_next/`, `produits/`… (pas un sous-dossier en plus).

Sans extraction en ligne : décompresser sur l'ordinateur et envoyer le contenu par FTP (FileZilla),
en affichant les fichiers cachés pour bien transférer `.htaccess`.

## 4. Vérifier
- https://print.neamindustry.com : accueil
- https://print.neamindustry.com/produits/flyer-a5/?creer=1 : l'éditeur s'ouvre, « Utiliser ce design » crée le PDF
- une adresse inexistante affiche la page 404 du site

## Ce que fait cette version
Catalogue, prix, éditeur en ligne, PDF d'impression et commande envoyée sur WhatsApp (+241 77 45 31 67).
Sans serveur Node.js : pas d'espace admin, pas d'enregistrement des commandes en base ni de page de suivi.
Pour tout cela, il faut une offre LWS avec Node.js (cPanel « Setup Node.js App ») ou un VPS.

## Mettre à jour
Modifier le catalogue (`content/catalogue.json`) ou les réglages (`content/settings.json`), relancer le script,
puis remplacer le contenu du dossier par le nouveau ZIP.
