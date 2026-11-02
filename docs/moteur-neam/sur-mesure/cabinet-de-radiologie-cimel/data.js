// Cabinet de radiologie CIMEL : contenu du site.
// Infos réelles (annuaires, OpenStreetMap) : nom, avenue de Cointet (Mont-Bouët), position GPS, médecin et spécialité, téléphone, e-mail.
// À confirmer avec le cabinet : liste exacte des examens et appareils, horaires, équipe, avis, prise en charge.
const AG = {
  slug: 'cabinet-de-radiologie-cimel', name: 'Cabinet de radiologie CIMEL', short: 'CIMEL',
  doc: 'Dr Alexis Fernand KOUMBA', spec: 'Médecin spécialiste en radiodiagnostic et imagerie médicale',
  tel: '077 36 76 75', wa: '24177367675', mail: 'dkalexisf@yahoo.fr',
  addr: ['Avenue de Cointet, Mont-Bouët', 'Libreville'], repere: 'À 100 m du supermarché Cecado, près du marché de Mont-Bouët',
  hours: [['Lundi – vendredi', '7 h 30 – 18 h'], ['Samedi', '8 h – 13 h'], ['Dimanche', 'Fermé']],
  geo: [0.398757, 9.449558],
};
const PH = {
  salle: 'x-salle-echo-1.jpg', radiologue: 'x-radiologue-1.jpg', echographe: 'x-echographe-1.jpg', grossesse: 'x-echo-grossesse-1.jpg',
  mammo: 'x-mammo-1.jpg', radio: 'sante-1530497610245-94d3c16cda28.jpg', accueil: 'sante-1519494026892-80bbd2d6fd0d.jpg',
  medecin: 'x-medecin-n-1.jpg', mains: 'sante-1576091160399-112ba8d25d1d.jpg', scanner: 'x-scanner-1.jpg',
};

// Examens : déroulement, préparation, durée, délai de compte rendu
const E = (o) => o;
const EXAMS = [
  E({ id: 'radiographie', t: 'Radiographie numérique', ico: 'bone', ph: PH.radio, cat: 'Radiologie',
    d: 'Thorax, os et articulations, colonne, sinus, abdomen : des images nettes avec une faible dose de rayons.',
    list: ['Thorax et poumons', 'Os, articulations, traumatismes', 'Colonne vertébrale', 'Sinus et crâne', 'Abdomen sans préparation'],
    prep: ['Aucune préparation particulière', 'Retirez bijoux et objets métalliques', 'Signalez une grossesse possible'], dur: '10 min', cr: 'Images immédiates, compte rendu le jour même' }),
  E({ id: 'echographie', t: 'Échographie', ico: 'wave', ph: PH.salle, cat: 'Échographie',
    d: 'Un examen sans rayons et sans douleur pour explorer les organes et les tissus mous.',
    list: ['Abdominale (foie, vésicule, reins)', 'Pelvienne', 'Thyroïde et cou', 'Seins', 'Parties molles et testicules'],
    prep: ['Abdominale : à jeun depuis 6 h', 'Pelvienne : vessie pleine, buvez 1 litre d\'eau 1 h avant', 'Autres : aucune préparation'], dur: '20 min', cr: 'Compte rendu remis à la fin de l\'examen' }),
  E({ id: 'obstetricale', t: 'Échographie obstétricale', ico: 'baby', ph: PH.grossesse, cat: 'Échographie',
    d: 'Le suivi de votre grossesse, trimestre après trimestre, dans un cadre calme et bienveillant.',
    list: ['Datation (1er trimestre)', 'Morphologie (2e trimestre)', 'Croissance (3e trimestre)', 'Photos remises aux parents'],
    prep: ['1er trimestre : vessie pleine', 'Ensuite : aucune préparation', 'Apportez vos échographies précédentes'], dur: '30 min', cr: 'Compte rendu et photos remis sur place' }),
  E({ id: 'doppler', t: 'Écho-doppler', ico: 'pulse', ph: PH.echographe, cat: 'Échographie',
    d: 'L\'étude de la circulation du sang dans les veines et les artères.',
    list: ['Veines des jambes (varices, phlébite)', 'Artères des jambes', 'Vaisseaux du cou', 'Artères rénales'],
    prep: ['Aucune préparation, sauf artères rénales : à jeun', 'Portez des vêtements amples'], dur: '30 min', cr: 'Compte rendu remis à la fin de l\'examen' }),
  E({ id: 'mammographie', t: 'Mammographie', ico: 'ribbon', ph: PH.mammo, cat: 'Radiologie',
    d: 'Dépistage et diagnostic des maladies du sein, complétés si besoin par une échographie.',
    list: ['Dépistage à partir de 40 ans', 'Bilan d\'une anomalie', 'Couplée à l\'échographie mammaire'],
    prep: ['Pas de déodorant, crème ni talc le jour de l\'examen', 'De préférence dans les 10 jours après les règles', 'Apportez vos anciens clichés'], dur: '20 min', cr: 'Compte rendu sous 24 h' }),
  E({ id: 'contraste', t: 'Examens avec produit de contraste', ico: 'drop', ph: PH.radiologue, cat: 'Radiologie',
    d: 'Hystérographie, urographie, transit œso-gastro-duodénal : des examens spécialisés, sur rendez-vous.',
    list: ['Hystérosalpingographie', 'Urographie intraveineuse (UIV)', 'Transit œso-gastro-duodénal', 'Urétrocystographie'],
    prep: ['Une fiche de préparation vous est remise au rendez-vous', 'Bilan de créatinine récent pour l\'UIV', 'Signalez toute allergie'], dur: '30 à 45 min', cr: 'Compte rendu sous 24 h' }),
];

const STEPS = [
  ['Votre ordonnance', 'Votre médecin vous prescrit l\'examen. Pas d\'ordonnance ? Appelez-nous, nous vous conseillons.'],
  ['Rendez-vous', 'En ligne, par téléphone ou WhatsApp. Nous vous rappelons la préparation la veille.'],
  ['L\'examen', 'Accueil au cabinet, examen réalisé par le radiologue et son équipe.'],
  ['Les résultats', 'Images et compte rendu remis au patient et transmis à votre médecin.'],
];

// Personnages fictifs : prénom uniquement
const AVIS = [
  ['Ornella', 'Échographie obstétricale', 'Accueil très doux, le docteur a pris le temps de tout nous expliquer. Nous sommes repartis avec les photos de notre bébé.'],
  ['Hervé', 'Radiographie du genou', 'Rendez-vous le jour même, résultats en moins d\'une heure. Efficace et professionnel.'],
  ['Christelle', 'Mammographie', 'J\'appréhendais l\'examen, l\'équipe m\'a mise en confiance. Compte rendu clair, envoyé à mon gynécologue.'],
];
const TEAM = [['Dr Alexis Fernand KOUMBA', 'Radiologue, médecin spécialiste en radiodiagnostic et imagerie médicale', PH.medecin, true], ['Nadia', 'Manipulatrice en radiologie', null], ['Rodrigue', 'Manipulateur en radiologie', null], ['Sylvie', 'Accueil et secrétariat médical', null]];

const FAQ = [
  ['Faut-il une ordonnance ?', 'Oui, la plupart des examens sont réalisés sur prescription médicale. Sans ordonnance, appelez-nous : nous vous orientons.'],
  ['Puis-je venir sans rendez-vous ?', 'Les radiographies simples peuvent être faites sans rendez-vous aux heures d\'ouverture. Les échographies, mammographies et examens avec contraste se font sur rendez-vous.'],
  ['Quand aurai-je mes résultats ?', 'Les images de radiographie sont immédiates. Le compte rendu d\'échographie est remis à la fin de l\'examen ; celui d\'une mammographie ou d\'un examen avec contraste sous 24 h.'],
  ['Les rayons X sont-ils dangereux ?', 'Les doses utilisées en radiologie numérique sont très faibles. Signalez toujours une grossesse possible : l\'examen sera adapté ou remplacé par une échographie.'],
  ['Que dois-je apporter ?', 'Votre ordonnance, votre pièce d\'identité, votre carte d\'assurance ou CNAMGS, et vos examens précédents.'],
];

module.exports = { AG, PH, EXAMS, STEPS, AVIS, TEAM, FAQ };
