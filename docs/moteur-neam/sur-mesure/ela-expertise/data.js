// ELA Expertise : contenu du site (maquette validée).
// Infos réelles (annuaires) : logo, slogan, 7 services, adresse, BP, téléphones, e-mail, position GPS.
// À confirmer : délais, horaires, zones d'intervention, exemple de rapport (fictif, signalé comme tel).
const AG = {
  slug: 'ela-expertise', name: 'ELA Expertise', expert: 'Luc Arnold ELA', titre: 'Expert évaluateur près la Cour d\'appel',
  slogan: 'L\'expertise pour une approche efficiente de l\'immobilier',
  tel: '066 24 30 44', tel2: '077 11 74 35', wa: '24166243044', mail: 'lucarnoldela@yahoo.fr', bp: 'BP 1265 Libreville',
  addr: ['Route de l\'église Saint-Pierre', 'Montagne Sainte, Libreville'],
  hours: ['Lun – Ven · 8 h – 17 h 30', 'Visites sur rendez-vous'],
  geo: [0.3946977, 9.4436566],
};
const PH = {
  villa: 'immo-1600596542815-ffad4c1539a9.jpg', villa2: 'immo-1564013799919-ab600027ffc6.jpg', villa3: 'immo-1512917774080-9991f1c4c750.jpg', villa4: 'immo-1600585154340-be6161a56a0c.jpg',
  expert: 'x-expert-chantier-1.jpg', geo: 'x-geometre-1.jpg', plans: 'x-plans-1.jpg', terrain: 'x-terrain-1.jpg',
  resid: 'x-residence-1.jpg', resid2: 'x-residence-2.jpg', resid3: 'x-residence-3.jpg', bur: 'x-bureaux-3.jpg', bur2: 'x-bureaux-2.jpg',
  salon: 'immo-1600607687939-ce8a6c25118c.jpg', salon2: 'immo-1616137422495-1e9e46e2aa77.jpg', tours: 'immo-1486406146926-c627a92ad1ab.jpg', cles: 'immo-1560518883-ce09059eeffa.jpg',
  cuisine: 'x-cuisine-appart-1.jpg',
};

// Les 7 services réels du cabinet
const S = (o) => o;
const SERV = [
  S({ id: 'immobiliere', t: 'Expertise immobilière et foncière', ph: PH.expert, d: 'Valeur vénale et locative de maisons, appartements, immeubles, bureaux, entrepôts et terrains, avec visite, relevés et étude de marché.',
    li: ['Valeur vénale et valeur locative', 'Garantie bancaire, vente, succession', 'Expertise judiciaire ou amiable', 'Terrains : titre foncier, bornage, constructibilité'], delai: 'Rapport sous 10 jours' }),
  S({ id: 'immobilisations', short: 'Évaluation des actifs pour le bilan, la réévaluation ou une cession.', t: 'Expertise des immobilisations', ph: PH.bur, d: 'Évaluation des bâtiments, aménagements et équipements inscrits à l\'actif de votre entreprise.',
    li: ['Réévaluation des bilans', 'Valeurs d\'apport et de cession', 'Inventaire physique et rapprochement comptable'], delai: 'Calendrier selon le parc' }),
  S({ id: 'entreprise', short: 'Valeur des titres et du fonds pour une cession, une levée ou un partage.', t: 'Évaluation d\'entreprise', ph: PH.tours, d: 'Valeur des titres, du fonds de commerce et des actifs, pour décider en connaissance de cause.',
    li: ['Cession, transmission, entrée d\'associés', 'Méthodes patrimoniales et de rendement', 'Note de synthèse pour les associés et les banques'], delai: 'Mission sur devis' }),
  S({ id: 'risques', short: 'Valeurs à assurer, état technique et évaluation après sinistre.', t: 'Évaluation des risques', ph: PH.resid, d: 'Valeurs à assurer et état technique de vos bâtiments, avant qu\'un sinistre ne survienne.',
    li: ['Valeur de reconstruction à neuf', 'Évaluation après sinistre', 'Recommandations de prévention'], delai: 'Rapport sous 10 jours' }),
  S({ id: 'amo', short: 'Un expert à vos côtés, de l\'étude du projet à la réception.', t: 'Conseil et assistance à maîtrise d\'ouvrage', ph: PH.plans, d: 'Un regard d\'expert à vos côtés, de l\'étude du projet jusqu\'à la réception des travaux.',
    li: ['Étude de faisabilité et budget', 'Analyse des devis et suivi de chantier', 'Réception et levée des réserves'], delai: 'Accompagnement sur mesure' }),
  S({ id: 'patrimoine', short: 'Valoriser, arbitrer et transmettre vos biens immobiliers.', t: 'Gestion de patrimoine', ph: PH.cles, d: 'Valoriser, arbitrer et transmettre vos biens immobiliers avec une vision d\'ensemble.',
    li: ['Inventaire et valorisation du patrimoine', 'Stratégie de location ou de cession', 'Préparation de la transmission'], delai: 'Bilan patrimonial sur rendez-vous' }),
  S({ id: 'risk-management', short: 'Cartographie des risques de votre parc et plan d\'actions.', t: 'Risk management', ph: PH.resid3, d: 'Identifier, mesurer et réduire les risques qui pèsent sur un parc immobilier.',
    li: ['Cartographie des risques', 'Plan d\'actions priorisé', 'Suivi et indicateurs'], delai: 'Mission sur devis' }),
];

const CAS = [
  ['home', 'Vente ou achat', 'Fixer le bon prix et négocier sur des bases solides.'],
  ['bank', 'Crédit bancaire', 'Rapport de garantie exigé par la banque pour votre prêt.'],
  ['scale', 'Litige et procédure', 'Expertise judiciaire ou amiable, opposable devant le juge.'],
  ['users', 'Succession et partage', 'Une valeur neutre, acceptée par tous les héritiers.'],
  ['chart', 'Bilan et réévaluation', 'Immobilisations au juste prix dans vos comptes.'],
  ['shield', 'Assurance', 'Valeur à assurer et évaluation après sinistre.'],
];

const FAQ = [
  ['Combien coûte une expertise ?', 'Les honoraires dépendent du type de bien, de sa surface et de l\'objet de l\'expertise. Vous recevez un devis gratuit et détaillé sous 48 h, avant tout engagement.'],
  ['Quels documents faut-il fournir ?', 'Idéalement le titre foncier ou l\'acte de propriété, les plans, le permis de construire et, pour un bien loué, les baux en cours. Nous vous envoyons la liste exacte avec le devis.'],
  ['Le rapport est-il accepté par les banques ?', 'Oui. Le rapport est établi et signé par un expert évaluateur près la Cour d\'appel, selon des méthodes reconnues. Il est utilisé pour les garanties bancaires, les actes notariés et les procédures.'],
  ['Intervenez-vous en dehors de Libreville ?', 'Oui, à Akanda, Owendo et Ntoum, et dans tout le Gabon sur demande. Les frais de déplacement sont indiqués dans le devis.'],
  ['Combien de temps faut-il ?', 'Comptez en général 10 jours ouvrés entre la visite et la remise du rapport pour un bien d\'habitation. Les missions plus importantes font l\'objet d\'un calendrier convenu ensemble.'],
];

const BIENS = [
  ['villa', 'Villa ou maison', 'Habitation individuelle'], ['appart', 'Appartement', 'En immeuble'], ['immeuble', 'Immeuble', 'De rapport ou mixte'],
  ['terrain', 'Terrain', 'Nu ou viabilisé'], ['pro', 'Bureaux, commerce', 'Locaux professionnels'], ['entreprise', 'Entreprise, actifs', 'Titres, immobilisations'],
];
const OBJETS = ['Garantie bancaire', 'Vente / achat', 'Succession, partage', 'Procédure judiciaire', 'Bilan comptable', 'Assurance', 'Autre'];
const DOCS = ['Titre foncier', 'Acte de vente', 'Plans', 'Permis de construire', 'Baux en cours'];
const ZONES = ['Libreville', 'Akanda', 'Owendo', 'Ntoum', 'Port-Gentil', 'Franceville', 'Tout le Gabon sur demande'];

// Galerie : types de biens évalués par le cabinet
const GAL = [
  [PH.villa, 'Villas avec piscine'], [PH.resid, 'Immeubles d\'habitation'], [PH.terrain, 'Terrains et parcelles'], [PH.bur, 'Bureaux et plateaux'],
  [PH.villa2, 'Maisons individuelles'], [PH.salon, 'Intérieurs et finitions'], [PH.resid3, 'Immeubles de rapport'], [PH.tours, 'Immobilier d\'entreprise'],
  [PH.villa3, 'Résidences haut de gamme'], [PH.cuisine, 'Appartements'], [PH.villa4, 'Villas contemporaines'], [PH.bur2, 'Locaux professionnels'],
];

module.exports = { AG, PH, SERV, CAS, FAQ, BIENS, OBJETS, DOCS, ZONES, GAL };
