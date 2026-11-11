// Fattal Travel & Tourism (Libreville) : contenu du site sur mesure.
// Infos réelles (Le Pratique du Gabon, Facebook FTTGabon, Instagram ftt_gabon, annuaires) : « Faire l'expérience du monde ! » ;
// billets d'avion, visas, réservations d'hôtel, location de voitures, assurance voyage ; 140 rue Bretonnet, centre-ville, à côté de Casino, BP 10868 ;
// 011 74 72 40, 062 94 00 94, 062 99 99 98 ; iman@fattaltravel.world, info@fattaltravel.world ; dirigée par Iman FATTAL ; note Google 4,8.
// Prix « à partir de » et exigences de visa : indicatifs, à vérifier par l'agence avant toute publication.
const P = '../../assets/photos/';

const FT = {
  slug: 'fattal-travel-et-tourism', name: 'Fattal Travel & Tourism', short: 'Fattal', slogan: 'Faire l\'expérience du monde !',
  tel: '062 94 00 94', tel2: '062 99 99 98', fixe: '011 74 72 40', wa: '24162940094', mail: 'info@fattaltravel.world', mail2: 'iman@fattaltravel.world',
  addr: '140 rue Bretonnet, centre-ville (à côté de Casino)', bp: 'BP 10868 Libreville', city: 'Libreville', mapq: 'Rue+Bretonnet,+Libreville,+Gabon',
  hours: [['Lundi – vendredi', '8 h 30 – 18 h'], ['Samedi', '9 h – 13 h'], ['Dimanche', 'Fermé (WhatsApp)']],
  rating: 4.8, soc: ['facebook', 'instagram'],
};

const PH = {
  hero: P + 'voyage-1436491865332-7a61a109cc05.jpg', passeport: P + 'x-passeport-1.jpg', agent: P + 'x-bureau-n-1.jpg', voyageuse: P + 'luxe-1696962678565.jpg',
  hotel: P + 'hotel-1571896349842-33c89424de2d.jpg', voiture: P + 'x-citadine-2.jpg', plage: P + 'x-gabon-4.jpg',
};

// Destinations au départ de Libreville : id, nom, pays, thèmes, prix A/R éco « à partir de » (FCFA), durée de vol indicative, visa (code), photos, accroche
const DEST = [
  { id: 'paris', n: 'Paris', pays: 'France', th: ['ville', 'affaires', 'etudes'], prix: 650000, vol: '≈ 7 h direct', visa: 'schengen', ph: [P + 'x-paris-1.jpg', P + 'x-paris-2.jpg'], d: 'Études, affaires, famille ou shopping : la destination la plus demandée au départ de Libreville.' },
  { id: 'dubai', n: 'Dubaï', pays: 'Émirats arabes unis', th: ['ville', 'shopping', 'affaires'], prix: 580000, vol: '≈ 11 h avec escale', visa: 'eau', ph: [P + 'x-dubai-1.jpg', P + 'x-dubai-2.jpg'], d: 'Shopping, désert et gratte-ciel : séjours clés en main, visa traité par l\'agence.' },
  { id: 'istanbul', n: 'Istanbul', pays: 'Turquie', th: ['ville', 'shopping'], prix: 520000, vol: '≈ 9 h avec escale', visa: 'profil', ph: [P + 'x-istanbul-1.jpg', P + 'x-istanbul-2.jpg'], d: 'Bazars, mosquées et Bosphore : idéal pour un premier grand voyage ou les achats professionnels.' },
  { id: 'marrakech', n: 'Marrakech', pays: 'Maroc', th: ['ville', 'famille', 'etudes'], prix: 480000, vol: '≈ 6 h via Casablanca', visa: 'maroc', ph: [P + 'x-marrakech-1.jpg', P + 'x-marrakech-2.jpg'], d: 'Médina, riads et douceur de vivre, à quelques heures de Libreville.' },
  { id: 'dakar', n: 'Dakar', pays: 'Sénégal', th: ['ville', 'affaires', 'plage'], prix: 420000, vol: '≈ 5 h avec escale', visa: 'profil', ph: [P + 'x-dakar-1.jpg', P + 'x-dakar-2.jpg'], d: 'Affaires, culture et plages de la Petite-Côte : la porte de l\'Afrique de l\'Ouest.' },
  { id: 'le-cap', n: 'Le Cap', pays: 'Afrique du Sud', th: ['nature', 'famille'], prix: 620000, vol: '≈ 8 h avec escale', visa: 'profil', ph: [P + 'x-cape-town-1.jpg', P + 'x-cape-town-2.jpg'], d: 'Montagne de la Table, vignobles et route des Jardins : un voyage spectaculaire.' },
  { id: 'zanzibar', n: 'Zanzibar', pays: 'Tanzanie', th: ['plage', 'famille'], prix: 650000, vol: '≈ 9 h avec escale', visa: 'profil', ph: [P + 'x-zanzibar-1.jpg', P + 'x-zanzibar-2.jpg'], d: 'Plages de sable blanc et ruelles de Stone Town, pour une lune de miel ou des vacances.' },
  { id: 'maurice', n: 'Île Maurice', pays: 'Maurice', th: ['plage', 'famille'], prix: 750000, vol: '≈ 10 h avec escale', visa: 'profil', ph: [P + 'x-maurice-1.jpg', P + 'x-maurice-2.jpg'], d: 'Lagons turquoise et hôtels tout compris : le séjour balnéaire par excellence.' },
];
const THEMES = [['tout', 'Toutes'], ['ville', 'Villes'], ['plage', 'Plage'], ['affaires', 'Affaires'], ['etudes', 'Études'], ['shopping', 'Shopping'], ['famille', 'Famille'], ['nature', 'Nature']];

// Guide visa : documents usuels par type de demande (indicatif, vérifié par l'agence avant tout dépôt)
const VISAS = {
  schengen: { t: 'Visa Schengen (France et espace Schengen)', delai: '15 jours à 6 semaines selon la période', rdv: 'Rendez-vous au centre de dépôt, prise d\'empreintes', docs: ['Passeport valide 3 mois après le retour, avec 2 pages vierges', 'Formulaire de demande rempli et signé', '2 photos d\'identité récentes aux normes', 'Réservation de vol aller-retour', 'Justificatif d\'hébergement (hôtel ou attestation d\'accueil)', 'Assurance voyage couvrant 30 000 € minimum', 'Trois derniers relevés bancaires', 'Attestation de travail, congé ou inscription scolaire', 'Frais de visa'] },
  eau: { t: 'Visa Émirats arabes unis (Dubaï)', delai: '3 à 7 jours ouvrés', rdv: 'Demande en ligne traitée par l\'agence', docs: ['Passeport valide 6 mois, scan couleur', 'Photo d\'identité sur fond blanc', 'Billet d\'avion aller-retour', 'Réservation d\'hôtel', 'Copie de la pièce d\'identité nationale'] },
  maroc: { t: 'Maroc', delai: 'Pas de visa pour un court séjour (à vérifier selon votre situation)', rdv: 'Formalités à l\'arrivée', docs: ['Passeport valide 6 mois', 'Billet d\'avion aller-retour', 'Réservation d\'hôtel ou adresse d\'accueil', 'Assurance voyage recommandée'] },
  profil: { t: 'Selon votre profil et la destination', delai: 'Nous vérifions pour vous sous 24 h', rdv: 'Visa électronique, à l\'arrivée ou consulaire selon le pays', docs: ['Passeport valide 6 mois avec pages vierges', 'Photo d\'identité récente', 'Billet d\'avion aller-retour', 'Réservation d\'hôtel', 'Carnet de vaccination (fièvre jaune) à jour', 'Assurance voyage'] },
};
const VISA_LABEL = { schengen: 'Visa consulaire', eau: 'e-Visa via l\'agence', maroc: 'Sans visa (court séjour)', profil: 'Selon profil' };

const SERVICES = [
  ['billets', 'Billets d\'avion', 'Toutes compagnies, toutes destinations : nous comparons pour vous les meilleurs tarifs et horaires.', 'plane'],
  ['visas', 'Visas', 'Constitution du dossier, prise de rendez-vous, suivi : vos demandes de visa entre de bonnes mains.', 'doc'],
  ['hotels', 'Réservations d\'hôtel', 'Hôtels sélectionnés selon votre budget, du séjour d\'affaires au tout compris en famille.', 'bed'],
  ['voitures', 'Location de voitures', 'Un véhicule qui vous attend à l\'arrivée, avec ou sans chauffeur.', 'car'],
  ['assurance', 'Assurance voyage', 'Frais médicaux, rapatriement, bagages : partez couvert, attestation remise pour le visa.', 'shield'],
  ['groupes', 'Groupes & entreprises', 'Délégations, séminaires, pèlerinages et voyages scolaires : un interlocuteur unique.', 'users'],
];

const AVIS = [
  ['Yannick', 'Billet Libreville – Paris', 'Billet trouvé moins cher que ce que j\'avais vu en ligne, avec un horaire bien meilleur. Accueil très professionnel.'],
  ['Sandrine', 'Séjour en famille à Dubaï', 'Visa, hôtel, transferts : tout était prêt. Les enfants ont adoré et nous n\'avons eu à nous occuper de rien.'],
  ['Arnaud', 'Voyages d\'affaires', 'Notre société passe par Fattal pour tous ses déplacements. Réactifs même le samedi sur WhatsApp.'],
];

module.exports = { FT, PH, DEST, THEMES, VISAS, VISA_LABEL, SERVICES, AVIS };
