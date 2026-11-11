// AB Location (Port-Gentil) : contenu du site sur mesure.
// Infos réelles (Facebook AB Location, goafricaonline, annuaires) : location de voitures à Port-Gentil, « Louez en toute confiance »,
// véhicule VIP, Toyota RAV4 en location longue durée ; 062 66 28 28, 077 34 05 00, 077 78 70 00 ; BP 1325 Port-Gentil ;
// ablocationgabon@hotmail.com ; note Google 5/5 ; logo réel (pick-up dans un anneau argent, lettrage rouge).
// Flotte, tarifs, cautions et conditions : exemples à confirmer avec l'agence.
const P = '../../assets/photos/';

const AB = {
  slug: 'ab-location', name: 'AB Location', tel: '062 66 28 28', tel2: '077 34 05 00', tel3: '077 78 70 00', wa: '24162662828', mail: 'ablocationgabon@hotmail.com',
  bp: 'BP 1325 Port-Gentil', city: 'Port-Gentil', hours: [['Lundi – samedi', '8 h – 18 h'], ['Dimanche', 'Sur rendez-vous · WhatsApp']], soc: ['facebook', 'tiktok'], rating: 5,
};

const PH = {
  conduite: P + 'x-conduite-n-1.jpg', chauffeur: P + 'x-conducteur-n-2.jpg', route: P + 'x-gabon-1.jpg', nuit1: P + 'x-vtc-nuit-1.jpg', nuit2: P + 'x-vtc-nuit-2.jpg',
  accueil: P + 'x-bureau-n-1.jpg', cles: P + 'x-main-n-1.jpg', bureaux: P + 'x-bureaux-2.jpg',
};

// Flotte : id, catégorie (forme de la silhouette), nom, modèle indicatif, places, boîte, bagages, prix / jour, caution, atouts
const FLOTTE = [
  { id: 'citadine', cat: 'citadine', n: 'Citadine', mod: 'Hyundai Grand i10 ou similaire', pl: 5, bv: 'Automatique', bag: 2, prix: 25000, caution: 150000, at: ['Climatisation', 'Idéale en ville', 'Économique'] },
  { id: 'berline', cat: 'berline', n: 'Berline', mod: 'Toyota Corolla ou similaire', pl: 5, bv: 'Automatique', bag: 3, prix: 35000, caution: 200000, at: ['Climatisation', 'Confort', 'Coffre spacieux'] },
  { id: 'suv', cat: 'suv', n: 'SUV', mod: 'Toyota RAV4', pl: 5, bv: 'Automatique', bag: 4, prix: 50000, caution: 300000, at: ['Garde au sol', 'Location longue durée', 'Polyvalent'] },
  { id: '4x4', cat: '4x4', n: '4x4', mod: 'Land Cruiser Prado ou similaire', pl: 7, bv: 'Automatique', bag: 5, prix: 80000, caution: 500000, at: ['Pistes et sable', 'Cap Lopez', '7 places'] },
  { id: 'pickup', cat: 'pickup', n: 'Pick-up double cabine', mod: 'Toyota Hilux ou similaire', pl: 5, bv: 'Manuelle', bag: 6, prix: 70000, caution: 500000, at: ['Chantiers', 'Benne', '4 roues motrices'] },
  { id: 'minibus', cat: 'minibus', n: 'Minibus 15 places', mod: 'Toyota Hiace ou similaire', pl: 15, bv: 'Manuelle', bag: 10, prix: 90000, caution: 400000, at: ['Groupes', 'Navettes', 'Mariages'] },
  { id: 'vip', cat: 'berline', n: 'VIP avec chauffeur', mod: 'Berline ou SUV haut de gamme', pl: 4, bv: 'Automatique', bag: 3, prix: 120000, caution: 0, at: ['Chauffeur inclus', 'Délégations', 'Événements'], vip: true },
];
const CATS = [['tout', 'Tous'], ['ville', 'Ville'], ['piste', 'Pistes & chantiers'], ['groupe', 'Groupes'], ['vip', 'Avec chauffeur']];
const CAT_OF = { citadine: ['ville'], berline: ['ville'], suv: ['ville', 'piste'], '4x4': ['piste'], pickup: ['piste'], minibus: ['groupe'], vip: ['vip', 'groupe'] };

const AVIS = [
  ['Steeve', 'SUV, 2 semaines de mission', 'Véhicule propre, livré à l\'aéroport à mon arrivée. Démarches rapides et équipe très réactive sur WhatsApp.'],
  ['Murielle', 'Minibus pour un mariage', 'Minibus et chauffeur pour nos invités tout le week-end : ponctualité parfaite. Je recommande.'],
  ['Hugues', 'Location longue durée', 'Notre société loue deux pick-up au mois. Entretien suivi, véhicule de remplacement en 24 h quand il le faut.'],
];

module.exports = { AB, PH, FLOTTE, CATS, CAT_OF, AVIS };
