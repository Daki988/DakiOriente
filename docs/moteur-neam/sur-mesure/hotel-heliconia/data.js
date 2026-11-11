// Hôtel Héliconia, Franceville : données du site sur mesure (tarifs indicatifs, à confirmer avec l'hôtel).
const { ic } = require('../_kit-hotel/hotel-kit');
const P = '../../assets/photos/';
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="10" fill="#0F3D2E"/><path d="M22 7v31" stroke="#7FB069" stroke-width="2" stroke-linecap="round"/><path d="M22 11 11 14l11 4zM22 19l11 3-11 4zM22 27l-11 3 11 4z" fill="#E2552B"/><circle cx="11" cy="14" r="1.6" fill="#F2B544"/><circle cx="33" cy="22" r="1.6" fill="#F2B544"/><circle cx="11" cy="30" r="1.6" fill="#F2B544"/></svg>`;

module.exports = {
  slug: 'hotel-heliconia', name: 'Hôtel Héliconia', tel: '065 25 16 16', wa: '24165251616', mail: 'contact@hotelheliconia.ga',
  addr: 'Quartier Mbaya', city: 'Franceville', mapq: 'Hotel+Heliconia+Mbaya+Franceville+Gabon', hours: 'Réception 24 h/24, 7 j/7',
  checkin: '14:00', checkout: '12:00', soc: ['facebook', 'instagram'], unit: 'chambre',
  logoSvg, logo: `${logoSvg}<span class="t">Héliconia<small>Hôtel · Franceville</small></span>`,
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Inter:wght@400;500;600;700&display=swap',
  footer: 'Hôtel d\'affaires et de loisirs au cœur du Haut-Ogooué : chambres et suites, piscine, salle de sport, restaurant et salles de réunion.',
  roomsLabel: 'Chambres & suites', restoLabel: 'Restaurant', extraPage: ['seminaires.html', 'Séminaires'],
  title: 'Hôtel à Franceville, piscine et suites', kicker: 'Franceville · Haut-Ogooué',
  h1: 'Votre escale verte<br>au cœur du Haut‑Ogooué', lead: 'Chambres et suites climatisées, piscine, salle de sport et restaurant, à quelques minutes du centre de Franceville.',
  intro: 'Né pour accueillir les équipes et supporters de la CAN 2012, l\'Héliconia de Franceville reçoit aujourd\'hui voyageurs d\'affaires, missions, familles et délégations dans un cadre calme et arboré du quartier Mbaya.',
  introTag: 'Bienvenue', introTitle: 'Le confort d\'un grand hôtel,<br>le calme de Mbaya',
  highlights: [['~50', 'chambres et suites'], ['24 h/24', 'réception et sécurité'], ['3', 'hôtels Héliconia dans la province']],
  roomsTitle: 'Chambres et suites', roomsLead: 'Quatre catégories, toutes climatisées avec salle de bain privée, télévision et Wi-Fi.',
  rooms: [
    { id: 'standard', n: 'Chambre Standard', cap: 2, m2: 22, bed: 'Lit double ou 2 lits', d: 'Chambre fonctionnelle et lumineuse, idéale pour une mission ou une courte étape à Franceville.', eq: ['Climatisation', 'TV écran plat', 'Wi-Fi', 'Douche', 'Bureau'], price: 40000, wkd: 40000, ph: [P + 'x-chambre-twin-1.jpg', P + 'x-chambre-twin-2.jpg'] },
    { id: 'superieure', n: 'Chambre Supérieure', cap: 2, m2: 28, bed: 'Lit king size', d: 'Plus d\'espace, coin salon et literie haut de gamme pour les séjours de plusieurs nuits.', eq: ['Climatisation', 'Coin salon', 'Minibar', 'Wi-Fi', 'Coffre-fort'], price: 55000, wkd: 55000, ph: [P + 'hotel-1590490360182-c33d57733427.jpg', P + 'x-sdb-2.jpg'] },
    { id: 'junior', n: 'Suite Junior', cap: 3, m2: 40, bed: 'Lit king size + canapé', d: 'Chambre et salon ouverts, grande salle de bain : le bon choix pour un couple ou un cadre en déplacement long.', eq: ['Salon', 'Minibar', 'Machine à café', 'Baignoire', 'Wi-Fi'], price: 80000, wkd: 80000, ph: [P + 'hotel-1582719478250-c89cae4dc85b.jpg', P + 'x-suite-2.jpg'] },
    { id: 'vip', n: 'Suite VIP', cap: 4, m2: 60, bed: 'Lit king size + salon séparé', d: 'Notre plus grande suite : salon séparé pour recevoir, salle de bain avec baignoire et douche, service personnalisé.', eq: ['Salon séparé', 'Baignoire + douche', 'Peignoirs', 'Minibar', 'Accueil VIP'], price: 115000, wkd: 115000, ph: [P + 'hotel-1578683010236-d716f9a3f461.jpg', P + 'x-suite-1.jpg', P + 'x-sdb-1.jpg'] },
  ],
  extras: [
    { id: 'pdj', n: 'Petit-déjeuner buffet', p: 7500, u: 'par adulte et par nuit', per: 'pers-nuit' },
    { id: 'navette', n: 'Transfert aéroport de Mvengué', p: 15000, u: 'par trajet', per: 'sejour' },
    { id: 'lit', n: 'Lit d\'appoint', p: 10000, u: 'par nuit', per: 'nuit' },
    { id: 'late', n: 'Départ tardif (jusqu\'à 16 h)', p: 15000, u: 'par séjour', per: 'sejour' },
    { id: 'diner', n: 'Demi-pension (dîner)', p: 12000, u: 'par adulte et par nuit', per: 'pers-nuit' },
    { id: 'voiture', n: 'Voiture avec chauffeur, 1 journée', p: 60000, u: 'par jour', per: 'sejour' },
  ],
  amenTitle: 'Tout sur place', amen: [
    ['pool', 'Piscine', 'Bassin extérieur et transats, ouverts tous les jours.'], ['gym', 'Salle de sport', 'Cardio et musculation, accès libre pour les clients.'],
    ['fork', 'Restaurant & bar', 'Cuisine gabonaise et internationale, room service.'], ['meet', 'Salles de réunion', 'Séminaires, formations, réceptions jusqu\'à 120 personnes.'],
    ['wifi', 'Wi-Fi gratuit', 'Dans les chambres et les espaces communs.'], ['park', 'Parking surveillé', 'Gratuit, gardé jour et nuit.'],
    ['plane', 'Navette aéroport', 'Mvengué sur demande, à toute heure.'], ['shield', 'Sécurité 24 h/24', 'Réception et gardiennage permanents.'],
  ],
  homeExtra: `<section class="sec"><div class="wrap"><span class="tag">Autour de l'hôtel</span><h2>Explorer le Haut-Ogooué</h2><p class="lead">La réception organise vos sorties avec chauffeur et guide.</p><div class="lst">
<div><h3>Chutes de Poubara</h3><p>Le pont de lianes et les chutes de l'Ogooué, à une vingtaine de minutes de route.</p></div>
<div><h3>Parc de la Lékédi</h3><p>Forêt, savane et faune sauvage, près de Bakoumba : une journée inoubliable.</p></div>
<div><h3>Canyons de la Lékoni</h3><p>Les « cirques » rouges des plateaux Batéké, autour de Léconi.</p></div></div></div></section>`,
  reviews: [['Ange', 'Mission professionnelle, 4 nuits', 'Chambre propre et calme, Wi-Fi qui fonctionne et petit-déjeuner copieux. Parfait pour travailler.'], ['Estelle', 'Séjour en famille', 'Les enfants n\'ont pas quitté la piscine. Personnel souriant et disponible.'], ['Rodrigue', 'Séminaire d\'entreprise', 'Salle bien équipée, pauses-café à l\'heure et chambres prêtes pour tout le groupe.']],
  ctaTitle: 'Un séjour à Franceville ?', ctaText: 'Réservez en ligne ou écrivez-nous sur WhatsApp : réponse rapide, 7 j/7.',
  resto: {
    desc: 'Restaurant de l\'Hôtel Héliconia à Franceville : cuisine gabonaise et internationale, petit-déjeuner buffet, bar et room service.',
    title: 'Restaurant & bar', lead: 'Cuisine gabonaise et internationale, du petit-déjeuner au dîner, en salle, en terrasse ou en chambre.',
    h2: 'Les saveurs du Haut-Ogooué', text: 'Notre chef met à l\'honneur les produits de la région : poissons de l\'Ogooué, nyembwe, manioc et légumes du marché, à côté des classiques internationaux.',
    hours: [['Petit-déjeuner', '6 h 30 – 10 h'], ['Déjeuner', '12 h – 15 h'], ['Dîner', '19 h – 22 h 30'], ['Bar', '10 h – minuit']],
    menu: [['Entrées', [['Salade de crudités', 'Légumes du marché, vinaigrette maison', 5000], ['Feuilles de manioc', 'Façon locale, petit pot', 4500], ['Soupe du jour', 'Selon l\'humeur du chef', 4000]]],
      ['Plats', [['Poulet nyembwe', 'Sauce noix de palme, riz ou banane plantain', 9500], ['Capitaine braisé', 'Poisson entier, piment, frites ou bâtons de manioc', 12000], ['Entrecôte grillée', 'Sauce au poivre, légumes sautés', 14000]]],
      ['Desserts & bar', [['Salade de fruits frais', 'Ananas, papaye, mangue', 3500], ['Fondant au chocolat', 'Cœur coulant', 4500], ['Cocktail maison', 'Bissap, gingembre, citron vert', 5000]]]],
  },
  extraDesc: 'Séminaires, formations et réceptions à l\'Hôtel Héliconia de Franceville : salles équipées, forfaits journée d\'étude et hébergement des participants.',
  extraTitle: 'Séminaires & événements', extraLead: 'Salles équipées, pauses gourmandes et hébergement sur place : organisez votre événement à Franceville sans souci logistique.',
  extraBody: `<section class="sec"><div class="wrap"><span class="tag">Forfaits</span><h2>Nos formules, par participant</h2><div class="lst">
<div><h3>Demi-journée d'étude</h3><p>Salle équipée, vidéoprojecteur, sonorisation, eau et une pause-café.</p><b>15 000 FCFA</b></div>
<div><h3>Journée d'étude</h3><p>Salle, deux pauses-café, déjeuner au restaurant, papeterie.</p><b>25 000 FCFA</b></div>
<div><h3>Séminaire résidentiel</h3><p>Journée d'étude + nuit en chambre Standard, dîner et petit-déjeuner.</p><b>70 000 FCFA</b></div></div><p class="note">Tarifs indicatifs, dégressifs à partir de 20 participants. Devis précis sous 24 h.</p></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Sur place</span><h2>Tout est prévu</h2><ul class="chk">${['Salles de 10 à 120 personnes, en théâtre, en U ou en classe', 'Vidéoprojecteur, écran, sonorisation et micros', 'Wi-Fi haut débit pour tous les participants', 'Pauses-café, déjeuners et dîners de gala', 'Hébergement de toute la délégation sur place', 'Navette aéroport et transport des participants'].map((t) => `<li>${ic('check', 18)}<span>${t}</span></li>`).join('')}</ul></div>
<form class="form" data-wa-form="je souhaite un devis pour un événement." novalidate><h3 class="h3">Demander un devis</h3><p>Réponse sous 24 h avec une proposition détaillée.</p>
<div class="g2"><label class="fld"><span>Organisation</span><input name="org" required></label><label class="fld"><span>Type d'événement</span><select name="type"><option>Séminaire</option><option>Formation</option><option>Conférence</option><option>Réception / gala</option><option>Mariage</option></select></label></div>
<div class="g2"><label class="fld"><span>Date souhaitée</span><input type="date" name="date" required></label><label class="fld"><span>Participants</span><input type="number" name="pax" min="5" value="30" required></label></div>
<div class="g2"><label class="fld"><span>Durée</span><select name="duree"><option>Demi-journée</option><option selected>1 journée</option><option>2 jours</option><option>3 jours et plus</option></select></label><label class="fld"><span>Hébergement</span><select name="heb"><option>Non</option><option>Oui, pour une partie du groupe</option><option>Oui, pour tout le groupe</option></select></label></div>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<button class="btn p" type="submit">Envoyer la demande sur WhatsApp</button></form></div></section>`,
  aboutDesc: 'L\'Hôtel Héliconia de Franceville, né pour la CAN 2012 : chambres et suites, piscine, salle de sport, restaurant, séminaires. Infos pratiques et accès.',
  aboutTitle: 'L\'hôtel', aboutLead: 'Un hôtel de la CAN 2012, devenu l\'adresse des voyageurs du Haut-Ogooué.',
  aboutH2: 'Une adresse née pour la CAN 2012', aboutText: ['Les hôtels Héliconia ont été construits à Franceville, Moanda et Bongoville pour accueillir les équipes et les visiteurs de la Coupe d\'Afrique des Nations 2012.', 'À Franceville, l\'hôtel propose une cinquantaine de chambres et de suites, une piscine, une salle de sport, un restaurant et des salles de réunion, dans le quartier calme de Mbaya.', 'Missions, délégations, familles et touristes y trouvent un point de départ confortable pour découvrir la province.'],
  faq: [['Quelles sont les heures d\'arrivée et de départ ?', 'Les chambres sont disponibles à partir de 14 h, le jour de l\'arrivée, et doivent être libérées avant 12 h le jour du départ. Le départ tardif est possible sur demande.'], ['Comment venir depuis l\'aéroport ?', 'L\'aéroport de Mvengué est à environ 30 minutes. Notre navette vient vous chercher sur demande : ajoutez-la à votre réservation.'], ['Peut-on payer en entreprise ?', 'Oui, nous établissons des factures au nom de votre société et acceptons les bons de commande des administrations et entreprises.'], ['Le petit-déjeuner est-il inclus ?', 'Il est proposé en option (buffet), à ajouter lors de la réservation ou sur place.'], ['La piscine est-elle accessible aux enfants ?', 'Oui, sous la surveillance des parents, tous les jours de 8 h à 19 h.']],
  gallery: [[P + 'hotel-1542314831-068cd1dbfeeb.jpg', 'La piscine de nuit'], [P + 'x-lobby-2.jpg', 'Le hall d\'accueil'], [P + 'hotel-1578683010236-d716f9a3f461.jpg', 'Suite VIP'], [P + 'x-chambre-twin-1.jpg', 'Chambre Standard'], [P + 'x-salle-resto-2.jpg', 'Le restaurant'], [P + 'hotel-1520250497591-112f2f40a3f4.jpg', 'Le jardin tropical'], [P + 'x-plat-africain-1.jpg', 'Cuisine gabonaise'], [P + 'hotel-1582719478250-c89cae4dc85b.jpg', 'Suite Junior'], [P + 'x-sdb-1.jpg', 'Salle de bain'], [P + 'x-lounge-bar-2.jpg', 'Le bar'], [P + 'x-cascade-1.jpg', 'Excursions nature']],
  access: [['plane', 'Aéroport de Mvengué', 'environ 30 min en voiture, navette sur demande'], ['car', 'Centre-ville de Franceville', 'environ 10 min'], ['pin', 'Gare du Transgabonais', 'terminus de Franceville, environ 15 min']],
  ph: { hero: P + 'hotel-1542314831-068cd1dbfeeb.jpg', side1: P + 'x-lobby-2.jpg', side2: P + 'hotel-1520250497591-112f2f40a3f4.jpg', rooms: P + 'hotel-1590490360182-c33d57733427.jpg', resto: P + 'x-salle-resto-2.jpg', food1: P + 'x-plat-africain-1.jpg', food2: P + 'x-poisson-braise-1.jpg', extra: P + 'x-lobby-1.jpg', about: P + 'hotel-1551882547-ff40c63fe5fa.jpg' },
};
