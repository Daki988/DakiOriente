// AFRAM : contenu du site (refonte « grande école de commerce »).
// Infos réelles (aframgabon.com, Ogooué Éducation, LinkedIn, conditions financières publiées) : Académie Franco-Américaine de Management,
// établissement privé d'enseignement supérieur habilité et reconnu par l'État gabonais, créé le 28 mars 2003, plus de 20 ans d'expérience ;
// approche des business schools nord-américaines et européennes ; vocation, vision et mission reprises du site ; Bachelor/Licence (Droit, QHSE,
// Management des organisations, Informatique) et Master (Droit, Entrepreneuriat - management des projets et innovation, QHSE, Informatique),
// formation continue, certifications ; deux sites de plus de 15 salles climatisées chacun, bibliothèque numérique, salle informatique, tableaux
// numériques tactiles ; Rue André MINTSA, Batterie IV, près de l'École conventionnée Gros Bouquet 1 ; 066 70 11 84, WhatsApp 074 00 00 43,
// aframilesmail@aframgabon.com ; lun–ven 8 h–20 h, sam 8 h–14 h ; Junior-Entreprise (Afram Rose), Novembre bleu, retour des anciens.
// Frais : conditions financières publiées par l'école (à confirmer pour l'année en cours).
// Contenus des programmes (modules, débouchés) : indicatifs, à valider avec l'école.
const AF = {
  slug: 'afram', name: 'AFRAM', long: 'Académie Franco-Américaine de Management', base: 'Management · IT · Law · Environment',
  tel: '066 70 11 84', wa: '24174000043', waTxt: '074 00 00 43', mail: 'aframilesmail@aframgabon.com', dom: 'aframgabon.com',
  addr: 'Rue André MINTSA, Batterie IV', repere: 'Près de l\'École conventionnée Gros Bouquet 1', city: 'Libreville', mapq: 'Batterie+IV,+Libreville,+Gabon',
  hours: [['Lundi – vendredi', '8 h – 20 h'], ['Samedi', '8 h – 14 h']],
  fb: 'aframschoolofmanagement', li: 'afram-school-officiel', created: '28 mars 2003',
};
const I = (f) => '../../assets/photos/' + f;
const PH = {
  hero: I('x-diplomes-1.jpg'), duo: I('x-diplomes-2.jpg'), remise: I('x-diplomes-3.jpg'), costume: I('x-diplome-costume-1.jpg'),
  diplomee: I('x-diplome-2.jpg'), diplome: I('x-diplome-1.jpg'), info: I('x-informatique-1.jpg'), bureau: I('x-bureau-n-1.jpg'),
  equipe: I('services-1655720357872-ce227e4164ba.jpg'), qhse: I('x-expert-chantier-1.jpg'), main: I('x-main-n-2.jpg'), couloir: I('services-1497366216548-37526070297c.jpg'),
};
const DOM = [['management', 'Management'], ['droit', 'Droit'], ['qhse', 'QHSE'], ['informatique', 'Informatique']];
// Programmes : id, niveau, domaine, titre, accroche, photo, durée, admission, modules par année, débouchés, compétences
const P = (o) => o;
const PROGRAMMES = [
  P({ id: 'bachelor-management', niv: 'Bachelor', dom: 'management', t: 'Bachelor Management des organisations', a: 'Comprendre l\'entreprise sous tous ses angles et en piloter les équipes.', ph: PH.equipe, dur: '3 ans', adm: 'Baccalauréats économiques ou équivalents',
    an: [['1re année', ['Économie générale', 'Comptabilité générale', 'Introduction au management', 'Droit des affaires', 'Anglais des affaires', 'Bureautique']], ['2e année', ['Marketing', 'Gestion des ressources humaines', 'Contrôle de gestion', 'Statistiques appliquées', 'Communication professionnelle', 'Stage d\'immersion']], ['3e année', ['Stratégie d\'entreprise', 'Gestion de projet', 'Finance d\'entreprise', 'Entrepreneuriat', 'Management interculturel', 'Stage et mémoire professionnel']]],
    deb: ['Assistant de direction', 'Chargé de clientèle', 'Gestionnaire RH', 'Assistant contrôleur de gestion', 'Créateur d\'entreprise'] }),
  P({ id: 'bachelor-droit', niv: 'Bachelor', dom: 'droit', t: 'Bachelor Droit', a: 'Les fondamentaux du droit public et privé, appliqués à l\'entreprise.', ph: PH.costume, dur: '3 ans', adm: 'Baccalauréat ou tout titre admis en équivalence',
    an: [['1re année', ['Introduction au droit', 'Droit constitutionnel', 'Droit civil : les personnes', 'Histoire des institutions', 'Méthodologie juridique', 'Anglais juridique']], ['2e année', ['Droit des obligations', 'Droit administratif', 'Droit pénal général', 'Droit commercial', 'Finances publiques', 'Stage en cabinet']], ['3e année', ['Droit des sociétés', 'Droit du travail', 'Droit OHADA', 'Procédure civile', 'Droit fiscal', 'Mémoire']]],
    deb: ['Juriste d\'entreprise (après Master)', 'Assistant juridique', 'Clerc', 'Agent de l\'administration', 'Poursuite en Master Droit'] }),
  P({ id: 'bachelor-qhse', niv: 'Bachelor', dom: 'qhse', t: 'Bachelor QHSE', a: 'Qualité, hygiène, sécurité et environnement : protéger les personnes et les sites.', ph: PH.qhse, dur: '3 ans', adm: 'Baccalauréat ou tout titre admis en équivalence',
    an: [['1re année', ['Fondamentaux de la qualité', 'Hygiène et santé au travail', 'Chimie et risques', 'Mathématiques appliquées', 'Droit de l\'environnement', 'Anglais technique']], ['2e année', ['Normes ISO 9001, 14001, 45001', 'Évaluation des risques', 'Gestion des déchets', 'Secourisme et incendie', 'Audit interne', 'Stage sur site']], ['3e année', ['Système de management intégré', 'Sécurité industrielle', 'Développement durable et RSE', 'Gestion de crise', 'Management d\'équipe', 'Stage et mémoire']]],
    deb: ['Animateur QHSE', 'Technicien HSE (pétrole, mines, BTP)', 'Assistant qualité', 'Chargé environnement'] }),
  P({ id: 'bachelor-informatique', niv: 'Bachelor', dom: 'informatique', t: 'Bachelor Informatique', a: 'Développer, administrer et sécuriser les systèmes d\'information.', ph: PH.info, dur: '3 ans', adm: 'Baccalauréat ou tout titre admis en équivalence',
    an: [['1re année', ['Algorithmique', 'Programmation', 'Architecture des ordinateurs', 'Mathématiques discrètes', 'Bureautique avancée', 'Anglais technique']], ['2e année', ['Bases de données', 'Développement web', 'Réseaux', 'Systèmes d\'exploitation', 'Programmation orientée objet', 'Stage']], ['3e année', ['Développement mobile', 'Sécurité informatique', 'Cloud et virtualisation', 'Gestion de projet agile', 'E-business', 'Projet de fin d\'études']]],
    deb: ['Développeur web et mobile', 'Administrateur réseaux', 'Technicien support', 'Chef de projet junior'] }),
  P({ id: 'master-entrepreneuriat', niv: 'Master', dom: 'management', t: 'Master Entrepreneuriat, management des projets et innovation', a: 'Créer, financer et piloter des projets innovants.', ph: PH.bureau, dur: '2 ans', adm: 'Licence ou diplôme équivalent ; relevés de M1 pour l\'entrée en M2',
    an: [['Master 1', ['Stratégie et innovation', 'Business plan et levée de fonds', 'Management de projet avancé', 'Marketing digital', 'Finance entrepreneuriale', 'Leadership']], ['Master 2', ['Incubation et prototypage', 'Management de l\'innovation', 'Droit des affaires OHADA', 'Gestion des risques projet', 'Négociation', 'Stage et mémoire']]],
    deb: ['Créateur ou repreneur d\'entreprise', 'Chef de projet', 'Consultant en stratégie', 'Responsable innovation'] }),
  P({ id: 'master-droit', niv: 'Master', dom: 'droit', t: 'Master Droit', a: 'Se spécialiser en droit des affaires et accompagner les organisations.', ph: PH.diplome, dur: '2 ans', adm: 'Licence en droit ou diplôme équivalent ; relevés de M1 pour l\'entrée en M2',
    an: [['Master 1', ['Droit des affaires approfondi', 'Droit OHADA', 'Contentieux', 'Droit bancaire', 'Droit international privé', 'Anglais juridique']], ['Master 2', ['Fiscalité des entreprises', 'Arbitrage et modes alternatifs', 'Droit social approfondi', 'Compliance', 'Rédaction d\'actes', 'Stage et mémoire']]],
    deb: ['Juriste d\'entreprise', 'Conseiller juridique', 'Préparation aux concours et au barreau', 'Responsable conformité'] }),
  P({ id: 'master-qhse', niv: 'Master', dom: 'qhse', t: 'Master QHSE', a: 'Diriger la démarche qualité, sécurité et environnement d\'une organisation.', ph: PH.qhse, dur: '2 ans', adm: 'Licence ou diplôme équivalent ; relevés de M1 pour l\'entrée en M2',
    an: [['Master 1', ['Management intégré QHSE', 'Audit et certification', 'Risques industriels', 'Droit de l\'environnement', 'Statistiques et indicateurs', 'Anglais professionnel']], ['Master 2', ['Stratégie RSE', 'Gestion de crise et plans d\'urgence', 'Santé au travail', 'Management des équipes HSE', 'Économie circulaire', 'Stage et mémoire']]],
    deb: ['Responsable QHSE', 'Auditeur qualité', 'Manager HSE (pétrole, mines, BTP)', 'Consultant RSE'] }),
  P({ id: 'master-informatique', niv: 'Master', dom: 'informatique', t: 'Master Informatique', a: 'Concevoir et piloter les projets numériques des organisations.', ph: PH.info, dur: '2 ans', adm: 'Licence en informatique ou diplôme équivalent ; relevés de M1 pour l\'entrée en M2',
    an: [['Master 1', ['Architecture logicielle', 'Data et intelligence artificielle', 'Cybersécurité', 'Gouvernance des SI', 'Développement avancé', 'Anglais professionnel']], ['Master 2', ['Transformation numérique', 'Cloud et DevOps', 'Audit des systèmes d\'information', 'Management de projet informatique', 'Innovation et startups', 'Stage et mémoire']]],
    deb: ['Chef de projet informatique', 'Architecte logiciel', 'Responsable sécurité des SI', 'Consultant en transformation numérique'] }),
];
const FRAIS = {
  Bachelor: { scol: 990000, mois: 9, admin: { non: 210000, boursier: 250000 } },
  Master: { scol: 1900000, mois: 9, admin: { non: 250000, boursier: 350000 } },
  uniforme: 200000,
};
const DOSSIER = {
  Bachelor: ['Formulaire à remplir à l\'établissement', '2 photos d\'identité', 'Attestation de réussite au baccalauréat', 'Bulletins de notes de terminale', 'Relevé de notes du baccalauréat', 'Acte de naissance légalisé'],
  Master: ['Formulaire à remplir à l\'établissement', '2 photos d\'identité', 'Attestation de réussite de licence ou diplôme légalisé', 'Relevés de notes L1, L2, L3', 'Acte de naissance légalisé', 'Relevés de notes de M1 pour l\'entrée en M2'],
};
const NEWS = [
  ['Novembre bleu', 'La santé de l\'homme, une affaire de tous : étudiants, soyons proactifs face au cancer de la prostate', 'Événement', PH.duo],
  ['Octobre rose', 'Afram Rose : la Junior-Entreprise se mobilise pour Octobre rose, campagne de sensibilisation et de dépistage', 'Vie étudiante', PH.remise],
  ['Rentrée', 'Le campus reprend vie : une nouvelle page s\'écrit, avec le retour des anciens', 'Campus', PH.hero],
];
module.exports = { AF, PH, DOM, PROGRAMMES, FRAIS, DOSSIER, NEWS };
