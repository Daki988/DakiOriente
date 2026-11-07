// Skin Technology by Latania : contenu du site.
// Infos réelles (Le Pratique du Gabon, Instagram @skintechnologygabon, TikTok @skintechnologybylatania, Facebook) :
// marque et institut de soin, de réparation et de rajeunissement de la peau, fondée par Tania AKPOVI ; produits de soin du visage
// (dont une gamme clarifiante, des soins « caviar ») ; showroom au Beaulieu, 1er étage, en face de la salle des fêtes, Angondjé (Akanda) ;
// 074 59 26 55 et 065 25 43 56 ; 24kskintech@gmail.com. Logo réel (aigle doré dans un écusson) redessiné.
// À confirmer : liste exacte des produits, prix, soins et tarifs de l'institut, horaires.
const SK = {
  slug: 'skin-technology-by-latania', name: 'Skin Technology by Latania', founder: 'Tania AKPOVI',
  tel: '074 59 26 55', tel2: '065 25 43 56', wa: '24165254356', mail: '24kskintech@gmail.com',
  addr: 'Immeuble Beaulieu, 1er étage, en face de la salle des fêtes', city: 'Angondjé, Akanda', geo: [0.5081613, 9.3935366],
  ig: 'skintechnologygabon', tt: 'skintechnologybylatania',
  hours: [['Lundi – samedi', '9 h – 19 h'], ['Dimanche', 'Fermé']],
};
const PH = {
  hero: '../../assets/sig/portrait-cut.webp', glow: '../../assets/sig/soin-1.jpg', cream: '../../assets/sig/soin-2.jpg', touch: '../../assets/sig/soin-3.jpg',
  curls: '../../assets/sig/soin-4.jpg', dark: '../../assets/photos/beaute-1765607476292.jpg', mask: '../../assets/photos/x-masque-n-1.jpg', robe: '../../assets/photos/x-soin-n-1.jpg',
};
// Gammes : [id, nom, promesse, couleur]
const GAMMES = [
  ['clarifiante', 'Clarifiante', 'Taches, teint irrégulier : un teint unifié et lumineux', '#C9A24A'],
  ['caviar', 'Caviar', 'Rides, fermeté : la gamme anti-âge d\'exception', '#1A1816'],
  ['pure', 'Pure', 'Boutons, pores, excès de sébum : une peau nette', '#7E9C8C'],
  ['hydra', 'Hydra', 'Peaux sèches et sensibles : confort et douceur', '#8FA9BD'],
  ['corps', 'Corps', 'Éclat et douceur de la peau du corps', '#C79B7B'],
];
// Produits : [id, nom, gamme, format, prix, forme (drop, jar, tube, pump, bar), préoccupations]
const PRODUITS = [
  ['serum-clarifiant', 'Sérum clarifiant', 'clarifiante', '30 ml', 25000, 'drop', ['taches', 'eclat']],
  ['creme-jour-clarifiante', 'Crème de jour clarifiante SPF 30', 'clarifiante', '50 ml', 22000, 'jar', ['taches', 'eclat']],
  ['lotion-clarifiante', 'Lotion tonique clarifiante', 'clarifiante', '200 ml', 15000, 'pump', ['taches', 'eclat']],
  ['savon-clarifiant', 'Savon exfoliant clarifiant', 'clarifiante', '100 g', 8000, 'bar', ['taches', 'eclat']],
  ['serum-caviar', 'Sérum caviar', 'caviar', '30 ml', 35000, 'drop', ['rides']],
  ['creme-nuit-caviar', 'Crème de nuit caviar', 'caviar', '50 ml', 38000, 'jar', ['rides']],
  ['contour-caviar', 'Contour des yeux caviar', 'caviar', '15 ml', 20000, 'tube', ['rides']],
  ['gel-pure', 'Gel nettoyant purifiant', 'pure', '150 ml', 12000, 'pump', ['imperfections']],
  ['serum-pure', 'Sérum anti-imperfections', 'pure', '30 ml', 22000, 'drop', ['imperfections']],
  ['masque-pure', 'Masque à l\'argile', 'pure', '75 ml', 14000, 'jar', ['imperfections']],
  ['lait-hydra', 'Lait démaquillant doux', 'hydra', '200 ml', 12000, 'pump', ['secheresse']],
  ['creme-hydra', 'Crème hydratante confort', 'hydra', '50 ml', 18000, 'jar', ['secheresse']],
  ['huile-hydra', 'Huile sèche visage', 'hydra', '30 ml', 16000, 'drop', ['secheresse', 'eclat']],
  ['lait-corps', 'Lait corps éclat', 'corps', '400 ml', 20000, 'pump', ['eclat']],
  ['gommage-corps', 'Gommage corps', 'corps', '250 g', 15000, 'jar', ['eclat']],
];
const CONCERNS = [['taches', 'Taches'], ['imperfections', 'Imperfections'], ['eclat', 'Teint terne'], ['rides', 'Rides et fermeté'], ['secheresse', 'Sécheresse']];
// Soins à l'institut : [id, nom, durée, prix (0 = offert), description, préoccupations]
const SOINS = [
  ['diagnostic', 'Diagnostic de peau', '30 min', 0, 'Analyse de votre peau et conseils personnalisés. Offert avant votre premier soin.', ['taches', 'imperfections', 'eclat', 'rides', 'secheresse']],
  ['nettoyage', 'Nettoyage de peau profond', '60 min', 25000, 'Démaquillage, gommage, extraction douce des points noirs, masque et hydratation.', ['imperfections', 'eclat', 'secheresse']],
  ['eclat', 'Soin éclat anti-taches', '75 min', 35000, 'Exfoliation, sérum clarifiant et masque pour atténuer les taches et unifier le teint.', ['taches', 'eclat']],
  ['acne', 'Soin anti-imperfections', '60 min', 30000, 'Purifie, resserre les pores et apaise les boutons, sans agresser la peau.', ['imperfections']],
  ['peeling', 'Peeling', '45 min', 40000, 'Renouvelle la peau en profondeur : taches, marques et grain de peau.', ['taches', 'imperfections', 'eclat']],
  ['microneedling', 'Microneedling', '60 min', 60000, 'Stimule le collagène : rides, cicatrices et relâchement.', ['rides', 'taches']],
  ['caviar', 'Soin lift caviar', '75 min', 45000, 'Massage liftant et soins caviar pour une peau plus ferme et repulpée.', ['rides', 'secheresse']],
  ['corps', 'Gommage et enveloppement corps', '90 min', 40000, 'Gommage, enveloppement et lait éclat pour une peau douce de la tête aux pieds.', ['eclat', 'secheresse']],
];
const AVIS = [
  ['Merveille', 'Gamme clarifiante', 'Mes taches de grossesse se sont nettement atténuées en trois mois. Et on me conseille vraiment, sans me pousser à acheter.'],
  ['Prisca', 'Soin anti-imperfections', 'Enfin une peau nette ! Le diagnostic m\'a fait comprendre que j\'utilisais des produits trop agressifs.'],
  ['Danielle', 'Soin lift caviar', 'Un moment de pure détente et une peau visiblement plus ferme. Le showroom est magnifique.'],
];
module.exports = { SK, PH, GAMMES, PRODUITS, CONCERNS, SOINS, AVIS };
