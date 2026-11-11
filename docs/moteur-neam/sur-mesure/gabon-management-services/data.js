// Gabon Management Services (GMS) : contenu du site.
// Infos réelles (gabonmanagementservices.ga, Le Pratique du Gabon, Facebook, LinkedIn, Instagram) : agence immobilière à Libreville depuis 2018,
// « L'excellence immobilière à votre service » ; Station Engen Likouala, BP 3083 ; 074 00 78 50 / 062 19 11 67 / 066 33 65 29 ;
// 11 expertises ; dirigée par Jean-Robert NGUANGA. Les annonces GMS-101 à GMS-201 reprennent des biens publiés par l'agence (photos d'illustration).
// À confirmer : biens disponibles, surfaces, honoraires, horaires.
const WI = {
  slug: 'gabon-management-services', name: 'Gabon Management Services', boss: 'Jean-Robert NGUANGA',
  tel: '074 00 78 50', tel2: '062 19 11 67', tel3: '066 33 65 29', wa: '24174007850', mail: 'gabonmanagementservices@hotmail.com', dom: 'gabonmanagementservices.ga',
  addr: 'Station Engen Likouala', bp: 'BP 3083 Libreville', city: 'Libreville', mapq: 'Likouala,+Libreville,+Gabon',
  hours: [['Lundi – vendredi', '8 h – 17 h 30'], ['Samedi', '9 h – 13 h (visites sur rendez-vous)'], ['Dimanche', 'Fermé']],
};
const I = (f) => '../../assets/photos/' + f;
const PH = {
  villa: I('immo-1512917774080-9991f1c4c750.jpg'), villa2: I('immo-1564013799919-ab600027ffc6.jpg'), villaNuit: I('immo-1600585154340-be6161a56a0c.jpg'), villaBlanche: I('immo-1600596542815-ffad4c1539a9.jpg'),
  cles: I('immo-1560518883-ce09059eeffa.jpg'), s1: I('immo-1583847268964-b28dc8f51f92.jpg'), s2: I('immo-1593696140826-c58b021acf8b.jpg'), s3: I('immo-1600607687939-ce8a6c25118c.jpg'),
  s4: I('immo-1616137422495-1e9e46e2aa77.jpg'), s5: I('immo-1638972691611-69633a3d3127.jpg'), s6: I('immo-1656646424956-cd6e88b678bc.jpg'), s7: I('immo-1721613885025-e337f77e948b.jpg'),
  s8: I('immo-1758448755952-42b404bc6f39.jpg'), s9: I('immo-1758565811176-ccd94357a844.jpg'), s10: I('immo-1774199496664-a9690967be5a.jpg'),
  res1: I('x-residence-1.jpg'), res2: I('x-residence-2.jpg'), res3: I('x-residence-3.jpg'), bur1: I('x-bureaux-1.jpg'), bur2: I('x-bureaux-2.jpg'), bur3: I('x-bureaux-3.jpg'),
  terrain: I('x-terrain-1.jpg'), cui1: I('x-cuisine-appart-1.jpg'), cui2: I('x-cuisine-appart-2.jpg'), main: I('x-main-n-1.jpg'), plans: I('x-plans-1.jpg'),
};
const QUARTIERS = ['Bas de Gué-Gué', 'Haut de Gué-Gué', 'Sablière', 'Angondjé', 'Akanda', 'Premier Campement', 'Batterie IV', 'Centre-ville'];
const B = (o) => o;
const BIENS = [
  B({ ref: 'GMS-101', tr: 'location', type: 'Villa', t: 'Villa duplex 3 chambres', q: 'Bas de Gué-Gué', prix: 800000, m2: 260, ch: 3, sdb: 3, meuble: false, atouts: ['Suite parentale avec dressing', '3 terrasses', 'Buanderie', 'Loge gardien', 'Quartier sécurisé'], ph: [PH.villaBlanche, PH.s8, PH.cui1] }),
  B({ ref: 'GMS-102', tr: 'location', type: 'Villa', t: 'Villa contemporaine 3 chambres', q: 'Sablière', prix: 600000, m2: 210, ch: 3, sdb: 3, meuble: false, atouts: ['Cuisine avec îlot central', 'Terrasse', 'Forage', 'Parking', 'Loge gardien'], ph: [PH.villa2, PH.s3, PH.cui2] }),
  B({ ref: 'GMS-103', tr: 'location', type: 'Appartement', t: 'Appartement 2 chambres', q: 'Angondjé', prix: 450000, m2: 95, ch: 2, sdb: 2, meuble: false, atouts: ['Résidence calme', 'Climatisation', 'Parking'], ph: [PH.s4, PH.res3, PH.cui2] }),
  B({ ref: 'GMS-104', tr: 'location', type: 'Studio', t: 'Studio lumineux à Beaulieu', q: 'Akanda', prix: 200000, m2: 35, ch: 1, sdb: 1, meuble: false, atouts: ['Idéal jeune actif', 'Eau chaude', 'Sécurisé'], ph: [PH.s7, PH.cui1] }),
  B({ ref: 'GMS-105', tr: 'location', type: 'Villa', t: 'Villa mitoyenne neuve 3 chambres', q: 'Premier Campement', prix: 600000, m2: 160, ch: 3, sdb: 2, meuble: false, atouts: ['Neuf, première main', '100 % climatisée', 'Forage', 'Cuisine équipée', 'Parking privé'], ph: [PH.s9, PH.s2, PH.res1] }),
  B({ ref: 'GMS-106', tr: 'location', type: 'Bureaux', t: 'Plateau de bureaux 180 m²', q: 'Centre-ville', prix: 1200000, m2: 180, ch: 0, sdb: 2, meuble: false, atouts: ['Climatisation', 'Fibre', 'Salle de réunion', 'Parking'], ph: [PH.bur2, PH.bur3, PH.bur1] }),
  B({ ref: 'GMS-201', tr: 'vente', type: 'Immeuble', t: 'Immeuble neuf au Haut de Gué-Gué', q: 'Haut de Gué-Gué', prix: 900000000, m2: 700, ch: 3, sdb: 2, meuble: false, atouts: ['Jamais habité', 'Finitions marbre', 'Clôturé et sécurisé', 'Parking privé'], ph: [PH.res2, PH.s10, PH.s5] }),
  B({ ref: 'GMS-202', tr: 'vente', type: 'Villa', t: 'Villa 4 chambres avec piscine', q: 'Batterie IV', prix: 320000000, m2: 380, ch: 4, sdb: 4, meuble: false, atouts: ['Piscine', 'Titre foncier', 'Groupe électrogène', 'Jardin'], ph: [PH.villa, PH.villaNuit, PH.s1] }),
  B({ ref: 'GMS-203', tr: 'vente', type: 'Terrain', t: 'Terrain titré 1 000 m²', q: 'Angondjé', prix: 45000000, m2: 1000, ch: 0, sdb: 0, meuble: false, atouts: ['Titre foncier', 'Accès goudronné', 'Zone résidentielle'], ph: [PH.terrain] }),
  B({ ref: 'GMS-204', tr: 'vente', type: 'Appartement', t: 'F3 en résidence neuve', q: 'Akanda', prix: 70000000, m2: 92, ch: 2, sdb: 2, meuble: false, atouts: ['Neuf', 'Ascenseur', 'Parking'], ph: [PH.res3, PH.s6, PH.cui2] }),
];
// Métiers mis en avant (id utilisés comme ancres de expertises.html)
const SERVICES = [
  ['location', 'Location premium', 'Villas, appartements et bureaux vérifiés, visites organisées en quelques jours.'],
  ['gestion', 'Gestion de patrimoine', 'Gestion locative 360° : locataires, loyers, entretien, reporting mensuel.'],
  ['vente', 'Vente & achat', 'Estimation, mise en valeur, négociation et accompagnement jusqu\'au notaire.'],
  ['regularisation', 'Régularisation foncière', 'Titres fonciers, bornage, dossiers administratifs : vos biens sécurisés.'],
  ['construction', 'Conception & construction', 'Plans 3D, construction et rénovation aux standards internationaux.'],
];
// Les 11 expertises publiées par l'agence
const XP = [
  ['conseil', 'Conseil', 'Stratégies immobilières sur mesure pour optimiser vos investissements.'],
  ['estimation', 'Estimation', 'Valorisation précise et réaliste de vos biens par nos experts.'],
  ['regularisation', 'Régularisation', 'Gestion administrative complète pour sécuriser vos titres fonciers.'],
  ['conception', 'Conception', 'Plans et vues 3D pour vos projets de construction.'],
  ['construction', 'Construction', 'Réalisation de vos projets avec des standards de qualité internationaux.'],
  ['refection', 'Réfection', 'Rénovation moderne pour donner une seconde vie à votre patrimoine.'],
  ['vente', 'Vente & achat', 'Propriétés d\'exception et investissements sécurisés.'],
  ['location', 'Location premium', 'Accès aux biens les plus demandés du marché.'],
  ['gestion', 'Gestion de patrimoine', 'Gestion locative 360° pour maximiser vos rendements.'],
  ['juridique', 'Juridique & fiscal', 'Accompagnement complet pour des transactions sans risque.'],
  ['international', 'Réseau international', 'Visibilité à l\'étranger pour votre bien, conseils à la diaspora.'],
];
const DOSSIER = [
  ['Pièce d\'identité ou passeport', true], ['Trois derniers bulletins de salaire', true], ['Contrat de travail ou attestation employeur', true],
  ['Avis d\'imposition ou bilan (indépendants)', false], ['Lettre d\'engagement de l\'employeur (expatriés)', false], ['Garant : pièce d\'identité et justificatifs', false],
];
const AVIS = [
  ['Carine', 'Locataire, villa à la Sablière', 'Visite le mardi, bail signé le vendredi. L\'équipe a tout organisé et la villa était impeccable à l\'entrée.'],
  ['Thierry', 'Propriétaire installé en France', 'GMS gère mes deux appartements d\'Angondjé : loyers versés chaque mois et photos à chaque intervention.'],
  ['Nadège', 'Régularisation d\'un terrain', 'Mon titre foncier traînait depuis des années. GMS a repris le dossier et je l\'ai enfin obtenu.'],
];
module.exports = { WI, PH, QUARTIERS, BIENS, SERVICES, DOSSIER, AVIS, XP };
