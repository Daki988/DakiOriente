// Hôtel Le Refuge, Lambaréné : données du site sur mesure.
// Infos réelles (Petit Futé, miboue, Le Pratique du Gabon, Facebook LeRefugeLambarene) : complexe hôtelier sur la N1, 400 m après l'aéroport,
// près de l'hôpital Albert-Schweitzer, BP 357 ; 42 chambres (standards, supérieures, luxe, suites junior et VIP, studios et appartements) nommées
// d'après les bois et les lacs du Gabon ; standard dès 45 000 FCFA petit-déjeuner buffet inclus, suites VIP dès 150 000 FCFA ; grande piscine,
// restaurant-bar (cuisine européenne et africaine, pizzas, 7 h – 22 h), salle polyvalente 400 places, salle de séminaire 100 places, salle de sport,
// location de chaises et de matériel ; 074 75 48 40 ; direction@lerefuge-hotel.com ; dirigé par Lionel ONOUVIET.
// Prix intermédiaires, options et forfaits : indicatifs, à confirmer.
const { ic } = require('../_kit-hotel/hotel-kit');
const P = '../../assets/photos/';
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="10" fill="#1F3B2D"/><path d="M8 24 22 11l14 13" fill="none" stroke="#E0A15C" stroke-width="2.4" stroke-linejoin="round"/><path d="M13 23v11h18V23" fill="none" stroke="#fff" stroke-width="2"/><path d="M8 37c4-2 8-2 12 0s8 2 16 0" fill="none" stroke="#E0A15C" stroke-width="1.8" stroke-linecap="round"/><path d="M19.5 34v-6h5v6" fill="#E0A15C"/></svg>`;

module.exports = {
  slug: 'hotel-le-refuge', name: 'Hôtel Le Refuge', tel: '074 75 48 40', wa: '24174754840', mail: 'direction@lerefuge-hotel.com',
  addr: 'Route nationale N1, 400 m après l\'aéroport, BP 357', city: 'Lambaréné', mapq: '-0.70154572,10.24038601', hours: 'Réception 24 h/24, 7 j/7',
  checkin: '14:00', checkout: '12:00', soc: ['facebook', 'instagram', 'tiktok'], unit: 'chambre',
  logoSvg, logo: `${logoSvg}<span class="t">Le Refuge<small>Hôtel · Lambaréné</small></span>`,
  fonts: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap',
  footer: 'Complexe hôtelier de 42 chambres à Lambaréné : grande piscine, restaurant-bar, salle de sport, salles de séminaire et de réception.',
  roomsLabel: 'Chambres & suites', restoLabel: 'Restaurant & bar', extraPage: ['seminaires.html', 'Séminaires & réceptions'],
  title: 'Hôtel à Lambaréné, piscine et salles de réception', kicker: 'Lambaréné · Moyen-Ogooué',
  h1: 'Votre refuge<br>au cœur du Moyen‑Ogooué', lead: '42 chambres, suites et appartements climatisés, une grande piscine et des salles pour tous vos événements, à 400 m de l\'aéroport.',
  intro: 'Construit un peu à l\'écart de la ville, Le Refuge accueille voyageurs d\'affaires, missions, familles et touristes dans un cadre vaste et reposant. Chaque chambre porte le nom d\'un bois ou d\'un lac du Gabon.',
  introTag: 'Bienvenue', introTitle: 'Le calme, à deux pas<br>de tout Lambaréné',
  highlights: [['42', 'chambres, suites et appartements'], ['400', 'places en salle polyvalente'], ['7 h – 22 h', 'restaurant ouvert chaque jour']],
  roomsTitle: 'Chambres, suites et appartements', roomsLead: 'Toutes climatisées et entièrement équipées, petit-déjeuner buffet inclus. Chacune porte le nom d\'un bois ou d\'un lac du Gabon.',
  rooms: [
    { id: 'standard', n: 'Chambre Standard « Okoumé »', cap: 2, m2: 22, bed: 'Lit double', d: 'Confortable et lumineuse, idéale pour une mission ou une étape sur la Nationale 1.', eq: ['Climatisation', 'TV', 'Wi-Fi', 'Petit-déjeuner inclus'], price: 45000, wkd: 45000, ph: [P + 'x-chambre-twin-2.jpg', P + 'x-sdb-2.jpg'] },
    { id: 'superieure', n: 'Chambre Supérieure « Padouk »', cap: 2, m2: 28, bed: 'Lit king size', d: 'Plus d\'espace, coin bureau et literie haut de gamme pour les séjours de plusieurs nuits.', eq: ['Climatisation', 'Bureau', 'Minibar', 'Petit-déjeuner inclus'], price: 55000, wkd: 55000, ph: [P + 'hotel-1611892440504-42a792e24d32.jpg', P + 'x-sdb-1.jpg'] },
    { id: 'luxe', n: 'Chambre Luxe « Moabi »', cap: 2, m2: 32, bed: 'Lit king size', d: 'Décoration soignée, coin salon et salle de bain spacieuse.', eq: ['Coin salon', 'Minibar', 'Coffre-fort', 'Petit-déjeuner inclus'], price: 70000, wkd: 70000, ph: [P + 'hotel-1590490360182-c33d57733427.jpg', P + 'x-sdb-1.jpg'] },
    { id: 'appartement', n: 'Studio & appartement « Evaro »', cap: 4, m2: 45, bed: 'Chambre + salon', d: 'Cuisine équipée et salon séparé : parfait pour une mission longue ou une famille.', eq: ['Cuisine équipée', 'Salon', 'Wi-Fi', 'Petit-déjeuner inclus'], price: 80000, wkd: 80000, ph: [P + 'x-suite-2.jpg', P + 'x-cuisine-appart-2.jpg'] },
    { id: 'junior', n: 'Suite Junior « Zilé »', cap: 3, m2: 42, bed: 'Lit king size + canapé', d: 'Chambre et salon ouverts, baignoire : le confort pour un couple ou un cadre en déplacement.', eq: ['Salon', 'Baignoire', 'Minibar', 'Petit-déjeuner inclus'], price: 95000, wkd: 95000, ph: [P + 'hotel-1582719478250-c89cae4dc85b.jpg', P + 'x-suite-3.jpg'] },
    { id: 'vip', n: 'Suite VIP « Onangué »', cap: 4, m2: 65, bed: 'Lit king size + salon séparé', d: 'Notre plus belle suite : grand salon pour recevoir, salle de bain avec baignoire et douche, accueil personnalisé.', eq: ['Salon séparé', 'Baignoire + douche', 'Peignoirs', 'Accueil VIP'], price: 150000, wkd: 150000, ph: [P + 'hotel-1578683010236-d716f9a3f461.jpg', P + 'x-suite-1.jpg'] },
  ],
  extras: [
    { id: 'diner', n: 'Demi-pension (dîner)', p: 10000, u: 'par adulte et par nuit', per: 'pers-nuit' },
    { id: 'lit', n: 'Lit d\'appoint', p: 10000, u: 'par nuit', per: 'nuit' },
    { id: 'lacs', n: 'Excursion en pirogue sur les lacs', p: 25000, u: 'par personne', per: 'pers' },
    { id: 'schweitzer', n: 'Visite de l\'hôpital Albert-Schweitzer', p: 10000, u: 'par personne, avec chauffeur', per: 'pers' },
    { id: 'late', n: 'Départ tardif (jusqu\'à 16 h)', p: 15000, u: 'par séjour', per: 'sejour' },
    { id: 'transfert', n: 'Accueil à l\'aéroport ou à la gare routière', p: 5000, u: 'par trajet', per: 'sejour' },
  ],
  amenTitle: 'Tout sur place', amen: [
    ['pool', 'Grande piscine', 'Transats et jardin, pour se rafraîchir après la route.'], ['fork', 'Restaurant & bar', 'Cuisine africaine et européenne, pizzas, 7 h – 22 h.'],
    ['meet', 'Salle polyvalente', 'Mariages, réceptions et conférences jusqu\'à 400 personnes.'], ['desk', 'Salle de séminaire', 'Équipée, jusqu\'à 100 participants.'],
    ['gym', 'Salle de sport', 'Accès libre pour les clients de l\'hôtel.'], ['park', 'Grand parking', 'Gratuit, idéal pour les cortèges et les groupes.'],
    ['plane', 'À 400 m de l\'aéroport', 'Et à quelques minutes de l\'hôpital Albert-Schweitzer.'], ['wifi', 'Wi-Fi gratuit', 'Dans les chambres et les espaces communs.'],
  ],
  homeExtra: `<section class="sec"><div class="wrap"><span class="tag">Découvrir Lambaréné</span><h2>Entre fleuve, lacs et histoire</h2><p class="lead">La réception organise vos sorties, avec chauffeur et piroguier.</p><div class="lst">
<div><h3>Les lacs du Moyen-Ogooué</h3><p>Onangué, Evaro, Zilé : une balade en pirogue au milieu des îles et des villages de pêcheurs.</p></div>
<div><h3>Hôpital Albert-Schweitzer</h3><p>Le musée et la maison du docteur Schweitzer, prix Nobel de la paix, à quelques minutes.</p></div>
<div><h3>L'Ogooué</h3><p>Le grand fleuve du Gabon traverse la ville : couchers de soleil inoubliables depuis les berges.</p></div></div></div></section>`,
  reviews: [['Brice', 'Mission de 5 nuits', 'Chambre propre, climatisation efficace et petit-déjeuner buffet copieux. Personnel souriant et aux petits soins.'], ['Mireille', 'Mariage, salle polyvalente', 'Nous étions 300 invités : la salle, le parking et le service ont été à la hauteur. Merci à toute l\'équipe.'], ['Joël', 'Escale en famille', 'Les enfants ont adoré la piscine et les pizzas du restaurant. Une étape parfaite sur la route du sud.']],
  ctaTitle: 'Un séjour ou un événement à Lambaréné ?', ctaText: 'Réservez votre chambre en ligne ou demandez un devis pour votre séminaire ou votre réception.',
  resto: {
    desc: 'Le restaurant-bar de l\'Hôtel Le Refuge à Lambaréné : petit-déjeuner buffet, cuisine africaine et européenne, pizzas, de 7 h à 22 h.',
    title: 'Restaurant & bar', lead: 'Du petit-déjeuner buffet au dîner, cuisine africaine et européenne, et les pizzas qui font la réputation de la maison.',
    h2: 'Africain, européen et pizzas', text: 'Poissons du fleuve, plats mijotés gabonais, grillades et pizzas au feu : la carte du Refuge réunit tout le monde, de la mission d\'affaires à la tablée familiale.',
    hours: [['Petit-déjeuner buffet', '7 h – 10 h'], ['Déjeuner', '12 h – 15 h'], ['Dîner', '19 h – 22 h'], ['Bar', 'toute la journée']],
    menu: [['Africain', [['Capitaine de l\'Ogooué braisé', 'Poisson du fleuve, bâtons de manioc', 10000], ['Poulet nyembwe', 'Sauce noix de palme, riz ou plantain', 8500], ['Feuilles de manioc au poisson fumé', 'Recette du Moyen-Ogooué', 7500]]],
      ['Européen', [['Entrecôte grillée', 'Sauce au poivre, frites maison', 12000], ['Filet de poisson meunière', 'Riz pilaf, légumes', 10000], ['Salade César', 'Poulet grillé, croûtons', 6500]]],
      ['Pizzas & douceurs', [['Pizza Refuge', 'Tomate, mozzarella, viande hachée, poivrons', 8000], ['Pizza 4 fromages', 'Généreuse et gratinée', 8500], ['Salade de fruits', 'Ananas, papaye, mangue', 3000]]]],
  },
  extraDesc: 'Salles de l\'Hôtel Le Refuge à Lambaréné : salle polyvalente de 400 places pour mariages et réceptions, salle de séminaire de 100 places, location de chaises et de matériel.',
  extraTitle: 'Séminaires & réceptions', extraLead: 'Une salle polyvalente de 400 places, une salle de séminaire de 100 places, la restauration et l\'hébergement sur place.',
  extraBody: `<section class="sec"><div class="wrap"><span class="tag">Nos salles</span><h2>Deux salles, tous vos événements</h2><div class="lst">
<div><h3>Salle polyvalente</h3><p>Mariages, dots, réceptions, conférences et concerts : jusqu'à 400 personnes, grand parking.</p><b>400 places</b></div>
<div><h3>Salle de séminaire</h3><p>Formations, ateliers et réunions : vidéoprojecteur, sonorisation, pauses-café.</p><b>100 places</b></div>
<div><h3>Location de matériel</h3><p>Chaises, tables, nappes et équipements pour vos événements, sur place ou à l'extérieur.</p><b>Sur devis</b></div></div></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Clé en main</span><h2>Nous nous occupons de tout</h2><ul class="chk">${['Traiteur : cocktail, buffet africain et européen, dîner servi', 'Hébergement des invités et des participants', 'Sonorisation, vidéoprojecteur, éclairage', 'Décoration et mise en place des tables', 'Parking pour les cortèges', 'Forfaits journée d\'étude avec déjeuner'].map((t) => `<li>${ic('check', 18)}<span>${t}</span></li>`).join('')}</ul></div>
<form class="form" data-wa-form="je souhaite un devis pour un événement." novalidate><h3 class="h3">Demander un devis</h3><p>Réponse sous 24 h avec une proposition détaillée.</p>
<div class="g2"><label class="fld"><span>Type d'événement</span><select name="type"><option>Mariage / dot</option><option>Réception / anniversaire</option><option>Séminaire / formation</option><option>Conférence</option><option>Location de matériel seule</option></select></label><label class="fld"><span>Date souhaitée</span><input type="date" name="date" required></label></div>
<div class="g2"><label class="fld"><span>Nombre d'invités</span><input type="number" name="pax" min="10" max="400" value="100" required></label><label class="fld"><span>Restauration</span><select name="resto"><option>Cocktail</option><option selected>Buffet</option><option>Dîner servi</option><option>Sans restauration</option></select></label></div>
<div class="g2"><label class="fld"><span>Hébergement des invités</span><select name="heb"><option>Non</option><option>Quelques chambres</option><option>Bloc de chambres</option></select></label><label class="fld"><span>Organisation / nom</span><input name="nom" required autocomplete="name"></label></div>
<label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label>
<button class="btn p" type="submit">Envoyer la demande sur WhatsApp</button></form></div></section>`,
  aboutDesc: 'L\'Hôtel Le Refuge à Lambaréné : 42 chambres, piscine, restaurant-bar, salles de réception et de séminaire, près de l\'aéroport et de l\'hôpital Albert-Schweitzer.',
  aboutTitle: 'L\'hôtel', aboutLead: 'Un vaste complexe hôtelier, calme et accueillant, sur la route nationale à Lambaréné.',
  aboutH2: 'Un vaste refuge, un accueil aux petits soins', aboutText: ['Le Refuge est un complexe hôtelier de 42 chambres, construit un peu à l\'écart de la ville sur la route nationale, à 400 m de l\'aéroport de Lambaréné.', 'Chambres standards, supérieures et luxe, suites junior et VIP, studios et appartements : chacun porte le nom d\'un bois ou d\'un lac du Gabon.', 'Une équipe de 31 personnes veille sur la piscine, le restaurant-bar, la salle de sport et les salles qui accueillent mariages, séminaires et réceptions.'],
  faq: [['Le petit-déjeuner est-il inclus ?', 'Oui, le petit-déjeuner buffet est inclus dans le prix de toutes les chambres.'], ['Quelles sont les heures d\'arrivée et de départ ?', 'Arrivée à partir de 14 h, départ avant 12 h. Le départ tardif est possible sur demande.'], ['Peut-on organiser un mariage avec hébergement des invités ?', 'Oui : salle polyvalente de 400 places, traiteur et blocs de chambres pour vos invités. Demandez un devis.'], ['L\'hôtel accepte-t-il les bons de commande ?', 'Oui, pour les administrations, ONG et entreprises, avec facture au nom de la structure.'], ['Comment venir ?', 'Sur la route nationale N1, 400 m après l\'aéroport de Lambaréné, en venant de Libreville.']],
  gallery: [[P + 'hotel-1566073771259-6a8506099945.jpg', 'La piscine'], [P + 'hotel-1578683010236-d716f9a3f461.jpg', 'Suite VIP « Onangué »'], [P + 'x-salle-resto-1.jpg', 'Le restaurant'], [P + 'x-pirogue-1.jpg', 'Les lacs en pirogue'], [P + 'x-chambre-twin-2.jpg', 'Chambre Standard'], [P + 'x-deco-mariage-2.jpg', 'Réception'], [P + 'hotel-1611892440504-42a792e24d32.jpg', 'Chambre Supérieure'], [P + 'x-lounge-bar-2.jpg', 'Le bar'], [P + 'x-gabon-2.jpg', 'Le Moyen-Ogooué'], [P + 'x-suite-2.jpg', 'Appartement « Evaro »'], [P + 'x-lobby-3.jpg', 'L\'accueil']],
  access: [['plane', 'Aéroport de Lambaréné', 'à 400 m'], ['pin', 'Hôpital Albert-Schweitzer', 'quelques minutes en voiture'], ['car', 'Depuis Libreville', 'environ 3 h 30 par la N1']],
  ph: { hero: P + 'hotel-1566073771259-6a8506099945.jpg', side1: P + 'x-lobby-3.jpg', side2: P + 'x-pirogue-1.jpg', rooms: P + 'hotel-1611892440504-42a792e24d32.jpg', resto: P + 'x-salle-resto-1.jpg', food1: P + 'x-poisson-braise-3.jpg', food2: P + 'resto-1750127060930.jpg', extra: P + 'x-deco-mariage-1.jpg', about: P + 'x-gabon-2.jpg' },
};
