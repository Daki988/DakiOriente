// Boko's Café (Okala, Libreville) : contenu du site sur mesure.
// Infos réelles (Facebook, Instagram @boko.slbv, Le Pratique du Gabon, Mbolo Gabon) : restaurant de saveurs africaines,
// « cadre chaleureux et cosy aux couleurs de l'Afrique » ; Okala, ruelle de Canal 7, face au lavage (entre l'Auberge et Canal 7) ;
// 074 21 54 54, réservations 066 08 87 08 ; Afro Brunch, soirées Afro Fusion, bissap et gingembre maison ; moins de 15 000 FCFA par personne ;
// dirigé par Éric IDENGE. Carte, prix et horaires : exemples à confirmer avec le restaurant.
const P = '../../assets/photos/';

const BK = {
  slug: 'boko-s-cafe', name: 'Boko\'s Café', tel: '074 21 54 54', resa: '066 08 87 08', wa: '24174215454', mail: 'contact@bokoscafe.ga',
  addr: 'Okala, ruelle de Canal 7, face au lavage', city: 'Libreville', mapq: 'Okala,+Libreville,+Gabon', insta: 'boko.slbv',
  hours: [['Lundi – samedi', '11 h – 23 h'], ['Dimanche', 'Afro Brunch 11 h – 15 h · soir 19 h – 23 h']], soc: ['instagram', 'facebook', 'tiktok'],
};

const PH = {
  hero: P + 'x-plat-africain-1.jpg', salle: P + 'resto-1555396273-367ea4eb4db5.jpg', bar: P + 'x-lounge-bar-2.jpg', cocktails: P + 'x-lounge-bar-3.jpg',
  chef: P + 'x-chef-n-1.jpg', chant: P + 'x-chant-n-4.jpg', chant2: P + 'x-chant-n-1.jpg', dj: P + 'x-dj-1.jpg', wax: P + 'x-wax-1.jpg', paniers: P + 'x-paniers-1.jpg',
  brunch: P + 'x-jus-ananas-2.jpg', plantain: P + 'x-plantain-1.jpg', bissap: P + 'x-bissap-1.jpg',
};

// Carte : id, catégorie, nom, description, prix, tags (sig = signature, ep = épicé, vg = végétarien), photo
const CATS = [['entrees', 'Entrées'], ['plats', 'Plats'], ['grillades', 'Grillades'], ['accomp', 'Accompagnements'], ['desserts', 'Desserts'], ['boissons', 'Boissons']];
const M = (id, c, n, d, p, tags, ph) => ({ id, c, n, d, p, tags, ph: ph ? P + ph : '' });
const MENU = [
  M('salade-avocat', 'entrees', 'Salade avocat-crevettes', 'Avocat, crevettes marinées, citron vert, piment doux', 5500, [], 'x-salade-crevettes-1.jpg'),
  M('soya', 'entrees', 'Brochettes soya', 'Bœuf épicé à la braise, oignons, piment en poudre', 4500, ['ep'], 'x-brochettes-1.jpg'),
  M('beignets-haricots', 'entrees', 'Beignets de haricots', 'Croustillants, sauce pimentée maison', 3000, ['vg', 'ep']),
  M('nyembwe', 'plats', 'Poulet nyembwe', 'Poulet mijoté à la sauce noix de palme, comme à la maison', 8500, ['sig'], 'x-plat-africain-3.jpg'),
  M('odika', 'plats', 'Bœuf sauce odika', 'Le « chocolat » gabonais : sauce à l\'amande de mangue sauvage', 9500, ['sig'], 'x-plat-africain-2.jpg'),
  M('dg', 'plats', 'Poulet DG', 'Poulet sauté, plantains mûrs, légumes croquants', 9000, [], 'x-plat-africain-5.jpg'),
  M('jollof', 'plats', 'Riz jollof au poulet', 'Riz parfumé à la tomate et aux épices, cuisse de poulet grillée', 8000, ['ep'], 'x-plat-africain-4.jpg'),
  M('gambas', 'plats', 'Gambas sautées au piment', 'Ail, gingembre, piment frais, riz blanc', 12000, ['ep'], 'x-gambas-1.jpg'),
  M('feuilles', 'plats', 'Feuilles de manioc', 'Pilées et mijotées, version végétarienne', 6500, ['vg']),
  M('capitaine', 'grillades', 'Capitaine braisé', 'Poisson entier, marinade citron-piment, sur feuille de bananier', 11000, ['sig'], 'x-poisson-braise-1.jpg'),
  M('bar', 'grillades', 'Bar braisé', 'Poisson entier, oignons, tomates, sauce verte', 9500, [], 'x-poisson-braise-2.jpg'),
  M('brochettes-mix', 'grillades', 'Assiette de brochettes', 'Bœuf, poulet et légumes grillés, pour deux', 12000, [], 'x-brochettes-3.jpg'),
  M('plantain', 'accomp', 'Banane plantain frite', 'Mûre et dorée', 2000, ['vg'], 'x-plantain-1.jpg'),
  M('manioc', 'accomp', 'Bâtons de manioc', 'La tradition, à partager', 1500, ['vg']),
  M('riz', 'accomp', 'Riz blanc ou attiéké', 'Au choix', 1500, ['vg']),
  M('frites-plantain', 'accomp', 'Chips de plantain', 'Fines et croustillantes', 2000, ['vg'], 'x-plantain-2.jpg'),
  M('fondant', 'desserts', 'Fondant au chocolat', 'Cœur coulant, glace vanille', 4000, [], 'x-fondant-1.jpg'),
  M('fruits', 'desserts', 'Salade de fruits du marché', 'Ananas, papaye, mangue, menthe', 3000, ['vg']),
  M('beignets', 'desserts', 'Beignets sucrés', 'Sucre et cannelle, sauce chocolat', 2500, ['vg']),
  M('bissap', 'boissons', 'Bissap maison', 'Fleur d\'hibiscus, menthe, servi bien frais', 1500, ['sig', 'vg'], 'x-bissap-1.jpg'),
  M('gingembre', 'boissons', 'Jus de gingembre maison', 'Pressé chaque matin, piquant', 1500, ['vg', 'ep']),
  M('ananas', 'boissons', 'Jus d\'ananas frais', 'Pur jus, sans sucre ajouté', 2000, ['vg'], 'x-jus-ananas-1.jpg'),
  M('afro-mojito', 'boissons', 'Cocktail Afro Mojito', 'Menthe, citron vert, bissap, eau pétillante (sans alcool sur demande)', 5000, ['sig'], 'x-mojito-1.jpg'),
];

const EVENTS = [
  ['brunch', 'Afro Brunch du dimanche', 'Tous les dimanches, 11 h – 15 h', 'Un brunch généreux aux saveurs africaines : beignets, plantain, œufs, grillades, fruits frais, bissap et gingembre à volonté.', '15 000 FCFA / pers.', PH.brunch],
  ['afro-fusion', 'Soirées Afro Fusion', 'Un vendredi par mois, dès 20 h', 'Musique live, menu dégustation et cocktails signature : l\'Afrique en fête, à Okala.', 'Sur réservation', PH.chant],
  ['privatisation', 'Privatisez le Boko\'s', 'Anniversaires, entreprises, baptêmes', 'Menu personnalisé, décoration aux couleurs de l\'Afrique et service dédié, jusqu\'à 60 invités.', 'Sur devis', PH.salle],
];

const AVIS = [
  ['Ornella', 'Afro Brunch en famille', 'Le brunch du dimanche est devenu notre rituel. Le poulet nyembwe et le bissap à volonté, un bonheur !'],
  ['Kevin', 'Dîner entre amis', 'Cadre cosy, musique au top et un capitaine braisé parfaitement assaisonné. Service souriant.'],
  ['Prisca', 'Anniversaire privatisé', 'Ils ont tout organisé : menu, déco wax, gâteau. Mes invités en parlent encore.'],
];

module.exports = { BK, PH, CATS, MENU, EVENTS, AVIS };
