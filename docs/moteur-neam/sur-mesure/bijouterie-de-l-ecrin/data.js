// Bijouterie de l'Écrin : contenu du site.
// Infos réelles (annuaires, Facebook « Chez Gueye ») : maison familiale tenue par Abdoulaye GUEYE, Glass face Western Union,
// BP 1425 Libreville, 065 31 19 55 et 066 24 59 25, abdoulaye1425@yahoo.fr.
// À confirmer : pièces, prix, horaires, services de l'atelier, logo (proposé). Personnages fictifs : prénom uniquement.
const AG = {
  slug: 'bijouterie-de-l-ecrin', name: 'Bijouterie de l\'Écrin', dir: 'Abdoulaye GUEYE',
  tel: '065 31 19 55', tel2: '066 24 59 25', wa: '24165311955', mail: 'abdoulaye1425@yahoo.fr', bp: 'BP 1425 Libreville',
  addr: 'Glass, face à Western Union', city: 'Libreville', mapq: 'Glass,+Libreville,+Gabon',
  hours: [['Lundi – samedi', '9 h – 19 h'], ['Dimanche', 'Fermé']],
};
const PH = {
  portrait: 'x-bijou-portrait-n-1.jpg', bracelets: 'x-bijou-bracelets-n-1.jpg', perlesP: 'x-bijou-perles-n-1.jpg', collierP: 'x-bijou-collier-n-1.jpg',
  bijoutier: 'x-bijoutier-n-1.jpg', etabli: 'x-etabli-1.jpg', soudure: 'x-soudure-bijou-1.jpg', creoles: 'x-creoles-or-1.jpg',
  alliances: 'x-alliances-1.jpg', alliances2: 'x-alliances-2.jpg', alliances3: 'x-alliances-3.jpg', solitaire: 'luxe-1605100804763-247f67b3557e.jpg',
  boucles: 'x-boucles-1.jpg', boucles2: 'x-boucles-2.jpg', boucles3: 'x-boucles-3.jpg', perles: 'luxe-1515562141207-7a88fb7ce338.jpg',
};

// [id, nom, détail, prix FCFA (à partir de), photo, rayon]
const PROD = [
  ['solitaire', 'Bague solitaire', 'Or blanc 18 carats, pierre centrale', 450000, PH.solitaire, 'bagues'],
  ['alliances-jaune', 'Alliances or jaune', 'La paire, or 18 carats, gravure offerte', 380000, PH.alliances, 'mariage'],
  ['alliances-classiques', 'Alliances classiques', 'Or 18 carats, finition polie', 320000, PH.alliances3, 'mariage'],
  ['alliances-fines', 'Alliances fines', 'Or 18 carats, 2 mm', 260000, PH.alliances2, 'mariage'],
  ['creoles', 'Créoles en or', 'Or 18 carats, plusieurs diamètres', 150000, PH.creoles, 'boucles'],
  ['boucles-soleil', 'Boucles soleil', 'Or jaune, motif rayonnant', 180000, PH.boucles, 'boucles'],
  ['puces-perle', 'Puces perle', 'Or et perle de culture', 95000, PH.boucles2, 'boucles'],
  ['collier-perles', 'Collier de perles', 'Perles de culture, fermoir or', 280000, PH.perles, 'colliers'],
  ['chaine-maille', 'Chaîne maille gourmette', 'Or 18 carats, 50 cm', 220000, PH.collierP, 'colliers'],
  ['jonc', 'Jonc ciselé', 'Or 18 carats, travail main', 340000, PH.bracelets, 'bracelets'],
  ['bracelet-fin', 'Bracelet fin', 'Or 18 carats, maille forçat', 120000, PH.boucles3, 'bracelets'],
  ['parure', 'Parure de mariée', 'Collier, boucles et bracelet assortis', 650000, PH.portrait, 'mariage'],
];
const RAYONS = { bagues: 'Bagues', mariage: 'Mariage', boucles: 'Boucles d\'oreilles', colliers: 'Colliers', bracelets: 'Bracelets' };

// Services de l'atelier
const ATELIER = [
  ['mesure', 'Création sur mesure', 'Votre bijou dessiné avec vous, puis façonné à l\'atelier.', PH.bijoutier],
  ['taille', 'Mise à taille', 'Agrandir ou réduire une bague, en 48 h.', PH.etabli],
  ['reparation', 'Réparation', 'Chaîne cassée, fermoir, pierre desserrée : on répare.', PH.soudure],
  ['gravure', 'Gravure', 'Prénoms, date, message : à l\'intérieur des alliances ou sur un pendentif.', PH.alliances2],
  ['nettoyage', 'Nettoyage et polissage', 'Vos bijoux retrouvent leur éclat d\'origine.', PH.creoles],
];

const AVIS = [
  ['Jessica', 'Alliances or jaune', 'Nos alliances gravées avec notre date de mariage : un travail fin, et des conseils très honnêtes. Merci !'],
  ['Hermann', 'Création sur mesure', 'J\'ai fait refaire la bague de ma mère à partir de son ancien or. Le résultat est magnifique.'],
  ['Murielle', 'Réparation', 'Ma chaîne était cassée depuis des mois : réparée le jour même, comme neuve.'],
];

module.exports = { AG, PH, PROD, RAYONS, ATELIER, AVIS };
