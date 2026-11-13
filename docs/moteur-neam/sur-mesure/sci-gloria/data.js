// SCI Gloria (Angondjé, Libreville) : données du site sur mesure.
// Infos réelles (Le Pratique du Gabon 2025, TikTok @sci.gloria) : promotion immobilière et location gérance, appartements ;
// Angondjé, les Parasoliers, BP 3846 Libreville ; 062 90 82 81 ; scigloria241@gmail.com ; appartements meublés modernes à louer.
// Types de logements, prix, services et remises : exemples à confirmer avec la SCI.
const { ic } = require('../_kit-hotel/hotel-kit');
const P = '../../assets/photos/';
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="8" fill="#24364A"/><path d="M11 33V19l11-8 11 8v14" fill="none" stroke="#E39A7E" stroke-width="2.2" stroke-linejoin="round"/><text x="22" y="31" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" fill="#fff">G</text></svg>`;
const STAY = [{ n: 7, pct: 10, label: 'semaine' }, { n: 30, pct: 30, label: 'mois' }];

module.exports = {
  slug: 'sci-gloria', name: 'SCI Gloria', tel: '062 90 82 81', wa: '24162908281', mail: 'scigloria241@gmail.com',
  addr: 'Angondjé, les Parasoliers, BP 3846', city: 'Libreville', mapq: 'Angondje,+Libreville,+Gabon', hours: 'Accueil 7 j/7, 8 h – 20 h',
  checkin: '14:00', checkout: '11:00', soc: ['tiktok', 'facebook'], unit: 'logement', longStay: STAY, ldType: 'LodgingBusiness',
  logoSvg, logo: `${logoSvg}<span class="t">SCI Gloria<small>Appartements meublés</small></span>`,
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Mulish:wght@400;500;600;700&display=swap',
  footer: 'Appartements meublés et location gérance à Angondjé : studios et appartements équipés, à la nuit, à la semaine ou au mois.',
  roomsLabel: 'Nos appartements', restoLabel: 'Services', restoFile: 'services.html', aboutLabel: 'La SCI', extraPage: ['long-sejour.html', 'Location au mois'],
  title: 'Appartements meublés à Angondjé, Libreville', kicker: 'Angondjé · les Parasoliers',
  h1: 'Chez vous à Angondjé,<br>meublé et équipé', lead: 'Studios et appartements modernes, prêts à vivre : pour une nuit, une mission ou plusieurs mois.',
  intro: 'SCI Gloria loue et gère des appartements meublés aux Parasoliers, à Angondjé : un quartier calme du nord de Libreville, à quelques minutes de l\'aéroport et d\'Akanda.',
  introTag: 'Bienvenue', introTitle: 'Le confort d\'un appartement,<br>la simplicité d\'un hôtel',
  highlights: [['Meublés', 'et entièrement équipés'], ['Nuit · mois', 'durée au choix'], ['−30 %', 'au mois']],
  roomsTitle: 'Studios et appartements', roomsLead: 'Cuisine équipée, climatisation, Wi-Fi, linge fourni. Ménage inclus, remise automatique à la semaine et au mois.',
  rooms: [
    { id: 'studio', n: 'Studio meublé', cap: 2, m2: 30, bed: 'Lit double', d: 'Pièce de vie avec coin nuit, kitchenette et salle de douche : idéal pour un voyageur ou un couple.', eq: ['Kitchenette', 'Climatisation', 'Wi-Fi', 'TV'], price: 25000, wkd: 25000, ph: [P + 'x-cuisine-appart-2.jpg', P + 'x-sdb-2.jpg'] },
    { id: 't2', n: 'Appartement 1 chambre', cap: 3, m2: 50, bed: 'Lit queen + canapé', d: 'Salon, chambre séparée et cuisine équipée : le confort pour une mission ou un séjour en famille.', eq: ['Cuisine équipée', 'Salon', 'Climatisation', 'Wi-Fi'], price: 40000, wkd: 40000, ph: [P + 'x-suite-2.jpg', P + 'x-cuisine-appart-1.jpg'] },
    { id: 't3', n: 'Appartement 2 chambres', cap: 5, m2: 75, bed: 'Lit queen + 2 lits', d: 'Deux chambres, grand salon et balcon : pour une famille ou des collègues en déplacement.', eq: ['2 chambres', 'Balcon', 'Lave-linge', 'Parking'], price: 55000, wkd: 55000, ph: [P + 'x-suite-1.jpg', P + 'x-chambre-twin-1.jpg', P + 'x-residence-1.jpg'] },
  ],
  extras: [
    { id: 'menage', n: 'Ménage quotidien', p: 5000, u: 'par nuit', per: 'nuit' },
    { id: 'navette', n: 'Accueil à l\'aéroport', p: 10000, u: 'par trajet', per: 'sejour' },
    { id: 'courses', n: 'Courses livrées à l\'arrivée', p: 5000, u: 'frais de service', per: 'sejour' },
    { id: 'linge', n: 'Blanchisserie (forfait)', p: 10000, u: 'par séjour', per: 'sejour' },
    { id: 'late', n: 'Départ tardif', p: 10000, u: 'par séjour', per: 'sejour' },
  ],
  amenTitle: 'Dans chaque logement', amen: [
    ['fork', 'Cuisine équipée', 'Plaques, réfrigérateur, vaisselle : vivez à votre rythme.'], ['wifi', 'Wi-Fi', 'Pour travailler comme à la maison.'],
    ['shield', 'Résidence sécurisée', 'Gardiennage et accès contrôlé.'], ['park', 'Parking', 'Dans l\'enceinte de la résidence.'],
    ['wash', 'Linge fourni', 'Draps et serviettes, changés chaque semaine.'], ['desk', 'Facture entreprise', 'Missions, ONG, expatriés.'],
    ['plane', 'Proche de l\'aéroport', 'Angondjé, au nord de Libreville.'], ['star', 'Location gérance', 'Propriétaires : confiez-nous votre bien.'],
  ],
  homeExtra: `<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Location au mois</span><h2>Restez plus longtemps, payez moins</h2></div><a class="btn line" href="long-sejour.html">Simuler mon séjour</a></div><div class="lst">
${STAY.map((t) => `<div><h3>Dès ${t.n} nuits</h3><p>Remise appliquée automatiquement sur toutes les nuits.</p><b>−${t.pct} %</b></div>`).join('')}<div><h3>Propriétaires</h3><p>Location gérance : nous louons, entretenons et gérons votre appartement.</p><b>Sur devis</b></div></div></div></section>`,
  reviews: [['Ange', 'Mission de 3 semaines', 'Appartement propre et bien équipé, quartier calme. La remise à la semaine fait vraiment la différence.'], ['Carole', 'Séjour en famille', 'Deux chambres, une vraie cuisine et un accueil très réactif sur WhatsApp. Parfait pour les vacances.'], ['Fabrice', 'Location au mois', 'Je loue depuis quatre mois : tout fonctionne, et la facture mensuelle simplifie la vie de mon entreprise.']],
  ctaTitle: 'Un appartement à Angondjé ?', ctaText: 'Une nuit, une semaine ou plusieurs mois : vérifiez les disponibilités et réservez sur WhatsApp.',
  resto: {
    desc: 'Les services de SCI Gloria : ménage, blanchisserie, accueil aéroport, conciergerie et location gérance pour les propriétaires.',
    title: 'Services de la résidence', lead: 'Tout ce qu\'il faut pour un séjour sans souci, et une gestion sereine pour les propriétaires.',
    tag1: 'Au quotidien', h2: 'Comme à l\'hôtel, en mieux', text: 'Ménage, linge, accueil à l\'aéroport, courses livrées : vous profitez de votre appartement, nous nous occupons du reste.',
    hours: [['Accueil', '7 j/7, 8 h – 20 h'], ['Arrivée', 'dès 14 h'], ['Départ', 'avant 11 h'], ['Urgences', 'joignable 24 h/24']],
    tag2: 'Tarifs indicatifs', h2b: 'Nos services', note: 'Services à la demande, à ajouter lors de la réservation ou pendant le séjour.',
    menu: [['Séjour', [['Ménage quotidien', 'Pendant tout le séjour', 5000], ['Blanchisserie', 'Linge lavé et repassé', 10000], ['Départ tardif', 'Selon disponibilité', 10000]]],
      ['Arrivée', [['Accueil à l\'aéroport', 'Léon Mba, à toute heure', 10000], ['Courses livrées', 'Votre liste, prête à l\'arrivée', 5000], ['Remise des clés', 'Sur place ou en boîte à clés', 0]]],
      ['Propriétaires', [['Location gérance', 'Recherche de locataires, loyers, entretien', 0], ['État des lieux', 'Avec photos, à chaque départ', 0], ['Rapport mensuel', 'Revenus et interventions', 0]]]],
  },
  extraDesc: 'Location d\'appartements meublés au mois à Angondjé : −10 % dès 7 nuits, −30 % dès 30 nuits. Simulateur et devis entreprise.',
  extraTitle: 'Location au mois', extraLead: 'Mission, mutation, travaux chez vous : un appartement meublé pour plusieurs semaines ou plusieurs mois.',
  extraBody: `<section class="sec"><div class="wrap"><span class="tag">Simulateur</span><h2>Combien coûte votre séjour ?</h2><p class="lead">Choisissez la durée et le logement : la remise est calculée immédiatement.</p>
<div class="sim" data-ls><div><label class="fld"><span>Logement</span><select name="r"><option value="studio">Studio meublé</option><option value="t2" selected>Appartement 1 chambre</option><option value="t3">Appartement 2 chambres</option></select></label>
<p style="margin-top:18px">Durée du séjour : <span class="val" data-ls-n></span></p><input type="range" name="n" min="1" max="90" value="30" aria-label="Nombre de nuits"><p class="note">Remises : −10 % dès 7 nuits, −30 % dès 30 nuits.</p></div>
<div class="res"><span>Total estimé</span><div data-ls-r></div><a class="btn p" data-ls-go href="reservation.html">Réserver ces dates</a></div></div></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Inclus</span><h2>Tout est prêt</h2><ul class="chk">${['Appartement meublé et équipé', 'Linge changé chaque semaine', 'Wi-Fi et climatisation', 'Parking et gardiennage', 'Facture mensuelle pour les entreprises'].map((t) => `<li>${ic('check', 18)}<span>${t}</span></li>`).join('')}</ul></div>
<form class="form" data-wa-form="je souhaite un devis pour une location au mois." novalidate><h3 class="h3">Devis location au mois</h3>
<div class="g2"><label class="fld"><span>Date d'arrivée</span><input type="date" name="date" required></label><label class="fld"><span>Durée</span><select name="duree"><option>1 mois</option><option>2 à 3 mois</option><option>6 mois</option><option>1 an</option></select></label></div>
<div class="g2"><label class="fld"><span>Logement</span><select name="log"><option>Studio</option><option selected>Appartement 1 chambre</option><option>Appartement 2 chambres</option></select></label><label class="fld"><span>Facturation</span><select name="fact"><option>Particulier</option><option>Entreprise / ONG</option></select></label></div>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<button class="btn p" type="submit">Envoyer sur WhatsApp</button></form></div></section>`,
  aboutDesc: 'SCI Gloria, société immobilière à Angondjé (les Parasoliers) : promotion immobilière, location gérance et appartements meublés.',
  aboutTitle: 'La SCI', aboutLead: 'Promotion immobilière et location gérance au nord de Libreville.',
  aboutH2: 'Des appartements bien tenus, des propriétaires tranquilles', aboutText: ['SCI Gloria développe et gère des appartements aux Parasoliers, à Angondjé, l\'un des quartiers résidentiels les plus recherchés du nord de Libreville.', 'Nos logements meublés accueillent voyageurs, missions et familles, à la nuit comme au mois.', 'Propriétaires, nous proposons aussi la location gérance : recherche de locataires, encaissement des loyers, entretien et comptes rendus réguliers.'],
  faq: [['Quelles sont les heures d\'arrivée et de départ ?', 'Arrivée à partir de 14 h, départ avant 11 h. Un horaire différent est possible sur demande.'], ['Comment fonctionne la remise ?', 'Elle s\'applique automatiquement : −10 % dès 7 nuits, −30 % dès 30 nuits.'], ['Faut-il verser une caution ?', 'Une caution est demandée à l\'arrivée et restituée au départ après l\'état des lieux.'], ['Facturez-vous les entreprises ?', 'Oui, avec facture mensuelle pour les séjours longs.'], ['Je suis propriétaire, pouvez-vous gérer mon appartement ?', 'Oui, c\'est notre métier de location gérance : écrivez-nous pour une proposition.']],
  gallery: [[P + 'x-residence-1.jpg', 'La résidence'], [P + 'x-suite-2.jpg', 'Appartement 1 chambre'], [P + 'x-cuisine-appart-1.jpg', 'Cuisine équipée'], [P + 'x-cuisine-appart-2.jpg', 'Studio'], [P + 'x-suite-1.jpg', 'Salon'], [P + 'x-chambre-twin-1.jpg', 'Chambre'], [P + 'x-sdb-2.jpg', 'Salle de douche'], [P + 'x-residence-3.jpg', 'Façade'], [P + 'immo-1616137422495-1e9e46e2aa77.jpg', 'Séjour lumineux']],
  access: [['plane', 'Aéroport Léon Mba', 'environ 15 min'], ['pin', 'Akanda', 'à quelques minutes'], ['car', 'Centre-ville', 'environ 25 min']],
  ph: { hero: P + 'x-suite-2.jpg', side1: P + 'x-residence-1.jpg', side2: P + 'x-cuisine-appart-1.jpg', rooms: P + 'x-suite-1.jpg', resto: P + 'x-cuisine-appart-2.jpg', food1: P + 'x-main-n-1.jpg', food2: P + 'x-sdb-1.jpg', extra: P + 'x-cuisine-appart-1.jpg', about: P + 'x-residence-3.jpg' },
};
