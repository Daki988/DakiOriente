// Données de démonstration — Tremplin (candidats) & GuruTools (recruteurs).
// Les entreprises sont fictives.

export type ContractType = 'Stage' | 'Emploi' | 'Alternance'

export type Offer = {
  id: string
  title: string
  company: string
  logo: string
  city: string
  type: ContractType
  contract: string
  salary?: string
  posted: string
  tags: string[]
  description: string
  missions: string[]
}

export const OFFERS: Offer[] = [
  { id: 'o1', title: 'Commercial(e) terrain', company: 'Kumba Services', logo: '🟦', city: 'Libreville', type: 'Emploi', contract: 'CDI', salary: '250 000 – 350 000 FCFA', posted: 'il y a 2 j', tags: ['Vente', 'Permis B'], description: 'Rejoignez une équipe dynamique pour développer notre portefeuille clients à Libreville.', missions: ['Prospecter de nouveaux clients', 'Présenter nos offres de services', 'Suivre et fidéliser le portefeuille'] },
  { id: 'o2', title: 'Assistant(e) administratif(ve)', company: 'Kumba Services', logo: '🟦', city: 'Libreville', type: 'Emploi', contract: 'CDD 12 mois', salary: '200 000 FCFA', posted: 'il y a 3 j', tags: ['Bureautique', 'Organisation'], description: 'Vous assurez la gestion administrative quotidienne de l’agence.', missions: ['Accueil et standard', 'Gestion des dossiers et courriers', 'Suivi des plannings'] },
  { id: 'o3', title: 'Agent de vente', company: 'Kumba Services', logo: '🟦', city: 'Owendo', type: 'Emploi', contract: 'CDI', posted: 'il y a 5 j', tags: ['Vente', 'Relation client'], description: 'Accueillir, conseiller et vendre en point de vente.', missions: ['Conseil client', 'Mise en rayon', 'Encaissement'] },
  { id: 'o4', title: 'Stage – Développeur web', company: 'Okoumé Digital', logo: '🟩', city: 'Libreville', type: 'Stage', contract: 'Stage 6 mois', salary: 'Gratification 100 000 FCFA', posted: 'il y a 1 j', tags: ['React', 'JavaScript'], description: 'Participez au développement d’applications web pour nos clients gabonais.', missions: ['Développer des interfaces', 'Tester et corriger', 'Participer aux réunions d’équipe'] },
  { id: 'o5', title: 'Stage – Marketing digital', company: 'Mbolo Média', logo: '🟧', city: 'Libreville', type: 'Stage', contract: 'Stage 3 mois', posted: 'il y a 4 j', tags: ['Réseaux sociaux', 'Canva'], description: 'Animez nos réseaux sociaux et créez du contenu.', missions: ['Calendrier éditorial', 'Création de visuels', 'Analyse des statistiques'] },
  { id: 'o6', title: 'Alternance – Comptabilité', company: 'Cabinet Ndong & Associés', logo: '🟪', city: 'Port-Gentil', type: 'Alternance', contract: 'Alternance 24 mois', posted: 'il y a 6 j', tags: ['Comptabilité', 'Excel'], description: 'Formez-vous à l’expertise comptable au sein d’un cabinet reconnu.', missions: ['Saisie comptable', 'Déclarations fiscales', 'Préparation des bilans'] },
  { id: 'o7', title: 'Technicien(ne) de maintenance', company: 'Ogooué Énergie', logo: '🟨', city: 'Franceville', type: 'Emploi', contract: 'CDI', salary: '400 000 FCFA', posted: 'il y a 1 sem.', tags: ['Électricité', 'Maintenance'], description: 'Assurer la maintenance préventive et curative des équipements.', missions: ['Diagnostics', 'Interventions sur site', 'Rapports d’intervention'] },
  { id: 'o8', title: 'Stage – Ressources humaines', company: 'Okoumé Digital', logo: '🟩', city: 'Libreville', type: 'Stage', contract: 'Stage 4 mois', posted: 'il y a 2 sem.', tags: ['Recrutement', 'Administration'], description: 'Accompagnez l’équipe RH dans le recrutement et l’intégration.', missions: ['Tri des candidatures', 'Organisation d’entretiens', 'Onboarding'] },
]

export const FORMATIONS = [
  { id: 'fo1', title: 'Réussir son entretien d’embauche', duration: '2 h', level: 'Débutant', emoji: '🎤', price: 0, provider: 'Tremplin Académie' },
  { id: 'fo2', title: 'Excel pour l’entreprise', duration: '8 h', level: 'Intermédiaire', emoji: '📊', price: 15000, provider: 'Tremplin Académie' },
  { id: 'fo3', title: 'Initiation au développement web', duration: '20 h', level: 'Débutant', emoji: '💻', price: 35000, provider: 'Okoumé Digital' },
  { id: 'fo4', title: 'Marketing digital & réseaux sociaux', duration: '10 h', level: 'Débutant', emoji: '📱', price: 20000, provider: 'Mbolo Média' },
  { id: 'fo5', title: 'Techniques de vente', duration: '6 h', level: 'Débutant', emoji: '🤝', price: 10000, provider: 'Kumba Services' },
  { id: 'fo6', title: 'Anglais professionnel', duration: '30 h', level: 'Tous niveaux', emoji: '🇬🇧', price: 40000, provider: 'Tremplin Académie' },
]

export const COMPANIES = [
  { name: 'Kumba Services', sector: 'Services aux entreprises', city: 'Libreville', offers: 3, logo: '🟦' },
  { name: 'Okoumé Digital', sector: 'Numérique', city: 'Libreville', offers: 2, logo: '🟩' },
  { name: 'Mbolo Média', sector: 'Communication', city: 'Libreville', offers: 1, logo: '🟧' },
  { name: 'Cabinet Ndong & Associés', sector: 'Expertise comptable', city: 'Port-Gentil', offers: 1, logo: '🟪' },
  { name: 'Ogooué Énergie', sector: 'Énergie', city: 'Franceville', offers: 1, logo: '🟨' },
]

// ——— GuruTools ———

export type Candidate = {
  id: string
  recruitmentId: string
  name: string
  avatar: string
  score: number
  city: string
  experience: string
  degree: string
  summary: string
  strengths: string[]
  improvements: string[]
  status: 'nouveau' | 'présélectionné' | 'écarté'
}

export type Recruitment = {
  id: string
  title: string
  city: string
  contract: string
  status: 'Publié' | 'En cours' | 'Terminé'
  createdAt: number
  description?: string
}

const day = 86400000
export const SEED_RECRUITMENTS: Recruitment[] = [
  { id: 'r1', title: 'Commercial(e) terrain', city: 'Libreville', contract: 'CDI', status: 'Publié', createdAt: Date.now() - 6 * day },
  { id: 'r2', title: 'Assistant(e) administratif(ve)', city: 'Libreville', contract: 'CDD', status: 'En cours', createdAt: Date.now() - 10 * day },
  { id: 'r3', title: 'Agent de vente', city: 'Owendo', contract: 'CDI', status: 'Publié', createdAt: Date.now() - 3 * day },
]

const c = (id: string, recruitmentId: string, name: string, avatar: string, score: number, experience: string, summary: string, strengths: string[], improvements: string[], status: Candidate['status'] = 'nouveau'): Candidate => ({
  id, recruitmentId, name, avatar, score, city: 'Libreville', experience, degree: 'Bac+2', summary, strengths, improvements, status,
})

export const SEED_CANDIDATES: Candidate[] = [
  c('c1', 'r1', 'Marc N.', '👨🏾', 94, '3 ans d’expérience', 'Commercial · Très bonne adéquation', ['3 ans d’expérience en vente terrain', 'Compétences en négociation', 'Expérience dans un secteur similaire', 'Bonne maîtrise du français', 'Mobilité sur Libreville'], ['Pas d’expérience managériale', 'Compétences digitales limitées'], 'présélectionné'),
  c('c2', 'r1', 'Léa B.', '👩🏾', 86, '2 ans d’expérience', 'Expérience terrain + objectifs atteints', ['Objectifs commerciaux dépassés', 'Aisance relationnelle', 'Permis B'], ['Connaissance du secteur à approfondir']),
  c('c3', 'r1', 'Junior M.', '🧑🏾', 72, '1 an d’expérience', 'Bon potentiel · Compétences proches', ['Motivation', 'Formation commerciale'], ['Expérience terrain courte', 'Pas de permis']),
  c('c4', 'r1', 'Sabrina O.', '👩🏾‍🦱', 68, '1 an d’expérience', 'Expérience en vente · Formation adaptée', ['Formation adaptée', 'Expérience en boutique'], ['Peu de prospection', 'Disponibilité limitée']),
  c('c5', 'r1', 'Patrick E.', '👨🏾‍🦲', 45, 'Débutant', 'Peu d’expérience mais motivé', ['Très motivé'], ['Aucune expérience commerciale', 'Formation éloignée du poste']),
  c('c6', 'r2', 'Grâce K.', '👩🏾‍💼', 91, '4 ans d’expérience', 'Assistante de direction confirmée', ['Maîtrise du pack Office', 'Organisation', 'Discrétion'], ['Anglais à renforcer']),
  c('c7', 'r2', 'Yannick T.', '👨🏾‍💼', 77, '2 ans d’expérience', 'Profil polyvalent', ['Polyvalence', 'Rigueur'], ['Expérience courte en secrétariat']),
  c('c8', 'r3', 'Murielle A.', '👩🏾', 83, '2 ans d’expérience', 'Vendeuse en grande surface', ['Relation client', 'Encaissement'], ['Mobilité Owendo à confirmer']),
]
