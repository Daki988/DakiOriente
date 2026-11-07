// Cabinet dentaire ACAE Sourire : contenu du site.
// Infos réelles (Le Pratique du Gabon, Go Africa Online, Facebook « Acae sourire », réseau médical SUNU) : Dr Jacquie NDOUTOUME,
// soins dentaires à Akae (Acaé), à côté de la pharmacie, près du feu ; 065 66 85 85 ; cabinetdentaireacaesourire@gmail.com ;
// « une équipe expérimentée et des équipements modernes » ; note Google 4,6 / 5.
// À confirmer : soins proposés, horaires, équipe (prénoms fictifs), assurances acceptées, logo (proposé).
const AG = {
  slug: 'cabinet-dentaire-acae-sourire', name: 'Cabinet dentaire ACAE Sourire', short: 'ACAE Sourire',
  doc: 'Dr Jacquie NDOUTOUME', spec: 'Chirurgien-dentiste',
  tel: '065 66 85 85', fixe: '', wa: '24165668585', mail: 'cabinetdentaireacaesourire@gmail.com',
  addr: ['Akae, à côté de la pharmacie', 'Libreville'], repere: 'Près du feu d\'Akae',
  hours: [['Lundi – vendredi', '8 h – 18 h'], ['Samedi', '9 h – 14 h'], ['Dimanche', 'Urgences sur appel']],
  mapq: 'Akae,+Libreville,+Gabon',
  assur: ['SUNU Assurances', 'Mutuelles d\'entreprise'],
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
  ['Prisca', 'Soins de caries', 'Je redoutais la piqûre et je n\'ai rien senti. Docteure très douce et cabinet impeccable.'],
  ['Arnaud', 'Urgence dentaire', 'Rage de dents un samedi matin : reçu dans l\'heure, soulagé le jour même. Merci à toute l\'équipe.'],
  ['Léa', 'Dentisterie pour enfants', 'Mon fils de 5 ans est ressorti en souriant et réclame déjà sa prochaine visite !'],
];
const TEAM = [['Dr Jacquie NDOUTOUME', 'Chirurgien-dentiste'], ['Murielle', 'Aide opératoire'], ['Yann', 'Assistant dentaire'], ['Grâce', 'Accueil des patients']];

const FAQ = [
  ['J\'ai très mal aux dents, que faire ?', 'Appelez-nous le jour même au 065 66 85 85 : nous gardons des créneaux pour les urgences. En attendant, un antidouleur classique et du froid sur la joue.'],
  ['Les soins font-ils mal ?', 'Non. Tous les soins sont faits sous anesthésie locale, et nous vérifions qu\'elle agit avant de commencer.'],
  ['Mon assurance est-elle acceptée ?', 'Le cabinet fait partie du réseau de soins SUNU Assurances. Pour les autres assurances et mutuelles, appelez-nous avec votre carte d\'assuré.'],
  ['À quel âge amener mon enfant ?', 'Dès 3 ans pour une première visite, même sans problème : c\'est le meilleur moyen d\'éviter la peur du dentiste.'],
  ['Combien coûte un implant ?', 'Cela dépend de votre situation. Vous recevez un devis détaillé après le bilan, avant tout engagement.'],
];

// Urgences : [id, symptôme, niveau (0 aujourd'hui, 1 sous 48 h, 2 dans la semaine), que faire en attendant]
const URG = [
  ['rage', 'Douleur forte, qui empêche de dormir', 0, ['Prenez un antidouleur classique (paracétamol)', 'Froid sur la joue, 15 minutes', 'Pas d\'aspirine sur la gencive', 'Appelez-nous dès l\'ouverture']],
  ['abces', 'Joue gonflée, fièvre', 0, ['Appelez-nous immédiatement', 'Froid sur la joue, jamais de chaud', 'Si la gêne pour respirer ou avaler augmente : urgences hospitalières']],
  ['cassee', 'Dent cassée ou fêlée', 1, ['Gardez le morceau dans du lait', 'Rincez à l\'eau tiède', 'Évitez de mâcher de ce côté']],
  ['tombee', 'Dent définitive tombée (choc)', 0, ['Tenez la dent par la couronne, jamais par la racine', 'Mettez-la dans du lait ou dans votre bouche', 'Venez dans l\'heure : elle peut être replantée']],
  ['saigne', 'Gencives qui saignent', 2, ['Continuez à vous brosser doucement', 'Bain de bouche sans alcool', 'Prenez rendez-vous pour un détartrage']],
  ['sensible', 'Sensibilité au chaud ou au froid', 2, ['Dentifrice pour dents sensibles', 'Évitez les boissons très froides', 'Prenez rendez-vous pour un bilan']],
  ['prothese', 'Prothèse ou couronne décollée', 1, ['Gardez-la dans une boîte propre', 'Ne la recollez pas vous-même', 'Prenez rendez-vous rapidement']],
];

module.exports = { AG, PH, EXAMS, STEPS, AVIS, TEAM, FAQ, CONSEILS, URG };
