export type ServiceId =
  | 'market'
  | 'food'
  | 'express'
  | 'health'
  | 'print'
  | 'services'
  | 'brico'
  | 'beauty'
  | 'tech'

export type Service = {
  id: ServiceId
  name: string
  /** Libellé affiché dans la tuile (sous "NEAM") */
  short: string
  description: string
  tagline: string
  /** Dégradé de la tuile */
  gradient: string
  /** Couleur principale (texte, boutons) */
  color: string
  /** Couleur douce (fonds) */
  soft: string
  /** Visuel composé pour les cartes "services phares" */
  visual: string[]
  categories: string[]
  cta: string
  eta: string
}

export const SERVICES: Service[] = [
  {
    id: 'market',
    name: 'NEAM Market',
    short: 'Market',
    description: 'Courses et produits du quotidien',
    tagline: 'Vos courses livrées en moins d’une heure.',
    gradient: 'linear-gradient(145deg, #ffa21a 0%, #ff6a00 100%)',
    color: '#f06400',
    soft: '#fff3e6',
    visual: ['🧺', '🍍', '🥑', '🥖', '🍅'],
    categories: ['Tout', 'Fruits & légumes', 'Épicerie', 'Boissons', 'Frais', 'Maison'],
    cta: 'Ajouter',
    eta: '30-50 min',
  },
  {
    id: 'food',
    name: 'NEAM Food',
    short: 'Food',
    description: 'Repas et livraison de repas',
    tagline: 'Les meilleurs restaurants de votre ville.',
    gradient: 'linear-gradient(145deg, #ff4b4b 0%, #e3112f 100%)',
    color: '#e3112f',
    soft: '#ffecee',
    visual: ['🍲', '🍗', '🥘', '🌶️', '🍚'],
    categories: ['Tout', 'Gabonais', 'Grillades', 'Fast-food', 'Boissons', 'Desserts'],
    cta: 'Ajouter',
    eta: '25-40 min',
  },
  {
    id: 'express',
    name: 'NEAM Express',
    short: 'Express',
    description: 'Livraison rapide de courses, repas et colis',
    tagline: 'Un coursier à votre porte en quelques minutes.',
    gradient: 'linear-gradient(145deg, #2fe08d 0%, #089b5a 100%)',
    color: '#079b5a',
    soft: '#e7fbf1',
    visual: ['🛵', '📦', '⚡', '📍', '✉️'],
    categories: ['Tout', 'Colis', 'Documents', 'Courses'],
    cta: 'Envoyer',
    eta: '15-30 min',
  },
  {
    id: 'health',
    name: 'NEAM Health',
    short: 'Health',
    description: 'Santé, parapharmacie et bien-être',
    tagline: 'Votre pharmacie de garde, 7j/7.',
    gradient: 'linear-gradient(145deg, #2ab4ff 0%, #1361ef 100%)',
    color: '#1361ef',
    soft: '#e9f2ff',
    visual: ['💊', '🩺', '🧴', '🌡️', '💉'],
    categories: ['Tout', 'Médicaments', 'Parapharmacie', 'Bébé', 'Matériel', 'Consultation'],
    cta: 'Ajouter',
    eta: '30-45 min',
  },
  {
    id: 'print',
    name: 'NEAM Print',
    short: 'Print',
    description: 'Impression et supports marketing',
    tagline: 'Imprimez votre image de marque.',
    gradient: 'linear-gradient(145deg, #b05cff 0%, #6a24d6 100%)',
    color: '#6a24d6',
    soft: '#f3ebff',
    visual: ['🖨️', '👕', '☕', '📇', '🪧'],
    categories: ['Tout', 'Papeterie', 'Textile', 'Objets', 'Grand format'],
    cta: 'Commander',
    eta: '24-48 h',
  },
  {
    id: 'services',
    name: 'NEAM Services',
    short: 'Services',
    description: 'Assistance, conciergerie, réservation, etc.',
    tagline: 'On s’occupe de tout, vous profitez.',
    gradient: 'linear-gradient(145deg, #ffcf2e 0%, #ff9a00 100%)',
    color: '#d97a00',
    soft: '#fff8e1',
    visual: ['🛎️', '🧹', '🚗', '📅', '🗂️'],
    categories: ['Tout', 'Maison', 'Conciergerie', 'Transport', 'Administratif'],
    cta: 'Réserver',
    eta: 'Sur rendez-vous',
  },
  {
    id: 'brico',
    name: 'Brico&Deco by NEAM',
    short: 'Brico&Deco',
    description: 'Bricolage, décoration et équipement',
    tagline: 'Tout pour construire, réparer et embellir.',
    gradient: 'linear-gradient(145deg, #ff8a2b 0%, #e5530a 100%)',
    color: '#e5530a',
    soft: '#fff0e6',
    visual: ['🧰', '🔨', '🎨', '💡', '🪛'],
    categories: ['Tout', 'Outillage', 'Peinture', 'Électricité', 'Déco', 'Artisans'],
    cta: 'Ajouter',
    eta: '2-4 h',
  },
  {
    id: 'beauty',
    name: 'NEAM Beauty',
    short: 'Beauty',
    description: 'Beauté, soins et cosmétiques',
    tagline: 'Sublimez-vous, à domicile.',
    gradient: 'linear-gradient(145deg, #ff5fae 0%, #e0157a 100%)',
    color: '#d6136f',
    soft: '#ffebf5',
    visual: ['💄', '🧴', '💅', '🌸', '✨'],
    categories: ['Tout', 'Soins', 'Maquillage', 'Cheveux', 'Parfums', 'À domicile'],
    cta: 'Ajouter',
    eta: '45-90 min',
  },
  {
    id: 'tech',
    name: 'NEAM Tech',
    short: 'Tech',
    description: 'High-tech, informatique et solutions digitales',
    tagline: 'La technologie au service de votre quotidien.',
    gradient: 'linear-gradient(145deg, #12c8ff 0%, #0a63f0 100%)',
    color: '#0a63f0',
    soft: '#e6f4ff',
    visual: ['💻', '🎧', '📱', '⌚', '🔌'],
    categories: ['Tout', 'Smartphones', 'Informatique', 'Audio', 'Accessoires', 'Digital'],
    cta: 'Ajouter',
    eta: '1-3 h',
  },
]

export const SERVICE_MAP = Object.fromEntries(SERVICES.map((s) => [s.id, s])) as Record<ServiceId, Service>

export const CITIES = [
  'Libreville',
  'Akanda',
  'Owendo',
  'Port-Gentil',
  'Franceville',
  'Oyem',
  'Moanda',
  'Lambaréné',
  'Mouila',
  'Tchibanga',
  'Makokou',
  'Koulamoutou',
]
