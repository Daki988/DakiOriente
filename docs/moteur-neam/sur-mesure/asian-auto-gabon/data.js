// Asian Auto Gabon : contenu du site.
// Infos réelles (annuaires, Facebook, LinkedIn) : ex-NPS Gabon devenu Asian Auto Motors (2021), distributeur exclusif de pièces
// détachées d'origine pour véhicules japonais et coréens ; vente de pièces, de lubrifiants moteurs et industriels, de véhicules ;
// av. Georges Damas Aleka, Glass, BP 9222 Libreville, 011 72 53 72 et 062 12 37 37, magasin@asianauto-gabon.com. Logo réel redessiné.
// À confirmer : horaires, références et prix indicatifs, délais de commande, livraison.
const AG = {
  slug: 'asian-auto-gabon', name: 'Asian Auto Gabon', dir: 'Philippe MOKOKO',
  tel: '011 72 53 72', tel2: '062 12 37 37', wa: '24162123737', mail: 'magasin@asianauto-gabon.com', bp: 'BP 9222 Libreville', dom: 'asianauto-gabon.com',
  addr: 'Avenue Georges Damas Aleka, Glass', city: 'Libreville', mapq: 'Avenue+Georges+Damas+Aleka,+Glass,+Libreville,+Gabon',
  hours: [['Lundi – vendredi', '8 h – 17 h 30'], ['Samedi', '8 h – 13 h'], ['Dimanche', 'Fermé']],
};
// Marques de véhicules servies (texte seulement, sans logo)
const MARQUES = ['Toyota', 'Nissan', 'Mitsubishi', 'Hyundai', 'Kia', 'Suzuki', 'Isuzu', 'Honda', 'Mazda'];
const PH = {
  freins: 'x-freins-1.jpg', freins2: 'x-freins-2.jpg', vidange: 'x-vidange-1.jpg', vidange2: 'x-vidange-2.jpg', bougies: 'x-bougies-1.jpg', bougies2: 'x-bougies-2.jpg',
  amortisseur: 'x-amortisseur-1.jpg', pneus: 'x-pneus-1.jpg', moteur: 'auto-1486262715619-67b85e0b08d3.jpg', garage: 'auto-1727893304219-063d142ce6f3.jpg',
  outils: 'x-armoire-outils-1.jpg', mains: 'x-mains-moteur-1.jpg',
};
// Rayons du catalogue : [id, nom, photo, pièces courantes]
const RAYONS = [
  ['filtration', 'Filtration', PH.vidange2, ['Filtre à huile', 'Filtre à air', 'Filtre à gasoil', 'Filtre d\'habitacle']],
  ['freinage', 'Freinage', PH.freins, ['Plaquettes', 'Disques', 'Mâchoires', 'Cylindres de roue', 'Liquide de frein']],
  ['suspension', 'Suspension et direction', PH.amortisseur, ['Amortisseurs', 'Rotules', 'Silentblocs', 'Biellettes', 'Roulements de roue']],
  ['moteur', 'Moteur et distribution', PH.moteur, ['Kits de distribution', 'Courroies', 'Joints de culasse', 'Pompes à eau', 'Injecteurs']],
  ['allumage', 'Allumage et électricité', PH.bougies, ['Bougies', 'Bobines', 'Alternateurs', 'Démarreurs', 'Batteries']],
  ['embrayage', 'Embrayage et transmission', PH.mains, ['Kits d\'embrayage', 'Butées', 'Cardans', 'Croisillons']],
];
// Lubrifiants (sans marque) : [nom, usage, conditionnements]
const LUBES = [
  ['Huile moteur 5W-30', 'Moteurs essence récents', '1 L · 4 L · 5 L'],
  ['Huile moteur 10W-40', 'Essence et diesel, usage courant', '1 L · 4 L · 5 L'],
  ['Huile moteur 15W-40', 'Diesel, 4x4 et utilitaires', '5 L · 20 L · 208 L'],
  ['Huile de boîte et pont', 'Boîtes manuelles, ponts', '1 L · 20 L'],
  ['Fluide de boîte automatique', 'Boîtes automatiques', '1 L · 4 L'],
  ['Huiles industrielles', 'Hydraulique, compresseurs, engrenages', '20 L · 208 L'],
];
const AVIS = [
  ['Stéphane', 'Plaquettes et disques', 'Avec le numéro de châssis, ils ont trouvé la bonne référence du premier coup. Pièce d\'origine, prix correct.'],
  ['Annick', 'Kit de distribution', 'Commande passée sur WhatsApp le matin, pièce récupérée l\'après-midi. Très pratique.'],
  ['Romuald', 'Flotte d\'entreprise', 'Nous équipons nos pick-up chez eux depuis des années : stock, conseil et facture en règle.'],
];

module.exports = { AG, MARQUES, PH, RAYONS, LUBES, AVIS };
