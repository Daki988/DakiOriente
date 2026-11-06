// 2S Confort Driving : contenu du site.
// Infos réelles (annuaires, Facebook) : auto-école auto et moto, conduite sur aire (piste), Nzeng-Ayong à côté de Prix Import,
// BP 845 Libreville, 077 36 16 73 et 066 26 78 72, sergiekoumbandembi@gmail.com, dirigée par Sergie KOUMBA NDEMBI.
// À confirmer : formules, prix, horaires, moniteurs (prénoms fictifs), avis, logo (proposé).
const AG = {
  slug: '2s-confort-driving', name: '2S Confort Driving', dir: 'Sergie KOUMBA NDEMBI',
  tel: '077 36 16 73', tel2: '066 26 78 72', wa: '24177361673', mail: 'sergiekoumbandembi@gmail.com', bp: 'BP 845 Libreville',
  addr: 'Nzeng-Ayong, à côté de Prix Import', city: 'Libreville',
  mapq: 'Nzeng-Ayong,+Libreville,+Gabon',
  hours: [['Lundi – vendredi', '7 h 30 – 18 h 30'], ['Samedi', '8 h – 16 h'], ['Dimanche', 'Fermé']],
};
const PH = {
  conduite: 'x-conduite-n-1.jpg', conducteur: 'x-conducteur-n-2.jpg', casque: 'x-casque-moto-1.jpg', motos: 'x-motos-route-1.jpg', citadine: 'x-citadine-2.jpg',
};

// Formules : [id, titre, public, prix FCFA, contenu, mise en avant]
const FORMULES = [
  ['code', 'Code de la route', 'Pour réussir l\'examen théorique', 75000, ['Cours en salle avec un moniteur', 'Tests blancs illimités', 'Livret de code', 'Inscription à l\'examen'], false],
  ['permis-b', 'Permis B', 'La formule complète voiture', 380000, ['Code de la route inclus', '25 h de conduite', 'Aire de conduite et circulation', 'Présentation à l\'examen'], true],
  ['acceleree', 'Permis B accéléré', 'Votre permis en 6 semaines', 450000, ['Code intensif', '25 h de conduite en 6 semaines', 'Créneaux prioritaires', 'Présentation à l\'examen'], false],
  ['permis-a', 'Permis A moto', 'Deux-roues, en toute sécurité', 200000, ['Code de la route inclus', '15 h de pratique', 'Plateau et circulation', 'Équipement prêté'], false],
  ['perfectionnement', 'Perfectionnement', 'Reprendre confiance au volant', 90000, ['Bilan de conduite', '5 h avec un moniteur', 'Circulation en ville et créneaux', 'Conseils personnalisés'], false],
  ['heure', 'Heure de conduite', 'À l\'unité, pour compléter', 15000, ['1 h avec un moniteur', 'Voiture à double commande', 'Sur rendez-vous'], false],
];

const STEPS = [
  ['Inscription', 'En ligne ou à l\'auto-école, avec votre pièce d\'identité et vos photos.'],
  ['Le code', 'Cours en salle et tests blancs jusqu\'à être prêt pour l\'examen.'],
  ['La conduite', 'Aire de conduite pour les bases, puis circulation dans Libreville.'],
  ['L\'examen', 'Nous vous présentons à l\'examen quand vous êtes prêt, pas avant.'],
];

// Mini-test du code : [panneau, question, réponses, index bonne réponse, explication]
const QUIZ = [
  ['stop', 'Que devez-vous faire à ce panneau ?', ['Ralentir et passer si la voie est libre', 'Marquer l\'arrêt complet, puis céder le passage', 'Klaxonner avant de passer'], 1, 'Au stop, l\'arrêt est obligatoire, même si personne n\'arrive.'],
  ['cedez', 'Ce panneau signifie :', ['Vous avez la priorité', 'Cédez le passage à l\'intersection', 'Fin d\'une route prioritaire'], 1, 'Vous devez laisser passer les véhicules de la route que vous rejoignez, sans forcément vous arrêter.'],
  ['sens-interdit', 'Ce panneau indique :', ['Sens interdit à tout véhicule', 'Stationnement interdit', 'Route barrée pour travaux'], 0, 'Vous ne pouvez pas entrer dans cette voie dans ce sens.'],
  ['v50', 'Que signifie ce panneau ?', ['Vitesse conseillée 50 km/h', 'Vitesse minimale 50 km/h', 'Vitesse maximale 50 km/h'], 2, 'Le cercle rouge indique une limite : 50 km/h au maximum.'],
  ['stationnement', 'Ici, vous pouvez :', ['Vous arrêter quelques instants, mais pas stationner', 'Ni vous arrêter, ni stationner', 'Stationner librement'], 0, 'Une seule barre : stationnement interdit, l\'arrêt reste possible.'],
  ['danger', 'Ce triangle rouge annonce :', ['Une obligation', 'Un danger', 'Une indication de direction'], 1, 'Les panneaux triangulaires à bord rouge annoncent un danger : ralentissez et redoublez d\'attention.'],
  ['priorite', 'Ce losange jaune signifie :', ['Route prioritaire', 'Fin de route prioritaire', 'Danger'], 0, 'Vous êtes sur une route prioritaire jusqu\'au panneau de fin.'],
  ['depassement', 'Ce panneau interdit :', ['De rouler à plus de 2 voitures côte à côte', 'De dépasser les véhicules à moteur, sauf les deux-roues', 'De circuler en voiture'], 1, 'Le dépassement des véhicules à moteur est interdit, sauf celui des deux-roues sans side-car.'],
];

// Personnages fictifs : prénom uniquement
const AVIS = [
  ['Grâce', 'Permis B', 'J\'avais peur de conduire. Moniteur très patient, je l\'ai eu du premier coup !'],
  ['Kevin', 'Permis A moto', 'Bonne formation sur le plateau avant d\'aller en circulation. Je me sens en sécurité sur ma moto.'],
  ['Larissa', 'Perfectionnement', 'Après des années sans conduire, 5 heures ont suffi pour reprendre confiance dans les embouteillages.'],
];
const TEAM = [['Sergie KOUMBA NDEMBI', 'Directeur de l\'auto-école'], ['Patrick', 'Moniteur voiture'], ['Yannick', 'Moniteur moto'], ['Christelle', 'Accueil et dossiers']];

const FAQ = [
  ['Quels documents faut-il pour s\'inscrire ?', 'Une pièce d\'identité, des photos d\'identité et un certificat médical. Nous vous aidons à constituer le dossier.'],
  ['Peut-on payer en plusieurs fois ?', 'Oui, le paiement peut être échelonné en 2 ou 3 fois. Parlez-en à l\'accueil.'],
  ['À partir de quel âge ?', '18 ans pour passer le permis B. Vous pouvez commencer le code avant.'],
  ['Où se passent les leçons ?', 'Les premières sur notre aire de conduite, pour apprendre sans stress, puis en circulation dans Libreville.'],
  ['Combien de temps pour avoir son permis ?', 'En général 2 à 3 mois en formule classique, 6 semaines en formule accélérée.'],
];

module.exports = { AG, PH, FORMULES, STEPS, QUIZ, AVIS, TEAM, FAQ };
