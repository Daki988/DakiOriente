// Eva Spa chez Clarisse : contenu du site.
// Infos réelles (annuaires, Instagram @evaspa241) : adresse (montée de Louis, face pharmacie l'Orchidée), BP 6666,
// téléphones, e-mail, activités (soins du corps, coiffure africaine et européenne, onglerie).
// À confirmer : liste exacte des soins, prix, horaires, logo (proposé), avis, prénoms de l'équipe (fictifs).
const AG = {
  slug: 'eva-spa-chez-clarisse', name: 'Eva Spa chez Clarisse', ig: 'evaspa241',
  tel: '066 24 75 39', tel2: '077 21 65 05', wa: '24166247539', mail: 'elisememnyemb@gmail.com', bp: 'BP 6666 Libreville',
  addr: 'Montée de Louis, face à la pharmacie l\'Orchidée', city: 'Libreville',
  map: 'https://www.google.com/maps?q=Mont%C3%A9e+de+Louis,+Libreville,+Gabon&z=16&output=embed',
  hours: [['Lundi – samedi', '9 h – 19 h'], ['Dimanche', 'Sur rendez-vous']],
};
const PH = {
  pierres: 'x-massage-n-1.jpg', dos: 'x-massage-n-2.jpg', serviette: 'x-soin-n-1.jpg', masque: 'beaute-1646457417455.jpg', creme: 'beaute-1693004923522.jpg',
  portrait: 'beaute-1765607476292.jpg', glow: 'beaute-1637851362556.jpg', boucles: 'beaute-1585890483046.jpg', salon: 'beaute-1633681926035-ec1ac984418a.jpg',
  coiffure: 'beaute-1560066984-138dadb4c035.jpg', tresses: 'x-tresses-2.jpg', tressesDos: 'x-tresses-1.jpg', tressage: 'x-tresses-n-1.jpg', mainsTresse: 'x-tresses-n-3.jpg',
  ongles: 'x-ongles-n-3.jpg', onglesNoirs: 'x-ongles-n-1.jpg', pieds: 'x-ongles-n-2.jpg', cils: 'x-maquillage-n-1.jpg', maquillage: 'x-maquillage-n-3.jpg', sourcils: 'x-maquillage-1.jpg',
};

// Carte des soins : [nom, détail, durée (min), prix FCFA]
const CATS = [
  { id: 'spa', t: 'Spa & massages', ph: PH.pierres, d: 'Massages, hammam et rituels pour le corps.', items: [
    ['Massage relaxant', 'Huiles chaudes, tout le corps', 60, 25000], ['Massage aux pierres chaudes', 'Basalte chaud, détente profonde', 75, 32000],
    ['Massage tonique', 'Jambes lourdes, dos, nuque', 60, 28000], ['Rituel duo', 'Deux massages côte à côte', 90, 50000],
    ['Hammam et gommage', 'Gommage au savon noir', 45, 20000], ['Enveloppement au karité', 'Nutrition intense de la peau', 45, 22000]] },
  { id: 'visage', t: 'Visage & regard', ph: PH.masque, d: 'Soins adaptés aux peaux noires et métissées.', items: [
    ['Soin éclat', 'Nettoyage, gommage, masque', 60, 22000], ['Soin anti-taches', 'Spécial peaux noires', 60, 25000],
    ['Nettoyage profond', 'Points noirs, pores', 45, 18000], ['Rehaussement de cils', 'Tenue 6 semaines', 45, 15000],
    ['Maquillage soirée', 'Teint, yeux, lèvres', 45, 20000], ['Épilation des sourcils', 'À la cire ou au fil', 15, 3000]] },
  { id: 'coiffure', t: 'Coiffure', ph: PH.tresses, d: 'Coiffure africaine et européenne.', items: [
    ['Tresses sans nœuds', 'Mèches comprises, à partir de', 240, 25000], ['Nattes collées', 'Motif au choix', 90, 8000],
    ['Pose de tissage', 'Fermeture ou closure', 120, 15000], ['Défrisage et soin', 'Avec soin protecteur', 90, 12000],
    ['Shampoing et brushing', 'Cheveux naturels ou défrisés', 60, 7000], ['Coupe et coiffage', 'Femme, homme, enfant', 45, 6000]] },
  { id: 'ongles', t: 'Onglerie', ph: PH.ongles, d: 'Mains et pieds soignés, couleurs qui tiennent.', items: [
    ['Pose gel', 'Couleur au choix', 75, 15000], ['Semi-permanent mains', 'Tenue 3 semaines', 45, 10000],
    ['Remplissage gel', 'Sous 3 semaines', 60, 12000], ['Beauté des pieds', 'Soin complet et vernis', 60, 12000],
    ['Manucure classique', 'Limage, cuticules, vernis', 30, 6000], ['Nail art', 'Par ongle', 10, 1000]] },
];
const FORFAITS = [
  ['Pause détente', 'Massage relaxant + soin éclat', 120, 42000, PH.serviette],
  ['Journée Eva', 'Hammam, massage aux pierres, soin visage, beauté des pieds', 240, 75000, PH.pierres],
  ['Duo complice', 'Rituel duo + thé et douceurs', 120, 55000, PH.dos],
];

// Personnages fictifs : prénom uniquement
const AVIS = [
  ['Laetitia', 'Massage aux pierres chaudes', 'Une vraie bulle de calme en plein Libreville. Je suis ressortie légère, je reviens le mois prochain.'],
  ['Michelle', 'Tresses sans nœuds', 'Tresses impeccables et légères, et l\'équipe est adorable. Le résultat a tenu plus de cinq semaines.'],
  ['Prisca', 'Journée Eva', 'Offerte par mon mari pour mon anniversaire : le plus beau cadeau. Merci Clarisse !'],
];
const TEAM = [['Clarisse', 'Fondatrice, soins du corps et du visage'], ['Grâce', 'Coiffeuse, tresses et tissages'], ['Ruth', 'Prothésiste ongulaire'], ['Divine', 'Esthéticienne, massages']];

module.exports = { AG, PH, CATS, FORFAITS, AVIS, TEAM };
