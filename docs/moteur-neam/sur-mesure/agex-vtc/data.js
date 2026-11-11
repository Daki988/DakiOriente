// Agex VTC (Assistance Gabon Express VTC), Akanda : données du site sur mesure.
// Tarifs : grille indicative à valider avec l'entreprise.
const P = '../../assets/photos/';

const AG = {
  slug: 'agex-vtc', name: 'Agex VTC', full: 'Assistance Gabon Express VTC', slogan: 'La qualité professionnelle garantie !',
  tel: '077 90 99 35', tel2: '065 90 99 35', wa: '24177909935', mail: 'agexvtc@gmail.com',
  addr: 'Akanda, entrée 4ème cité', bp: 'BP 2616 Libreville', city: 'Akanda', zone: 'Grand Libreville',
  insta: 'agex_vtc', rating: 4.2, soc: ['instagram', 'facebook', 'linkedin'],
};

const PH = {
  hero: P + 'x-conduite-n-1.jpg', chauffeur: P + 'x-conducteur-n-2.jpg', nuit1: P + 'x-vtc-nuit-1.jpg', nuit2: P + 'x-vtc-nuit-2.jpg',
  route: P + 'x-gabon-1.jpg', avion: P + 'voyage-1436491865332-7a61a109cc05.jpg', passeport: P + 'x-passeport-1.jpg',
  ecole: P + 'x-etudiants-1.jpg', bureau: P + 'x-bureau-n-1.jpg', mariage: P + 'x-deco-mariage-1.jpg', fete: P + 'x-deco-mariage-2.jpg',
  nature: P + 'x-gabon-2.jpg', dj: P + 'x-dj-1.jpg', plage: P + 'x-gabon-4.jpg',
};

// Zones du Grand Libreville : coordonnées approximatives en km (x vers l'est, y vers le nord, centre-ville = 0,0)
const ZONES = [
  ['akanda', 'Akanda (4ème cité)', 2, 8], ['angondje', 'Angondjé', 3, 11], ['cap', 'Cap Estérias', 2, 22], ['aeroport', 'Aéroport Léon Mba', 1, 5],
  ['louis', 'Quartier Louis / Batterie IV', 0, 2.5], ['centre', 'Centre-ville / Mont-Bouët', 0, 0], ['glass', 'Glass / Port-Môle', -0.5, -2],
  ['nzeng', 'Nzeng-Ayong', 5, 0.5], ['pk8', 'PK8 / Lalala', 6, -3], ['pk12', 'PK12', 10, -4], ['owendo', 'Owendo (port)', 2, -11], ['ntoum', 'Ntoum', 30, -5],
];

// Classes de véhicules : prise en charge, prix au km, prix à l'heure (mise à disposition)
const CLASSES = [
  { id: 'eco', n: 'Confort', d: 'Berline compacte climatisée, 3 passagers', base: 2000, km: 300, h: 10000, pax: 3, bag: 2 },
  { id: 'berline', n: 'Berline Business', d: 'Grande berline, chauffeur en costume, 3 passagers', base: 3000, km: 450, h: 15000, pax: 3, bag: 3 },
  { id: 'suv', n: 'SUV / 7 places', d: '4x4 ou monospace, 6 passagers, bagages volumineux', base: 4000, km: 600, h: 20000, pax: 6, bag: 5 },
];

const SERVICES = [
  ['simple', 'Course simple', 'D\'un point A à un point B, partout dans le Grand Libreville, de jour comme de nuit.', PH.route, 'Prix estimé avant de partir'],
  ['heure', 'Course à l\'heure', 'Un chauffeur à votre disposition pour vos rendez-vous, démarches ou courses.', PH.chauffeur, 'Dès 10 000 FCFA / h'],
  ['aeroport', 'Accueil aéroportuaire', 'Suivi de votre vol, accueil avec pancarte à Léon Mba, aide aux bagages.', PH.avion, 'Attente incluse'],
  ['scolaire', 'Abonnements scolaires', 'Vos enfants déposés et récupérés à l\'école chaque jour, par le même chauffeur.', PH.ecole, 'Forfait mensuel'],
  ['pro', 'Abonnements professionnels', 'Trajets domicile-travail des employés, rendez-vous clients, facture mensuelle.', PH.bureau, 'Compte entreprise'],
  ['affretement', 'Affrètements privés', 'Délégations, séminaires, invités : plusieurs véhicules coordonnés sur un même événement.', PH.nuit1, 'Sur devis'],
  ['mariage', 'Anniversaires et mariages', 'Véhicules décorés, chauffeurs en tenue, cortège organisé pour le grand jour.', PH.mariage, 'Sur devis'],
  ['famille', 'Sorties en famille', 'Plage, Cap Estérias, Pointe-Denis par l\'embarcadère, Kango : partez sans vous soucier du volant.', PH.nature, 'À la demi-journée'],
  ['nuit', 'Sorties nocturnes', 'Restaurant, concert, soirée : on vous dépose et on vous ramène, en toute sécurité.', PH.nuit2, 'Disponible 24 h/24'],
];

const AVIS = [
  ['Grâce', 'Abonnement scolaire, 2 enfants', 'Toujours à l\'heure, même sous la pluie. Mes enfants connaissent leur chauffeur et je suis prévenue à chaque dépôt.'],
  ['Hervé', 'Transfert aéroport de nuit', 'Vol arrivé à 2 h du matin : le chauffeur était là avec la pancarte. Voiture propre et prix annoncé respecté.'],
  ['Murielle', 'Mariage', 'Trois véhicules décorés pour le cortège, coordination parfaite. Merci à toute l\'équipe !'],
];

module.exports = { AG, PH, ZONES, CLASSES, SERVICES, AVIS };
