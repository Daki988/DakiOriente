// Wanted Immobilier : contenu du site.
// Infos réelles (Le Pratique du Gabon, Facebook, LinkedIn, ancien site wantedimmobilier.com) : agence de Port-Gentil, « La clé de votre logement » ;
// location, gestion, vente, syndic, agencement ; Carrefour des Douanes, BP 1503 Port-Gentil ; 066 62 25 00 ; gérée par Virginie LEPOIVRE.
// Logo réel (clé dont la lame dessine une ville) redessiné. Les annonces ci-dessous sont des exemples à remplacer par le vrai portefeuille.
// À confirmer : biens, prix, honoraires, horaires, e-mail.
const WI = {
  slug: 'wanted-immobilier', name: 'Wanted Immobilier', boss: 'Virginie LEPOIVRE',
  tel: '066 62 25 00', wa: '24166622500', mail: 'contact@wantedimmobilier.com', dom: 'wantedimmobilier.com',
  addr: 'Carrefour des Douanes', bp: 'BP 1503 Port-Gentil', city: 'Port-Gentil', mapq: 'Carrefour+des+Douanes,+Port-Gentil,+Gabon',
  hours: [['Lundi – vendredi', '8 h 30 – 17 h 30'], ['Samedi', '9 h – 12 h (sur rendez-vous)'], ['Dimanche', 'Fermé']],
};
const I = (f) => '../../assets/photos/' + f;
const PH = {
  villa: I('immo-1512917774080-9991f1c4c750.jpg'), villa2: I('immo-1564013799919-ab600027ffc6.jpg'), villaNuit: I('immo-1600585154340-be6161a56a0c.jpg'), villaBlanche: I('immo-1600596542815-ffad4c1539a9.jpg'),
  cles: I('immo-1560518883-ce09059eeffa.jpg'), s1: I('immo-1583847268964-b28dc8f51f92.jpg'), s2: I('immo-1593696140826-c58b021acf8b.jpg'), s3: I('immo-1600607687939-ce8a6c25118c.jpg'),
  s4: I('immo-1616137422495-1e9e46e2aa77.jpg'), s5: I('immo-1638972691611-69633a3d3127.jpg'), s6: I('immo-1656646424956-cd6e88b678bc.jpg'), s7: I('immo-1721613885025-e337f77e948b.jpg'),
  s8: I('immo-1758448755952-42b404bc6f39.jpg'), s9: I('immo-1758565811176-ccd94357a844.jpg'), s10: I('immo-1774199496664-a9690967be5a.jpg'),
  res1: I('x-residence-1.jpg'), res2: I('x-residence-2.jpg'), res3: I('x-residence-3.jpg'), bur1: I('x-bureaux-1.jpg'), bur2: I('x-bureaux-2.jpg'), bur3: I('x-bureaux-3.jpg'),
  terrain: I('x-terrain-1.jpg'), cui1: I('x-cuisine-appart-1.jpg'), cui2: I('x-cuisine-appart-2.jpg'), main: I('x-main-n-1.jpg'),
};
const QUARTIERS = ['Centre-ville', 'Bord de mer', 'Balise', 'Château', 'Grand Village', 'Quartier Sud', 'Ntchengue', 'Matanda'];
// Biens : ref, transaction (location / vente), type, titre, quartier, prix FCFA (par mois si location), surface m², chambres, sdb, meublé, atouts, photos
const B = (o) => o;
const BIENS = [
  B({ ref: 'WI-101', tr: 'location', type: 'Villa', t: 'Villa 4 chambres avec piscine', q: 'Bord de mer', prix: 1800000, m2: 320, ch: 4, sdb: 3, meuble: false, atouts: ['Piscine', 'Groupe électrogène', 'Gardiennage', 'Jardin'], ph: [PH.villa, PH.s3, PH.cui1] }),
  B({ ref: 'WI-102', tr: 'location', type: 'Appartement', t: 'F3 meublé avec vue', q: 'Centre-ville', prix: 750000, m2: 95, ch: 2, sdb: 2, meuble: true, atouts: ['Meublé', 'Climatisation', 'Parking', 'Ascenseur'], ph: [PH.s4, PH.cui2, PH.res3] }),
  B({ ref: 'WI-103', tr: 'location', type: 'Appartement', t: 'Studio meublé tout équipé', q: 'Balise', prix: 300000, m2: 38, ch: 1, sdb: 1, meuble: true, atouts: ['Meublé', 'Internet', 'Eau chaude'], ph: [PH.s7, PH.cui2] }),
  B({ ref: 'WI-104', tr: 'location', type: 'Duplex', t: 'Duplex 3 chambres en résidence', q: 'Château', prix: 1200000, m2: 180, ch: 3, sdb: 3, meuble: false, atouts: ['Résidence sécurisée', 'Terrasse', 'Parking 2 places'], ph: [PH.s2, PH.res1, PH.s9] }),
  B({ ref: 'WI-105', tr: 'location', type: 'Bureaux', t: 'Plateau de bureaux 220 m²', q: 'Centre-ville', prix: 1500000, m2: 220, ch: 0, sdb: 2, meuble: false, atouts: ['Climatisation', 'Fibre', 'Salle de réunion', 'Parking'], ph: [PH.bur2, PH.bur3, PH.bur1] }),
  B({ ref: 'WI-106', tr: 'location', type: 'Appartement', t: 'F4 familial lumineux', q: 'Grand Village', prix: 650000, m2: 120, ch: 3, sdb: 2, meuble: false, atouts: ['Balcon', 'Cuisine équipée', 'Parking'], ph: [PH.s5, PH.res2, PH.cui1] }),
  B({ ref: 'WI-201', tr: 'vente', type: 'Villa', t: 'Villa contemporaine 5 chambres', q: 'Bord de mer', prix: 280000000, m2: 410, ch: 5, sdb: 4, meuble: false, atouts: ['Piscine', 'Titre foncier', 'Vue mer', 'Dépendance'], ph: [PH.villaBlanche, PH.s8, PH.s10] }),
  B({ ref: 'WI-202', tr: 'vente', type: 'Villa', t: 'Villa 3 chambres avec jardin', q: 'Quartier Sud', prix: 95000000, m2: 200, ch: 3, sdb: 2, meuble: false, atouts: ['Titre foncier', 'Jardin', 'Forage'], ph: [PH.villa2, PH.s1, PH.s6] }),
  B({ ref: 'WI-203', tr: 'vente', type: 'Terrain', t: 'Terrain 600 m² viabilisé', q: 'Ntchengue', prix: 30000000, m2: 600, ch: 0, sdb: 0, meuble: false, atouts: ['Titre foncier', 'Viabilisé', 'Accès goudronné'], ph: [PH.terrain] }),
  B({ ref: 'WI-204', tr: 'vente', type: 'Appartement', t: 'F3 en résidence neuve', q: 'Matanda', prix: 65000000, m2: 90, ch: 2, sdb: 2, meuble: false, atouts: ['Neuf', 'Ascenseur', 'Parking'], ph: [PH.res3, PH.s9, PH.cui2] }),
];
const SERVICES = [
  ['location', 'Location', 'Villas, appartements et bureaux : nous trouvons le bien qui vous correspond et organisons les visites.'],
  ['gestion', 'Gestion locative', 'Loyers, états des lieux, entretien, relations avec les locataires : nous gérons votre bien pour vous.'],
  ['vente', 'Vente', 'Estimation, mise en valeur, visites et accompagnement jusqu\'à la signature chez le notaire.'],
  ['syndic', 'Syndic', 'Gestion des parties communes, charges et assemblées pour les résidences et immeubles.'],
  ['agencement', 'Agencement', 'Rafraîchissement, ameublement et aménagement pour louer plus vite et mieux.'],
];
const DOSSIER = [
  ['Pièce d\'identité ou passeport', true], ['Trois derniers bulletins de salaire', true], ['Contrat de travail ou attestation employeur', true],
  ['Avis d\'imposition ou bilan (indépendants)', false], ['Lettre d\'engagement de l\'employeur (expatriés)', false], ['Garant : pièce d\'identité et justificatifs', false],
];
const AVIS = [
  ['Patrick', 'Locataire, villa Bord de mer', 'Arrivé à Port-Gentil pour une mission, j\'ai visité trois villas en une matinée et signé dans la semaine. Équipe réactive.'],
  ['Marie-Claire', 'Propriétaire, deux appartements', 'Je vis à Libreville : Wanted gère mes appartements de A à Z et je reçois mes loyers chaque mois sans souci.'],
  ['Ibrahim', 'Bureaux, centre-ville', 'Ils ont trouvé nos bureaux et géré l\'agencement avant notre arrivée. Un vrai gain de temps.'],
];
module.exports = { WI, PH, QUARTIERS, BIENS, SERVICES, DOSSIER, AVIS };
