// Delicatess : contenu du site.
// Infos réelles (annuaire, Instagram @contact.delicatess) : « Parfumerie et cosmétiques de luxe », Akanda,
// galerie de la résidence Bouye Denise, BP 8129 Libreville, 074 73 62 43, contact.delicatess@gmail.com.
// Les produits sont présentés sans nom de marque (règle NEAM : pas de marques tierces) : à remplacer par le vrai catalogue.
const AG = {
  slug: 'delicatess', name: 'Delicatess', ig: 'contact.delicatess',
  tel: '074 73 62 43', wa: '24174736243', mail: 'contact.delicatess@gmail.com', bp: 'BP 8129 Libreville',
  addr: 'Galerie de la résidence Bouye Denise', city: 'Akanda',
  map: 'https://www.google.com/maps?q=Akanda,+Gabon&z=13&output=embed',
  hours: [['Lundi – samedi', '10 h – 20 h'], ['Dimanche', '11 h – 17 h']],
  livraison: 2000,
};
const PH = {
  noir: 'x-parfum-sombre-2.jpg', vitrine: 'x-parfum-sombre-1.jpg', oud: 'x-parfum-oud-1.jpg', femme: 'x-parfum-femme-n-1.jpg', rouge: 'x-parfum-rouge-1.jpg',
  soins: 'beaute-1601049676869.jpg', soinsJaune: 'x-cosmetiques-1.jpg', makeup: 'beaute-1596462502278-27bfdc403348.jpg', coffret: 'x-cadeau-1.jpg', paquet: 'x-cadeau-2.jpg',
  portrait: 'beaute-1765607476292.jpg', glow: 'beaute-1637851362556.jpg', creme: 'beaute-1693004923522.jpg',
};

// Familles olfactives (servent aux filtres et au quiz)
const FAM = { frais: 'Frais', floral: 'Floral', boise: 'Boisé', oriental: 'Oriental & gourmand', oud: 'Oud & musc' };

// [id, nom, détail, prix, photo, rayon, pour, famille]
const PROD = [
  ['rose-oud', 'Rose & Oud', 'Eau de parfum 100 ml · rose de Taïf, oud, safran', 85000, PH.rouge, 'parfums', 'femme', 'oud'],
  ['fleur-blanche', 'Fleur blanche', 'Eau de parfum 90 ml · jasmin, tubéreuse, musc', 75000, PH.femme, 'parfums', 'femme', 'floral'],
  ['vanille-ambree', 'Vanille ambrée', 'Eau de parfum 100 ml · vanille, ambre, fève tonka', 68000, PH.vitrine, 'parfums', 'mixte', 'oriental'],
  ['agrumes-neroli', 'Agrumes & néroli', 'Eau de toilette 100 ml · bergamote, néroli, thé', 55000, PH.noir, 'parfums', 'mixte', 'frais'],
  ['bois-santal', 'Bois de santal', 'Eau de parfum 100 ml · santal, cèdre, vétiver', 78000, PH.noir, 'parfums', 'homme', 'boise'],
  ['cuir-tabac', 'Cuir & tabac', 'Eau de parfum 100 ml · cuir, tabac blond, cardamome', 82000, PH.vitrine, 'parfums', 'homme', 'boise'],
  ['brise-marine', 'Brise marine', 'Eau de toilette 100 ml · notes marines, menthe, bois flotté', 58000, PH.noir, 'parfums', 'homme', 'frais'],
  ['oud-royal', 'Oud royal', 'Extrait de parfum 50 ml · oud, encens, rose', 120000, PH.oud, 'orient', 'mixte', 'oud'],
  ['musc-blanc', 'Musc blanc', 'Huile parfumée 12 ml · musc, poudre, coton', 25000, PH.oud, 'orient', 'femme', 'oud'],
  ['bakhoor', 'Bakhoor ambré', 'Encens à brûler 50 g · ambre, oud, bois précieux', 15000, PH.oud, 'orient', 'mixte', 'oriental'],
  ['creme-eclat', 'Crème éclat', 'Visage 50 ml · peaux noires et métissées', 32000, PH.soins, 'soins', 'femme', null],
  ['serum-c', 'Sérum vitamine C', 'Visage 30 ml · teint unifié', 28000, PH.soinsJaune, 'soins', 'mixte', null],
  ['rouge-mat', 'Rouge à lèvres mat', '6 teintes · tenue longue durée', 15000, PH.makeup, 'maquillage', 'femme', null],
  ['fond-teint', 'Fond de teint', 'Teintes ébène à caramel · fini naturel', 30000, PH.makeup, 'maquillage', 'femme', null],
  ['coffret-decouverte', 'Coffret découverte', '5 miniatures de parfum · idéal pour choisir', 45000, PH.coffret, 'coffrets', 'mixte', null],
  ['coffret-signature', 'Coffret signature', 'Eau de parfum + lait parfumé + pochette', 95000, PH.paquet, 'coffrets', 'mixte', null],
];
const RAYONS = { parfums: 'Parfums', orient: 'Orient & oud', soins: 'Soins', maquillage: 'Maquillage', coffrets: 'Coffrets' };

// Personnages fictifs : prénom uniquement
const AVIS = [
  ['Danielle', 'Conseil parfum', 'On m\'a fait sentir trois parfums et j\'ai trouvé MON parfum. Conseil impeccable, emballage magnifique.'],
  ['Arnaud', 'Cadeau pour ma femme', 'Commande sur WhatsApp à midi, livré à Angondjé le soir même avec un joli coffret. Parfait.'],
  ['Ruth', 'Soins visage', 'Enfin des soins pensés pour nos peaux. Mon teint n\'a jamais été aussi lumineux.'],
];

module.exports = { AG, PH, FAM, PROD, RAYONS, AVIS };
