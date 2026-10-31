// Contenu propre à chaque entreprise : concept, offre, prix et photos.
// Une photo est désignée par son sujet (photos.js), suivi si besoin de « #n » (n-ième photo du sujet).
// Un élément sans photo exacte n'a pas de photo : on n'affiche jamais une image qui ne correspond pas.
const PH = require('./photos');

const m = (t, d, pr, ph) => (ph ? [t, d, pr, ph] : [t, d, pr]);

// ---------------- Restaurants ----------------
const RESTO = {
  akweza: {
    tagline: 'La cuisine du Gabon, comme à la maison',
    intro: 'Akweza sert à Libreville les grands classiques gabonais : nyembwe, poisson braisé, feuilles de manioc et banane plantain, préparés chaque jour avec les produits du marché.',
    about: 'Chez Akweza, les recettes se transmettent de génération en génération. La cuisine mijote dès le matin pour servir, midi et soir, les plats qui font la fierté du Gabon.',
    hero: 'poisson-braise#1', side: 'plat-africain#3',
    menu: {
      'Entrées': [m('Salade avocat-crevettes', 'Avocat, crevettes, vinaigrette au citron', 5000, 'salade-crevettes'), m('Banane plantain frite', 'Plantain mûr, sauce piment maison', 2500, 'plantain#1'), m('Brochettes de bœuf', 'Marinées aux épices, grillées au feu de bois', 4000, 'brochettes#1')],
      'Plats gabonais': [m('Poisson braisé', 'Capitaine entier, plantain et piment', 10000, 'poisson-braise#1'), m('Poulet braisé', 'Riz parfumé, sauce tomate', 8000, 'plat-africain#5'), m('Nyembwe de poulet', 'Sauce graine de palme, riz blanc', 8500), m('Feuilles de manioc', 'Poisson fumé, pâte d\'arachide', 7500), m('Bouillon de poisson', 'Piment, gingembre, citronnelle', 7000)],
      'Boissons maison': [m('Jus de bissap', 'Fleurs d\'hibiscus et menthe', 1500, 'bissap'), m('Jus d\'ananas pressé', 'Pressé à la commande', 2000, 'jus-ananas#1'), m('Eau de coco', 'Servie dans la noix', 2000, 'coco')],
    },
    gallery: ['poisson-braise#1', 'plat-africain#3', 'brochettes#1', 'plantain#1', 'salle-resto#4', 'bissap', 'chef'],
  },
  atomium: {
    tagline: 'Grillades, brasserie et bonne humeur',
    intro: 'L\'Atomium est la brasserie-grill de Libreville : viandes grillées à la commande, planches à partager et cocktails, dans une salle animée du déjeuner au dernier verre.',
    about: 'L\'Atomium est né d\'une envie simple : une brasserie où l\'on mange une belle pièce de viande, entre collègues le midi ou entre amis le soir, sans chichis et sans attendre.',
    hero: 'steak#2', side: 'salle-resto#3',
    menu: {
      'Pour commencer': [m('Salade César', 'Poulet grillé, parmesan, croûtons', 6000, 'cesar'), m('Wings sauce barbecue', '6 pièces, bâtonnets de légumes', 4500, 'wings#1'), m('Planche à partager', 'Charcuterie, fromages, pains grillés', 12000, 'planche#1')],
      'Grillades': [m('Entrecôte grillée', '300 g, sauce au poivre', 14000, 'steak#1'), m('Pièce du boucher', 'Pommes grenaille, légumes du marché', 16000, 'steak#2'), m('Brochettes mixtes', 'Bœuf et poulet marinés', 8000, 'brochettes#2'), m('Poisson du jour grillé', 'Selon arrivage', 11000, 'poisson-braise#3')],
      'Accompagnements': [m('Frites maison', 'Coupées et cuites à la commande', 2000, 'frites'), m('Banane plantain', 'Frite ou braisée', 2000, 'plantain#2')],
      'Desserts': [m('Fondant au chocolat', 'Cœur coulant, glace vanille', 4000, 'fondant#1'), m('Tiramisu', 'Mascarpone et café', 4000, 'tiramisu#1')],
      'Bar': [m('Mojito', 'Rhum, menthe fraîche, citron vert', 5000, 'mojito#1'), m('Jus d\'ananas', 'Pressé minute', 2000, 'jus-ananas#2')],
    },
    gallery: ['steak#2', 'salle-resto#3', 'planche#1', 'wings#1', 'brochettes#2', 'mojito#1', 'fondant#1'],
  },
  'an-j-empire': {
    tagline: 'Les saveurs de toute l\'Afrique',
    intro: 'An-J Empire fait voyager vos papilles de Dakar à Libreville : riz jollof, poisson braisé à l\'ivoirienne, ragoûts mijotés et grillades, servis généreusement.',
    about: 'An-J Empire réunit à Libreville les recettes de tout le continent. Chaque semaine, le chef met un pays à l\'honneur et revisite ses plats emblématiques.',
    hero: 'plat-africain#1', side: 'plat-africain#4',
    menu: {
      'Plats du continent': [m('Riz jollof au poulet', 'Riz épicé à la tomate, poulet grillé', 8000, 'plat-africain#4'), m('Poisson braisé à l\'ivoirienne', 'Attiéké, oignons, piment', 9500, 'poisson-braise#2'), m('Ragoût de bœuf', 'Mijoté aux légumes, riz blanc', 8500, 'plat-africain#2'), m('Assiette de l\'Empire', 'Riz, poulet, poisson et sauces du jour', 12000, 'plat-africain#1')],
      'Grillades': [m('Brochettes de bœuf', 'Épices suya', 4500, 'brochettes#3'), m('Poisson rouge grillé', 'Salade fraîche', 9000, 'plat-africain#6')],
      'Accompagnements': [m('Alloco', 'Banane plantain frite', 2000, 'plantain#2'), m('Riz parfumé', 'Nature ou aux légumes', 1500)],
      'Boissons': [m('Bissap glacé', 'Fait maison', 1500, 'bissap'), m('Jus de gingembre', 'Bien relevé', 1500), m('Jus d\'ananas', 'Pressé minute', 2000, 'jus-ananas#1')],
    },
    gallery: ['plat-africain#1', 'plat-africain#4', 'poisson-braise#2', 'plat-africain#2', 'brochettes#3', 'plat-africain#6'],
  },
  'akwaba-lounge': {
    tagline: 'Lounge, cocktails et soirées',
    intro: 'Akwaba Lounge, c\'est l\'adresse des afterworks et des soirées de Libreville : tapas à partager, grillades, cocktails signature et DJ le week-end.',
    about: 'Akwaba signifie « bienvenue ». Au lounge, on vient pour se retrouver, partager une planche, trinquer et danser jusqu\'à tard dans une ambiance feutrée.',
    hero: 'lounge-bar#1', side: 'dj#3',
    menu: {
      'À partager': [m('Planche Akwaba', 'Charcuterie, fromages, pains grillés', 15000, 'planche#1'), m('Planche apéritive', 'Tapas variés de la maison', 12000, 'planche#2'), m('Wings croustillantes', 'Sauce barbecue maison', 5000, 'wings#1')],
      'Grillades': [m('Gambas sautées', 'Ail, persil, citron', 12000, 'gambas#3'), m('Brochettes du lounge', 'Bœuf mariné, légumes grillés', 6000, 'brochettes#3')],
      'Cocktails signature': [m('Mojito Akwaba', 'Rhum, menthe, citron vert', 6000, 'mojito#2'), m('Virgin Mojito', 'Sans alcool', 4000, 'mojito#2'), m('Ananas givré', 'Ananas frais, citron vert', 4500, 'jus-ananas#2')],
    },
    gallery: ['lounge-bar#1', 'lounge-bar#2', 'dj#3', 'planche#2', 'mojito#2', 'lounge-bar#3', 'gambas#3'],
    events: true,
  },
  'beach-club': {
    tagline: 'Les pieds dans le sable, face à l\'océan',
    intro: 'Le Beach Club vous accueille au bord de l\'océan : poissons et fruits de mer grillés, cocktails frais et transats au soleil, du déjeuner au coucher du soleil.',
    about: 'Au Beach Club, tout tourne autour de la mer : la pêche du jour arrive le matin, le grill s\'allume à midi et les cocktails accompagnent le coucher du soleil.',
    hero: 'terrasse-mer', side: 'gambas#1',
    menu: {
      'Grillades de la mer': [m('Poisson braisé', 'Pêche du jour, plantain', 12000, 'poisson-braise#4'), m('Gambas grillées', 'Beurre citronné', 15000, 'gambas#1'), m('Langouste grillée', 'Selon arrivage', 28000, 'langouste#1')],
      'Fraîcheur': [m('Salade de crevettes', 'Avocat, haricots verts, agrumes', 8000, 'salade-crevettes')],
      'Cocktails': [m('Mojito', 'Rhum, menthe, citron vert', 5000, 'mojito#2'), m('Eau de coco', 'Servie dans la noix', 2000, 'coco'), m('Jus d\'ananas', 'Pressé minute', 2000, 'jus-ananas#1')],
    },
    gallery: ['terrasse-mer', 'plage#2', 'gambas#1', 'langouste#1', 'poisson-braise#4', 'mojito#2', 'coco'],
  },
  'assiga-village': {
    tagline: 'Pointe Denis, les pieds dans le sable',
    intro: 'Assiga Village vous reçoit à Pointe Denis pour une journée hors du temps : traversée, déjeuner de la mer, plage et farniente à quelques minutes de Libreville.',
    about: 'À Assiga, la journée commence par la traversée et se termine face au coucher du soleil. Entre-temps : poisson braisé, langouste et baignade.',
    hero: 'plage#1', side: 'langouste#2',
    menu: {
      'Formules journée': [m('Formule plage', 'Traversée aller-retour, transat, déjeuner', 35000), m('Formule famille', '2 adultes, 2 enfants, déjeuner compris', 110000)],
      'De la mer': [m('Poisson entier braisé', 'Bar ou capitaine, plantain', 13000, 'poisson-braise#1'), m('Langouste grillée', 'Beurre aux herbes', 30000, 'langouste#2'), m('Gambas à la plancha', 'Ail et citron', 15000, 'gambas#4')],
      'De la terre': [m('Brochettes de bœuf', 'Sauce piment', 6000, 'brochettes#1'), m('Banane plantain', 'Frite', 2000, 'plantain#1')],
      'Boissons': [m('Eau de coco', 'Servie dans la noix', 2000, 'coco'), m('Mojito', 'Rhum, menthe, citron vert', 5000, 'mojito#1')],
    },
    gallery: ['plage#1', 'zanzibar#2', 'langouste#2', 'poisson-braise#1', 'gambas#4', 'coco'],
  },
  'akae-beach': {
    tagline: 'Océan, saveurs et good vibes',
    intro: 'Akaé Beach, c\'est la plage version Libreville : grillades de la mer, cocktails et musique, les pieds dans le sable.',
    about: 'Akaé Beach a été pensé comme une parenthèse : de la bonne cuisine de la mer, des cocktails frais et une ambiance détendue au son des vagues.',
    hero: 'plage#2', side: 'gambas#2',
    menu: {
      'Grillades de la mer': [m('Poisson braisé', 'Plantain et piment', 11000, 'poisson-braise#2'), m('Gambas grillées', 'Beurre citronné', 15000, 'gambas#2'), m('Langouste', 'Selon arrivage', 27000, 'langouste#1')],
      'Cocktails': [m('Mojito', 'Rhum, menthe, citron vert', 5000, 'mojito#1'), m('Eau de coco', 'Dans la noix', 2000, 'coco'), m('Jus d\'ananas', 'Pressé minute', 2000, 'jus-ananas#2')],
    },
    gallery: ['plage#2', 'gambas#2', 'poisson-braise#2', 'mojito#1', 'coco', 'terrasse-mer'],
  },
  'bella-mamma': {
    tagline: 'L\'arte della cucina italiana',
    intro: 'Bella Mamma fait la cuisine italienne comme à Naples : pizzas cuites au four, pâtes fraîches maison et desserts de la nonna.',
    about: 'Bella Mamma, c\'est une recette de famille : la pâte repose 48 heures, la sauce tomate mijote doucement et les pâtes sont tirées chaque matin.',
    hero: 'pizza#4', side: 'tagliatelle#1',
    menu: {
      'Pizze': [m('Pizza Margherita', 'Tomate San Marzano, mozzarella, basilic', 7500, 'pizza#1'), m('Pizza Diavola', 'Salami piquant, mozzarella', 9000, 'pizza#3'), m('Pizza Quattro Formaggi', 'Mozzarella, gorgonzola, parmesan, chèvre', 9500), m('Pizza de la Mamma', 'Recette du jour', 9000, 'pizza#4')],
      'Pasta': [m('Tagliatelle al ragù', 'Pâtes fraîches maison, sauce bolognaise', 8500, 'tagliatelle#1'), m('Lasagne della Mamma', 'Recette familiale', 9000, 'lasagne#1'), m('Spaghetti all\'arrabbiata', 'Tomate, ail, piment', 7500, 'tagliatelle#2')],
      'Dolci': [m('Tiramisu', 'Mascarpone et café', 4000, 'tiramisu#2'), m('Panna cotta', 'Coulis de fruits rouges', 3500)],
      'Bevande': [m('Limonade italienne', 'Citron et menthe', 2500), m('Espresso', 'Torréfaction italienne', 1500)],
    },
    gallery: ['pizza#4', 'pizza#1', 'tagliatelle#1', 'lasagne#1', 'tiramisu#2', 'pizza#3'],
  },
  'black-burger': {
    tagline: 'Smash. Melt. Repeat.', cta: 'Commander',
    intro: 'Black Burger prépare à Libreville des burgers smashés à la minute : bœuf frais, cheddar fondant, pain brioché et frites maison.',
    about: 'Chez Black Burger, la viande est hachée le matin et smashée sur la plancha devant vous. Le reste suit la même règle : frais, généreux, rapide.',
    hero: 'burger#1', side: 'frites',
    menu: {
      'Burgers': [m('Black Classic', 'Bœuf 150 g, cheddar, sauce maison', 6500, 'burger#1'), m('Double Smash', '2 × 100 g, double cheddar, oignons', 8500), m('Chicken Crispy', 'Poulet pané, coleslaw', 6000), m('Veggie', 'Galette de légumes, cheddar', 6000)],
      'À côté': [m('Frites maison', 'Sel fumé', 2000, 'frites'), m('Wings × 6', 'Sauce barbecue', 4500, 'wings#1')],
      'Shakes': [m('Milkshake chocolat', 'Chantilly, biscuit', 3500, 'milkshake#1'), m('Milkshake vanille', 'Glace vanille', 3500, 'milkshake#2')],
      'Menus': [m('Menu Classic', 'Burger, frites et boisson', 9500)],
    },
    gallery: ['burger#1', 'frites', 'wings#1', 'milkshake#1', 'milkshake#2'],
  },
  'boko-s-cafe': {
    tagline: 'Café, brunch et bonne humeur',
    intro: 'Boko\'s Café est le repaire des gourmands de Libreville : pancakes, avocado toasts, smoothie bowls et bon café, du petit-déjeuner au goûter.',
    about: 'Boko\'s Café a commencé avec une machine à espresso et une envie : proposer un vrai brunch à Libreville. Aujourd\'hui, c\'est le rendez-vous du week-end.',
    hero: 'pancakes#1', side: 'cafe',
    menu: {
      'Brunch': [m('Pancakes', 'Sirop d\'érable, fruits frais', 5000, 'pancakes#1'), m('Avocado toast', 'Œuf poché, pain au levain', 5500, 'avocado-toast#1'), m('Smoothie bowl', 'Fruits frais, granola', 5000, 'smoothie-bowl#1'), m('Formule brunch', 'Plat, boisson chaude et jus pressé', 9000, 'avocado-toast#2')],
      'Viennoiseries': [m('Croissant', 'Pur beurre', 800, 'croissant#2'), m('Pain au chocolat', 'Deux barres de chocolat', 900, 'pain-chocolat#2')],
      'Douceurs': [m('Éclair au chocolat', 'Crème pâtissière', 2000, 'eclair#1'), m('Tartelette aux fruits', 'Fruits de saison', 2500, 'tarte-fruits#2')],
      'Cafés': [m('Cappuccino', 'Lait mousseux', 2000, 'cafe'), m('Jus d\'ananas', 'Pressé minute', 2000, 'jus-ananas#1')],
    },
    gallery: ['pancakes#1', 'avocado-toast#1', 'cafe', 'smoothie-bowl#1', 'croissant#2', 'pancakes#2', 'smoothie-bowl#2'],
  },
  'ble-dore': {
    tagline: 'Le bon pain, chaque matin',
    intro: 'Le Blé Doré est la boulangerie-pâtisserie et salon de thé de Libreville : pains au levain, viennoiseries pur beurre et pâtisseries fines, faits sur place chaque jour.',
    about: 'Au Blé Doré, le premier fournée sort à 5 h. Farine sélectionnée, levain naturel et beurre de qualité : la boulangerie à la française, à Libreville.',
    hero: 'baguette#1', side: 'croissant#1',
    menu: {
      'Pains': [m('Baguette tradition', 'Levain naturel', 500, 'baguette#1'), m('Pain de campagne', 'Farine bise, croûte épaisse', 1500, 'pain'), m('Baguettes au choix', 'Céréales, complète, viennoise', 700, 'baguette#3')],
      'Viennoiseries': [m('Croissant pur beurre', 'Feuilletage maison', 600, 'croissant#1'), m('Pain au chocolat', 'Deux barres de chocolat noir', 700, 'pain-chocolat#1'), m('Panier de viennoiseries', 'Assortiment de 6 pièces', 4000, 'croissant#3')],
      'Pâtisseries': [m('Tarte aux fruits', 'Fruits de saison', 2500, 'tarte-fruits#1'), m('Éclair au chocolat', 'Crème pâtissière', 1500, 'eclair#2'), m('Gâteau d\'anniversaire', 'Sur commande, 48 h', 'Sur devis')],
      'Salon de thé': [m('Formule petit-déjeuner', 'Boisson chaude, viennoiserie, jus', 3500, 'croissant#4'), m('Café crème', 'Arabica', 1500, 'cafe')],
    },
    gallery: ['baguette#1', 'croissant#1', 'baguette#2', 'tarte-fruits#1', 'pain-chocolat#1', 'eclair#2', 'croissant#3'],
  },
};

// ---------------- Hôtels ----------------
const room = (t, d, pr, size, beds, am, ph) => ({ t, d, pr, size, beds, am, ph });
const AM = ['Wi-Fi', 'Climatisation', 'TV écran plat'];
const HOTEL = {
  'appart-hotel-libreloft': {
    tagline: 'Comme chez vous, le service en plus', intro: 'Libreloft propose à Port-Gentil des studios et appartements meublés, avec cuisine équipée et ménage, pour un séjour d\'une nuit comme de plusieurs mois.',
    about: 'Libreloft est né pour les voyageurs d\'affaires et les familles qui veulent leur indépendance sans renoncer au confort d\'un hôtel : cuisine équipée, ménage, réception joignable à toute heure.',
    hero: 'salon-maison#3', side: 'cuisine-appart#1', week: true,
    rooms: [room('Studio Loft', 'Coin cuisine équipé, bureau', 38000, '28 m²', 'Lit queen size', AM.concat(['Kitchenette', 'Bureau']), ['cuisine-appart#2', 'chambre#5']), room('Appartement 1 chambre', 'Salon séparé, cuisine ouverte', 55000, '45 m²', 'Lit king size', AM.concat(['Cuisine équipée', 'Lave-linge']), ['salon-maison#3', 'chambre#1', 'cuisine-appart#1']), room('Appartement 2 chambres', 'Idéal famille, grand séjour', 85000, '72 m²', '2 chambres', AM.concat(['Cuisine équipée', 'Balcon']), ['salon-maison#5', 'chambre-twin#2', 'cuisine-appart#2'])],
    feats: [['wifi', 'Wi-Fi fibre'], ['resto', 'Cuisine équipée'], ['check', 'Ménage inclus'], ['car', 'Parking sécurisé'], ['shield', 'Accès 24 h/24'], ['cal', 'Tarifs longue durée']],
    gallery: ['salon-maison#3', 'cuisine-appart#1', 'chambre#5', 'salon-maison#5', 'cuisine-appart#2', 'sdb#2'],
  },
  'dounia-park': {
    tagline: 'Hôtel, piscine et loisirs en famille', intro: 'Dounia Park réunit au Cap Estérias un hôtel, une grande piscine et des espaces de jeux : l\'adresse idéale pour un week-end en famille ou un événement.',
    about: 'Dounia Park a été imaginé comme un lieu de détente pour toute la famille : on y dort, on s\'y baigne, on y fête les anniversaires et les fins d\'année.',
    hero: 'piscine#1', side: 'bungalow#3',
    rooms: [room('Chambre Confort', 'Vue sur les jardins', 40000, '22 m²', 'Lit queen size', AM.concat(['Douche à l\'italienne']), ['chambre#2', 'sdb#1']), room('Bungalow Jardin', 'Terrasse privée au cœur du parc', 60000, '35 m²', 'Lit king size', AM.concat(['Terrasse', 'Minibar']), ['bungalow#3', 'chambre#4']), room('Suite Famille', 'Deux lits doubles, grand espace', 80000, '48 m²', '2 lits doubles', AM.concat(['Salon', 'Accès direct piscine']), ['chambre-twin#2', 'piscine#1'])],
    feats: [['pool', 'Grande piscine'], ['users', 'Aire de jeux'], ['resto', 'Restaurant & snack'], ['cal', 'Salle d\'événements'], ['car', 'Parking'], ['wifi', 'Wi-Fi gratuit']],
    gallery: ['piscine#1', 'bungalow#3', 'chambre#2', 'chambre-twin#2', 'buffet#2', 'piscine#4'],
  },
  'chez-jimmy': {
    tagline: 'Bien dormir, bien manger', intro: 'Chez Jimmy est un hôtel-restaurant familial : des chambres simples et soignées, et une table réputée pour sa cuisine généreuse.',
    about: 'Chez Jimmy, on vient d\'abord pour manger, et on revient pour dormir. La maison tient à son accueil familial et à sa cuisine faite maison.',
    hero: 'salle-resto#1', side: 'chambre#4',
    rooms: [room('Chambre Simple', 'Calme et fonctionnelle', 25000, '16 m²', 'Lit double', AM, ['chambre#4']), room('Chambre Double', 'Lumineuse, bureau', 32000, '20 m²', 'Lit queen size', AM.concat(['Bureau']), ['chambre#1', 'sdb#2']), room('Chambre Familiale', 'Jusqu\'à 4 personnes', 45000, '30 m²', '2 lits doubles', AM.concat(['Réfrigérateur']), ['chambre-twin#3'])],
    feats: [['resto', 'Restaurant maison'], ['wifi', 'Wi-Fi gratuit'], ['car', 'Parking'], ['heart', 'Accueil familial'], ['shield', 'Gardiennage 24 h/24'], ['clock', 'Petit-déjeuner dès 6 h 30']],
    gallery: ['salle-resto#1', 'chambre#4', 'chambre#1', 'poisson-braise#3', 'chambre-twin#3', 'buffet#1'],
  },
  'hotel-le-minkebe': {
    tagline: 'L\'hospitalité gabonaise au cœur de la ville', intro: 'L\'Hôtel Le Minkébé accueille voyageurs d\'affaires et visiteurs dans des chambres confortables, à deux pas des administrations et des commerces.',
    about: 'Le Minkébé porte le nom du grand parc du nord du Gabon. L\'hôtel en garde l\'esprit : du calme, de l\'espace et une équipe attentionnée.',
    hero: 'lobby#2', side: 'suite#1',
    rooms: [room('Chambre Classique', 'Confort essentiel', 42000, '20 m²', 'Lit queen size', AM.concat(['Bureau']), ['chambre#3']), room('Chambre Confort', 'Deux lits, idéale en duo', 52000, '24 m²', '2 lits', AM.concat(['Minibar']), ['chambre-twin#1', 'sdb#1']), room('Suite Minkébé', 'Salon séparé, vue dégagée', 95000, '45 m²', 'Lit king size', AM.concat(['Salon', 'Minibar', 'Baignoire']), ['suite#1', 'sdb#1'])],
    feats: [['wifi', 'Wi-Fi gratuit'], ['resto', 'Restaurant & bar'], ['users', 'Salle de réunion'], ['car', 'Parking sécurisé'], ['plane', 'Navette aéroport'], ['shield', 'Réception 24 h/24']],
    gallery: ['lobby#2', 'chambre#3', 'chambre-twin#1', 'suite#1', 'salle-resto#2', 'sdb#1'],
  },
  'hotel-le-lagon-bleu': {
    tagline: 'Le calme, au bord de l\'eau', intro: 'L\'Hôtel Le Lagon Bleu offre une parenthèse au bord de l\'eau : chambres ouvertes sur le jardin, piscine et terrasse pour admirer le coucher du soleil.',
    about: 'Au Lagon Bleu, on prend le temps : petit-déjeuner en terrasse, après-midi à la piscine, dîner face à l\'eau.',
    hero: 'piscine#3', side: 'bungalow#1',
    rooms: [room('Chambre Vue Jardin', 'Ouverte sur la verdure', 48000, '22 m²', 'Lit queen size', AM, ['chambre#2']), room('Chambre Vue Lagune', 'Baie vitrée face à l\'eau', 62000, '26 m²', 'Lit king size', AM.concat(['Terrasse']), ['bungalow#1']), room('Suite Lagon', 'Grand salon, vue panoramique', 110000, '50 m²', 'Lit king size', AM.concat(['Salon', 'Baignoire']), ['suite#3', 'sdb#1'])],
    feats: [['pool', 'Piscine & transats'], ['resto', 'Restaurant en terrasse'], ['wifi', 'Wi-Fi gratuit'], ['heart', 'Massages sur demande'], ['car', 'Parking'], ['plane', 'Navette aéroport']],
    gallery: ['piscine#3', 'bungalow#1', 'chambre#2', 'suite#3', 'terrasse-hotel', 'buffet#3'],
  },
  'hotel-heliconia': {
    tagline: 'Un jardin tropical en ville', intro: 'L\'Hôtel Héliconia vous accueille dans un écrin de verdure : chambres lumineuses, piscine entourée de palmiers et service attentionné.',
    about: 'L\'héliconia est une fleur tropicale aux couleurs vives. L\'hôtel lui ressemble : chaleureux, coloré et tourné vers le jardin.',
    hero: 'piscine#2', side: 'chambre#5',
    rooms: [room('Chambre Standard', 'Lumineuse et calme', 45000, '20 m²', 'Lit double', AM, ['chambre#5']), room('Chambre Deluxe', 'Plus d\'espace, coin salon', 65000, '28 m²', 'Lit king size', AM.concat(['Coin salon', 'Minibar']), ['chambre#1', 'sdb#2']), room('Suite Héliconia', 'Salon, vue sur la piscine', 100000, '48 m²', 'Lit king size', AM.concat(['Salon', 'Balcon']), ['suite#2'])],
    feats: [['pool', 'Piscine'], ['leaf', 'Jardin tropical'], ['resto', 'Restaurant & bar'], ['wifi', 'Wi-Fi gratuit'], ['car', 'Parking'], ['shield', 'Réception 24 h/24']],
    gallery: ['piscine#2', 'chambre#5', 'chambre#1', 'suite#2', 'sdb#2', 'salle-resto#2'],
  },
  'hotel-bambou': {
    tagline: 'L\'esprit lodge, au calme', intro: 'L\'Hôtel Bambou mêle confort et nature : chambres et bungalows en bois, piscine et terrasse pour se reposer loin du bruit.',
    about: 'Bois, lin et verdure : l\'Hôtel Bambou a été pensé comme un lodge, pour se ressourcer le temps d\'une nuit ou d\'un week-end.',
    hero: 'piscine#4', side: 'bungalow#3',
    rooms: [room('Chambre Bambou', 'Décor bois et lin', 40000, '20 m²', 'Lit queen size', AM, ['chambre#4']), room('Bungalow', 'Indépendant, terrasse privée', 58000, '32 m²', 'Lit king size', AM.concat(['Terrasse']), ['bungalow#3', 'chambre#2']), room('Suite Bambou', 'Salon et grande salle de bain', 90000, '45 m²', 'Lit king size', AM.concat(['Salon', 'Baignoire']), ['suite#1', 'sdb#1'])],
    feats: [['pool', 'Piscine'], ['leaf', 'Cadre nature'], ['resto', 'Restaurant'], ['wifi', 'Wi-Fi'], ['car', 'Parking'], ['heart', 'Accueil personnalisé']],
    gallery: ['piscine#4', 'bungalow#3', 'chambre#4', 'suite#1', 'lodge', 'bungalow#2'],
  },
  'hotel-le-jomonia': {
    tagline: 'L\'hôtel des voyageurs d\'affaires', intro: 'L\'Hôtel Le Jomonia accueille les voyageurs d\'affaires : chambres équipées d\'un bureau, Wi-Fi rapide, salle de réunion et navette aéroport.',
    about: 'Au Jomonia, tout est pensé pour ceux qui travaillent : check-in rapide, petit-déjeuner dès 6 h et salle de réunion équipée.',
    hero: 'lobby#1', side: 'chambre#3',
    rooms: [room('Single Business', 'Bureau ergonomique', 45000, '18 m²', 'Lit double', AM.concat(['Bureau', 'Machine à café']), ['chambre#3']), room('Double Confort', 'Deux lits, idéale pour les équipes', 58000, '24 m²', '2 lits', AM.concat(['Bureau']), ['chambre-twin#2']), room('Suite Exécutive', 'Salon de travail séparé', 105000, '46 m²', 'Lit king size', AM.concat(['Salon', 'Bureau', 'Minibar']), ['suite#3'])],
    feats: [['wifi', 'Wi-Fi rapide'], ['users', 'Salle de réunion'], ['plane', 'Navette aéroport'], ['resto', 'Petit-déjeuner dès 6 h'], ['car', 'Parking'], ['shield', 'Réception 24 h/24']],
    gallery: ['lobby#1', 'chambre#3', 'chambre-twin#2', 'suite#3', 'buffet#1', 'bureaux#3'],
  },
  'hotel-akewa': {
    tagline: 'Le confort, en toute simplicité', intro: 'L\'Hôtel Akewa propose des chambres modernes et une suite spacieuse, avec un accueil attentionné et un excellent petit-déjeuner.',
    about: 'Akewa signifie « merci » en langue myènè. C\'est l\'esprit de la maison : remercier chaque client par un service soigné.',
    hero: 'lobby#3', side: 'suite#2',
    rooms: [room('Chambre Akewa', 'Moderne et lumineuse', 43000, '20 m²', 'Lit queen size', AM, ['chambre#2']), room('Chambre Prestige', 'Deux lits, vue sur la ville', 60000, '26 m²', '2 lits', AM.concat(['Minibar']), ['chambre-twin#3']), room('Suite Akewa', 'Salon, grande salle de bain', 120000, '55 m²', 'Lit king size', AM.concat(['Salon', 'Baignoire', 'Minibar']), ['suite#2', 'sdb#2'])],
    feats: [['wifi', 'Wi-Fi gratuit'], ['resto', 'Petit-déjeuner buffet'], ['car', 'Parking'], ['plane', 'Navette aéroport'], ['shield', 'Sécurité 24 h/24'], ['users', 'Salle de séminaire']],
    gallery: ['lobby#3', 'chambre#2', 'chambre-twin#3', 'suite#2', 'buffet#2', 'sdb#2'],
  },
  'hotel-glass': {
    tagline: 'Au cœur du quartier Glass', intro: 'L\'Hôtel Glass vous accueille au cœur de Libreville, dans le quartier Glass : chambres business, suite et bar à deux pas du centre-ville.',
    about: 'L\'Hôtel Glass a choisi l\'un des quartiers historiques de Libreville. Une adresse centrale, moderne et pratique.',
    hero: 'lobby#1', side: 'suite#1',
    rooms: [room('Chambre Business', 'Deux lits, bureau', 50000, '22 m²', '2 lits', AM.concat(['Bureau']), ['chambre-twin#1']), room('Chambre Executive', 'Grand lit, coin salon', 65000, '26 m²', 'Lit king size', AM.concat(['Coin salon']), ['chambre#3']), room('Suite Glass', 'Salon et vue sur la ville', 115000, '50 m²', 'Lit king size', AM.concat(['Salon', 'Minibar']), ['suite#1'])],
    feats: [['pin', 'Emplacement central'], ['wifi', 'Wi-Fi rapide'], ['resto', 'Bar & restaurant'], ['users', 'Salle de réunion'], ['car', 'Parking'], ['shield', 'Réception 24 h/24']],
    gallery: ['lobby#1', 'chambre-twin#1', 'chambre#3', 'suite#1', 'salle-resto#1', 'sdb#1'],
  },
  'hotel-le-refuge': {
    tagline: 'Le réveil sur le fleuve', intro: 'L\'Hôtel Le Refuge accueille à Lambaréné ceux qui veulent vivre l\'Ogooué : chambres et bungalows au bord du fleuve, jardin tropical et cuisine locale.',
    about: 'Le Refuge est né au bord de l\'Ogooué. Ici, le fleuve rythme la journée : pirogue le matin, sieste au jardin, dîner face au coucher du soleil.',
    hero: 'bungalow#2', side: 'chambre#1',
    rooms: [room('Chambre Fleuve', 'Vue sur l\'Ogooué', 45000, '22 m²', 'Lit queen size', AM.concat(['Moustiquaire']), ['chambre#1']), room('Bungalow Forêt', 'Au cœur du jardin tropical', 60000, '30 m²', 'Lit king size', AM.concat(['Terrasse']), ['bungalow#2', 'chambre#4']), room('Suite Ogooué', 'Salon et terrasse sur le fleuve', 95000, '45 m²', 'Lit king size', AM.concat(['Salon', 'Terrasse']), ['suite#3'])],
    feats: [['leaf', 'Jardin tropical'], ['pool', 'Piscine'], ['resto', 'Cuisine locale'], ['wifi', 'Wi-Fi'], ['plane', 'Excursions en pirogue'], ['shield', 'Réception 24 h/24']],
    gallery: ['bungalow#2', 'chambre#1', 'suite#3', 'gabon#2', 'pirogues', 'piscine#5'],
  },
  'hotel-hibiscus': {
    tagline: 'Votre adresse fleurie à Libreville', intro: 'L\'Hôtel Hibiscus vous reçoit dans un cadre fleuri : chambres confortables, suite et piscine, avec un service soigné.',
    about: 'Hibiscus, c\'est une maison accueillante où l\'on se sent vite chez soi : un jardin fleuri, une piscine et une équipe aux petits soins.',
    hero: 'piscine#5', side: 'chambre#5',
    rooms: [room('Chambre Hibiscus', 'Calme et fleurie', 44000, '20 m²', 'Lit queen size', AM, ['chambre#5']), room('Chambre Supérieure', 'Plus grande, coin bureau', 58000, '25 m²', 'Lit king size', AM.concat(['Bureau']), ['chambre#4', 'sdb#2']), room('Suite Hibiscus', 'Salon séparé', 98000, '46 m²', 'Lit king size', AM.concat(['Salon', 'Minibar']), ['suite#2'])],
    feats: [['pool', 'Piscine'], ['leaf', 'Jardin fleuri'], ['resto', 'Restaurant'], ['wifi', 'Wi-Fi gratuit'], ['car', 'Parking'], ['plane', 'Navette aéroport']],
    gallery: ['piscine#5', 'chambre#5', 'chambre#4', 'suite#2', 'sdb#2', 'buffet#3'],
  },
};

// ---------------- Beauté ----------------
const s = (t, d, pr) => [t, d, pr];
const BEAUTE = {
  'institut-de-beaute-ivora': { tagline: 'Visage et corps, en douceur', intro: 'L\'Institut Ivora prend soin de votre visage et de votre corps : soins sur mesure, épilation et massages dans un espace calme.', hero: 'soin-visage#4', side: 'massage#1',
    cats: { 'Visage': [s('Soin hydratant', '60 min · tous types de peau', 20000), s('Nettoyage de peau', '45 min · extraction douce', 15000), s('Soin anti-taches', '60 min', 25000)], 'Corps': [s('Gommage corps', '45 min', 18000), s('Massage relaxant', '60 min', 25000)], 'Épilation': [s('Jambes complètes', 'Cire tiède', 10000), s('Maillot', 'Cire tiède', 6000), s('Sourcils', 'Cire ou fil', 3000)] },
    catPh: { 'Visage': 'soin-visage#4', 'Corps': 'massage#1', 'Épilation': 'epilation#2' }, gallery: ['soin-visage#4', 'soin-visage#1', 'massage#1', 'epilation#2', 'salon-beaute', 'soin-visage#3'] },
  'dalhias-institut': { tagline: 'Des mains et des pieds sublimés', intro: 'Dalhias Institut est spécialiste de la beauté des mains et des pieds : manucure, pose gel, pédicure et épilation.', hero: 'manucure#2', side: 'pedicure',
    cats: { 'Mains': [s('Manucure', 'Soin + vernis', 8000), s('Pose gel', 'Couleur au choix', 15000), s('Semi-permanent', 'Tenue 3 semaines', 10000)], 'Pieds': [s('Beauté des pieds', 'Soin complet + vernis', 12000), s('Pédicure spa', 'Bain, gommage, massage', 15000)], 'Épilation': [s('Jambes complètes', 'Cire', 10000), s('Aisselles', 'Cire', 4000)] },
    catPh: { 'Mains': 'manucure#2', 'Pieds': 'pedicure', 'Épilation': 'epilation#1' }, gallery: ['manucure#2', 'nail-art#1', 'pedicure', 'manucure#1', 'epilation#1', 'manucure#3'] },
  'institut-ozenga': { tagline: 'La beauté au naturel', intro: 'L\'Institut Ozenga soigne les peaux noires avec des actifs naturels : karité, huile de coco et argiles, pour un teint éclatant.', hero: 'soin-peau-noire#2', side: 'cosmetiques#1',
    cats: { 'Soins visage': [s('Soin éclat au karité', '60 min', 22000), s('Masque à l\'argile', '45 min', 15000), s('Soin anti-taches', '60 min', 25000)], 'Corps': [s('Gommage au sucre de canne', '45 min', 18000), s('Massage à l\'huile de coco', '60 min', 25000)], 'Forfaits': [s('Forfait éclat', 'Soin visage + gommage', 35000), s('Forfait mariée', 'Préparation de la peau, 3 séances', 70000)] },
    catPh: { 'Soins visage': 'soin-peau-noire#2', 'Corps': 'massage-pierres#2', 'Forfaits': 'portrait-beaute#3' }, gallery: ['soin-peau-noire#2', 'soin-peau-noire#1', 'cosmetiques#1', 'portrait-beaute#3', 'massage-pierres#2', 'soin-visage#2'] },
  'hk-beaute': { tagline: 'Un regard qui fait la différence', intro: 'HK Beauté est spécialiste du regard et du maquillage : extensions de cils, sourcils et maquillage pour toutes les occasions.', hero: 'maquillage#1', side: 'cils#1',
    cats: { 'Regard': [s('Extensions de cils', 'Pose cil à cil', 25000), s('Remplissage cils', 'Sous 3 semaines', 15000), s('Rehaussement de cils', 'Avec teinture', 18000), s('Sourcils', 'Restructuration', 5000)], 'Maquillage': [s('Maquillage jour', '30 min', 15000), s('Maquillage soirée', '45 min', 25000), s('Maquillage mariée', 'Essai + jour J', 60000)] },
    catPh: { 'Regard': 'cils#1', 'Maquillage': 'maquillage#1' }, gallery: ['maquillage#1', 'cils#1', 'cils#2', 'maquillage#2', 'maquillage-produits', 'portrait-beaute#1'] },
  'l-africaine-libreville': { tagline: 'La beauté des peaux noires', intro: 'L\'Africaine sublime la beauté noire : soins de la peau, maquillage adapté et coiffures afro, dans un institut chaleureux.', hero: 'portrait-beaute#2', side: 'tresses#2',
    cats: { 'Peau': [s('Soin éclat peau noire', '60 min', 22000), s('Soin hydratation intense', '45 min', 18000)], 'Maquillage': [s('Maquillage adapté', 'Jour ou soirée', 20000), s('Maquillage mariée', 'Essai inclus', 55000)], 'Coiffure': [s('Tresses', 'Selon longueur', 15000), s('Soin capillaire', 'Cheveux naturels', 10000)] },
    catPh: { 'Peau': 'soin-peau-noire#1', 'Maquillage': 'maquillage#2', 'Coiffure': 'tresses#2' }, gallery: ['portrait-beaute#2', 'soin-peau-noire#1', 'maquillage#2', 'tresses#2', 'portrait-beaute#1', 'shampoing'] },
  'eva-spa-chez-clarisse': { tagline: 'Votre moment, rien qu\'à vous', intro: 'Eva Spa chez Clarisse vous offre une vraie pause : massages, pierres chaudes, hammam et soins du visage, seul ou à deux.', hero: 'massage-pierres#1', side: 'massage#1',
    cats: { 'Massages': [s('Massage relaxant', '60 min · huiles chaudes', 25000), s('Massage aux pierres chaudes', '75 min', 32000), s('Rituel duo', '90 min · à deux', 50000)], 'Spa': [s('Hammam et gommage', '45 min', 20000), s('Soin du visage éclat', '60 min', 22000)] },
    catPh: { 'Massages': 'massage-pierres#1', 'Spa': 'soin-visage#2' }, gallery: ['massage-pierres#1', 'massage#1', 'massage-pierres#2', 'soin-visage#2', 'salon-beaute', 'soin-visage#1'] },
  'beauty-of-color-nail-bar': { tagline: 'Des ongles qui ont du style', intro: 'Beauty of Color est le nail bar de Libreville : pose gel, semi-permanent et nail art sur mesure, mains et pieds.', hero: 'nail-art#2', side: 'manucure#3',
    cats: { 'Ongles': [s('Pose gel', 'Couleur au choix', 15000), s('Semi-permanent mains', 'Tenue 3 semaines', 10000), s('Remplissage gel', 'Sous 3 semaines', 12000)], 'Nail art': [s('Nail art', 'Par ongle', 1000), s('Baby boomer', 'Dégradé naturel', 18000)], 'Pieds': [s('Beauté des pieds', 'Soin complet + vernis', 12000)] },
    catPh: { 'Ongles': 'manucure#3', 'Nail art': 'nail-art#2', 'Pieds': 'pedicure' }, gallery: ['nail-art#2', 'nail-art#1', 'manucure#3', 'pedicure', 'manucure#1', 'manucure#2'] },
  'institut-sheba': { tagline: 'Coiffure et beauté afro', intro: 'L\'Institut Sheba coiffe et sublime : tresses, pose de perruques, brushing et soins capillaires pour cheveux naturels.', hero: 'tresses#1', side: 'salon-coiffure',
    cats: { 'Coiffure': [s('Tresses', 'Selon longueur', 15000), s('Pose perruque', 'Lace et personnalisation', 20000), s('Brushing', 'Soin inclus', 8000)], 'Soins': [s('Soin capillaire profond', 'Cheveux naturels', 10000), s('Shampoing et coiffage', '30 min', 5000)], 'Beauté': [s('Maquillage', 'Jour ou soirée', 15000)] },
    catPh: { 'Coiffure': 'tresses#1', 'Soins': 'shampoing', 'Beauté': 'maquillage#2' }, gallery: ['tresses#1', 'tresses#2', 'salon-coiffure', 'shampoing', 'maquillage#2', 'portrait-beaute#1'] },
  'skin-technology-by-latania': { tagline: 'Le soin qui vous ressemble', intro: 'Skin Technology by Latania traite les problèmes de peau : diagnostic, peelings, microneedling et soins experts.', hero: 'soin-visage#4', side: 'serums#1',
    cats: { 'Diagnostic': [s('Diagnostic de peau', 'Analyse et protocole', 10000)], 'Soins experts': [s('Peeling éclat', 'Taches et teint terne', 35000), s('Microneedling', 'Texture et cicatrices', 50000), s('Hydrafacial', 'Nettoyage profond', 40000)] },
    catPh: { 'Diagnostic': 'soin-visage#4', 'Soins experts': 'serums#1' }, gallery: ['soin-visage#4', 'serums#1', 'serums#3', 'soin-peau-noire#1', 'soin-visage#2', 'serums#2'] },
};

// ---------------- Immobilier ----------------
const L = (t, typ, ch, m2, pr, ph) => ({ t, typ, ch, m2, pr, ph });
const LIST = {
  villaPiscine: L('Villa avec piscine', 'Vente', 4, 320, 185000000, ['villa#1', 'salon-maison#2', 'cuisine-appart#1']),
  villaModerne: L('Villa contemporaine', 'Vente', 5, 380, 240000000, ['villa#3', 'salon-maison#7', 'villa#4']),
  villaLoc: L('Villa avec piscine', 'Location', 4, 300, 2500000, ['villa#2', 'salon-maison#9', 'cuisine-appart#2']),
  maison: L('Maison familiale', 'Vente', 4, 250, 95000000, ['villa#4', 'salon-maison#1']),
  duplex: L('Duplex moderne', 'Vente', 3, 210, 120000000, ['villa#3', 'salon-maison#4']),
  apptF3: L('Appartement meublé F3', 'Location', 2, 95, 650000, ['salon-maison#3', 'cuisine-appart#1']),
  apptF4: L('Appartement F4', 'Location', 3, 120, 900000, ['salon-maison#6', 'residence#1']),
  apptVente: L('Appartement standing', 'Vente', 3, 140, 85000000, ['salon-maison#8', 'residence#2']),
  studio: L('Studio meublé', 'Location', 1, 35, 250000, ['cuisine-appart#2']),
  immeuble: L('Immeuble de rapport', 'Vente', 0, 600, 450000000, ['residence#3', 'residence#1']),
  bureaux: L('Plateau de bureaux', 'Location', 0, 150, 1200000, ['bureaux#1', 'bureaux#2']),
  bureauxVente: L('Bureaux équipés', 'Vente', 0, 220, 160000000, ['bureaux#3', 'bureaux#1']),
  terrain: L('Terrain titré', 'Vente', 0, 600, 45000000, ['terrain']),
  terrainGrand: L('Terrain viabilisé', 'Vente', 0, 1500, 90000000, ['terrain']),
};
const ZONES = { Libreville: ['Batterie IV', 'Glass', 'Angondjé', 'Haut de Gué-Gué', 'Okala', 'Nzeng-Ayong', 'Louis', 'Sablière', 'Charbonnages', 'Akébé'], 'Port-Gentil': ['Balise', 'Centre-ville', 'Grand Village', 'Matanda', 'Ntchengué'], Akanda: ['Angondjé', 'Cap Estérias', 'Malibé', 'Avorbam'] };
const IMMO = {
  'l-agence-immo': { mode: 'agence', tagline: 'Trouvez le bien qui vous ressemble', hero: 'villa#1', side: 'cles', picks: ['villaPiscine', 'apptF3', 'duplex', 'studio', 'terrain', 'apptF4', 'bureaux', 'maison', 'villaLoc'] },
  'la-rochelle-immobilier': { mode: 'agence', tagline: 'L\'immobilier en confiance', hero: 'villa#2', side: 'salon-maison#7', picks: ['villaModerne', 'apptVente', 'villaLoc', 'apptF4', 'terrainGrand', 'studio', 'bureauxVente', 'apptF3'] },
  centrimmo: { mode: 'agence', tagline: 'Acheter, louer, investir sereinement', hero: 'residence#1', side: 'salon-maison#6', picks: ['apptF4', 'immeuble', 'apptF3', 'bureaux', 'apptVente', 'studio', 'villaPiscine', 'terrain'] },
  'wanted-immobilier': { mode: 'agence', tagline: 'Le bien que vous recherchez', hero: 'villa#3', side: 'salon-maison#9', picks: ['villaLoc', 'duplex', 'apptF3', 'maison', 'studio', 'villaModerne', 'apptF4', 'terrain'] },
  'agence-immobiliere-de-libreville': { mode: 'agence', tagline: 'L\'immobilier de confiance à Libreville', hero: 'villa#4', side: 'salon-maison#1', picks: ['maison', 'apptF4', 'villaPiscine', 'bureaux', 'apptF3', 'terrainGrand', 'apptVente', 'studio'] },
  'home-et-co': { mode: 'agence', tagline: 'Chez vous, enfin', hero: 'salon-maison#10', side: 'cuisine-appart#1', picks: ['apptF3', 'villaLoc', 'studio', 'apptF4', 'duplex', 'villaModerne', 'apptVente'] },
  'yeshua-real-estate': { mode: 'agence', tagline: 'Investir sereinement au Gabon', hero: 'villa#1', side: 'salon-maison#11', picks: ['villaModerne', 'terrainGrand', 'immeuble', 'villaPiscine', 'apptVente', 'bureauxVente', 'terrain'] },
  'sci-gloria': { mode: 'sci', tagline: 'Des résidences bien tenues', hero: 'residence#1', side: 'salon-maison#3', picks: ['apptF3', 'apptF4', 'studio', 'bureaux'] },
  'sci-sofiga': { mode: 'sci', tagline: 'Louez en toute sérénité', hero: 'residence#2', side: 'salon-maison#6', picks: ['apptF4', 'villaLoc', 'apptF3', 'studio'] },
  'sci-noh-et-fils': { mode: 'sci', tagline: 'Un patrimoine familial à votre service', hero: 'residence#3', side: 'salon-maison#8', picks: ['villaLoc', 'apptF3', 'bureaux', 'studio'] },
  'ela-expertise': { mode: 'expertise', tagline: 'La juste valeur de votre bien', hero: 'villa#4', side: 'cles' },
  'gabon-management-services': { mode: 'gestion', tagline: 'Votre patrimoine, bien géré', hero: 'residence#2', side: 'bureaux#3', picks: ['apptF3', 'apptF4', 'villaLoc', 'studio', 'bureaux'] },
};

// ---------------- Santé ----------------
const sv = (icon, t, d, ph) => [icon, t, d, ph];
const SANTE = {
  'cabinet-dentaire-demel': { label: 'Nos soins', tagline: 'Des soins dentaires pour toute la famille', hero: 'cabinet-dentaire', side: 'dentiste-enfant',
    services: [sv('tooth', 'Soins et détartrage', 'Contrôle, détartrage et soins des caries.', 'dentiste#1'), sv('heart', 'Dentisterie pour enfants', 'Des soins doux pour les plus petits.', 'dentiste-enfant'), sv('sparkle', 'Blanchiment', 'Un sourire plus éclatant en une séance.'), sv('users', 'Orthodontie', 'Appareils pour enfants et adolescents.'), sv('shield', 'Prothèses', 'Couronnes et bridges sur mesure.'), sv('clock', 'Urgences', 'Rendez-vous dans la journée.')] },
  'cabinet-dentaire-avicenne': { label: 'Nos soins', tagline: 'Implants et esthétique du sourire', hero: 'implant#2', side: 'implant#1',
    services: [sv('shield', 'Implants dentaires', 'Remplacement durable des dents manquantes.', 'implant#1'), sv('sparkle', 'Couronnes céramique', 'Esthétiques et résistantes.', 'implant#3'), sv('star', 'Blanchiment', 'Un sourire éclatant.'), sv('tooth', 'Facettes', 'Pour corriger forme et couleur.'), sv('heart', 'Parodontologie', 'Soins des gencives.'), sv('check', 'Détartrage', 'Hygiène et prévention.', 'dentiste#2')] },
  'cabinet-dentaire-acae-sourire': { label: 'Nos soins', tagline: 'L\'orthodontie, à tout âge', hero: 'dentiste#2', side: 'dentiste-enfant',
    services: [sv('users', 'Orthodontie enfants', 'Bilan dès 7 ans et suivi.', 'dentiste-enfant'), sv('sparkle', 'Aligneurs transparents', 'Discrets, pour les adultes.'), sv('tooth', 'Bagues céramique', 'Couleur de la dent.'), sv('shield', 'Contention', 'Pour garder le résultat.'), sv('check', 'Bilan orthodontique', 'Radio et plan de traitement.'), sv('heart', 'Soins dentaires', 'Caries, détartrage, contrôle.', 'dentiste#1')] },
  'cabinet-dentaire-dr-abbas': { label: 'Nos soins', tagline: 'Votre dentiste, même en urgence', hero: 'cabinet-dentaire', side: 'dentiste#1',
    services: [sv('clock', 'Urgences dentaires', 'Douleur, abcès, dent cassée : reçu dans la journée.', 'dentiste#1'), sv('tooth', 'Soins des caries', 'Composites couleur de la dent.'), sv('check', 'Détartrage', 'Hygiène et prévention.', 'dentiste#2'), sv('shield', 'Extractions', 'Y compris dents de sagesse.'), sv('star', 'Prothèses', 'Couronnes, bridges et appareils.'), sv('sparkle', 'Implants', 'Solution fixe et durable.', 'implant#2')] },
  'cabinet-de-radiologie-cimel': { label: 'Nos examens', tagline: 'Imagerie médicale de précision', hero: 'scanner#1', side: 'radio#3',
    services: [sv('sante', 'Radiographie numérique', 'Résultats immédiats, faible dose.', 'radio#1'), sv('sparkle', 'Échographie', 'Abdominale, pelvienne, obstétricale.'), sv('shield', 'Scanner', 'Examens avec ou sans injection.', 'scanner#1'), sv('star', 'IRM', 'Imagerie de haute précision.', 'scanner#2'), sv('heart', 'Mammographie', 'Dépistage et diagnostic.'), sv('clock', 'Comptes rendus rapides', 'Sous 24 h, envoyés au médecin.', 'radio#3')] },
  'cabinet-medical-saint-raphael': { label: 'Nos consultations', tagline: 'Votre santé vasculaire, notre priorité', hero: 'tension', side: 'medecin',
    services: [sv('heart', 'Consultation d\'angiologie', 'Bilan des veines et des artères.', 'tension'), sv('sante', 'Écho-doppler', 'Veineux et artériel.'), sv('shield', 'Traitement des varices', 'Sclérothérapie et suivi.'), sv('sparkle', 'Bilan vasculaire', 'Pour les patients à risque.'), sv('check', 'Prévention de la phlébite', 'Conseils et contention.'), sv('clock', 'Suivi personnalisé', 'Rendez-vous de contrôle.', 'medecin')] },
  'alpha-omega-diagnostic': { label: 'Nos consultations', tagline: 'Médecine générale et ophtalmologie', hero: 'ophtalmo#1', side: 'tension',
    services: [sv('sante', 'Médecine générale', 'Consultations adultes et enfants.', 'medecin'), sv('sparkle', 'Ophtalmologie', 'Examen complet de la vue.', 'ophtalmo#1'), sv('star', 'Examen de la vue', 'Mesure de l\'acuité, prescription.', 'ophtalmo#2'), sv('heart', 'Bilans de santé', 'Tension, glycémie, bilan complet.', 'tension'), sv('check', 'Certificats médicaux', 'Sport, emploi, voyage.'), sv('shield', 'Vaccinations', 'Calendrier vaccinal et voyages.')] },
  biolab: { label: 'Nos analyses', tagline: 'Des analyses fiables, des résultats rapides', hero: 'microscope', side: 'infirmiere',
    services: [sv('sante', 'Bilan sanguin', 'NFS, glycémie, cholestérol, bilan complet.', 'microscope'), sv('sparkle', 'Analyses spécialisées', 'Hormonologie, sérologies, microbiologie.'), sv('car', 'Prélèvement à domicile', 'Une infirmière vient chez vous.', 'infirmiere'), sv('clock', 'Résultats en 24 h', 'Pour la plupart des analyses.'), sv('shield', 'Résultats en ligne', 'Consultables et partageables.'), sv('users', 'Entreprises', 'Bilans d\'embauche et de suivi.')] },
};

// ---------------- Voyage ----------------
const D = (t, d, pr, z, ph, days) => ({ t, d, pr, z, ph, days });
const VOYAGE = {
  'escapade-travel-agency': { tagline: 'Plages et villes de rêve', hero: 'zanzibar#1', side: 'maurice#1',
    dest: [D('Zanzibar', '7 jours · plages et Stone Town', 1250000, 'Afrique', 'zanzibar#1'), D('Île Maurice', '8 jours · lagons turquoise', 1450000, 'Afrique', 'maurice#1'), D('Dubaï', '5 jours · vol + hôtel', 890000, 'Monde', 'dubai#1'), D('Le Cap', '6 jours · Table Mountain', 1150000, 'Afrique', 'cape-town#1'), D('Marrakech', '6 jours · riads et souks', 980000, 'Afrique', 'marrakech#2'), D('Paris', 'Billet + 4 nuits', 1050000, 'Monde', 'paris#1')] },
  'araa-services': { tagline: 'Billets, visas et séjours', hero: 'passeport', side: 'avion',
    dest: [D('Paris', 'Billet aller-retour', 650000, 'Monde', 'paris#2'), D('Dubaï', 'Billet + visa', 780000, 'Monde', 'dubai#2'), D('Istanbul', '6 jours · vol + hôtel', 1100000, 'Monde', 'istanbul#1'), D('Marrakech', '5 jours · vol + riad', 850000, 'Afrique', 'marrakech#1'), D('Dakar', 'Billet aller-retour', 450000, 'Afrique', 'dakar#2')] },
  'elixir-center': { tagline: 'Voyages d\'affaires et en famille', hero: 'avion', side: 'istanbul#2',
    dest: [D('Istanbul', '5 jours · affaires et shopping', 990000, 'Monde', 'istanbul#2'), D('Le Cap', '7 jours · en famille', 1300000, 'Afrique', 'cape-town#2'), D('Dakar', '4 jours · île de Gorée', 620000, 'Afrique', 'dakar#3'), D('Île Maurice', '7 jours · tout inclus', 1500000, 'Afrique', 'maurice#2'), D('Dubaï', '5 jours · salons professionnels', 920000, 'Monde', 'dubai#1')] },
  'fattal-travel-et-tourism': { tagline: 'Le monde commence ici', hero: 'dubai#1', side: 'istanbul#1',
    dest: [D('Dubaï', '6 jours · désert et Burj Khalifa', 950000, 'Monde', 'dubai#2'), D('Istanbul', '5 jours · Bosphore', 1050000, 'Monde', 'istanbul#1'), D('Paris', 'Séjour 5 nuits', 1150000, 'Monde', 'paris#1'), D('Zanzibar', '7 jours · plages', 1200000, 'Afrique', 'zanzibar#2'), D('Marrakech', '5 jours · médina', 900000, 'Afrique', 'marrakech#2'), D('Le Cap', '6 jours · route des vins', 1250000, 'Afrique', 'cape-town#1')] },
  'aventures-sans-frontieres': { tagline: 'Le Gabon grandeur nature', hero: 'gorille#1', side: 'elephant#3',
    dest: [D('Parc de la Lopé', '3 jours · savane et forêt', 450000, 'Gabon', 'elephant#3'), D('Loango, la mer et la faune', '4 jours · éléphants et baleines', 780000, 'Gabon', 'baleine#1'), D('Pongara et les tortues', 'Week-end · tortues luth (novembre – février)', 180000, 'Gabon', 'tortue#1'), D('Chutes de l\'Ivindo', '5 jours · forêt et cascades', 950000, 'Gabon', 'cascade#1'), D('Sur la piste des gorilles', '3 jours · Lopé, suivi des primates', 650000, 'Gabon', 'gorille#1'), D('Akanda et ses mangroves', 'Journée · oiseaux et pirogue', 65000, 'Gabon', 'gabon#2')] },
  'batrhotour-assistance': { tagline: 'Le Haut-Ogooué grandeur nature', hero: 'cascade#2', side: 'savane#1',
    intro: 'Batrhotour Assistance organise depuis Franceville la découverte du Haut-Ogooué : chutes de Poubara, plateaux Batéké, parc de la Lékédi et canyons de Lékoni.',
    dest: [D('Chutes de Poubara', 'Journée · pont de lianes et cascades', 55000, 'Gabon', 'cascade#2'), D('Plateaux Batéké', '2 jours · savanes et villages', 240000, 'Gabon', 'savane#1'), D('Canyons de Lékoni', '2 jours · cirque et lac Bleu', 260000, 'Gabon', 'gabon#3'), D('Parc de la Lékédi', 'Journée · primates et lacs', 90000, 'Gabon', 'gorille#2'), D('Franceville en un jour', 'Visite guidée de la ville', 35000, 'Gabon', 'gabon#1'), D('Coucher de soleil sur la savane', 'Soirée · observation et dîner', 45000, 'Gabon', 'savane#2')] },
  'fishing-gabon-club': { tagline: 'La pêche sportive au Gabon', hero: 'peche-large#1', side: 'peche-large#2',
    dest: [D('Pêche au gros', 'Cap Estérias · journée', 250000, 'Large', 'peche-large#1'), D('Pêche au tarpon', 'Estuaire · demi-journée', 150000, 'Estuaire', 'peche-large#2'), D('Pêche du bord', 'Plages de Libreville · 4 h', 60000, 'Bord', 'peche-bord#1'), D('Séjour Sette Cama', '3 jours · lagune et océan', 950000, 'Séjour', 'peche-bord#2'), D('Pêche de nuit', 'Estuaire du Komo', 120000, 'Estuaire', 'peche-large#3'), D('Expédition Mayumba', '4 jours · tarpons géants', 1400000, 'Séjour', 'peche-bord#3')] },
};

// ---------------- Auto ----------------
const AUTO = {
  franstel: { tagline: 'Votre permis, sans stress', hero: 'conduite#2', side: 'citadine#1', items: [['Code de la route', 'Cours en salle et examens blancs', 75000], ['Permis B', '20 h de conduite incluses', 350000, 'conduite#2'], ['Formule accélérée', 'Permis en 6 semaines', 450000, 'citadine#1']] },
  '2s-confort-driving': { tagline: 'Conduire en confiance', hero: 'conduite#1', side: 'chauffeur#1', items: [['Permis B boîte manuelle', '25 h de conduite', 380000, 'conduite#1'], ['Permis boîte automatique', '15 h de conduite', 320000, 'citadine#2'], ['Perfectionnement', 'Remise à niveau, 5 h', 90000, 'chauffeur#1']] },
  'first-stop': { tagline: 'Entretien et réparation, sans surprise', hero: 'mecanicien#1', side: 'garage', items: [['Vidange complète', 'Huile + filtres', 45000, 'vidange#1'], ['Diagnostic électronique', 'Toutes marques', 25000, 'moteur'], ['Freinage', 'Plaquettes + disques', 'Sur devis', 'freins#1'], ['Amortisseurs', 'Contrôle et remplacement', 'Sur devis', 'amortisseur'], ['Pneus', 'Montage + équilibrage', 10000, 'pneus#1'], ['Climatisation', 'Recharge + contrôle', 35000]] },
  'asian-auto-gabon': { tagline: 'Pièces pour Toyota, Hyundai, Kia et Nissan', hero: 'freins#1', side: 'amortisseur', focus: 'Marques asiatiques' },
  'deuxaxe-gabon': { tagline: 'Pièces 4x4 et utilitaires', hero: 'hilux#3', side: 'amortisseur', focus: '4x4 et utilitaires' },
  ecig: { tagline: 'Pneus, batteries et entretien', hero: 'pneus#1', side: 'bougies#1', focus: 'Pneus et batteries' },
  'auto-mall-gabon': { tagline: 'Toutes les pièces, toutes les marques', hero: 'pneus#1', side: 'freins#2', focus: 'Toutes marques' },
  'ab-location': { tagline: 'Louez en toute liberté', hero: 'land-cruiser#1', side: 'hilux#1', items: [['Citadine', 'Économique, idéale en ville', 35000, 'citadine#1'], ['4x4 Land Cruiser', 'Pour toutes les routes du Gabon', 90000, 'land-cruiser#1'], ['Pick-up Hilux', 'Chantiers et longues distances', 75000, 'hilux#1'], ['Berline avec chauffeur', 'Mise à disposition', 70000, 'chauffeur#2']] },
};
const PARTS = [['Plaquettes de frein', 'Freinage', 15000, 'freins#1'], ['Disques de frein (paire)', 'Freinage', 45000, 'freins#2'], ['Filtre à huile', 'Filtration', 5000, 'vidange#2'], ['Huile moteur 5 L', 'Entretien', 28000, 'vidange#1'], ['Bougies (× 4)', 'Moteur', 12000, 'bougies#1'], ['Amortisseur avant', 'Suspension', 55000, 'amortisseur'], ['Pneu 265/65 R17', 'Pneus', 85000, 'pneus#1'], ['Pneu 195/65 R15', 'Pneus', 45000], ['Batterie 70 Ah', 'Électricité', 65000]];

// ---------------- Écoles ----------------
const F = (t, d, dur, pr, ph) => ({ t, d, dur, pr, ph });
const ECOLE = {
  'ecole-de-musique-ravel': { tagline: 'La musique, de l\'éveil à la scène', hero: 'solfege', side: 'guitare#2', music: true,
    forms: [F('Piano', 'Dès 6 ans, classique et moderne', 'Année', 45000), F('Guitare classique', 'Technique et répertoire', 'Année', 40000, 'guitare#2'), F('Chant', 'Technique vocale', 'Année', 40000, 'chant'), F('Solfège', 'Lecture et théorie', 'Année', 25000, 'solfege'), F('Éveil musical', '4 – 6 ans', 'Trimestre', 30000), F('Violon', 'Dès 7 ans', 'Année', 45000)] },
  'awax-music-school': { tagline: 'Fais vibrer ton talent', hero: 'dj#2', side: 'studio-musique', music: true,
    forms: [F('Beatmaking & MAO', 'Production sur ordinateur', 'Trimestre', 50000, 'studio-musique'), F('DJing', 'Mix, platines et scène', 'Trimestre', 55000, 'dj#1'), F('Chant & rap', 'Voix, flow et écriture', 'Trimestre', 40000, 'chant'), F('Batterie', 'Rythme et groove', 'Trimestre', 45000, 'batterie-musique#1'), F('Guitare', 'Acoustique et électrique', 'Trimestre', 40000, 'guitare#1'), F('Stage vacances', 'Une semaine intensive', 'Semaine', 60000, 'batterie-musique#2')] },
  'auxilium-gabon': { tagline: 'Parlez le monde', hero: 'classe-langue', side: 'informatique#1',
    forms: [F('Anglais', 'Tous niveaux · préparation TOEIC', 'Trimestre', 60000, 'classe-langue'), F('Espagnol', 'Débutant à avancé', 'Trimestre', 55000), F('Chinois', 'Initiation', 'Trimestre', 65000), F('Français (FLE)', 'Pour non-francophones', 'Trimestre', 55000), F('Allemand', 'Préparation Goethe', 'Trimestre', 60000), F('Formation entreprise', 'Cours sur site', 'Sur mesure', 'Sur devis', 'open-space')] },
  'ecole-hoteliere-de-libreville': { tagline: 'L\'excellence du service', hero: 'cours-cuisine', side: 'serveur#1',
    forms: [F('Cuisine', 'CAP et BTS', '2 ans', 75000, 'chef'), F('Service en salle', 'Sommellerie et bar', '1 an', 65000, 'serveur#1'), F('Réception', 'Accueil et front office', '1 an', 65000, 'lobby#2'), F('Pâtisserie', 'Arts sucrés', '1 an', 70000, 'patissier#1'), F('Management hôtelier', 'Bac +3', '3 ans', 95000, 'serveur#2'), F('Stages', 'Hôtels partenaires', 'Inclus', 'Inclus', 'buffet#1')] },
  afram: { tagline: 'Former les leaders de demain', hero: 'diplome#2', side: 'amphi',
    forms: [F('Management', 'Bachelor et Master', '3 – 5 ans', 120000, 'amphi'), F('Informatique', 'Développement et réseaux', '3 ans', 130000, 'informatique#1'), F('Droit des affaires', 'Licence et Master', '3 – 5 ans', 115000), F('QHSE', 'Qualité, sécurité, environnement', '2 ans', 110000, 'casques#2'), F('Formation continue', 'Cours du soir', 'Modulable', 80000, 'informatique#2'), F('Remise des diplômes', 'Promotion 2026', '—', '—', 'diplome#1')] },
};

// ---------------- Luxe et boutiques ----------------
const P = (t, d, pr, ph, cat) => ({ t, d, pr, ph, cat });
const SHOP = {
  'beauty-gabon': { tagline: 'Signez votre présence', hero: 'parfum-sombre#2', side: 'bougie#1',
    products: [P('Oud Royal', 'Eau de parfum · 100 ml', 85000, 'parfum-sombre#2', 'Parfums'), P('Musc blanc', 'Eau de parfum · 50 ml', 45000, 'sig/parfum-2.webp', 'Parfums'), P('Ambre noir', 'Eau de parfum · 100 ml', 75000, 'sig/parfum-3.webp', 'Parfums'), P('Coffret découverte', '5 × 10 ml', 60000, 'cadeau#1', 'Coffrets'), P('Bougie parfumée', 'Oud et vanille', 18000, 'bougie#1', 'Maison'), P('Brume parfumée', 'Corps et cheveux · 100 ml', 22000, 'sig/parfum-1.webp', 'Parfums')] },
  delicatess: { tagline: 'Des soins qui révèlent votre peau', hero: 'cosmetiques#1', side: 'serums#2',
    products: [P('Sérum éclat', 'Vitamine C · 30 ml', 18000, 'serums#1', 'Visage'), P('Beurre de karité', 'Pur, non raffiné', 7500, 'cosmetiques#1', 'Corps'), P('Huile sèche', 'Corps et cheveux', 12000, 'serums#3', 'Corps'), P('Crème hydratante', 'Visage, peaux noires', 15000, 'cosmetiques#2', 'Visage'), P('Sérum anti-taches', 'Niacinamide · 30 ml', 20000, 'serums#2', 'Visage'), P('Coffret routine', '4 soins essentiels', 45000, 'cadeau#2', 'Coffrets')] },
  'bijouterie-de-l-ecrin': { tagline: 'L\'éclat qui vous ressemble', hero: 'bague', side: 'alliances#1',
    products: [P('Bague solitaire', 'Or blanc 18 carats', 450000, 'bague', 'Bagues'), P('Alliances or jaune', 'La paire', 380000, 'alliances#1', 'Mariage'), P('Alliances classiques', 'Or 18 carats', 320000, 'alliances#3', 'Mariage'), P('Collier de perles', 'Perles de culture', 280000, 'perles', 'Colliers'), P('Boucles d\'oreilles soleil', 'Or jaune', 180000, 'boucles#1', 'Boucles'), P('Créoles en or', 'Or 18 carats', 150000, 'boucles#3', 'Boucles')] },
  'chouchou-lazare': { tagline: 'Couture africaine, regard universel', hero: 'mode-wax#1', side: 'wax#1',
    products: [P('Robe Héritage', 'Wax, coupe ajustée', 'Sur demande', 'sig/look-1.webp', 'Collection'), P('Ensemble Kente', 'Haut et jupe', 'Sur demande', 'sig/look-2.webp', 'Collection'), P('Tenue de cérémonie', 'Sur-mesure', 'Sur rendez-vous', 'sig/look-3.webp', 'Sur-mesure'), P('Robe wax longue', 'Prêt-à-porter', 'Sur demande', 'mode-wax#1', 'Collection'), P('Tissus wax', 'Sélection de l\'atelier', 'Sur demande', 'wax#2', 'Atelier')] },
  'artemis-luxury-co': { tagline: 'Signez votre présence', hero: 'sig/parfum-1.webp', side: 'sig/parfum-2.webp',
    products: [P('Ambre Nuit', 'Eau de parfum · 100 ml', 72000, 'sig/parfum-1.webp', 'Parfums'), P('Oud Imperial', 'Extrait · 50 ml', 95000, 'sig/parfum-2.webp', 'Parfums'), P('Rose de Taïf', 'Eau de parfum · 100 ml', 68000, 'sig/parfum-3.webp', 'Parfums'), P('Vétiver Bleu', 'Eau de parfum · 100 ml', 65000, 'sig/parfum-4.webp', 'Parfums'), P('Coffret découverte', '4 × 10 ml', 55000, 'cadeau#1', 'Coffrets')] },
  'atelier-olima': { tagline: 'Fait main, au Gabon', hero: 'masque#3', side: 'paniers#1',
    products: [P('Masque Punu', 'Bois sculpté à la main', 85000, 'masque#1', 'Sculpture'), P('Masque de collection', 'Pièce unique', 150000, 'masque#2', 'Sculpture'), P('Panier tressé', 'Fibres naturelles', 15000, 'paniers#1', 'Vannerie'), P('Paniers colorés', 'Lot de 3', 35000, 'paniers#2', 'Vannerie'), P('Statuette', 'Pierre de Mbigou', 45000, 'sculpture', 'Sculpture'), P('Tissu wax', 'Coupon de 6 yards', 20000, 'wax#1', 'Textile'), P('Colliers en pierre', 'Création de l\'atelier', 12000, 'bijoux-artisanat', 'Bijoux')] },
  'clin-d-oeil': { tagline: 'Le cadeau qui fait mouche', hero: 'cadeau#2', side: 'vases#1',
    products: [P('Coffret cadeau', 'Composé sur mesure', 25000, 'cadeau#3', 'Cadeaux'), P('Paquet surprise', 'Emballage offert', 15000, 'cadeau#2', 'Cadeaux'), P('Bougie parfumée', 'Cire de soja', 9000, 'bougie#2', 'Déco'), P('Cadre photo', 'Bois naturel', 12000, 'cadre#1', 'Déco'), P('Vase céramique', 'Pièce unique', 18000, 'vases#2', 'Déco'), P('Plante d\'intérieur', 'Avec cache-pot', 20000, 'plante#1', 'Déco')] },
  'even-jet-by-coco': { tagline: 'Des étoiles plein les yeux', hero: 'jeux-societe', side: 'velo-enfant#1',
    products: [P('Jeux d\'éveil', '0 – 3 ans', 12000, 'jouets#1', 'Petite enfance'), P('Jeux de société', 'En famille, dès 5 ans', 18000, 'jeux-societe', 'Famille'), P('Vélo enfant', '3 – 6 ans', 65000, 'velo-enfant#1', 'Plein air'), P('Draisienne', 'Dès 2 ans', 35000, 'velo-enfant#2', 'Plein air'), P('Peluches', 'Douces et colorées', 8000, 'peluches', 'Petite enfance'), P('Robots et figurines', '5 – 10 ans', 15000, 'jouets#2', 'Jouets')] },
  'atmosphere-florale': { tagline: 'Des fleurs pour tous vos moments', hero: 'roses#1', side: 'fleuriste',
    products: [P('Bouquet du jour', 'Fleurs de saison', 15000, 'bouquet', 'Bouquets'), P('Roses rouges × 12', 'Livraison incluse', 25000, 'roses#2', 'Bouquets'), P('Bouquet prestige', '24 roses', 45000, 'roses#1', 'Bouquets'), P('Décoration de mariage', 'Tables et arche', 'Sur devis', 'deco-mariage#1', 'Événements'), P('Centre de table', 'Pour vos réceptions', 30000, 'deco-mariage#2', 'Événements'), P('Plante verte', 'Avec cache-pot', 18000, 'plante#2', 'Plantes')] },
};

// ---------------- Services ----------------
const SERV = {
  '2hs-consulting': { tagline: 'La santé au travail, simplement', hero: 'casques#2', side: 'tension',
    services: [sv('sante', 'Visites médicales', 'Embauche, suivi périodique, reprise.', 'tension'), sv('shield', 'Prévention des risques', 'Audit des postes et plan d\'action.', 'casques#1'), sv('users', 'Formation SST', 'Sauveteurs secouristes du travail.'), sv('book', 'Document unique', 'Évaluation des risques, mise à jour.', 'casques#3')] },
  'agex-vtc': { tagline: 'Vos trajets en toute confiance', hero: 'chauffeur#1', side: 'chauffeur#2',
    services: [sv('car', 'Course en ville', 'Prise en charge en 15 minutes.', 'chauffeur#1'), sv('plane', 'Transfert aéroport', 'Suivi de vol, accueil personnalisé.', 'avion'), sv('clock', 'Mise à disposition', 'À l\'heure ou à la journée.', 'chauffeur#2'), sv('users', 'Entreprises', 'Compte client et facturation mensuelle.', 'poignee-main')] },
};

const ALL = { ...RESTO, ...HOTEL, ...BEAUTE, ...IMMO, ...SANTE, ...VOYAGE, ...AUTO, ...ECOLE, ...SHOP, ...SERV };

// Résout « sujet#n » en nom de fichier (ou « sig/… » pour les visuels des sites signature)
function photo(ref) {
  if (!ref) return null;
  if (ref.startsWith('sig/')) return ref;
  const [k, n] = ref.split('#');
  const list = PH[k];
  if (!list) throw new Error('Sujet photo inconnu : ' + ref);
  return list[Math.min((+n || 1) - 1, list.length - 1)];
}
const get = (slug) => ALL[slug] || null;
module.exports = { get, photo, PARTS, LIST, ZONES, PH };
