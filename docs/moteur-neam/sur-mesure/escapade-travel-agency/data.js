// Escapade Travel Agency : contenu du site (validé sur la maquette Figma).
// Infos réelles : adresse, téléphones, e-mail, activité. Destinations, prix et équipe : proposés, à confirmer.
const PISC = ['hotel-1520250497591-112f2f40a3f4.jpg', 'hotel-1542314831-068cd1dbfeeb.jpg', 'hotel-1551882547-ff40c63fe5fa.jpg', 'hotel-1566073771259-6a8506099945.jpg', 'hotel-1571896349842-33c89424de2d.jpg'];
const CHAMB = ['hotel-1578683010236-d716f9a3f461.jpg', 'hotel-1582719478250-c89cae4dc85b.jpg', 'hotel-1590490360182-c33d57733427.jpg', 'hotel-1611892440504-42a792e24d32.jpg', 'hotel-1613553474179-e1eda3ea5734.jpg'];
const PLAGE = ['resto-1507525428034-b723cf961d3e.jpg', 'resto-1519046904884-53103b34b206.jpg'];
const PH = {
  plongee: 'voyage-1544551763-46a013bb70d5.jpg', avion: 'voyage-1436491865332-7a61a109cc05.jpg',
  passeport: 'x-passeport-1.jpg', team: 'services-1655720357872-ce227e4164ba.jpg', PISC, CHAMB, PLAGE,
};

const AG = {
  slug: 'escapade-travel-agency', name: 'Escapade Travel Agency',
  tel: '074 00 30 78', tel2: '062 87 49 03', wa: '24162874903', mail: 'escapadetravelagency@gmail.com',
  addr: 'Anciens feux Lalala, face Gaboprix', city: 'Libreville',
  hours: ['Lun – Ven · 8 h – 18 h', 'Samedi · 9 h – 13 h'],
  map: 'https://www.google.com/maps?q=Lalala,+Libreville,+Gabon&z=15&output=embed',
};

// Destinations : prix par personne, base chambre double
const D = (o) => o;
const DEST = [
  D({ id: 'zanzibar', n: 'Zanzibar', t: 'Zanzibar, plages et Stone Town', zone: 'Afrique', tags: ['plage', 'lune'], j: 7, nu: 6, pr: 1250000, short: '7 jours · plages de Nungwi et Stone Town', hot: 'Hôtel 4★ en bord de mer', pens: 'Demi-pension', note: '4,9', nb: 23,
    ph: ['x-zanzibar-2.jpg', PLAGE[0], PISC[0], PH.plongee, CHAMB[0], 'x-zanzibar-1.jpg'],
    prog: [['1', 'Libreville → Zanzibar', 'Vol avec une escale. Accueil à l\'aéroport et transfert privé jusqu\'à votre hôtel de Nungwi.'], ['2', 'Plage de Nungwi', 'Journée libre sur l\'une des plus belles plages de l\'océan Indien. Coucher de soleil en boutre.'], ['3', 'Stone Town', 'Visite guidée de la vieille ville classée à l\'Unesco : marchés, portes sculptées, maison des Merveilles.'], ['4', 'Safari Blue', 'Journée en mer : snorkeling, banc de sable, déjeuner de fruits de mer sur l\'île.'], ['5–6', 'Forêt de Jozani et temps libre', 'Rencontre avec les singes colobes rouges, puis spa ou plongée en option.'], ['7', 'Retour à Libreville', 'Transfert à l\'aéroport et vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '6 nuits en hôtel 4★, demi-pension', 'Transferts aéroport privés', 'Visite de Stone Town et Safari Blue', 'Assistance WhatsApp 7j/7'],
    exc: ['Visa électronique (nous le faisons pour vous)', 'Assurance voyage (en option)', 'Déjeuners et boissons', 'Plongée et spa'] }),
  D({ id: 'ile-maurice', n: 'Île Maurice', t: 'Île Maurice, lagons turquoise', zone: 'Afrique', tags: ['plage', 'lune'], j: 8, nu: 7, pr: 1450000, short: '8 jours · lagons turquoise, demi-pension', hot: 'Hôtel 4★ sur la plage de Belle Mare', pens: 'Demi-pension', note: '4,9', nb: 17,
    ph: ['x-maurice-1.jpg', 'x-maurice-2.jpg', PLAGE[1], PISC[1], CHAMB[1], PH.plongee],
    prog: [['1', 'Libreville → Maurice', 'Vol avec une escale, accueil et transfert jusqu\'à votre hôtel de Belle Mare.'], ['2', 'Plage et lagon', 'Journée détente, kayak et paddle compris à l\'hôtel.'], ['3', 'Île aux Cerfs en catamaran', 'Croisière à la journée, baignade dans le lagon et déjeuner barbecue à bord.'], ['4', 'Le Sud sauvage', 'Terre des Sept Couleurs de Chamarel, cascade et point de vue du Morne.'], ['5', 'Port-Louis', 'Marché central, front de mer du Caudan et jardin de Pamplemousses.'], ['6–7', 'Temps libre', 'Plage, spa, plongée ou nage avec les dauphins (en option).'], ['8', 'Retour à Libreville', 'Transfert à l\'aéroport et vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '7 nuits en hôtel 4★, demi-pension', 'Transferts aéroport', 'Croisière à l\'île aux Cerfs et excursion dans le Sud', 'Assistance WhatsApp 7j/7'],
    exc: ['Formalités d\'entrée (vérifiées par l\'agence)', 'Assurance voyage (en option)', 'Déjeuners et boissons', 'Plongée, dauphins et spa'] }),
  D({ id: 'dubai', n: 'Dubaï', t: 'Dubaï, désert et gratte-ciel', zone: 'Monde', tags: ['ville'], j: 5, nu: 4, pr: 890000, short: '5 jours · vol + hôtel 4★ + safari désert', hot: 'Hôtel 4★ à Dubai Marina', pens: 'Petit-déjeuner', note: '4,8', nb: 31,
    ph: ['x-dubai-1.jpg', 'x-dubai-2.jpg', PISC[2], CHAMB[2], PH.avion],
    prog: [['1', 'Libreville → Dubaï', 'Vol avec une escale, transfert à l\'hôtel et dîner-croisière en boutre sur la Marina.'], ['2', 'Burj Khalifa et Dubai Mall', 'Montée au 124e étage, fontaines de Dubaï et shopping.'], ['3', 'Safari dans le désert', 'Dunes en 4x4, balade à dos de chameau et dîner barbecue sous les étoiles.'], ['4', 'Vieux Dubaï ou Abu Dhabi', 'Souks de l\'or et des épices en abra, ou grande mosquée d\'Abu Dhabi (en option).'], ['5', 'Retour à Libreville', 'Transfert à l\'aéroport et vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '4 nuits en hôtel 4★, petit-déjeuner', 'Transferts aéroport', 'Safari désert et dîner-croisière', 'Visa touristique préparé par l\'agence'],
    exc: ['Frais de visa', 'Assurance voyage (en option)', 'Déjeuners et dîners libres', 'Entrée Burj Khalifa'] }),
  D({ id: 'le-cap', n: 'Le Cap', t: 'Le Cap, entre montagne et océan', zone: 'Afrique', tags: ['ville', 'nature'], j: 6, nu: 5, pr: 1150000, short: '6 jours · Table Mountain et route des vins', hot: 'Hôtel 4★ au Waterfront', pens: 'Petit-déjeuner', note: '4,9', nb: 12,
    ph: ['x-cape-town-1.jpg', 'x-cape-town-2.jpg', PISC[3], CHAMB[3], PH.avion],
    prog: [['1', 'Libreville → Le Cap', 'Vol avec une escale, transfert à l\'hôtel et soirée au Waterfront.'], ['2', 'Table Mountain et Bo-Kaap', 'Téléphérique jusqu\'au sommet, puis le quartier aux maisons colorées.'], ['3', 'La péninsule du Cap', 'Manchots de Boulders Beach et cap de Bonne-Espérance.'], ['4', 'La route des vins', 'Stellenbosch et Franschhoek, déjeuner dans un domaine.'], ['5', 'Temps libre', 'Robben Island, shopping ou plage de Camps Bay.'], ['6', 'Retour à Libreville', 'Transfert à l\'aéroport et vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '5 nuits en hôtel 4★, petit-déjeuner', 'Transferts aéroport', 'Excursions péninsule et route des vins', 'Assistance WhatsApp 7j/7'],
    exc: ['Frais de visa éventuels (dossier préparé par l\'agence)', 'Assurance voyage (en option)', 'Repas non mentionnés', 'Téléphérique et Robben Island'] }),
  D({ id: 'marrakech', n: 'Marrakech', t: 'Marrakech, riads et désert', zone: 'Afrique', tags: ['ville'], j: 6, nu: 5, pr: 980000, short: '6 jours · riad, souks et désert d\'Agafay', hot: 'Riad de charme dans la médina', pens: 'Petit-déjeuner', note: '4,8', nb: 19,
    ph: ['x-marrakech-2.jpg', 'x-marrakech-1.jpg', PISC[4], CHAMB[4], PH.avion],
    prog: [['1', 'Libreville → Marrakech', 'Vol, accueil et installation dans votre riad au cœur de la médina.'], ['2', 'Jemaa el-Fna et les souks', 'Visite guidée de la médina, des souks et de la place mythique à la tombée du jour.'], ['3', 'Majorelle et palais Bahia', 'Jardins, palais et quartier de la Kasbah.'], ['4', 'Désert d\'Agafay', 'Balade à dos de chameau et dîner sous tente berbère.'], ['5', 'Hammam et temps libre', 'Hammam traditionnel, shopping ou piscine.'], ['6', 'Retour à Libreville', 'Transfert à l\'aéroport et vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '5 nuits en riad, petit-déjeuner', 'Transferts aéroport', 'Visite guidée et soirée dans le désert', 'Assistance WhatsApp 7j/7'],
    exc: ['Formalités d\'entrée (vérifiées par l\'agence)', 'Assurance voyage (en option)', 'Déjeuners et dîners libres', 'Hammam'] }),
  D({ id: 'paris', n: 'Paris', t: 'Paris, la ville lumière', zone: 'Monde', tags: ['ville'], j: 5, nu: 4, pr: 1050000, short: 'Billet aller-retour + 4 nuits d\'hôtel', hot: 'Hôtel 3★ en centre-ville', pens: 'Petit-déjeuner', note: '4,7', nb: 28,
    ph: ['x-paris-1.jpg', 'x-paris-2.jpg', CHAMB[0], PH.avion],
    prog: [['1', 'Libreville → Paris', 'Vol de nuit, arrivée le matin et transfert à l\'hôtel.'], ['2', 'Tour Eiffel et croisière', 'Champ-de-Mars, Trocadéro et croisière sur la Seine.'], ['3', 'Louvre et Montmartre', 'Musée du Louvre, puis Sacré-Cœur et place du Tertre.'], ['4', 'Shopping ou Versailles', 'Grands magasins, ou château de Versailles (en option).'], ['5', 'Retour à Libreville', 'Transfert à l\'aéroport et vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '4 nuits en hôtel 3★, petit-déjeuner', 'Transferts aéroport', 'Croisière sur la Seine', 'Aide au dossier de visa Schengen'],
    exc: ['Frais de visa Schengen', 'Assurance voyage (obligatoire pour le visa)', 'Repas', 'Entrées des musées'] }),
  D({ id: 'istanbul', n: 'Istanbul', t: 'Istanbul, entre deux continents', zone: 'Monde', tags: ['ville'], j: 5, nu: 4, pr: 990000, short: '5 jours · Bosphore et bazars', hot: 'Hôtel 4★ à Sultanahmet', pens: 'Petit-déjeuner', note: '4,8', nb: 14,
    ph: ['x-istanbul-1.jpg', 'x-istanbul-2.jpg', PISC[1], CHAMB[1], PH.avion],
    prog: [['1', 'Libreville → Istanbul', 'Vol avec une escale, transfert à l\'hôtel dans la vieille ville.'], ['2', 'Sultanahmet', 'Sainte-Sophie, mosquée Bleue, citerne Basilique et Grand Bazar.'], ['3', 'Le Bosphore', 'Croisière entre Europe et Asie, puis marché aux épices.'], ['4', 'Shopping et temps libre', 'Quartiers de Nişantaşı et Galata, ou hammam.'], ['5', 'Retour à Libreville', 'Transfert à l\'aéroport et vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '4 nuits en hôtel 4★, petit-déjeuner', 'Transferts aéroport', 'Visite guidée et croisière sur le Bosphore', 'Visa électronique préparé par l\'agence'],
    exc: ['Frais de visa', 'Assurance voyage (en option)', 'Repas', 'Entrées des monuments'] }),
  D({ id: 'dakar', n: 'Dakar', t: 'Dakar, Gorée et lac Rose', zone: 'Afrique', tags: ['ville', 'plage'], j: 4, nu: 3, pr: 620000, short: '4 jours · île de Gorée et lac Rose', hot: 'Hôtel 4★ sur la corniche', pens: 'Petit-déjeuner', note: '4,7', nb: 9,
    ph: ['x-dakar-2.jpg', 'x-dakar-1.jpg', 'x-dakar-3.jpg', PISC[2], CHAMB[2]],
    prog: [['1', 'Libreville → Dakar', 'Vol avec une escale, transfert à l\'hôtel et dîner sur la corniche.'], ['2', 'Île de Gorée', 'Traversée en chaloupe, maison des Esclaves et ruelles colorées.'], ['3', 'Lac Rose et Monument', 'Lac Retba, village artisanal et monument de la Renaissance africaine.'], ['4', 'Retour à Libreville', 'Marché Sandaga puis vol retour.']],
    inc: ['Vol aller-retour depuis Libreville', '3 nuits en hôtel 4★, petit-déjeuner', 'Transferts aéroport', 'Excursions Gorée et lac Rose', 'Assistance WhatsApp 7j/7'],
    exc: ['Assurance voyage (en option)', 'Déjeuners et dîners', 'Dépenses personnelles'] }),
];

const ROUTES = [
  ['International', 'Paris', 'Direct ou 1 escale · ~7 h', 520000], ['International', 'Dubaï', '1 escale · ~11 h', 610000],
  ['Afrique', 'Casablanca', 'Direct · ~5 h 30', 450000], ['Afrique', 'Johannesburg', '1 escale · ~8 h', 560000],
  ['Afrique', 'Dakar', '1 escale · ~7 h', 410000], ['Afrique', 'Douala', 'Direct · ~1 h 15', 180000],
  ['National', 'Port-Gentil', 'Direct · ~45 min', 65000], ['National', 'Franceville', 'Direct · ~1 h', 85000],
];

const AVIS = [
  ['Prisca', 'Zanzibar · décembre', 'Notre lune de miel à Zanzibar était parfaite. Transferts, hôtel, excursions : tout était prêt à notre arrivée.'],
  ['Junior', 'Dubaï · voyage d\'affaires', 'Visa pour Dubaï obtenu en une semaine, sans me déplacer. Le suivi sur WhatsApp est très rassurant.'],
  ['Nadège', 'Paris · vacances en famille', 'Des billets Paris moins chers que ce que je trouvais seule, et une équipe disponible même le samedi.'],
];

const TEAM = [['Marlène', 'Conseillère séjours & lunes de miel', '#14A3A0'], ['Steeve', 'Billetterie et voyages d\'affaires', '#F28C28'], ['Aïcha', 'Visas et formalités', '#0E2A47']];

module.exports = { AG, DEST, ROUTES, AVIS, TEAM, PH };
