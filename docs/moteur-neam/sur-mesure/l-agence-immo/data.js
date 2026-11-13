// L'Agence Immo (Libreville) : contenu du site sur mesure.
// Infos réelles (Le Pratique du Gabon, annuaires, Facebook, TikTok @lagence.immo) : « Vous accompagner dans vos démarches immobilières » ;
// centre-ville, immeuble Akirémy, face au village artisanal, BP 5768 Libreville ; 074 09 18 82 ; lagence.immo.contact@gmail.com ;
// annonces publiées : box commercial à Owendo SNI (juste après la gare). Les autres biens sont des exemples. À confirmer : biens, honoraires, horaires.
const WI = {
  slug: 'l-agence-immo', name: 'L\'Agence Immo', boss: '',
  tel: '074 09 18 82', wa: '24174091882', mail: 'lagence.immo.contact@gmail.com', dom: 'lagenceimmo.ga',
  addr: 'Centre-ville, immeuble Akirémy, face au village artisanal', bp: 'BP 5768 Libreville', city: 'Libreville', mapq: 'Village+artisanal,+Libreville,+Gabon',
  hours: [['Lundi – vendredi', '8 h 30 – 17 h 30'], ['Samedi', '9 h – 13 h (visites sur rendez-vous)'], ['Dimanche', 'Fermé']],
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
const QUARTIERS = ['Centre-ville', 'Owendo', 'Louis', 'Glass', 'Nzeng-Ayong', 'Angondjé', 'Akanda', 'Batterie IV'];
const B = (o) => o;
const BIENS = [
  B({ ref: 'AI-101', tr: 'location', type: 'Local commercial', t: 'Box commercial, Owendo SNI', q: 'Owendo', prix: 250000, m2: 30, ch: 0, sdb: 1, meuble: false, atouts: ['Juste après la gare', 'Passage', 'Prêt à exploiter'], ph: [PH.bur1, PH.bur3] }),
  B({ ref: 'AI-102', tr: 'location', type: 'Appartement', t: 'F3 lumineux en résidence', q: 'Louis', prix: 550000, m2: 90, ch: 2, sdb: 2, meuble: false, atouts: ['Résidence sécurisée', 'Climatisation', 'Parking'], ph: [PH.s4, PH.res3, PH.cui2] }),
  B({ ref: 'AI-103', tr: 'location', type: 'Studio', t: 'Studio meublé au centre-ville', q: 'Centre-ville', prix: 250000, m2: 32, ch: 1, sdb: 1, meuble: true, atouts: ['Meublé', 'Proche commerces', 'Eau chaude'], ph: [PH.s7, PH.cui1] }),
  B({ ref: 'AI-104', tr: 'location', type: 'Villa', t: 'Villa 4 chambres avec jardin', q: 'Angondjé', prix: 1000000, m2: 260, ch: 4, sdb: 3, meuble: false, atouts: ['Jardin', 'Forage', 'Loge gardien'], ph: [PH.villa2, PH.s3, PH.cui1] }),
  B({ ref: 'AI-105', tr: 'location', type: 'Bureaux', t: 'Plateau de bureaux 150 m²', q: 'Centre-ville', prix: 1300000, m2: 150, ch: 0, sdb: 2, meuble: false, atouts: ['Climatisation', 'Fibre', 'Parking'], ph: [PH.bur2, PH.bur3] }),
  B({ ref: 'AI-106', tr: 'location', type: 'Appartement', t: 'F4 familial', q: 'Nzeng-Ayong', prix: 450000, m2: 110, ch: 3, sdb: 2, meuble: false, atouts: ['Balcon', 'Cuisine équipée'], ph: [PH.s5, PH.res2] }),
  B({ ref: 'AI-201', tr: 'vente', type: 'Villa', t: 'Villa contemporaine 4 chambres', q: 'Akanda', prix: 220000000, m2: 340, ch: 4, sdb: 4, meuble: false, atouts: ['Piscine', 'Titre foncier', 'Quartier calme'], ph: [PH.villaBlanche, PH.s8, PH.s10] }),
  B({ ref: 'AI-202', tr: 'vente', type: 'Terrain', t: 'Terrain titré 600 m²', q: 'Akanda', prix: 25000000, m2: 600, ch: 0, sdb: 0, meuble: false, atouts: ['Titre foncier', 'Accès goudronné'], ph: [PH.terrain] }),
  B({ ref: 'AI-203', tr: 'vente', type: 'Appartement', t: 'F3 en résidence neuve', q: 'Batterie IV', prix: 75000000, m2: 95, ch: 2, sdb: 2, meuble: false, atouts: ['Neuf', 'Ascenseur', 'Parking'], ph: [PH.res1, PH.s9, PH.cui2] }),
];
const SERVICES = [
  ['location', 'Location', 'Appartements, villas, bureaux et locaux commerciaux : visites organisées rapidement.'],
  ['gestion', 'Gestion locative', 'Locataires, loyers, entretien : nous gérons votre bien à votre place.'],
  ['vente', 'Vente & achat', 'Estimation, mise en valeur et accompagnement jusqu\'au notaire.'],
  ['commerce', 'Locaux commerciaux', 'Box, boutiques et bureaux pour lancer ou développer votre activité.'],
  ['conseil', 'Conseil & démarches', 'Bail, état des lieux, documents : nous vous accompagnons dans vos démarches.'],
];
const DOSSIER = [
  ['Pièce d\'identité ou passeport', true], ['Trois derniers bulletins de salaire', true], ['Contrat de travail ou attestation employeur', true],
  ['Registre de commerce (locaux professionnels)', false], ['Lettre d\'engagement de l\'employeur (expatriés)', false], ['Garant : pièce d\'identité et justificatifs', false],
];
const AVIS = [
  ['Cynthia', 'Box commercial à Owendo', 'Annonce vue sur TikTok, visite le lendemain et signature dans la semaine. Équipe très réactive.'],
  ['Romuald', 'Appartement à Louis', 'Ils m\'ont accompagné pour le bail et l\'état des lieux. Tout était clair, sans mauvaise surprise.'],
  ['Sandra', 'Propriétaire', 'L\'agence gère mon appartement depuis un an : loyers versés à temps et locataires sérieux.'],
];
module.exports = { WI, PH, QUARTIERS, BIENS, SERVICES, DOSSIER, AVIS };
