// Dalhias Institut (Montée de Louis, Libreville) : contenu du site.
// Infos réelles (Facebook DalhiasInstitut, Instagram @dalhiasinstit, Le Pratique du Gabon, miboue) : institut de beauté, esthétique, coiffure et onglerie ;
// Montée de Louis, Libreville ; 077 28 28 73 et 066 24 55 56 ; ouvert du mardi au samedi de 8 h à 19 h.
// À confirmer : liste des soins, prix, e-mail. Équipe et avis : prénoms fictifs.
const AG = {
  slug: 'dalhias-institut', name: 'Dalhias Institut', ig: 'dalhiasinstit',
  tel: '077 28 28 73', tel2: '066 24 55 56', wa: '24177282873', mail: 'contact@dalhiasinstitut.ga', bp: 'Libreville',
  addr: 'Montée de Louis', city: 'Libreville',
  map: 'https://www.google.com/maps?q=Mont%C3%A9e+de+Louis,+Libreville,+Gabon&z=16&output=embed',
  hours: [['Mardi – samedi', '8 h – 19 h'], ['Dimanche – lundi', 'Fermé']],
};
const PH = {
  pierres: 'x-ongles-n-3.jpg', dos: 'x-ongles-n-1.jpg', serviette: 'x-maquillage-n-2.jpg', masque: 'x-masque-n-1.jpg', creme: 'beaute-1693004923522.jpg',
  portrait: 'x-maquillage-n-3.jpg', glow: 'beaute-1765607476292.jpg', boucles: 'beaute-1585890483046.jpg', salon: 'beaute-1633681926035-ec1ac984418a.jpg',
  coiffure: 'beaute-1560066984-138dadb4c035.jpg', tresses: 'x-tresses-n-2.jpg', tressesDos: 'x-tresses-2.jpg', tressage: 'x-tresses-n-1.jpg', mainsTresse: 'x-tresses-n-3.jpg',
  ongles: 'x-ongles-n-3.jpg', onglesNoirs: 'x-ongles-n-1.jpg', pieds: 'x-ongles-n-2.jpg', cils: 'x-maquillage-n-1.jpg', maquillage: 'x-maquillage-n-3.jpg', sourcils: 'x-maquillage-1.jpg',
};
const CATS = [
  { id: 'ongles', t: 'Onglerie', ph: PH.ongles, d: 'Gel, capsules, semi-permanent et nail art.', items: [
    ['Pose gel sur ongles naturels', 'Couleur au choix', 75, 15000], ['Pose capsules + gel', 'Longueur au choix', 120, 20000],
    ['Remplissage', 'Sous 3 semaines', 60, 12000], ['Semi-permanent mains', 'Tenue 3 semaines', 45, 10000],
    ['Nail art', 'Par ongle, motif au choix', 10, 1000], ['Dépose complète', 'Soin des ongles inclus', 30, 5000]] },
  { id: 'pieds', t: 'Beauté des pieds', ph: PH.pieds, d: 'Pédicure, soins et couleur.', items: [
    ['Pédicure complète', 'Bain, gommage, callosités', 60, 12000], ['Semi-permanent pieds', 'Tenue 4 semaines', 45, 10000],
    ['Pédicure spa', 'Avec masque et massage', 75, 18000], ['Pose gel pieds', 'Couleur au choix', 60, 12000]] },
  { id: 'esthetique', t: 'Esthétique', ph: PH.cils, d: 'Visage, cils, sourcils et épilation.', items: [
    ['Soin du visage', 'Nettoyage, gommage, masque', 60, 20000], ['Extension de cils', 'Pose cil à cil', 120, 25000],
    ['Rehaussement de cils', 'Tenue 6 semaines', 45, 15000], ['Restructuration sourcils', 'Cire ou fil + teinture', 30, 6000],
    ['Épilation jambes complètes', 'Cire tiède', 45, 12000], ['Maquillage', 'Soirée ou cérémonie', 60, 25000]] },
  { id: 'coiffure', t: 'Coiffure', ph: PH.tresses, d: 'Tresses, nattes, tissages et soins.', items: [
    ['Tresses sans nœuds', 'Mèches comprises, à partir de', 240, 25000], ['Nattes collées', 'Motif au choix', 90, 8000],
    ['Pose de tissage', 'Avec closure', 120, 15000], ['Shampoing et soin', 'Cheveux naturels', 45, 6000]] },
];
const FORFAITS = [
  ['Mains & pieds Dalhias', 'Pose gel mains + semi-permanent pieds', 120, 23000, PH.ongles],
  ['Regard de star', 'Extension de cils + restructuration sourcils', 150, 29000, PH.cils],
  ['Prête pour la fête', 'Maquillage + pose gel + nattes collées', 210, 45000, PH.portrait],
];
const AVIS = [
  ['Mireille', 'Pose capsules + gel', 'Des ongles parfaits qui tiennent trois semaines. Le nail art est très fin, je recommande.'],
  ['Ornella', 'Extension de cils', 'Résultat naturel et léger, et l\'équipe est d\'une grande douceur. Je reviens pour le remplissage.'],
  ['Danielle', 'Prête pour la fête', 'Maquillage, ongles et coiffure le même après-midi : j\'étais prête à temps pour le mariage !'],
];
const TEAM = [['Kelly', 'Prothésiste ongulaire'], ['Raïssa', 'Esthéticienne, cils et sourcils'], ['Joëlle', 'Coiffeuse, tresses'], ['Esther', 'Maquilleuse']];

module.exports = { AG, PH, CATS, FORFAITS, AVIS, TEAM };
