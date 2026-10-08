# Daki Oriente — boutique intime en ligne

Site vitrine + boutique statique (HTML/CSS/JS, aucune dépendance). Ouvrez `index.html` dans un navigateur ou déposez le dossier sur n'importe quel hébergeur statique (Vercel, Netlify, GitHub Pages…).

## Ce que contient le site
- Vérification d'âge 18+ à l'entrée
- Bouton « Sortie rapide » + double appui sur Échap pour quitter le site instantanément
- Titre d'onglet neutre, `noindex`, panier stocké uniquement sur l'appareil
- Catalogue filtrable (6 collections, 26 produits), recherche, tri
- Fiche produit, panier avec barre « livraison offerte », commande sans compte
- Commande envoyée en récapitulatif WhatsApp, paiement à la livraison (espèces, Airtel Money, Moov Money)
- Quiz « Trouver mon produit idéal », FAQ discrétion, inscription newsletter

## À personnaliser
- `assets/js/app.js` → bloc `CONFIG` : numéro WhatsApp, frais et seuil de livraison offerte
- `assets/js/products.js` → produits, prix (FCFA), descriptions, catégories
- Les visuels produits sont des illustrations abstraites : remplacez-les par vos photos quand elles sont prêtes
