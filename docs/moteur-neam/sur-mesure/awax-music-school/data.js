// Awax Music School : contenu du site.
// Infos réelles (Le Pratique du Gabon, annuaire Filao, Facebook, Instagram @awaxmschool, Gabonews, Gabon 24) : école de formation musicale
// « made in Gabon », fruit de la passion de deux musiciens, plus de 12 ans d'expérience ; piano, guitare, batterie, saxophone, chant et
// coaching vocal, chorale, techniques du son ; formations professionnelles avec certificat ; site de Louis (à côté de la station Engen)
// et site d'Akanda (Ambowè, entrée plateforme Horizon) ; du lundi au samedi ; 077 25 95 73 ; awaxmusics@gmail.com ; rentrée 2026-2027 ;
// engagement « Novembre bleu ».
// À confirmer : tarifs, planning, professeurs (prénoms fictifs), âges, horaires exacts.
const AW = {
  slug: 'awax-music-school', name: 'Awax Music School', tel: '077 25 95 73', wa: '24177259573', mail: 'awaxmusics@gmail.com',
  ig: 'awaxmschool', fb: 'awaxsmusic',
  sites: [
    ['louis', 'Site de Louis', 'Libreville, à côté de la station Engen', 'Louis,+Libreville,+Gabon'],
    ['akanda', 'Site d\'Akanda', 'Ambowè, entrée plateforme Horizon', 'Ambowe,+Akanda,+Gabon'],
  ],
  hours: [['Lundi – vendredi', '14 h – 20 h'], ['Samedi', '9 h – 18 h'], ['Dimanche', 'Fermé']],
};
const I = (f) => '../../assets/photos/' + f;
const PH = {
  scene: I('x-chant-n-2.jpg'), chant: I('x-chant-n-1.jpg'), micro: I('x-chant-n-3.jpg'), duo: I('x-chant-n-4.jpg'),
  batt1: I('x-batterie-n-3.jpg'), batt2: I('x-batterie-n-1.jpg'), batt3: I('x-batterie-n-2.jpg'), son: I('x-dj-1.jpg'),
  guitare: I('ecole-1511379938547-c1f69419868d.jpg'), solfege: I('ecole-1507838153414-b4b713384a76.jpg'), sax: I('x-saxophone-1.jpg'), piano: I('x-piano-1.jpg'),
};
// Cours : [id, instrument, photo, âge minimum, accroche, ce que l'on apprend]
const COURS = [
  ['piano', 'Piano et clavier', PH.piano, 6, 'L\'instrument idéal pour comprendre la musique.', ['Lecture de notes et rythmes', 'Accords et accompagnement', 'Morceaux du répertoire africain et international']],
  ['guitare', 'Guitare', PH.guitare, 8, 'Acoustique, électrique ou basse : de l\'accord à la scène.', ['Accords et rythmiques', 'Solos et improvisation', 'Guitare d\'église, rumba, afro-pop']],
  ['batterie', 'Batterie et percussions', PH.batt1, 7, 'Le cœur du groupe : rythme, coordination et énergie.', ['Indépendance des mains et des pieds', 'Grooves afro, gospel, rock', 'Jeu en groupe']],
  ['saxophone', 'Saxophone', PH.sax, 10, 'Le souffle, le son et le swing.', ['Respiration et embouchure', 'Gammes et lecture', 'Jazz, makossa, soul']],
  ['chant', 'Chant et coaching vocal', PH.chant, 8, 'Placer sa voix, tenir la note, oser la scène.', ['Respiration et justesse', 'Interprétation et présence', 'Préparation aux concours et concerts']],
  ['chorale', 'Chorale', PH.duo, 6, 'Chanter ensemble, à plusieurs voix.', ['Harmonie et polyphonie', 'Rôle du lead vocal', 'Répertoire gospel et variété']],
  ['son', 'Techniques du son', PH.son, 15, 'Enregistrer, mixer, sonoriser un concert.', ['Prise de son et micros', 'Mixage et logiciels', 'Sonorisation en live']],
];
// Formules (tarifs indicatifs par mois, 4 séances)
const FORMULES = [
  ['indiv', 'Cours individuel', '45 min par semaine', 40000],
  ['duo', 'Cours en duo', '1 h par semaine, à deux', 30000],
  ['groupe', 'Atelier collectif', '1 h 30 par semaine, en groupe', 20000],
];
const INSCRIPTION = 15000;
// Planning : [jour (1 = lundi), heure, durée en minutes, cours, site, niveau]
const PLANNING = [
  [1, '15:00', 45, 'piano', 'louis', 'Débutant'], [1, '17:00', 60, 'guitare', 'louis', 'Tous niveaux'], [1, '18:00', 90, 'chorale', 'louis', 'Tous niveaux'],
  [2, '15:00', 45, 'batterie', 'akanda', 'Débutant'], [2, '16:30', 60, 'chant', 'akanda', 'Débutant'], [2, '18:00', 60, 'saxophone', 'louis', 'Intermédiaire'],
  [3, '14:00', 60, 'piano', 'akanda', 'Enfants'], [3, '16:00', 45, 'guitare', 'akanda', 'Débutant'], [3, '18:00', 90, 'son', 'louis', 'Adultes'],
  [4, '15:00', 45, 'batterie', 'louis', 'Intermédiaire'], [4, '17:00', 60, 'chant', 'louis', 'Avancé'], [4, '18:30', 60, 'piano', 'louis', 'Adultes'],
  [5, '15:00', 60, 'saxophone', 'akanda', 'Débutant'], [5, '17:00', 90, 'chorale', 'akanda', 'Tous niveaux'],
  [6, '09:00', 60, 'piano', 'louis', 'Enfants'], [6, '10:00', 60, 'guitare', 'louis', 'Enfants'], [6, '11:00', 60, 'batterie', 'akanda', 'Enfants'], [6, '14:00', 90, 'chant', 'akanda', 'Tous niveaux'], [6, '16:00', 90, 'son', 'akanda', 'Adultes'],
];
// Quiz « Quel instrument pour moi ? » : chaque réponse donne des points aux cours
const QUIZ = [
  ['Ce qui te fait vibrer dans une chanson…', [['La mélodie', { piano: 2, saxophone: 1 }], ['Le rythme', { batterie: 2, guitare: 1 }], ['La voix', { chant: 2, chorale: 1 }], ['Le son et la production', { son: 2, piano: 1 }]]],
  ['Tu préfères jouer…', [['Seul, à ton rythme', { piano: 1, guitare: 1, saxophone: 1 }], ['En groupe, sur scène', { batterie: 1, chorale: 2, chant: 1 }], ['Derrière la console', { son: 3 }]]],
  ['Ton énergie, plutôt…', [['Calme et concentré', { piano: 2, guitare: 1 }], ['Explosive', { batterie: 2, saxophone: 1 }], ['Expressive', { chant: 2, saxophone: 1 }]]],
  ['Ton style préféré', [['Gospel et chorale', { chorale: 2, chant: 1, piano: 1 }], ['Afro-pop et rumba', { guitare: 2, batterie: 1 }], ['Jazz et soul', { saxophone: 2, piano: 1 }], ['Rap, électro', { son: 2, batterie: 1 }]]],
];
const AVIS = [
  ['Joëlle', 'Maman de Kenzo, 9 ans, piano', 'En un trimestre, Kenzo joue ses premiers morceaux et a chanté au concert de fin d\'année. Professeurs patients et motivants.'],
  ['Rodrigue', 'Batterie, adulte', 'J\'ai commencé à 34 ans. Les cours du soir à Louis tombent pile après le travail. Je joue maintenant à l\'église.'],
  ['Inès', 'Coaching vocal', 'J\'ai appris à respirer et à tenir ma voix. Le coaching m\'a donné confiance avant mon premier concours.'],
];
module.exports = { AW, PH, COURS, FORMULES, INSCRIPTION, PLANNING, QUIZ, AVIS };
