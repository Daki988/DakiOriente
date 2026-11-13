// Yeshua Real Estate : contenu du site sur mesure.
// Infos réelles (yeshuarealestate.com) : société immobilière spécialisée dans l'intermédiation, la gestion, la promotion et la commercialisation
// de biens au Gabon ; maisons, terrains et séjours meublés ; Studios Jumeaux HOPE & OKIMIE à Akanda (« le confort d'un appartement, le service d'un hôtel ») ;
// terrains publiés : Bolokobouet 30 M, « Marseille 2 » 870 M, 1er Campement 13 M, Cocobeach Mengala 10 M et 5 M, promo 2,5 M FCFA ;
// mission « démocratiser le luxe immobilier » ; info@yeshuarealestate.com, +241 062 00 61 62 ; 074 43 58 58 ; dirigée par Joseph MANY BARLA.
// Les biens YRE-1xx (location) et YRE-207/208 sont des exemples. Prix des studios, surfaces et horaires : à confirmer.
const WI = {
  slug: 'yeshua-real-estate', name: 'Yeshua Real Estate', boss: 'Joseph MANY BARLA',
  tel: '062 00 61 62', tel2: '074 43 58 58', tel3: '074 43 58 58', wa: '24162006162', mail: 'info@yeshuarealestate.com', dom: 'yeshuarealestate.com',
  addr: 'Akanda, Grand Libreville', bp: 'Gabon', city: 'Libreville', mapq: 'Akanda,+Gabon',
  hours: [['Lundi – vendredi', '8 h 30 – 17 h 30'], ['Samedi', 'Visites sur rendez-vous'], ['Studios', 'Arrivées 7 j/7']],
};
const I = (f) => '../../assets/photos/' + f;
const PH = {
  villa: I('immo-1512917774080-9991f1c4c750.jpg'), villa2: I('immo-1564013799919-ab600027ffc6.jpg'), villaNuit: I('immo-1600585154340-be6161a56a0c.jpg'), villaBlanche: I('immo-1600596542815-ffad4c1539a9.jpg'),
  cles: I('immo-1560518883-ce09059eeffa.jpg'), s1: I('immo-1583847268964-b28dc8f51f92.jpg'), s2: I('immo-1593696140826-c58b021acf8b.jpg'), s3: I('immo-1600607687939-ce8a6c25118c.jpg'),
  s4: I('immo-1616137422495-1e9e46e2aa77.jpg'), s5: I('immo-1638972691611-69633a3d3127.jpg'), s6: I('immo-1656646424956-cd6e88b678bc.jpg'), s7: I('immo-1721613885025-e337f77e948b.jpg'),
  s8: I('immo-1758448755952-42b404bc6f39.jpg'), s9: I('immo-1758565811176-ccd94357a844.jpg'), s10: I('immo-1774199496664-a9690967be5a.jpg'),
  res1: I('x-residence-1.jpg'), res2: I('x-residence-2.jpg'), res3: I('x-residence-3.jpg'), bur1: I('x-bureaux-1.jpg'), bur2: I('x-bureaux-2.jpg'), bur3: I('x-bureaux-3.jpg'),
  terrain: I('x-terrain-1.jpg'), cui1: I('x-cuisine-appart-1.jpg'), cui2: I('x-cuisine-appart-2.jpg'), main: I('x-main-n-1.jpg'), plans: I('x-plans-1.jpg'),
  studio1: I('x-suite-2.jpg'), studio2: I('hotel-1613553474179-e1eda3ea5734.jpg'), geometre: I('x-geometre-1.jpg'), expert: I('x-expert-chantier-1.jpg'),
};
const QUARTIERS = ['Akanda', 'Angondjé', 'Bolokobouet', 'Premier Campement', 'Marseille 2', 'Cocobeach (Mengala)', 'Sablière', 'Owendo'];
const B = (o) => o;
const BIENS = [
  B({ ref: 'YRE-201', tr: 'vente', type: 'Terrain', t: 'Terrain à Bolokobouet', q: 'Bolokobouet', prix: 30000000, m2: 0, ch: 0, sdb: 0, meuble: false, atouts: ['Accès route', 'Zone en développement'], ph: [PH.terrain] }),
  B({ ref: 'YRE-202', tr: 'vente', type: 'Terrain', t: 'Grand terrain à Marseille 2', q: 'Marseille 2', prix: 870000000, m2: 0, ch: 0, sdb: 0, meuble: false, atouts: ['Grande surface', 'Projet de promotion', 'Emplacement stratégique'], ph: [PH.geometre, PH.terrain] }),
  B({ ref: 'YRE-203', tr: 'vente', type: 'Terrain', t: 'Terrain au 1er Campement', q: 'Premier Campement', prix: 13000000, m2: 0, ch: 0, sdb: 0, meuble: false, atouts: ['Quartier habité', 'Idéal maison familiale'], ph: [PH.terrain] }),
  B({ ref: 'YRE-204', tr: 'vente', type: 'Terrain', t: 'Terrain à Cocobeach, Mengala', q: 'Cocobeach (Mengala)', prix: 10000000, m2: 0, ch: 0, sdb: 0, meuble: false, atouts: ['Bord de mer à proximité', 'Résidence secondaire'], ph: [PH.terrain] }),
  B({ ref: 'YRE-205', tr: 'vente', type: 'Terrain', t: 'Terrain à Cocobeach, Mengala', q: 'Cocobeach (Mengala)', prix: 5000000, m2: 0, ch: 0, sdb: 0, meuble: false, atouts: ['Petit budget', 'Investissement'], ph: [PH.terrain] }),
  B({ ref: 'YRE-206', tr: 'vente', type: 'Terrain', t: 'Terrain, promotion spéciale', q: 'Cocobeach (Mengala)', prix: 2500000, m2: 0, ch: 0, sdb: 0, meuble: false, atouts: ['Prix promotionnel', 'Premier investissement'], ph: [PH.terrain] }),
  B({ ref: 'YRE-207', tr: 'vente', type: 'Villa', t: 'Villa 4 chambres avec jardin', q: 'Angondjé', prix: 180000000, m2: 300, ch: 4, sdb: 3, meuble: false, atouts: ['Titre foncier', 'Jardin', 'Forage'], ph: [PH.villa2, PH.s1, PH.cui1] }),
  B({ ref: 'YRE-208', tr: 'vente', type: 'Maison', t: 'Maison familiale 3 chambres', q: 'Akanda', prix: 85000000, m2: 180, ch: 3, sdb: 2, meuble: false, atouts: ['Quartier calme', 'Parking'], ph: [PH.s9, PH.s5, PH.cui2] }),
  B({ ref: 'YRE-101', tr: 'location', type: 'Maison', t: 'Maison 3 chambres à Akanda', q: 'Akanda', prix: 600000, m2: 160, ch: 3, sdb: 2, meuble: false, atouts: ['Cour', 'Forage', 'Gardiennage'], ph: [PH.s2, PH.res1, PH.cui1] }),
  B({ ref: 'YRE-102', tr: 'location', type: 'Appartement', t: 'Appartement 2 chambres', q: 'Angondjé', prix: 400000, m2: 85, ch: 2, sdb: 2, meuble: false, atouts: ['Résidence', 'Climatisation', 'Parking'], ph: [PH.s4, PH.res3] }),
  B({ ref: 'YRE-103', tr: 'location', type: 'Villa', t: 'Villa contemporaine meublée', q: 'Sablière', prix: 1200000, m2: 280, ch: 4, sdb: 4, meuble: true, atouts: ['Meublée', 'Piscine', 'Groupe électrogène'], ph: [PH.villaBlanche, PH.s8, PH.s3] }),
];
const SERVICES = [
  ['vente', 'Intermédiation & commercialisation', 'Nous mettons en relation vendeurs et acheteurs pour des transactions sécurisées et transparentes.'],
  ['gestion', 'Gestion & valorisation', 'Nous gérons vos biens pour préserver et augmenter la valeur de votre patrimoine, avec un suivi personnalisé.'],
  ['promotion', 'Promotion & développement', 'Nous développons des projets immobiliers sur des emplacements stratégiques, à fort potentiel.'],
  ['studios', 'Séjours meublés', 'Les Studios Jumeaux HOPE & OKIMIE, deux studios haut de gamme pour des séjours courts à Akanda.'],
  ['location', 'Location', 'Maisons et appartements sélectionnés, visites organisées rapidement.'],
];
// Guide de l'acheteur : vérifications avant d'acheter un terrain ou une maison
const DOSSIER = [
  ['Titre foncier vérifié au cadastre (ou procédure en cours)', true], ['Identité du vendeur et pouvoir de vendre', true], ['Plan de situation et bornage contradictoire', true],
  ['Absence de litige ou d\'occupation du terrain', true], ['Accès, eau et électricité à proximité', false], ['Acte de vente signé devant notaire', true],
];
const AVIS = [
  ['Carmen', 'Achat d\'un terrain', 'Ils m\'ont expliqué chaque étape, du titre foncier au notaire. J\'ai acheté en toute confiance.'],
  ['Olivier', 'Séjour au studio HOPE', 'Le confort d\'un appartement, le service d\'un hôtel : c\'est exactement ça. Propre, calme, bien équipé.'],
  ['Prisca', 'Gestion de ma maison', 'Je vis à l\'étranger : Yeshua s\'occupe de ma maison et des locataires, avec des comptes rendus réguliers.'],
];
const STUDIOS = [
  { id: 'hope', n: 'Studio HOPE', d: 'Studio meublé haut de gamme : lit queen, coin salon, cuisine équipée, salle de douche.', prix: 35000, ph: [PH.studio1, PH.cui2] },
  { id: 'okimie', n: 'Studio OKIMIE', d: 'Le jumeau de HOPE, même confort, même service : idéal pour un couple ou un voyageur d\'affaires.', prix: 35000, ph: [PH.studio2, PH.cui1] },
];
module.exports = { WI, PH, QUARTIERS, BIENS, SERVICES, DOSSIER, AVIS, STUDIOS };
