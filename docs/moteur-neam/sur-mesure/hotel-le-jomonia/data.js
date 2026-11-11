// Résidence hôtelière Le Jomonia, Libreville : données du site sur mesure (tarifs indicatifs, à confirmer avec l'hôtel).
const { ic } = require('../_kit-hotel/hotel-kit');
const P = '../../assets/photos/';
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="4" fill="#1E2B4A"/><path d="M9 18 22 9l13 9" fill="none" stroke="#B87333" stroke-width="2.4" stroke-linejoin="round"/><path d="M25 17v11.5a5.5 5.5 0 0 1-11 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
const STAY = [{ n: 7, pct: 10, label: 'semaine' }, { n: 14, pct: 15, label: 'deux semaines' }, { n: 30, pct: 25, label: 'mois' }];

module.exports = {
  slug: 'hotel-le-jomonia', name: 'Le Jomonia', tel: '077 06 40 00', wa: '24177064000', mail: 'info.lejomonia@gmail.com',
  addr: 'Bas de Gué-Gué', city: 'Libreville', mapq: 'Gue-Gue+Libreville+Gabon', hours: 'Réception 24 h/24',
  checkin: '13:00', checkout: '11:00', soc: ['facebook', 'instagram'], unit: 'logement', longStay: STAY,
  logoSvg, logo: `${logoSvg}<span class="t">Le Jomonia<small>Résidence hôtelière</small></span>`,
  fonts: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap',
  footer: 'Résidence hôtelière à Libreville : chambres et appartements équipés, petite piscine, navette aéroport. Idéal pour un long séjour ou un week-end.',
  roomsLabel: 'Chambres & appartements', restoLabel: 'Table d\'hôtes', extraPage: ['long-sejour.html', 'Long séjour'],
  title: 'Résidence hôtelière à Libreville, chambres et appartements', kicker: 'Libreville · Bas de Gué-Gué',
  h1: 'Chez vous à Libreville,<br>pour un soir ou un mois', lead: 'Chambres et appartements équipés dans un quartier calme et sécurisé, à 10 minutes de l\'aéroport Léon Mba.',
  intro: 'Le Jomonia est une résidence à taille humaine : 10 chambres et 6 appartements équipés, une salle à manger, une petite piscine et une équipe qui vous connaît par votre prénom. Idéal pour un long séjour ou pour s\'évader le temps d\'un week-end.',
  introTag: 'Bienvenue', introTitle: 'Une résidence calme,<br>à deux pas de tout',
  highlights: [['16', 'chambres et appartements'], ['10 min', 'de l\'aéroport'], ['−25 %', 'au mois']],
  roomsTitle: 'Chambres et appartements', roomsLead: 'Des chambres pour les courts séjours, des appartements avec cuisine pour vivre à votre rythme.',
  rooms: [
    { id: 'standard', n: 'Chambre Standard', cap: 2, m2: 18, bed: 'Lit double', d: 'Chambre claire et calme, salle de douche privée : l\'essentiel pour une escale ou un déplacement professionnel.', eq: ['Climatisation', 'TV', 'Wi-Fi', 'Douche', 'Bureau'], price: 30000, wkd: 27000, ph: [P + 'hotel-1613553474179-e1eda3ea5734.jpg', P + 'x-sdb-2.jpg'] },
    { id: 'confort', n: 'Chambre Confort', cap: 3, m2: 24, bed: 'Lit queen ou 2 lits', d: 'Plus spacieuse, avec coin salon et réfrigérateur : parfaite pour les séjours de plusieurs jours.', eq: ['Climatisation', 'Réfrigérateur', 'Coin salon', 'Wi-Fi', 'Douche'], price: 38000, wkd: 34000, ph: [P + 'x-chambre-twin-3.jpg', P + 'x-sdb-1.jpg'] },
    { id: 'appart1', n: 'Appartement 1 chambre', cap: 2, m2: 45, bed: 'Lit queen + salon', d: 'Chambre, salon et cuisine équipée : vous vivez comme chez vous, avec le service d\'un hôtel.', eq: ['Cuisine équipée', 'Salon', 'Lave-linge', 'Wi-Fi', 'Ménage inclus'], price: 55000, wkd: 50000, ph: [P + 'x-suite-2.jpg', P + 'x-cuisine-appart-2.jpg'] },
    { id: 'appart2', n: 'Appartement 2 chambres', cap: 4, m2: 70, bed: 'Lit queen + 2 lits', d: 'Deux chambres, grand salon et cuisine ouverte : pour une famille, un couple d\'expatriés ou deux collègues en mission.', eq: ['2 chambres', 'Cuisine ouverte', 'Lave-linge', 'Wi-Fi', 'Ménage inclus'], price: 75000, wkd: 70000, ph: [P + 'x-suite-1.jpg', P + 'x-cuisine-appart-1.jpg', P + 'x-chambre-twin-1.jpg'] },
  ],
  extras: [
    { id: 'pdj', n: 'Petit-déjeuner continental', p: 5000, u: 'par adulte et par nuit', per: 'pers-nuit' },
    { id: 'navette', n: 'Navette aéroport Léon Mba', p: 10000, u: 'par trajet', per: 'sejour' },
    { id: 'linge', n: 'Blanchisserie (forfait)', p: 10000, u: 'par séjour', per: 'sejour' },
    { id: 'diner', n: 'Dîner à la table d\'hôtes', p: 8000, u: 'par adulte et par nuit', per: 'pers-nuit' },
    { id: 'late', n: 'Départ tardif (jusqu\'à 15 h)', p: 10000, u: 'par séjour', per: 'sejour' },
    { id: 'courses', n: 'Courses livrées à l\'arrivée', p: 5000, u: 'frais de service', per: 'sejour' },
  ],
  amenTitle: 'Les services de la résidence', amen: [
    ['plane', 'Navette aéroport', 'À 10 minutes de Léon Mba, on vient vous chercher.'], ['pool', 'Petite piscine', 'Pour se rafraîchir après une journée de travail.'],
    ['fork', 'Salle à manger', 'Petit-déjeuner, déjeuner et dîner sur place.'], ['wifi', 'Wi-Fi gratuit', 'Partout dans la résidence.'],
    ['park', 'Parking gratuit', 'Dans l\'enceinte sécurisée.'], ['wash', 'Blanchisserie', 'Linge lavé et repassé sous 24 h.'],
    ['shield', 'Quartier sécurisé', 'Zone résidentielle calme, gardiennage 24 h/24.'], ['desk', 'Facture entreprise', 'Missions, ONG, expatriés : on s\'adapte.'],
  ],
  homeExtra: `<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Long séjour</span><h2>Plus vous restez, moins vous payez</h2></div><a class="btn line" href="long-sejour.html">Simuler mon séjour</a></div><div class="lst">
${STAY.map((t) => `<div><h3>Dès ${t.n} nuits</h3><p>Remise appliquée automatiquement sur toutes les nuits, chambres et appartements.</p><b>−${t.pct} %</b></div>`).join('')}</div></div></section>`,
  reviews: [['Patrick', 'Mission de 3 semaines', 'Appartement impeccable, cuisine bien équipée et ménage chaque jour. Je me suis senti chez moi.'], ['Inès', 'Week-end en couple', 'Calme absolu, piscine agréable et petit-déjeuner servi avec le sourire. On reviendra.'], ['Serge', 'Escale avant un vol', 'La navette m\'a déposé à l\'aéroport en 10 minutes. Pratique et très bon rapport qualité-prix.']],
  ctaTitle: 'Un séjour à Libreville ?', ctaText: 'Une nuit, une semaine ou un mois : réservez en ligne ou écrivez-nous sur WhatsApp.',
  resto: {
    desc: 'La table d\'hôtes du Jomonia à Libreville : petit-déjeuner continental, déjeuner et dîner faits maison, servis en salle à manger.',
    title: 'Table d\'hôtes', lead: 'Petit-déjeuner, déjeuner et dîner faits maison, servis dans notre salle à manger.',
    h2: 'Une cuisine de maison', text: 'Pas de carte interminable : chaque jour, un menu simple et généreux, cuisiné avec les produits du marché de Libreville. Les résidents des appartements peuvent aussi cuisiner chez eux.',
    hours: [['Petit-déjeuner', '6 h 30 – 10 h'], ['Déjeuner', '12 h – 14 h 30'], ['Dîner', '19 h – 22 h'], ['Room service', 'sur demande']],
    menu: [['Petit-déjeuner', [['Continental', 'Pain, viennoiseries, beurre, confiture, jus, café ou thé', 5000], ['Œufs au choix', 'Omelette, brouillés ou au plat', 2000], ['Fruits frais', 'Ananas, papaye, banane', 1500]]],
      ['Plat du jour', [['Poulet DG', 'Plantain, légumes sautés', 7000], ['Poisson braisé', 'Bâtons de manioc, sauce piment', 8000], ['Riz sauté aux crevettes', 'Légumes croquants', 7500]]],
      ['Douceurs', [['Salade de fruits', 'Fruits du marché', 2500], ['Beignets maison', 'Sucre et cannelle', 2000], ['Jus frais', 'Bissap, gingembre ou ananas', 1500]]]],
  },
  extraDesc: 'Long séjour au Jomonia à Libreville : remises dès 7 nuits, appartements équipés, ménage et blanchisserie. Simulateur de prix et réservation.',
  extraTitle: 'Long séjour', extraLead: 'Mission, stage, mutation, travaux chez vous : posez vos valises au Jomonia et payez moins chaque semaine.',
  extraBody: `<section class="sec"><div class="wrap"><span class="tag">Simulateur</span><h2>Combien coûte votre séjour ?</h2><p class="lead">Choisissez la durée et le logement : la remise est calculée immédiatement.</p>
<div class="sim" data-ls><div><label class="fld"><span>Logement</span><select name="r"><option value="standard">Chambre Standard</option><option value="confort">Chambre Confort</option><option value="appart1" selected>Appartement 1 chambre</option><option value="appart2">Appartement 2 chambres</option></select></label>
<p style="margin-top:18px">Durée du séjour : <span class="val" data-ls-n></span></p><input type="range" name="n" min="1" max="60" value="30" aria-label="Nombre de nuits"><p class="note">Remises : −10 % dès 7 nuits, −15 % dès 14 nuits, −25 % dès 30 nuits.</p></div>
<div class="res"><span>Total estimé</span><div data-ls-r></div><a class="btn p" data-ls-go href="reservation.html">Réserver ces dates</a></div></div></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Inclus</span><h2>Vivre comme chez vous</h2><ul class="chk">${['Cuisine équipée dans les appartements (plaques, four, réfrigérateur, vaisselle)', 'Ménage quotidien et changement du linge deux fois par semaine', 'Wi-Fi gratuit et espace de travail', 'Parking gratuit dans l\'enceinte sécurisée', 'Facture mensuelle au nom de votre entreprise ou ONG', 'Accueil à l\'aéroport à votre arrivée'].map((t) => `<li>${ic('check', 18)}<span>${t}</span></li>`).join('')}</ul></div>
<form class="form" data-wa-form="je souhaite un devis pour un long séjour." novalidate><h3 class="h3">Devis long séjour</h3><p>Pour une entreprise, une ONG ou plusieurs personnes : nous vous faisons une offre sur mesure.</p>
<div class="g2"><label class="fld"><span>Date d'arrivée</span><input type="date" name="date" required></label><label class="fld"><span>Durée</span><select name="duree"><option>1 à 2 semaines</option><option selected>1 mois</option><option>2 à 3 mois</option><option>Plus de 3 mois</option></select></label></div>
<div class="g2"><label class="fld"><span>Logement</span><select name="log"><option>Chambre</option><option selected>Appartement 1 chambre</option><option>Appartement 2 chambres</option><option>Plusieurs logements</option></select></label><label class="fld"><span>Facturation</span><select name="fact"><option>Particulier</option><option>Entreprise / ONG</option></select></label></div>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<button class="btn p" type="submit">Envoyer sur WhatsApp</button></form></div></section>`,
  aboutDesc: 'Le Jomonia, résidence hôtelière à Bas de Gué-Gué, Libreville : 10 chambres, 6 appartements, piscine, navette aéroport. Infos pratiques et accès.',
  aboutTitle: 'La résidence', aboutLead: 'Une maison d\'hôtes à taille humaine, dans un quartier calme de Libreville.',
  aboutH2: 'Le calme de Gué-Gué, l\'aéroport à 10 minutes', aboutText: ['Le Jomonia est installé à Bas de Gué-Gué, une zone résidentielle calme et sécurisée, à 10 minutes de l\'aéroport Léon Mba et 15 minutes du centre-ville.', 'La résidence compte 10 chambres standard et 6 appartements équipés, une salle à manger où sont servis petit-déjeuner, déjeuner et dîner, et une petite piscine.', 'Navette aéroport, Wi-Fi, parking et blanchisserie : tout est pensé pour les séjours longs comme pour les week-ends.'],
  faq: [['Quelles sont les heures d\'arrivée et de départ ?', 'Arrivée à partir de 13 h, départ avant 11 h. Pour un vol tôt ou tard, prévenez-nous : nous nous arrangeons.'], ['Comment fonctionne la remise long séjour ?', 'Elle s\'applique automatiquement sur toutes les nuits : −10 % dès 7 nuits, −15 % dès 14 nuits, −25 % dès 30 nuits.'], ['La navette aéroport est-elle disponible la nuit ?', 'Oui, à toute heure, sur réservation. Donnez-nous votre numéro de vol.'], ['Peut-on cuisiner ?', 'Oui, dans les appartements, qui ont une cuisine équipée. Les chambres ont accès à la table d\'hôtes.'], ['Facturez-vous les entreprises ?', 'Oui, avec facture mensuelle pour les séjours longs et bons de commande pour les ONG et administrations.']],
  gallery: [[P + 'x-residence-1.jpg', 'La résidence'], [P + 'x-suite-2.jpg', 'Appartement 1 chambre'], [P + 'x-cuisine-appart-1.jpg', 'Cuisine équipée'], [P + 'hotel-1613553474179-e1eda3ea5734.jpg', 'Chambre Standard'], [P + 'x-buffet-2.jpg', 'Petit-déjeuner'], [P + 'x-chambre-twin-3.jpg', 'Chambre Confort'], [P + 'x-suite-1.jpg', 'Salon, appartement 2 chambres'], [P + 'x-sdb-1.jpg', 'Salle de bain'], [P + 'x-plat-africain-2.jpg', 'Plat du jour'], [P + 'x-cuisine-appart-2.jpg', 'Coin cuisine'], [P + 'x-lobby-3.jpg', 'L\'accueil']],
  access: [['plane', 'Aéroport Léon Mba', 'environ 10 min, navette sur demande'], ['car', 'Centre-ville de Libreville', 'environ 15 min'], ['pin', 'Bord de mer', 'le front de mer à quelques minutes']],
  ph: { hero: P + 'hotel-1611892440504-42a792e24d32.jpg', side1: P + 'x-residence-1.jpg', side2: P + 'x-cuisine-appart-2.jpg', rooms: P + 'x-suite-2.jpg', resto: P + 'x-buffet-2.jpg', food1: P + 'x-buffet-1.jpg', food2: P + 'x-plat-africain-2.jpg', extra: P + 'x-cuisine-appart-1.jpg', about: P + 'x-lobby-3.jpg' },
};
