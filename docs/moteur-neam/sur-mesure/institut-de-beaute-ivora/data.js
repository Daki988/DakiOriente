// Institut de beauté Ivora (Cité Cosyga, Libreville) : contenu du site.
// Infos réelles (Le Pratique du Gabon, annuaires) : Cité Cosyga, Libreville ; 077 19 13 49 et 062 96 69 38 ; institutdebeauteivora@gmail.com.
// À confirmer : liste des soins, prix, horaires, réseaux sociaux. Équipe et avis : prénoms fictifs.
const AG = {
  slug: 'institut-de-beaute-ivora', name: 'Institut Ivora', ig: 'institutivora241',
  tel: '077 19 13 49', tel2: '062 96 69 38', wa: '24177191349', mail: 'institutdebeauteivora@gmail.com', bp: 'Libreville',
  addr: 'Cité Cosyga', city: 'Libreville',
  map: 'https://www.google.com/maps?q=Cosyga,+Libreville,+Gabon&z=15&output=embed',
  hours: [['Lundi – samedi', '9 h – 19 h'], ['Dimanche', 'Fermé']],
};
const PH = {
  pierres: 'beaute-1765607476292.jpg', dos: 'x-massage-n-2.jpg', serviette: 'x-masque-n-1.jpg', masque: 'beaute-1646457417455.jpg', creme: 'beaute-1693004923522.jpg',
  portrait: 'beaute-1765607476292.jpg', glow: 'beaute-1637851362556.jpg', boucles: 'beaute-1585890483046.jpg', salon: 'beaute-1633681926035-ec1ac984418a.jpg',
  coiffure: 'beaute-1560066984-138dadb4c035.jpg', tresses: 'x-massage-n-1.jpg', tressesDos: 'x-soin-n-1.jpg', tressage: 'x-masque-1.jpg', mainsTresse: 'x-main-n-2.jpg',
  ongles: 'x-ongles-n-2.jpg', onglesNoirs: 'x-ongles-n-1.jpg', pieds: 'x-ongles-n-2.jpg', cils: 'x-maquillage-n-2.jpg', maquillage: 'x-maquillage-n-4.jpg', sourcils: 'x-maquillage-1.jpg',
};
const CATS = [
  { id: 'visage', t: 'Soins du visage', ph: PH.masque, d: 'Diagnostic de peau, éclat, anti-taches, peaux noires et métissées.', items: [
    ['Diagnostic de peau', 'Analyse et conseils personnalisés', 20, 5000], ['Soin éclat', 'Nettoyage, gommage, masque', 60, 20000],
    ['Soin anti-taches', 'Unifie le teint des peaux noires', 75, 28000], ['Soin hydratant', 'Peaux sèches et déshydratées', 60, 22000],
    ['Nettoyage profond', 'Points noirs, pores dilatés', 45, 18000], ['Soin anti-âge', 'Fermeté et éclat', 75, 30000]] },
  { id: 'corps', t: 'Corps & massages', ph: PH.tresses, d: 'Massages, gommages et enveloppements.', items: [
    ['Massage relaxant', 'Huiles chaudes, tout le corps', 60, 22000], ['Massage du dos', 'Nuque, épaules, dos', 30, 12000],
    ['Gommage corps', 'Sucre et huiles végétales', 45, 18000], ['Enveloppement karité', 'Nutrition intense', 45, 20000],
    ['Drainage jambes légères', 'Circulation, légèreté', 45, 20000], ['Massage future maman', 'Dès le 4e mois', 60, 25000]] },
  { id: 'regard', t: 'Épilation & regard', ph: PH.cils, d: 'Épilation douce, sourcils, cils et maquillage.', items: [
    ['Épilation sourcils', 'Cire ou fil', 15, 3000], ['Épilation demi-jambes', 'Cire tiède', 30, 8000],
    ['Épilation aisselles', 'Cire tiède', 15, 5000], ['Rehaussement de cils', 'Tenue 6 semaines', 45, 15000],
    ['Teinture sourcils', 'Regard intensifié', 20, 5000], ['Maquillage événement', 'Teint, yeux, lèvres', 60, 25000]] },
  { id: 'mains', t: 'Mains & pieds', ph: PH.ongles, d: 'Manucure, pédicure et semi-permanent.', items: [
    ['Manucure', 'Limage, cuticules, vernis', 30, 6000], ['Semi-permanent mains', 'Tenue 3 semaines', 45, 10000],
    ['Pédicure complète', 'Gommage, callosités, vernis', 60, 12000], ['Pose gel', 'Couleur au choix', 75, 15000],
    ['Semi-permanent pieds', 'Tenue 4 semaines', 45, 10000], ['Paraffine mains', 'Douceur et hydratation', 20, 5000]] },
];
const FORFAITS = [
  ['Peau neuve', 'Diagnostic + soin anti-taches + conseils produits', 100, 30000, PH.masque],
  ['Rituel Ivora', 'Gommage, massage relaxant et soin éclat du visage', 150, 52000, PH.tresses],
  ['Mains & pieds de fête', 'Semi-permanent mains et pieds + paraffine', 110, 22000, PH.ongles],
];
const AVIS = [
  ['Yolande', 'Soin anti-taches', 'Après trois séances, mon teint est vraiment plus uniforme. Les conseils produits sont précieux.'],
  ['Sarah', 'Rituel Ivora', 'Un vrai moment de calme à Cosyga. Massage parfait et peau toute douce.'],
  ['Christelle', 'Maquillage mariage', 'Maquillage tenu toute la journée et toute la nuit, j\'étais ravie. Merci à l\'équipe !'],
];
const TEAM = [['Grâce', 'Esthéticienne, soins du visage'], ['Merveille', 'Masseuse'], ['Audrey', 'Prothésiste ongulaire'], ['Nina', 'Maquilleuse']];

module.exports = { AG, PH, CATS, FORFAITS, AVIS, TEAM };
