// Cabinet dentaire Dr Abbas : contenu du site.
// Infos réelles (Facebook « Cabinet Dentaire Dr Abbas », Le Pratique du Gabon, Go Africa Online, Yes RDV) : soins bucco-dentaires
// « avec ou sans rendez-vous » ; immeuble Centr'Affaires, derrière Rénovation (rue N'Djogam), Libreville ; 011 74 17 39 et 066 24 89 99 (WhatsApp) ;
// drabashasan@hotmail.com.
// À confirmer : soins proposés, horaires, affluence réelle, équipe (prénoms fictifs), assurances, logo (proposé).
const AG = {
  slug: 'cabinet-dentaire-dr-abbas', name: 'Cabinet dentaire Dr Abbas', short: 'Dr Abbas',
  doc: 'Dr ABBAS', spec: 'Chirurgien-dentiste',
  tel: '066 24 89 99', fixe: '011 74 17 39', wa: '24166248999', mail: 'drabashasan@hotmail.com',
  addr: ['Immeuble Centr\'Affaires, Rénovation', 'Libreville'], repere: 'Derrière Rénovation, rue N\'Djogam',
  hours: [['Lundi – vendredi', '8 h – 18 h'], ['Samedi', '8 h – 13 h'], ['Dimanche', 'Fermé']],
  mapq: 'Immeuble+Centr%27Affaires,+R%C3%A9novation,+Libreville,+Gabon',
  assur: ['Assurances privées', 'Mutuelles d\'entreprise'],
};
const PH = {
  enfant: 'x-dentiste-enfant-n-1.jpg', detartrage: 'x-detartrage-n-1.jpg', soin: 'x-soin-dentaire-n-1.jpg', fauteuil: 'x-fauteuil-n-1.jpg',
  consult: 'x-cabinet-soin-n-1.jpg', scan: 'x-scan-dentaire-1.jpg', implant: 'x-implant-2.jpg', implant3: 'x-implant-3.jpg',
  cabinet: 'x-dentaire-n-2.jpg', cabinet2: 'x-dentaire-n-1.jpg', sourire: 'x-sourire-n-1.jpg', sourire2: 'x-sourire-n-2.jpg',
};

const E = (o) => o;
const EXAMS = [
  E({ id: 'detartrage', t: 'Bilan et détartrage', ico: 'tooth', ph: PH.detartrage, cat: 'Soins',
    d: 'Le contrôle complet de vos dents et de vos gencives, suivi d\'un détartrage et d\'un polissage.',
    list: ['Examen des dents et des gencives', 'Détartrage aux ultrasons', 'Polissage', 'Conseils de brossage'],
    prep: ['Avant : brossez-vous les dents', 'Après : évitez café, thé et tabac pendant 1 h', 'Un contrôle tous les 6 mois'], dur: '30 à 45 min', cr: 'Plan de soins remis si nécessaire' }),
  E({ id: 'caries', t: 'Soins des caries', ico: 'shield', ph: PH.soin, cat: 'Soins',
    d: 'Obturations couleur de la dent, dévitalisations : on soigne sans douleur, sous anesthésie locale.',
    list: ['Obturation composite (couleur dent)', 'Dévitalisation', 'Reconstitution', 'Sensibilité dentaire'],
    prep: ['Avant : mangez normalement', 'Après : attendez la fin de l\'anesthésie pour manger', 'Évitez de mâcher du côté soigné le jour même'], dur: '30 à 60 min', cr: 'Soin terminé en 1 à 3 séances' }),
  E({ id: 'implants', t: 'Implants dentaires', ico: 'bolt', ph: PH.implant, cat: 'Chirurgie',
    d: 'Remplacer une dent manquante de façon durable et naturelle, sans toucher aux dents voisines.',
    list: ['Bilan radiographique 3D', 'Pose de l\'implant', 'Couronne définitive', 'Suivi annuel'],
    prep: ['Avant : signalez vos traitements et le tabac', 'Après : glace 20 min par heure, alimentation tiède', 'Pas de tabac pendant 15 jours'], dur: '1 h', cr: 'Couronne posée 3 à 4 mois après' }),
  E({ id: 'protheses', t: 'Couronnes et prothèses', ico: 'crown', ph: PH.implant3, cat: 'Esthétique',
    d: 'Couronnes céramique, bridges et appareils : retrouver un sourire complet et une bonne mastication.',
    list: ['Couronne céramique', 'Bridge', 'Prothèse amovible', 'Réparation de prothèse'],
    prep: ['Avant : apportez votre ancienne prothèse', 'Après : mastication douce les premiers jours'], dur: '2 à 3 séances', cr: 'Prothèse ajustée jusqu\'à votre confort' }),
  E({ id: 'blanchiment', t: 'Blanchiment', ico: 'spark', ph: PH.sourire2, cat: 'Esthétique',
    d: 'Un sourire plus éclatant en toute sécurité, après un bilan et un détartrage.',
    list: ['Bilan préalable', 'Blanchiment au fauteuil', 'Gouttières pour la maison', 'Conseils d\'entretien'],
    prep: ['Avant : détartrage récent', 'Après : pas de café, thé, tabac ni sauce colorée pendant 48 h'], dur: '1 h', cr: 'Résultat visible dès la séance' }),
  E({ id: 'enfants', t: 'Dentisterie pour enfants', ico: 'smile', ph: PH.enfant, cat: 'Enfants',
    d: 'Des soins doux pour les plus petits, dès 3 ans, pour qu\'ils n\'aient jamais peur du dentiste.',
    list: ['Première visite dès 3 ans', 'Vernis fluoré', 'Scellement des sillons', 'Soins des dents de lait'],
    prep: ['Avant : expliquez simplement la visite à votre enfant', 'Venez avec son doudou s\'il en a un', 'Après : une petite récompense est bienvenue'], dur: '20 à 30 min', cr: 'Conseils remis aux parents' }),
  E({ id: 'extraction', t: 'Extractions et dents de sagesse', ico: 'cross', ph: PH.fauteuil, cat: 'Chirurgie',
    d: 'Extraction simple ou de dents de sagesse, sous anesthésie locale, avec des consignes claires pour la suite.',
    list: ['Dent abîmée ou infectée', 'Dents de sagesse', 'Suivi de cicatrisation'],
    prep: ['Avant : mangez légèrement', 'Après : ne crachez pas et ne rincez pas le jour même', 'Alimentation froide ou tiède 48 h'], dur: '30 à 60 min', cr: 'Ordonnance et consignes remises' }),
];

const STEPS = [
  ['Prenez rendez-vous', 'En ligne, par téléphone ou WhatsApp. Urgence ? Rendez-vous dans la journée.'],
  ['Le bilan', 'Examen complet, radio si besoin, et explication de ce qu\'on voit.'],
  ['Le devis', 'Un plan de traitement clair et un devis avant tout soin important.'],
  ['Les soins', 'Des soins sans douleur, et un suivi régulier pour garder un sourire en bonne santé.'],
];
const CONSEILS = [
  ['2 fois par jour', 'Brossez-vous les dents 2 minutes, matin et soir.'],
  ['Le fil dentaire', 'Une fois par jour, là où la brosse ne passe pas.'],
  ['Moins de sucre', 'Limitez sodas et sucreries entre les repas.'],
  ['Tous les 6 mois', 'Un contrôle et un détartrage, même sans douleur.'],
];

// Personnages fictifs : prénom uniquement
const AVIS = [
  ['Hugues', 'Soins de caries', 'Je redoutais la piqûre et je n\'ai rien senti. Docteure très douce et cabinet impeccable.'],
  ['Nadia', 'Sans rendez-vous', 'Passée sans rendez-vous à l\'heure du déjeuner, reçue en vingt minutes. Très pratique quand on travaille au centre-ville.'],
  ['Sylvie', 'Dentisterie pour enfants', 'Mon fils de 5 ans est ressorti en souriant et réclame déjà sa prochaine visite !'],
];
const TEAM = [['Dr ABBAS', 'Chirurgien-dentiste'], ['Josiane', 'Assistante dentaire'], ['Kévin', 'Assistant dentaire'], ['Clarisse', 'Accueil et secrétariat']];

const FAQ = [
  ['J\'ai très mal aux dents, que faire ?', 'Appelez-nous ou passez directement : nous recevons aussi sans rendez-vous. 066 24 89 99 : nous gardons des créneaux pour les urgences. En attendant, un antidouleur classique et du froid sur la joue.'],
  ['Les soins font-ils mal ?', 'Non. Tous les soins sont faits sous anesthésie locale, et nous vérifions qu\'elle agit avant de commencer.'],
  ['Mon assurance est-elle acceptée ?', 'Appelez-nous avec votre carte d\'assuré ou de mutuelle : nous vous disons ce qui est pris en charge avant les soins.'],
  ['À quel âge amener mon enfant ?', 'Dès 3 ans pour une première visite, même sans problème : c\'est le meilleur moyen d\'éviter la peur du dentiste.'],
  ['Combien coûte un implant ?', 'Cela dépend de votre situation. Vous recevez un devis détaillé après le bilan, avant tout engagement.'],
];

// Affluence indicative au cabinet, par heure (0 = calme, 100 = très chargé). Lundi à vendredi : 8 h à 17 h ; samedi : 8 h à 12 h.
const AFF = {
  semaine: [80, 70, 45, 35, 25, 20, 40, 55, 75, 85],
  lundi: [95, 85, 60, 45, 30, 25, 45, 60, 80, 85],
  samedi: [70, 90, 85, 60, 40],
};
module.exports = { AG, PH, EXAMS, STEPS, AVIS, TEAM, FAQ, CONSEILS, AFF };
