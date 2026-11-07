// Chouchou Lazare : contenu du site.
// Infos réelles (FashionNetwork, Africanews, Brut Afrique, Afrik.com, Instagram @chouchoulazare, Facebook « Créations Chouchou Lazare ») :
// styliste-modéliste gabonais autodidacte, atelier à Libreville ; raphia du Gabon transformé en haute couture (bustiers sculptés, jupes
// aériennes, silhouettes majestueuses) ; aide sa mère à la couture dès 9 ans, premier défilé au lycée ; 1er prix du meilleur défilé à la
// Biennale internationale du design de Saint-Étienne ; président de l'Association des stylistes et créateurs gabonais ; défilé à Libreville
// devant les présidents gabonais et français (novembre 2025) ; Achievement Award au Fashion Annual Show de Paris (28 février 2026) ;
// décoré de l'Ordre du Mérite gabonais. Citations tirées de l'article d'Africanews (mars 2026).
// À confirmer : adresse de l'atelier, pièces et prix, délais, horaires.
const CL = {
  slug: 'chouchou-lazare', name: 'Chouchou Lazare', tel: '077 36 22 12', wa: '24177362212', mail: 'contact@chouchoulazare.ga',
  city: 'Libreville', ig: 'chouchoulazare', fb: 'Créations Chouchou Lazare',
};
const PH = {
  hero: '../../assets/sig/look-2.webp', look1: '../../assets/sig/look-1.webp', look3: '../../assets/sig/look-3.webp',
  green: '../../assets/photos/luxe-1696962678565.jpg', model: '../../assets/photos/luxe-1770419252355.jpg', wax: '../../assets/photos/x-wax-2.jpg',
  wax2: '../../assets/photos/x-wax-1.jpg', fibres: '../../assets/photos/x-paniers-1.jpg', raphia: '../../assets/photos/x-raphia-1.jpg', portant: '../../assets/photos/luxe-1445205170230-053b83016050.jpg',
  portrait: '../../assets/sig/wax-portrait.jpg',
};
// Pièces : [id, nom, ligne, matière, silhouette (svg) ou photo, description]
const PIECES = [
  ['reine', 'Bustier Reine', 'raphia', 'Raphia naturel tissé main', 'bustier', 'Bustier sculpté, porté sur une jupe longue : la pièce signature de la maison.'],
  ['aerienne', 'Jupe aérienne', 'raphia', 'Franges de raphia sur fond de soie', 'jupe', 'Une jupe qui danse à chaque pas, tout en légèreté.'],
  ['majeste', 'Robe Majesté', 'raphia', 'Raphia tressé et cousu', 'robe', 'Silhouette longue et majestueuse, pour les grandes soirées.'],
  ['cape', 'Cape Ogooué', 'raphia', 'Raphia et écorce', 'cape', 'Une cape d\'apparat inspirée des parures des chefs.'],
  ['akanda', 'Robe Akanda', 'wax', 'Wax et finitions raphia', PH.green, 'Robe portefeuille en wax, ceinture de raphia tressé.'],
  ['nyanga', 'Ensemble Nyanga', 'wax', 'Wax imprimé', PH.model, 'Haut et jupe assortis, pour le quotidien chic.'],
  ['kente', 'Robe Lopé', 'wax', 'Tissu tissé à bandes', PH.look3, 'Robe courte aux couleurs vives, coupe ajustée.'],
  ['dot', 'Tenue de dot', 'ceremonie', 'Raphia, wax et broderies', 'robe', 'Pour le mariage traditionnel : la tradition, réinventée sur mesure.'],
  ['homme', 'Ensemble homme cérémonie', 'ceremonie', 'Lin et bandes de raphia', 'homme', 'Tunique et pantalon, plastron de raphia tissé.'],
];
const LIGNES = [['raphia', 'Raphia'], ['wax', 'Wax'], ['ceremonie', 'Cérémonie']];
// Étapes du raphia
const ETAPES = [
  ['La récolte', 'Les jeunes feuilles du palmier raphia sont coupées, puis les fibres sont séparées à la main.'],
  ['Le séchage', 'Les fibres sèchent au soleil, sur le balcon de l\'atelier, jusqu\'à prendre leur couleur naturelle.'],
  ['Le tissage', 'Le raphia du Gabon est tissé très fin : c\'est ce qui en fait un textile à part.'],
  ['La création', 'Tressé, cousu ou collé, il devient bustier sculpté, jupe aérienne ou silhouette majestueuse.'],
];
const DATES = [
  ['Enfance', 'Il aide sa mère à la couture dès l\'âge de neuf ans.'],
  ['Lycée', 'Il organise son premier défilé.'],
  ['Saint-Étienne', 'Premier prix du meilleur défilé à la Biennale internationale du design.'],
  ['Libreville', 'Président de l\'Association des stylistes et créateurs gabonais.'],
  ['Novembre 2025', 'Défilé à Libreville devant les présidents gabonais et français.'],
  ['Février 2026', 'Achievement Award au Fashion Annual Show de Paris.'],
];
const OCCASIONS = ['Mariage traditionnel (dot)', 'Mariage civil ou religieux', 'Gala ou soirée', 'Défilé ou spectacle', 'Tenue de tous les jours'];
module.exports = { CL, PH, PIECES, LIGNES, ETAPES, DATES, OCCASIONS };
