// Hôtel Hibiscus, Libreville : données du site sur mesure.
// Infos réelles (hotelhibiscusgabon.com, Booking, Agoda, Travelocity) : « meilleur rapport qualité-prix », plus de 10 ans d'activité ;
// 2 établissements en centre-ville : Hibiscus Louis (Gué-Gué / Louis) et Hibiscus Boulevard Triomphal, à 20 min de l'aéroport Léon Mba,
// à quelques pas de l'océan et des centres commerciaux ; fibre optique, secours eau et électricité ; piscines adultes et enfants,
// salle de sport, 2 restaurants (cuisine locale et européenne), snack-bar, Luxor Lounge à Hibiscus Louis ; chambres standard (25 m²),
// suites junior (32 m²) et suites (36 m²) avec TV, climatisation, réfrigérateur, bureau, balcon vue océan ou ville pour la plupart ;
// mariages dès 1 500 000 FCFA ; parking gratuit, réception 24 h/24, bagagerie ; 066 83 55 18 ; contact@hotelhibiscusgabon.com ;
// dirigé par Gwladys MIMBOUI MENGUE. Prix des chambres : indicatifs (tarif moyen constaté autour de 55 000 FCFA), à confirmer.
const { ic } = require('../_kit-hotel/hotel-kit');
const P = '../../assets/photos/';
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="12" fill="#FBF3F5"/><g transform="translate(22 22)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="6.5" ry="11" cy="-9" fill="#D6336C" transform="rotate(${a})"/>`).join('')}<circle r="3.6" fill="#F2C94C"/></g></svg>`;

module.exports = {
  slug: 'hotel-hibiscus', name: 'Hôtel Hibiscus', tel: '066 83 55 18', wa: '24166835518', mail: 'contact@hotelhibiscusgabon.com',
  addr: 'Hibiscus Louis (Gué-Gué) · Hibiscus Boulevard Triomphal', city: 'Libreville', mapq: 'Hotel+Hibiscus+Louis+Libreville', hours: 'Réception 24 h/24, 7 j/7',
  checkin: '14:00', checkout: '12:00', soc: ['facebook', 'instagram'], unit: 'chambre',
  sites: ['Hibiscus Louis (Gué-Gué)', 'Hibiscus Boulevard Triomphal'],
  logoSvg, logo: `<img src="../../assets/logos/hotel-hibiscus.png" alt="Hôtel Hibiscus" width="224" height="40">`,
  fonts: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap',
  footer: 'Deux hôtels au cœur de Libreville, près de l\'océan : chambres et suites, piscines, salle de sport, restaurants et Luxor Lounge.',
  roomsLabel: 'Chambres & suites', restoLabel: 'Restaurants', extraPage: ['evenements.html', 'Mariages & Luxor Lounge'],
  title: 'Hôtel à Libreville, deux adresses près de l\'océan', kicker: 'Libreville · Louis & Boulevard Triomphal',
  h1: 'Le meilleur rapport<br>qualité-prix de Libreville', lead: 'Deux hôtels en plein centre, à deux pas de l\'océan : chambres avec balcon, piscines, fibre optique et réception 24 h/24.',
  intro: 'Depuis plus de 10 ans, l\'Hôtel Hibiscus accueille voyageurs d\'affaires, familles et touristes dans deux établissements du centre de Libreville. Fibre optique, secours eau et électricité : votre séjour n\'est jamais interrompu.',
  introTag: 'Bienvenue', introTitle: 'Deux adresses,<br>un même accueil',
  highlights: [['2', 'hôtels en centre-ville'], ['10 ans+', 'd\'expérience'], ['20 min', 'de l\'aéroport Léon Mba']],
  roomsTitle: 'Chambres et suites', roomsLead: 'TV écran plat, climatisation, réfrigérateur, bureau et salle de bain privée ; balcon vue océan ou ville pour la plupart.',
  rooms: [
    { id: 'standard', n: 'Chambre Standard', cap: 2, m2: 25, bed: 'Lit double', d: 'Confortable et fonctionnelle, avec bureau et balcon pour la plupart : le meilleur rapport qualité-prix du centre-ville.', eq: ['Climatisation', 'TV écran plat', 'Réfrigérateur', 'Wi-Fi fibre'], price: 55000, wkd: 55000, ph: [P + 'x-chambre-twin-3.jpg', P + 'x-sdb-2.jpg'] },
    { id: 'junior', n: 'Suite Junior', cap: 3, m2: 32, bed: 'Lit queen + canapé-lit', d: 'Un espace salon avec canapé-lit : idéale pour une famille ou un séjour de plusieurs nuits.', eq: ['Coin salon', 'Canapé-lit', 'Balcon', 'Wi-Fi fibre'], price: 75000, wkd: 75000, ph: [P + 'x-suite-2.jpg', P + 'x-sdb-1.jpg'] },
    { id: 'suite', n: 'Suite Hibiscus', cap: 3, m2: 36, bed: 'Lit queen + canapé-lit', d: 'Notre plus grande chambre, avec salon et balcon sur l\'océan ou la ville.', eq: ['Salon', 'Vue océan ou ville', 'Baignoire', 'Wi-Fi fibre'], price: 95000, wkd: 95000, ph: [P + 'hotel-1590490360182-c33d57733427.jpg', P + 'x-suite-1.jpg'] },
  ],
  extras: [
    { id: 'pdj', n: 'Petit-déjeuner', p: 7000, u: 'par adulte et par nuit', per: 'pers-nuit' },
    { id: 'navette', n: 'Transfert aéroport Léon Mba', p: 15000, u: 'par trajet', per: 'sejour' },
    { id: 'lit', n: 'Lit d\'appoint', p: 10000, u: 'par nuit', per: 'nuit' },
    { id: 'late', n: 'Départ tardif (jusqu\'à 16 h)', p: 15000, u: 'par séjour', per: 'sejour' },
  ],
  amenTitle: 'Tout pour un séjour sans souci', amen: [
    ['pool', 'Piscines adultes & enfants', 'Accès gratuit, eau contrôlée, entourées d\'arbres.'], ['wifi', 'Fibre optique', 'L\'une des connexions les plus rapides de la ville.'],
    ['shield', 'Secours eau & électricité', 'Groupe et réserve d\'eau : aucune coupure.'], ['fork', '2 restaurants & snack-bar', 'Saveurs locales et européennes.'],
    ['gym', 'Salle de sport', 'Pour garder le rythme pendant vos déplacements.'], ['star', 'Luxor Lounge', 'Le lounge de Hibiscus Louis, pour vos soirées.'],
    ['park', 'Parking gratuit', 'Et bagagerie à la réception.'], ['plane', 'À 20 min de l\'aéroport', 'En plein centre, près de l\'océan.'],
  ],
  homeExtra: `<section class="sec"><div class="wrap"><span class="tag">Nos deux hôtels</span><h2>Choisissez votre adresse</h2><div class="duo2">
<div><img src="${P}hotel-1571896349842-33c89424de2d.jpg" alt="" loading="lazy"><div class="bd"><h3>Hibiscus Louis</h3><p>Quartier Louis / Gué-Gué, à deux pas de l'océan. Piscines, restaurants et le Luxor Lounge, la salle de réception des mariages.</p><a class="btn p" href="reservation.html?site=Hibiscus%20Louis%20(Gu%C3%A9-Gu%C3%A9)">Réserver à Louis</a></div></div>
<div><img src="${P}x-lobby-1.jpg" alt="" loading="lazy"><div class="bd"><h3>Hibiscus Boulevard Triomphal</h3><p>Sur le boulevard Triomphal, au cœur du centre administratif et des affaires, près des commerces.</p><a class="btn p" href="reservation.html?site=Hibiscus%20Boulevard%20Triomphal">Réserver au Boulevard</a></div></div></div></div></section>`,
  reviews: [['Franck', 'Mission de 4 nuits', 'Wi-Fi rapide, aucune coupure d\'électricité et un balcon avec vue. Pour le prix, c\'est imbattable.'], ['Sylvie', 'Week-end en famille', 'Les enfants ont adoré leur piscine pendant que nous profitions de la nôtre. Personnel chaleureux.'], ['Cédric', 'Mariage', 'Salle magnifique, organisation au cordeau et soirée au Luxor Lounge : nos invités en parlent encore.']],
  ctaTitle: 'Un séjour à Libreville ?', ctaText: 'Choisissez votre hôtel, vos dates et votre chambre : confirmation rapide sur WhatsApp.',
  resto: {
    desc: 'Les restaurants de l\'Hôtel Hibiscus à Libreville : cuisine locale et européenne, snack-bar au bord de la piscine, Luxor Lounge.',
    title: 'Restaurants & snack-bar', lead: 'Saveurs locales et européennes, au restaurant ou au bord de la piscine.',
    h2: 'Deux restaurants, un snack-bar', text: 'Du petit-déjeuner aux dîners d\'affaires, nos cuisines marient les classiques gabonais et européens. Au bord de la piscine, le snack-bar sert grillades, salades et jus frais.',
    hours: [['Petit-déjeuner', '6 h 30 – 10 h'], ['Déjeuner', '12 h – 15 h'], ['Dîner', '19 h – 22 h 30'], ['Snack-bar piscine', '10 h – 20 h']],
    menu: [['Saveurs locales', [['Poulet nyembwe', 'Sauce noix de palme, riz ou plantain', 9000], ['Poisson braisé', 'Bâtons de manioc, sauce pimentée', 11000], ['Feuilles de manioc', 'Au poisson fumé', 7500]]],
      ['Saveurs européennes', [['Entrecôte grillée', 'Frites maison, sauce au poivre', 13000], ['Pâtes aux fruits de mer', 'Crème légère, persil', 11000], ['Salade César', 'Poulet grillé, parmesan', 7000]]],
      ['Snack & douceurs', [['Club sandwich', 'Frites maison', 6500], ['Burger Hibiscus', 'Bœuf, cheddar, oignons confits', 7500], ['Coupe de glace', 'Trois boules au choix', 3500]]]],
  },
  extraDesc: 'Mariages, réceptions et soirées à l\'Hôtel Hibiscus Louis : formules mariage dès 1 500 000 FCFA, Luxor Lounge pour vos anniversaires et enterrements de vie de garçon.',
  extraTitle: 'Mariages, événements & Luxor Lounge', extraLead: 'Du mariage intimiste à la grande réception, et des soirées au meilleur lounge de la ville.',
  extraBody: `<section class="sec"><div class="wrap split"><div><span class="tag">Mariages</span><h2>Votre mariage sur mesure</h2><p class="lead">Aucun mariage ne ressemble à un autre : à Hibiscus Louis, nous composons chaque célébration selon vos envies, de la cérémonie intime à la grande fête.</p><ul class="chk">${['Salle de réception décorée', 'Menu et gâteau sur mesure', 'Chambre nuptiale offerte', 'Hébergement des invités à tarif préférentiel', 'Parking gratuit pour le cortège'].map((t) => `<li>${ic('check', 18)}<span>${t}</span></li>`).join('')}</ul><div class="lst" style="grid-template-columns:1fr"><div><h3>Formules mariage</h3><p>Selon le nombre d'invités, le menu et la décoration.</p><b>dès 1 500 000 FCFA</b></div></div></div><img class="big" src="${P}x-deco-mariage-1.jpg" alt="Table de mariage" loading="lazy"></div></section>
<section class="sec soft"><div class="wrap split"><img class="big" src="${P}x-lounge-bar-3.jpg" alt="Cocktails au Luxor Lounge" loading="lazy"><div><span class="tag">Luxor Lounge</span><h2>Le meilleur lounge de la ville</h2><p class="lead">À Hibiscus Louis : se détendre après le travail, sortir entre amis, fêter un anniversaire ou un enterrement de vie de garçon.</p>
<form class="form" data-wa-form="je souhaite organiser un événement." novalidate><div class="g2"><label class="fld"><span>Événement</span><select name="type"><option>Mariage</option><option>Anniversaire au Luxor Lounge</option><option>Enterrement de vie de garçon / jeune fille</option><option>Séminaire / réunion</option><option>Autre</option></select></label><label class="fld"><span>Date</span><input type="date" name="date" required></label></div>
<div class="g2"><label class="fld"><span>Invités</span><input type="number" name="inv" min="2" value="30" required></label><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label></div>
<label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label><button class="btn p" type="submit">Demander un devis sur WhatsApp</button></form></div></div></section>`,
  aboutDesc: 'L\'Hôtel Hibiscus, deux hôtels au centre de Libreville depuis plus de 10 ans : Hibiscus Louis et Hibiscus Boulevard Triomphal. Équipements et infos pratiques.',
  aboutTitle: 'Nos hôtels', aboutLead: 'Plus de 10 ans au service des voyageurs, au cœur de Libreville.',
  aboutH2: 'L\'art de la satisfaction client', aboutText: ['Réputé pour être le meilleur rapport qualité-prix du Gabon, l\'Hôtel Hibiscus est devenu le choix naturel des voyageurs locaux comme des touristes.', 'Nos deux établissements, à Louis et sur le boulevard Triomphal, sont à quelques pas de l\'océan et des centres commerciaux, à 20 minutes de l\'aéroport Léon Mba.', 'Fibre optique, secours eau et électricité, piscines, restaurants et Luxor Lounge : notre équipe travaille chaque jour pour un séjour confortable et sans interruption.'],
  faq: [['Quelle différence entre les deux hôtels ?', 'Hibiscus Louis est proche de l\'océan et accueille le Luxor Lounge et les mariages ; Hibiscus Boulevard Triomphal est au cœur du quartier des affaires. Mêmes standards de confort.'], ['Le Wi-Fi est-il fiable ?', 'Oui : fibre optique, l\'une des connexions les plus rapides des hôtels de la ville, gratuite pour nos clients.'], ['Y a-t-il des coupures d\'eau ou d\'électricité ?', 'Nos hôtels disposent de systèmes de secours pour l\'eau et l\'électricité.'], ['La piscine est-elle accessible aux enfants ?', 'Oui, une piscine dédiée aux enfants, gratuite pour les clients de l\'hôtel.'], ['Peut-on laisser ses bagages après le départ ?', 'Oui, la bagagerie de la réception est à votre disposition, 24 h/24.']],
  gallery: [[P + 'hotel-1571896349842-33c89424de2d.jpg', 'La piscine'], [P + 'x-suite-2.jpg', 'Suite Junior'], [P + 'x-lounge-bar-2.jpg', 'Luxor Lounge'], [P + 'x-deco-mariage-2.jpg', 'Mariages'], [P + 'x-chambre-twin-3.jpg', 'Chambre Standard'], [P + 'x-salle-resto-2.jpg', 'Le restaurant'], [P + 'hotel-1590490360182-c33d57733427.jpg', 'Suite Hibiscus'], [P + 'x-lounge-bar-3.jpg', 'Cocktails'], [P + 'x-lobby-1.jpg', 'Hibiscus Boulevard Triomphal'], [P + 'x-sdb-1.jpg', 'Salle de bain'], [P + 'x-dj-1.jpg', 'Soirée au lounge']],
  access: [['plane', 'Aéroport Léon Mba', 'environ 20 min'], ['pin', 'Bord de mer', 'à quelques pas'], ['car', 'Centres commerciaux', 'à proximité des deux hôtels']],
  ph: { hero: P + 'hotel-1571896349842-33c89424de2d.jpg', side1: P + 'x-lobby-1.jpg', side2: P + 'x-lounge-bar-2.jpg', rooms: P + 'x-suite-2.jpg', resto: P + 'x-salle-resto-2.jpg', food1: P + 'x-plat-africain-6.jpg', food2: P + 'x-salade-crevettes-1.jpg', extra: P + 'x-deco-mariage-2.jpg', about: P + 'x-lobby-1.jpg' },
};
