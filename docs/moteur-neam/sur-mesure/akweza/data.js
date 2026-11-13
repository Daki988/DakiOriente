// Akweza (Complexe Akweza, Angondjé) : contenu du site sur mesure.
// Infos réelles (Facebook ComplexeAkweza2022, Instagram @lakweza, Le Pratique du Gabon, Tripadvisor) : restaurant, bar et lounge
// à Angondjé, à côté de l'école Maarif Turco-Gabonaise ; 060 10 10 10 ; ouvert le dimanche midi et soir ; moins de 15 000 FCFA par personne.
// Carte, prix, horaires et événements : exemples à confirmer avec le complexe.
const P = '../../assets/photos/';
const BK = {
  slug: 'akweza', name: 'Akweza', tel: '060 10 10 10', resa: '060 10 10 10', wa: '24160101010', mail: 'contact@akweza.ga',
  addr: 'Angondjé, à côté de l\'école Maarif Turco-Gabonaise', city: 'Libreville', mapq: 'Angondje,+Libreville,+Gabon', insta: 'lakweza',
  hours: [['Mardi – samedi', '12 h – 1 h'], ['Dimanche', 'Brunch 11 h – 15 h · soir 19 h – 23 h']], soc: ['facebook', 'instagram'],
};
const PH = {
  hero: P + 'x-brochettes-2.jpg', salle: P + 'x-lounge-bar-2.jpg', bar: P + 'x-lounge-bar-3.jpg', cocktails: P + 'x-mojito-2.jpg',
  chef: P + 'x-chef-n-1.jpg', chant: P + 'x-dj-1.jpg', chant2: P + 'x-chant-n-2.jpg', dj: P + 'x-dj-1.jpg', wax: P + 'x-salle-resto-1.jpg', paniers: P + 'x-paniers-1.jpg',
  brunch: P + 'x-pancakes-1.jpg', plantain: P + 'x-avocado-toast-1.jpg', bissap: P + 'x-jus-ananas-1.jpg',
};
const CATS = [['entrees', 'À partager'], ['plats', 'Plats'], ['grillades', 'Grillades'], ['accomp', 'Accompagnements'], ['desserts', 'Desserts'], ['boissons', 'Bar & cocktails']];
const M = (id, c, n, d, p, tags, ph) => ({ id, c, n, d, p, tags, ph: ph ? P + ph : '' });
const MENU = [
  M('ailes', 'entrees', 'Ailes de poulet croustillantes', 'Sauce piment doux, citron vert', 5000, ['ep'], 'x-wings-1.jpg'),
  M('planche', 'entrees', 'Planche Akweza', 'Brochettes, plantain, frites, sauces maison, pour 2 à 3', 12000, ['sig'], 'x-planche-1.jpg'),
  M('salade', 'entrees', 'Salade avocat-crevettes', 'Agrumes, coriandre', 5500, [], 'x-salade-crevettes-1.jpg'),
  M('poulet-braise', 'plats', 'Poulet braisé Akweza', 'Mariné 12 h, cuit à la braise, sauce maison', 8500, ['sig'], 'x-plat-africain-5.jpg'),
  M('poisson', 'plats', 'Poisson braisé', 'Capitaine ou bar entier, sauce verte', 10000, ['sig'], 'x-poisson-braise-1.jpg'),
  M('nyembwe', 'plats', 'Poulet nyembwe', 'Sauce noix de palme, riz ou plantain', 8000, [], 'x-plat-africain-3.jpg'),
  M('steak', 'plats', 'Entrecôte grillée', 'Frites maison, sauce au poivre', 12000, [], 'x-steak-1.jpg'),
  M('pates', 'plats', 'Tagliatelles aux crevettes', 'Crème légère, ail, persil', 9000, [], 'x-tagliatelle-1.jpg'),
  M('brochettes', 'grillades', 'Brochettes de bœuf', 'Marinade soya, oignons, piment', 6000, ['ep'], 'x-brochettes-1.jpg'),
  M('mixte', 'grillades', 'Grillade mixte', 'Bœuf, poulet, saucisses, pour deux', 15000, [], 'x-brochettes-3.jpg'),
  M('frites', 'accomp', 'Frites maison', 'Croustillantes', 2000, ['vg'], 'x-frites-1.jpg'),
  M('plantain', 'accomp', 'Banane plantain frite', 'Mûre et dorée', 2000, ['vg'], 'x-plantain-1.jpg'),
  M('manioc', 'accomp', 'Bâtons de manioc', 'La tradition', 1500, ['vg']),
  M('fondant', 'desserts', 'Fondant au chocolat', 'Cœur coulant, glace vanille', 4000, [], 'x-fondant-1.jpg'),
  M('tiramisu', 'desserts', 'Tiramisu maison', 'Café et cacao', 4000, [], 'x-tiramisu-1.jpg'),
  M('mojito', 'boissons', 'Mojito Akweza', 'Menthe, citron vert (sans alcool sur demande)', 5000, ['sig'], 'x-mojito-1.jpg'),
  M('ananas', 'boissons', 'Jus d\'ananas frais', 'Pressé minute', 2000, ['vg'], 'x-jus-ananas-2.jpg'),
  M('milkshake', 'boissons', 'Milkshake', 'Vanille, chocolat ou fraise', 3500, ['vg'], 'x-milkshake-1.jpg'),
  M('bissap', 'boissons', 'Bissap maison', 'Hibiscus, menthe', 1500, ['vg'], 'x-bissap-1.jpg'),
];
const EVENTS = [
  ['brunch', 'Brunch du dimanche', 'Tous les dimanches, 11 h – 15 h', 'Pancakes, œufs, avocado toast, grillades et jus frais : le dimanche en famille ou entre amis.', '12 000 FCFA / pers.', PH.brunch],
  ['afro-fusion', 'Soirées lounge & DJ', 'Vendredi et samedi, dès 21 h', 'DJ, cocktails signature et grillades tard le soir : l\'ambiance lounge d\'Angondjé.', 'Entrée libre', PH.dj],
  ['privatisation', 'Privatisez Akweza', 'Anniversaires, entreprises, fêtes', 'Espace lounge réservé, menu sur mesure, cocktails et DJ, jusqu\'à 80 invités.', 'Sur devis', PH.salle],
];
const AVIS = [
  ['Yannick', 'Soirée entre amis', 'Ambiance lounge au top, DJ excellent et brochettes parfaitement assaisonnées. Notre nouvelle adresse à Angondjé.'],
  ['Marlène', 'Déjeuner du dimanche', 'Le brunch du dimanche est copieux et le service souriant. On vient en famille, les enfants adorent.'],
  ['Hervé', 'Anniversaire privatisé', 'Espace réservé, déco et cocktails : tout était prêt à l\'heure. Merci à l\'équipe !'],
];
module.exports = { BK, PH, CATS, MENU, EVENTS, AVIS };
