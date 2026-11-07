// Fishing Gabon Club : contenu du site.
// Infos réelles (Le Pratique du Gabon, ShareMySea, Facebook, Instagram) : guide de pêche Damien ZISSMAN ; pirogue de 9,50 m
// (2 × 115 cv) ; départ du club Barracuda (Terrasses de l'Estuaire), BP 1044 Libreville ; 062 44 04 10 ; damien.zissman@gmail.com ;
// réservation 48 h à l'avance ; matériel et boissons inclus ; balades baleines selon la saison ; trips sur mesure (Loango, Setté Cama,
// estuaire du Komo) ; case à la Pointe Denis ; espèces : tarpons, carpes rouges (cubéras), barracudas, capitaines.
// À confirmer : tarifs, capacité, horaires de départ, saisons.
const FG = {
  slug: 'fishing-gabon-club', name: 'Fishing Gabon Club', guide: 'Damien ZISSMAN',
  tel: '062 44 04 10', wa: '24162440410', mail: 'damien.zissman@gmail.com', bp: 'BP 1044 Libreville',
  addr: 'Club Barracuda, Terrasses de l\'Estuaire', city: 'Libreville', geo: [0.320102, 9.483669],
  ig: 'fishing_gabon_club', fb: 'fishinggabonclub',
};
const PH = {
  large: 'x-peche-large-1.jpg', bord: 'x-peche-bord-1.jpg', bord2: 'x-peche-bord-2.jpg', bord3: 'x-peche-bord-3.jpg',
  pecheur: 'x-pecheur-n-1.jpg', port: 'x-pecheur-n-2.jpg', baleine: 'x-baleine-1.jpg', baleine2: 'x-baleine-2.jpg',
  pirogue: 'x-pirogue-1.jpg', lagune: 'x-lagune-1.jpg',
};
// Formules : [id, nom, durée, lieu, prix indicatif par pirogue (0 = sur devis), places max, photo, espèces visées, description]
const FORMULES = [
  ['estuaire', 'Demi-journée estuaire', '4 h', 'Estuaire du Komo et mangrove', 180000, 4, PH.pirogue, ['tarpon', 'carangue', 'barracuda'], 'Pêche aux leurres le long des mangroves, à la recherche des tarpons et des carangues.'],
  ['large', 'Journée au large', '8 h', 'Cap Estérias, Pointe Denis', 350000, 4, PH.large, ['carpe', 'barracuda', 'capitaine', 'thonine'], 'Jig, popper et traîne sur les roches et les épaves : carpes rouges, barracudas, capitaines.'],
  ['bord', 'Surfcasting et pêche du bord', '5 h', 'Plages sauvages du littoral', 120000, 4, PH.bord, ['capitaine', 'carangue'], 'Lancers depuis les plages, à la marée montante : capitaines et carangues.'],
  ['baleines', 'Balade baleines', '3 h', 'Au large de Libreville', 150000, 6, PH.baleine, ['baleine'], 'Observation des baleines à bosse en saison, et des espèces qui bordent les rivières de l\'Estuaire.'],
  ['sejour', 'Trip sur mesure', '2 à 5 jours', 'Loango, Setté Cama, Mayumba', 0, 4, PH.lagune, ['tarpon', 'carpe', 'capitaine', 'barracuda'], 'Expédition vers les plus beaux spots du littoral, organisée avec vous de A à Z.'],
];
// Espèces : [id, nom, poids, technique, saison mois par mois (0 rare, 1 possible, 2 meilleure période), photo]
const ESPECES = [
  ['tarpon', 'Tarpon', 'plus de 100 kg', 'Leurres souples, poissons nageurs, vif', [2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2], PH.pirogue],
  ['carpe', 'Carpe rouge (cubéra)', 'jusqu\'à 40 kg', 'Jig, vif sur les roches', [2, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2], PH.large],
  ['capitaine', 'Capitaine', 'jusqu\'à 40 kg', 'Surfcasting, leurres, vif', [1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1], PH.bord],
  ['barracuda', 'Barracuda', 'jusqu\'à 20 kg', 'Traîne, poissons nageurs', [2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2], PH.pecheur],
  ['carangue', 'Carangue', 'jusqu\'à 25 kg', 'Popper, stickbait', [2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2], PH.bord3],
  ['thonine', 'Thonine', '5 à 15 kg', 'Jig rapide, traîne', [1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1], PH.large],
  ['baleine', 'Baleine à bosse (observation)', '30 à 40 tonnes', 'Observation à distance, moteur coupé', [0, 0, 0, 0, 0, 0, 2, 2, 2, 1, 0, 0], PH.baleine2],
];
const AVIS = [
  ['Thierry', 'Journée au large', 'Ma première carpe rouge, et des conseils précieux du début à la fin. Le matériel est au top, les boissons fraîches aussi.'],
  ['Mireille', 'Balade baleines', 'Nous avons vu un groupe de baleines à bosse avec leur petit. Sortie calme et respectueuse, les enfants ont adoré.'],
  ['Gaëlle', 'Demi-journée estuaire', 'Débutante, j\'ai été guidée pas à pas dans la mangrove. Un tarpon au bout de la ligne : souvenir inoubliable !'],
];
module.exports = { FG, PH, FORMULES, ESPECES, AVIS };
