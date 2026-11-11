// Assiga Village (Pointe Denis) : contenu du site sur mesure.
// Infos réelles (Petit Futé, Facebook assigavillageofficiel, YouTube, groupe Mbolo Gabon) : hôtel-bar-restaurant à la Pointe Denis,
// « blotti entre océan et rivières », à 15 minutes de Libreville ; 18 chambres et suites décorées d'art gabonais ; cuisine africaine et européenne
// de produits frais ; trois univers : Bien-être (soins), Évasion (activités), Nature (excursions dans le parc de Pongara) ;
// forfait journée navette et repas dès 40 000 FCFA par adulte (35 000 FCFA en offre spéciale, départ navette Michel Marine à 9 h 45), tarifs enfants ;
// forfait 2 jours / 1 nuit dès 125 000 FCFA en chambre double avec petit-déjeuner, environ 250 000 FCFA en pension complète ;
// 066 18 38 38 ; assigavillage.ga@gmail.com ; dirigé par Jean Bernard BOUMAH ; note Google 4,3.
// Tarifs enfants, options et horaires de retour : indicatifs, à confirmer.
const P = '../../assets/photos/';

const AV = {
  slug: 'assiga-village', name: 'Assiga Village', tel: '066 18 38 38', wa: '24166183838', mail: 'assigavillage.ga@gmail.com',
  addr: 'Pointe Denis, face à Libreville', city: 'Pointe Denis', depart: 'Michel Marine (Libreville)', heure: '9 h 45',
  soc: ['facebook', 'instagram', 'tiktok', 'youtube'], rating: 4.3,
};

const PH = {
  hero: P + 'resto-1519046904884-53103b34b206.jpg', sunset: P + 'x-gabon-4.jpg', plage: P + 'resto-1507525428034-b723cf961d3e.jpg', lodge: P + 'hotel-1783334538188-4f4aed783057.jpg',
  porte: P + 'x-bungalow-1.jpg', nuit: P + 'x-bungalow-2.jpg', terrasse: P + 'resto-1559339352-11d035aa65de.jpg', massage: P + 'x-massage-n-1.jpg',
  peche: P + 'x-peche-bord-1.jpg', large: P + 'x-peche-large-1.jpg', tortue: P + 'x-tortue-1.jpg', tortue2: P + 'x-tortue-2.jpg', baleine: P + 'x-baleine-1.jpg', baleine2: P + 'x-baleine-2.jpg',
  mangrove: P + 'x-lagune-1.jpg', pirogue: P + 'x-pirogue-1.jpg', langouste: P + 'x-langouste-1.jpg', poisson: P + 'x-poisson-braise-4.jpg', gambas: P + 'x-gambas-2.jpg', mojito: P + 'x-mojito-2.jpg',
  chambre: P + 'x-chambre-twin-1.jpg', suite: P + 'x-suite-3.jpg', sdb: P + 'x-sdb-1.jpg',
};

// Formules : id, nom, prix adulte (journée) ou prix par chambre double (séjour), prix enfant, description, inclus
const FORMULES = [
  { id: 'journee', n: 'Journée à la plage', type: 'jour', ad: 40000, en: 20000, d: 'Traversée aller-retour, cocktail de bienvenue, déjeuner, plage et transats.', inc: ['Navette aller-retour depuis Michel Marine', 'Cocktail de bienvenue', 'Déjeuner (entrée, plat, dessert)', 'Transats et parasols'] },
  { id: 'weekend', n: 'Week-end 2 jours / 1 nuit', type: 'sejour', ch: 125000, en: 25000, d: 'Navette, nuit en chambre double, petit-déjeuner, plage et baignade.', inc: ['Navette aller-retour', 'Nuit en chambre double', 'Petit-déjeuner', 'Accès plage et activités libres'] },
  { id: 'complet', n: 'Week-end pension complète', type: 'sejour', ch: 250000, en: 45000, d: 'Le grand week-end : navette, nuit, tous les repas et une activité offerte.', inc: ['Navette aller-retour', 'Nuit en chambre double', 'Petit-déjeuner, déjeuners et dîner', 'Une activité Évasion offerte'] },
];

// Options (prix par personne)
const OPTIONS = [
  ['massage', 'Massage relaxant 1 h', 25000, 'bien-etre'], ['soin', 'Soin du visage', 20000, 'bien-etre'],
  ['pongara', 'Excursion dans le parc de Pongara', 30000, 'nature'], ['mangrove', 'Balade en pirogue dans la mangrove', 15000, 'nature'],
  ['peche', 'Sortie pêche', 35000, 'evasion'], ['kayak', 'Kayak (1 h)', 10000, 'evasion'],
];

// Univers et activités
const UNIVERS = [
  ['bien-etre', 'Bien-être', 'Massages, soins du visage et du corps face à l\'océan, pour repartir apaisé.', PH.massage],
  ['evasion', 'Évasion', 'Pêche, kayak, beach-volley, balades sur la plage : le plein d\'air marin.', PH.peche],
  ['nature', 'Nature', 'Le parc national de Pongara à deux pas : mangroves, tortues marines, baleines au large.', PH.tortue],
];

// Calendrier de la nature (indicatif) : mois 1–12
const SAISONS = [
  ['tortues', 'Ponte des tortues luth', [11, 12, 1, 2], 'De nuit, sur les plages de Pongara, avec un guide.', PH.tortue],
  ['baleines', 'Baleines à bosse au large', [7, 8, 9, 10], 'Elles remontent vers l\'estuaire : spectacle depuis le bateau.', PH.baleine],
  ['mangrove', 'Mangroves et oiseaux', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'Toute l\'année, en pirogue, au lever du jour.', PH.mangrove],
  ['peche', 'Belle saison de pêche', [5, 6, 7, 8, 9], 'Saison sèche : mer plus calme, belles prises au bord et au large.', PH.large],
];

const CARTE = [
  ['De la mer', [['Langouste grillée', 'Beurre citronné, légumes du jour', 22000], ['Poisson entier braisé', 'Pêché du jour, bâtons de manioc ou frites', 12000], ['Gambas à l\'ail', 'Persillade, riz parfumé', 15000]]],
  ['Saveurs africaines', [['Poulet nyembwe', 'Sauce noix de palme, banane plantain', 9000], ['Feuilles de manioc', 'Au poisson fumé', 8000], ['Brochettes de bœuf', 'Marinade maison, piment doux', 8000]]],
  ['Côté Europe & douceurs', [['Salade océane', 'Crevettes, avocat, agrumes', 8500], ['Pâtes aux fruits de mer', 'Crème légère, ail, persil', 12000], ['Ananas rôti', 'Caramel au rhum, glace coco', 4500]]],
];

const AVIS = [
  ['Laetitia', 'Journée entre amies', 'Une journée hors du temps à 15 minutes de Libreville. Service à l\'écoute, poisson braisé délicieux, on reviendra !'],
  ['Didier', 'Week-end en famille', 'Les enfants ont joué toute la journée sur la plage, nous avons profité du calme et de la cuisine. Chambres décorées avec goût.'],
  ['Aurélie', 'Nuit des tortues', 'Voir une tortue luth pondre sur la plage de Pongara, c\'est magique. Merci au guide et à toute l\'équipe.'],
];

module.exports = { AV, PH, FORMULES, OPTIONS, UNIVERS, SAISONS, CARTE, AVIS };
