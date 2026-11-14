// SCI Sofiga (Libreville) : contenu du site sur mesure.
// Infos réelles (Le Pratique du Gabon, Le Gabonaire, annuaires) : prestation cadastrale, promotion et gestion des biens immobiliers,
// acquisition et vente de parcelles de terrain, assainissement ; Likouala Moussaka, BP 5997 Libreville ; 077 08 48 80 et 062 97 22 22 ;
// scisofiga2021@yahoo.com. Parcelles et prix : exemples à remplacer par le portefeuille réel. Tarifs cadastraux : indicatifs.
const WI = {
  slug: 'sci-sofiga', name: 'SCI Sofiga', boss: '',
  tel: '077 08 48 80', tel2: '062 97 22 22', tel3: '062 97 22 22', wa: '24177084880', mail: 'scisofiga2021@yahoo.com', dom: 'scisofiga.ga',
  addr: 'Likouala Moussaka', bp: 'BP 5997 Libreville', city: 'Libreville', mapq: 'Likouala,+Libreville,+Gabon',
  hours: [['Lundi – vendredi', '8 h – 17 h'], ['Samedi', 'Visites de terrains sur rendez-vous'], ['Dimanche', 'Fermé']],
};
const I = (f) => '../../assets/photos/' + f;
const PH = {
  villa: I('immo-1512917774080-9991f1c4c750.jpg'), villa2: I('immo-1564013799919-ab600027ffc6.jpg'), villaNuit: I('immo-1600585154340-be6161a56a0c.jpg'), villaBlanche: I('x-terrain-1.jpg'),
  cles: I('x-plans-1.jpg'), s1: I('immo-1583847268964-b28dc8f51f92.jpg'), s2: I('immo-1593696140826-c58b021acf8b.jpg'), s3: I('immo-1600607687939-ce8a6c25118c.jpg'),
  s4: I('immo-1616137422495-1e9e46e2aa77.jpg'), s5: I('immo-1638972691611-69633a3d3127.jpg'), s6: I('immo-1656646424956-cd6e88b678bc.jpg'), s7: I('immo-1721613885025-e337f77e948b.jpg'),
  s8: I('immo-1758448755952-42b404bc6f39.jpg'), s9: I('immo-1758565811176-ccd94357a844.jpg'), s10: I('immo-1774199496664-a9690967be5a.jpg'),
  res1: I('x-residence-1.jpg'), res2: I('x-residence-2.jpg'), res3: I('x-residence-3.jpg'), bur1: I('x-bureaux-1.jpg'), bur2: I('x-bureaux-2.jpg'), bur3: I('x-bureaux-3.jpg'),
  terrain: I('x-terrain-1.jpg'), cui1: I('x-cuisine-appart-1.jpg'), cui2: I('x-cuisine-appart-2.jpg'), main: I('x-main-n-1.jpg'), plans: I('x-plans-1.jpg'),
  studio1: I('x-geometre-1.jpg'), studio2: I('x-expert-chantier-1.jpg'), geometre: I('x-geometre-1.jpg'), expert: I('x-expert-chantier-1.jpg'),
};
const QUARTIERS = ['Bikélé', 'Ntoum', 'Nkok', 'Okolassi', 'Akanda', 'Angondjé', 'Owendo', 'Likouala'];
const B = (o) => o;
const BIENS = [
  B({ ref: 'SF-201', tr: 'vente', type: 'Terrain', t: 'Parcelle 500 m² titrée', q: 'Bikélé', prix: 9000000, m2: 500, ch: 0, sdb: 0, meuble: false, atouts: ['Titre foncier', 'Bornée', 'Accès route'], ph: [PH.terrain, PH.geometre] }),
  B({ ref: 'SF-202', tr: 'vente', type: 'Terrain', t: 'Parcelle 1 000 m² en lotissement', q: 'Ntoum', prix: 12000000, m2: 1000, ch: 0, sdb: 0, meuble: false, atouts: ['Lotissement viabilisé', 'Paiement échelonné possible'], ph: [PH.terrain] }),
  B({ ref: 'SF-203', tr: 'vente', type: 'Terrain', t: 'Terrain industriel 2 500 m²', q: 'Nkok', prix: 45000000, m2: 2500, ch: 0, sdb: 0, meuble: false, atouts: ['Zone économique', 'Accès poids lourds'], ph: [PH.expert, PH.terrain] }),
  B({ ref: 'SF-204', tr: 'vente', type: 'Terrain', t: 'Parcelle 600 m² vue dégagée', q: 'Okolassi', prix: 15000000, m2: 600, ch: 0, sdb: 0, meuble: false, atouts: ['Bornée', 'Quartier en développement'], ph: [PH.terrain] }),
  B({ ref: 'SF-205', tr: 'vente', type: 'Terrain', t: 'Parcelle 800 m² titrée', q: 'Akanda', prix: 40000000, m2: 800, ch: 0, sdb: 0, meuble: false, atouts: ['Titre foncier', 'Zone résidentielle', 'Eau et électricité'], ph: [PH.terrain, PH.plans] }),
  B({ ref: 'SF-206', tr: 'vente', type: 'Maison', t: 'Maison 3 chambres à finir', q: 'Angondjé', prix: 60000000, m2: 180, ch: 3, sdb: 2, meuble: false, atouts: ['Gros œuvre terminé', 'Titre foncier'], ph: [PH.expert, PH.s9] }),
  B({ ref: 'SF-101', tr: 'location', type: 'Maison', t: 'Maison 3 chambres', q: 'Owendo', prix: 450000, m2: 150, ch: 3, sdb: 2, meuble: false, atouts: ['Cour', 'Forage'], ph: [PH.s2, PH.cui1] }),
  B({ ref: 'SF-102', tr: 'location', type: 'Appartement', t: 'Appartement 2 chambres', q: 'Likouala', prix: 350000, m2: 80, ch: 2, sdb: 1, meuble: false, atouts: ['Résidence gérée', 'Parking'], ph: [PH.s4, PH.res3] }),
];
const SERVICES = [
  ['vente', 'Parcelles de terrain', 'Acquisition et vente de parcelles vérifiées, bornées et documentées.'],
  ['cadastre', 'Prestations cadastrales', 'Bornage, levé topographique, plan de situation, morcellement et dossier de titre foncier.'],
  ['promotion', 'Promotion immobilière', 'Lotissements et programmes de construction sur des emplacements choisis.'],
  ['gestion', 'Gestion des biens', 'Location, encaissement des loyers et entretien de votre patrimoine.'],
  ['assainissement', 'Assainissement', 'Drainage, fosses, évacuation des eaux : des terrains sains et constructibles.'],
];
const DOSSIER = [
  ['Titre foncier ou procédure engagée au cadastre', true], ['Bornage contradictoire et plan de situation', true], ['Identité et qualité du vendeur', true],
  ['Absence de litige ou d\'occupation', true], ['Accès, drainage et assainissement du terrain', false], ['Acte de vente signé devant notaire', true],
];
const AVIS = [
  ['Ghislain', 'Achat d\'une parcelle à Bikélé', 'Terrain borné, documents vérifiés, notaire : tout a été suivi par la SCI. J\'ai acheté sans stress.'],
  ['Mélanie', 'Bornage et plan de situation', 'Le géomètre est venu dans la semaine et mon dossier de titre foncier est enfin complet.'],
  ['Arsène', 'Assainissement d\'un terrain', 'Mon terrain était inondable : drainage réalisé avant la saison des pluies, je peux construire.'],
];
// Prestations cadastrales (tarifs indicatifs « à partir de »)
const STUDIOS = [
  { id: 'bornage', n: 'Bornage contradictoire', d: 'Pose des bornes en présence des voisins, procès-verbal et plan de bornage.', prix: 250000, ph: [PH.geometre, PH.terrain] },
  { id: 'leve', n: 'Levé topographique', d: 'Relevé précis du terrain et des niveaux, préalable à tout projet de construction.', prix: 200000, ph: [PH.plans, PH.expert] },
  { id: 'titre', n: 'Dossier de titre foncier', d: 'Constitution et suivi du dossier au cadastre et aux domaines, jusqu\'à l\'obtention du titre.', prix: 350000, ph: [PH.plans, PH.geometre] },
  { id: 'morcellement', n: 'Morcellement et lotissement', d: 'Division d\'un grand terrain en parcelles, plan de lotissement et voiries.', prix: 500000, ph: [PH.expert, PH.terrain] },
];
module.exports = { WI, PH, QUARTIERS, BIENS, SERVICES, DOSSIER, AVIS, STUDIOS };
