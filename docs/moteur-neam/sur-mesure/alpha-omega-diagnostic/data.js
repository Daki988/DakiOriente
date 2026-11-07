// Alpha Omega Diagnostic : contenu du site.
// Infos réelles (Le Pratique du Gabon, annuaires, Facebook, Instagram @alphaomegadiagnostic, LinkedIn) : cabinet médical dirigé par
// le Dr Guy Jonathan EYENE ; ophtalmologie, santé au travail (médecine du travail), médecine générale, analyses médicales ;
// au-dessus de la SEEG de Mbolo, Libreville ; 011 76 17 17 et 062 76 17 17 ; cabalphaomega@gmail.com ; offre « consultation
// d'ophtalmologie + tension oculaire à 10 000 FCFA » ; réseau de soins Humaniis.
// À confirmer : horaires, actes exacts, tarifs, équipe (prénoms fictifs), avis, assurances acceptées.
const AG = {
  slug: 'alpha-omega-diagnostic', name: 'Alpha Omega Diagnostic', short: 'Alpha Omega',
  doc: 'Dr Guy Jonathan EYENE', spec: 'Médecin, directeur du cabinet',
  tel: '062 76 17 17', fixe: '011 76 17 17', wa: '24162761717', mail: 'cabalphaomega@gmail.com',
  addr: ['Au-dessus de la SEEG de Mbolo', 'Libreville'], repere: 'À côté du centre commercial Mbolo',
  hours: [['Lundi – vendredi', '8 h – 17 h'], ['Samedi', '8 h – 12 h'], ['Dimanche', 'Fermé']],
  mapq: '0.405905,9.436723', ig: 'alphaomegadiagnostic',
};
const PH = {
  phoro: 'x-ophtalmo-n-1.jpg', labo: 'x-labo-n-2.jpg', tubes: 'x-labo-n-1.jpg', medecin: 'x-medecin-n-1.jpg', accueil: 'sante-1519494026892-80bbd2d6fd0d.jpg',
  mains: 'sante-1576091160399-112ba8d25d1d.jpg', ouvrier: 'x-ouvrier-n-1.jpg',
};

const E = (o) => o;
const EXAMS = [
  E({ id: 'ophtalmologie', t: 'Consultation d\'ophtalmologie', ico: 'eye', ph: PH.phoro, cat: 'Ophtalmologie',
    d: 'Le bilan complet de vos yeux : vision, fond d\'œil, tension oculaire. Offre consultation + tension oculaire à 10 000 FCFA.',
    list: ['Baisse de la vue, maux de tête', 'Yeux rouges, qui piquent ou qui pleurent', 'Suivi du diabète et de l\'hypertension', 'Contrôle avant le permis de conduire'],
    prep: ['Apportez vos lunettes et vos anciennes ordonnances', 'Évitez les lentilles le jour de la consultation', 'Ne conduisez pas si l\'on doit dilater vos pupilles'], dur: '30 min', cr: 'Ordonnance de lunettes ou de traitement remise sur place' }),
  E({ id: 'glaucome', t: 'Tension oculaire et dépistage du glaucome', ico: 'eye', ph: PH.medecin, cat: 'Ophtalmologie',
    d: 'Le glaucome ne fait pas mal mais abîme la vue : une mesure simple permet de le dépister tôt.',
    list: ['Mesure de la tension de l\'œil', 'Examen du nerf optique', 'Conseillé après 40 ans', 'Indispensable en cas d\'antécédents familiaux'],
    prep: ['Aucune préparation', 'Apportez la liste de vos traitements'], dur: '15 min', cr: 'Résultat expliqué immédiatement' }),
  E({ id: 'vue', t: 'Bilan de la vue et lunettes', ico: 'glasses', ph: PH.accueil, cat: 'Ophtalmologie',
    d: 'Mesure précise de votre vue de loin et de près, et prescription de lunettes adaptées.',
    list: ['Myopie, hypermétropie, astigmatisme', 'Presbytie (vue de près après 45 ans)', 'Enfants qui plissent les yeux', 'Écrans et fatigue visuelle'],
    prep: ['Apportez vos lunettes actuelles', 'Pour un enfant : son carnet de santé'], dur: '20 min', cr: 'Ordonnance de lunettes remise sur place' }),
  E({ id: 'travail', t: 'Visite de médecine du travail', ico: 'work', ph: PH.ouvrier, cat: 'Santé au travail',
    d: 'Visites d\'embauche, périodiques et de reprise, avec examen de la vue et certificat d\'aptitude.',
    list: ['Visite d\'embauche', 'Visite périodique', 'Visite de reprise après arrêt', 'Aptitude aux postes à risque (conduite, hauteur)'],
    prep: ['Apportez la convocation de votre employeur', 'Pièce d\'identité', 'Lunettes si vous en portez'], dur: '30 min', cr: 'Fiche d\'aptitude remise à l\'employeur' }),
  E({ id: 'generale', t: 'Consultation de médecine générale', ico: 'steth', ph: PH.mains, cat: 'Médecine générale',
    d: 'Fièvre, fatigue, tension, suivi d\'une maladie chronique : un médecin pour toute la famille.',
    list: ['Fièvre et paludisme', 'Hypertension et diabète', 'Certificats médicaux', 'Bilan de santé'],
    prep: ['Apportez vos ordonnances et examens récents', 'Votre carnet de santé'], dur: '20 à 30 min', cr: 'Ordonnance et conclusions remises sur place' }),
  E({ id: 'analyses', t: 'Analyses médicales', ico: 'drop', ph: PH.labo, cat: 'Laboratoire',
    d: 'Prise de sang et analyses courantes sur place, pour vos consultations et vos bilans d\'entreprise.',
    list: ['Numération, glycémie, cholestérol', 'Goutte épaisse (paludisme)', 'Bilan rénal et hépatique', 'Bilans d\'embauche'],
    prep: ['Glycémie et cholestérol : à jeun depuis 8 h', 'Apportez l\'ordonnance du médecin'], dur: '10 min', cr: 'Résultats sous 24 à 48 h selon l\'analyse' }),
];

const STEPS = [
  ['Prenez rendez-vous', 'En ligne, par téléphone ou WhatsApp. Les urgences de l\'œil sont reçues dans la journée.'],
  ['L\'accueil', 'Au-dessus de la SEEG de Mbolo : enregistrement, assurance, mesure de la tension.'],
  ['La consultation', 'Examen, tension oculaire ou prise de sang réalisés sur place.'],
  ['Les résultats', 'Ordonnance, fiche d\'aptitude ou compte rendu, expliqués et remis en main propre.'],
];
const CONSEILS = [
  ['Après 40 ans', 'Faites mesurer votre tension oculaire tous les deux ans.'],
  ['Diabète', 'Un fond d\'œil chaque année protège votre vue.'],
  ['Écrans', 'Toutes les 20 minutes, regardez au loin pendant 20 secondes.'],
  ['Soleil', 'Portez des lunettes de soleil filtrantes en extérieur.'],
];

// Personnages fictifs : prénom uniquement
const AVIS = [
  ['Rodrigue', 'Consultation d\'ophtalmologie', 'Consultation et tension oculaire pour 10 000 FCFA, accueil rapide. On m\'a bien expliqué mon ordonnance de lunettes.'],
  ['Estelle', 'Médecine du travail', 'Nous y envoyons nos nouveaux employés : visites organisées vite et fiches d\'aptitude claires.'],
  ['Bertrand', 'Analyses médicales', 'Prise de sang le matin, résultats le lendemain. Pratique et sérieux.'],
];
const TEAM = [['Dr Guy Jonathan EYENE', 'Médecin, directeur du cabinet'], ['Nadège', 'Assistante en ophtalmologie'], ['Hervé', 'Technicien de laboratoire'], ['Sandrine', 'Accueil et secrétariat médical']];

const FAQ = [
  ['L\'offre à 10 000 FCFA comprend quoi ?', 'La consultation d\'ophtalmologie et la mesure de la tension oculaire. Les examens complémentaires éventuels vous sont annoncés avant d\'être réalisés.'],
  ['Mes yeux vont-ils être dilatés ?', 'Parfois, pour examiner le fond de l\'œil. La vue reste floue quelques heures : venez accompagné et ne conduisez pas.'],
  ['Mon entreprise peut-elle signer une convention ?', 'Oui. Nous organisons les visites d\'embauche, périodiques et de reprise de vos salariés, au cabinet ou sur votre site. Demandez un devis sur la page Entreprises.'],
  ['Quand consulter en urgence ?', 'Un œil rouge et douloureux, une baisse brutale de la vue ou un choc sur l\'œil : appelez-nous le jour même.'],
  ['Que dois-je apporter ?', 'Vos lunettes, vos ordonnances, une pièce d\'identité et votre carte d\'assurance ou CNAMGS.'],
];

// Médecine du travail : visites proposées aux entreprises
const VISITES = [['embauche', 'Visite d\'embauche'], ['periodique', 'Visite périodique'], ['reprise', 'Visite de reprise'], ['vue', 'Dépistage visuel (conducteurs)'], ['bilan', 'Bilan sanguin'], ['sensibilisation', 'Sensibilisation santé']];

module.exports = { AG, PH, EXAMS, STEPS, AVIS, TEAM, FAQ, CONSEILS, VISITES };
