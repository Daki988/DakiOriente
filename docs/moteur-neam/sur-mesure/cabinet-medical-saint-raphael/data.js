// Cabinet médical Saint Raphaël : contenu du site.
// Infos réelles (annuaires) : Dr Patrick ABOGHE OYEGHE, angiologie et cardiologie, quartier Louis, immeuble Zèbre,
// après l'ambassade de Côte d'Ivoire, tél. 011 73 21 35 et 074 24 49 20, camedsaintraphael@gmail.com.
// À confirmer : actes et équipements, horaires, équipe (prénoms fictifs), avis, prise en charge.
const AG = {
  slug: 'cabinet-medical-saint-raphael', name: 'Cabinet médical Saint Raphaël', short: 'Saint Raphaël',
  doc: 'Dr Patrick ABOGHE OYEGHE', spec: 'Médecin angiologue et cardiologue',
  tel: '074 24 49 20', fixe: '011 73 21 35', wa: '24174244920', mail: 'camedsaintraphael@gmail.com',
  addr: ['Quartier Louis, immeuble Zèbre', 'Libreville'], repere: 'Après l\'ambassade de Côte d\'Ivoire',
  hours: [['Lundi – vendredi', '8 h – 17 h'], ['Samedi', '8 h – 12 h'], ['Dimanche', 'Fermé']],
  mapq: 'Ambassade+de+C%C3%B4te+d%27Ivoire,+Louis,+Libreville,+Gabon',
};
const PH = {
  salle: 'x-salle-echo-1.jpg', echographe: 'x-echographe-1.jpg', medecin: 'x-medecin-n-1.jpg', accueil: 'sante-1519494026892-80bbd2d6fd0d.jpg',
  mains: 'sante-1576091160399-112ba8d25d1d.jpg', radiologue: 'x-radiologue-1.jpg',
};

const E = (o) => o;
const EXAMS = [
  E({ id: 'consultation', t: 'Consultation d\'angiologie', ico: 'steth', ph: PH.mains, cat: 'Consultation',
    d: 'Le bilan de vos veines, de vos artères et de la circulation lymphatique, avec un examen clinique complet.',
    list: ['Jambes lourdes, gonflées', 'Varices et varicosités', 'Douleurs à la marche', 'Mains et pieds froids'],
    prep: ['Apportez vos examens et ordonnances récents', 'Portez des vêtements faciles à retirer', 'Venez avec vos bas de contention si vous en avez'], dur: '30 min', cr: 'Conclusions et ordonnance remises à la fin' }),
  E({ id: 'doppler-veineux', t: 'Écho-doppler veineux', ico: 'wave', ph: PH.echographe, cat: 'Examen',
    d: 'L\'examen de référence des veines des jambes : sans douleur, sans rayons, résultat immédiat.',
    list: ['Recherche de phlébite', 'Bilan de varices', 'Avant un traitement ou une chirurgie', 'Surveillance après traitement'],
    prep: ['Aucune préparation', 'Portez des vêtements amples', 'Évitez crèmes et huiles sur les jambes le jour même'], dur: '30 min', cr: 'Compte rendu remis à la fin de l\'examen' }),
  E({ id: 'doppler-arteriel', t: 'Écho-doppler artériel', ico: 'pulse', ph: PH.salle, cat: 'Examen',
    d: 'L\'étude des artères des jambes, du cou et de l\'abdomen pour dépister les rétrécissements.',
    list: ['Artères des jambes', 'Carotides (vaisseaux du cou)', 'Aorte abdominale', 'Artères rénales'],
    prep: ['Aorte et artères rénales : à jeun depuis 6 h', 'Autres territoires : aucune préparation', 'Apportez vos résultats de cholestérol et de glycémie'], dur: '30 à 45 min', cr: 'Compte rendu remis à la fin de l\'examen' }),
  E({ id: 'cardiologie', t: 'Consultation de cardiologie', ico: 'heart', ph: PH.medecin, cat: 'Consultation',
    d: 'Hypertension, palpitations, essoufflement : un bilan du cœur, avec électrocardiogramme.',
    list: ['Hypertension artérielle', 'Palpitations, douleurs thoraciques', 'Essoufflement', 'Certificat avant le sport'],
    prep: ['Apportez la liste de vos traitements', 'Apportez votre dernier bilan sanguin', 'Ne fumez pas et évitez le café 2 h avant'], dur: '30 min', cr: 'Électrocardiogramme et conclusions remis sur place' }),
  E({ id: 'varices', t: 'Traitement des varices', ico: 'drop', ph: PH.radiologue, cat: 'Traitement',
    d: 'Sclérothérapie des varicosités et petites varices, en cabinet, sans hospitalisation.',
    list: ['Varicosités et « araignées »', 'Petites varices', 'Séances espacées de 2 à 3 semaines', 'Reprise des activités le jour même'],
    prep: ['Pas de crème sur les jambes', 'Apportez vos bas de contention', 'Écho-doppler veineux récent nécessaire'], dur: '20 à 30 min', cr: 'Plan de traitement remis à la première séance' }),
  E({ id: 'plaies', t: 'Plaies et ulcères de jambe', ico: 'shield', ph: PH.accueil, cat: 'Traitement',
    d: 'Le bilan et le suivi des plaies qui ne cicatrisent pas, avec la bonne contention.',
    list: ['Ulcère veineux ou artériel', 'Bilan de la cause', 'Conseils de pansements', 'Contention adaptée'],
    prep: ['Apportez vos pansements et traitements actuels', 'Gardez le pansement en place jusqu\'à la consultation'], dur: '30 min', cr: 'Protocole de soins remis à l\'infirmier' }),
];

const STEPS = [
  ['Prenez rendez-vous', 'En ligne, par téléphone ou WhatsApp. Le docteur vous reçoit avec ou sans lettre de votre médecin.'],
  ['La consultation', 'Écoute de vos symptômes, examen des jambes ou du cœur, prise de tension.'],
  ['L\'examen si besoin', 'Écho-doppler ou électrocardiogramme réalisés le jour même, au cabinet.'],
  ['Le suivi', 'Traitement, contention ou conseils, et un compte rendu pour votre médecin traitant.'],
];
const CONSEILS = [
  ['Bougez', 'Marchez 30 minutes par jour : le mollet est la pompe de vos veines.'],
  ['Surélevez', 'Le soir, jambes légèrement surélevées pour dégonfler.'],
  ['Fraîcheur', 'Terminez la douche par un jet d\'eau fraîche sur les jambes.'],
  ['En avion', 'Pour les longs vols, bas de contention et marche dans l\'allée.'],
];

// Personnages fictifs : prénom uniquement
const AVIS = [
  ['Jeanne', 'Écho-doppler veineux', 'Examen rapide et sans douleur. Le docteur m\'a montré l\'écran et tout expliqué. Mes jambes vont mieux avec la contention.'],
  ['Serge', 'Consultation de cardiologie', 'Ma tension est enfin équilibrée. Suivi sérieux, rendez-vous à l\'heure.'],
  ['Pauline', 'Traitement des varices', 'Trois séances et mes varicosités ont presque disparu. Je recommande.'],
];
const TEAM = [['Dr Patrick ABOGHE OYEGHE', 'Angiologue et cardiologue'], ['Mireille', 'Infirmière'], ['Joëlle', 'Accueil et secrétariat médical'], ['Fabrice', 'Assistant médical']];

const FAQ = [
  ['Faut-il une lettre de mon médecin ?', 'Non, vous pouvez consulter directement. Si votre médecin vous a écrit un courrier, apportez-le.'],
  ['L\'écho-doppler fait-il mal ?', 'Non. C\'est une échographie : une sonde glisse sur la peau avec un gel. Pas de rayons, pas de piqûre.'],
  ['Quand faut-il consulter rapidement ?', 'Une jambe brusquement gonflée, chaude et douloureuse peut être une phlébite : appelez-nous le jour même. En cas de douleur dans la poitrine ou d\'essoufflement brutal, appelez les secours.'],
  ['Les bas de contention sont-ils utiles ?', 'Oui, ils soulagent les jambes lourdes et préviennent la phlébite en voyage. Nous vous indiquons la bonne classe et la bonne taille.'],
  ['Que dois-je apporter ?', 'Vos ordonnances, vos examens précédents, votre pièce d\'identité et votre carte d\'assurance ou CNAMGS.'],
];

module.exports = { AG, PH, EXAMS, STEPS, AVIS, TEAM, FAQ, CONSEILS };
