import type { IconName } from '../lib/icons'

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
  | 'tremplin'
  | 'gurutools'
  | 'legal'

/** Gabarit d'interface utilisé par le service. */
export type ServiceKind = 'shop' | 'express' | 'tremplin' | 'gurutools' | 'legal'

/** Raccourci de l'accueil d'un service (tuile pastel avec icône). */
export type Quick = { label: string; icon: IconName; tint: string; cat?: string; to?: string }

/** Onglet de la barre de navigation propre au service. `to` relatif = sous-page du service. */
export type NavItem = { label: string; icon: IconName; to: string }

export type Section = { title: string; filter: 'promo' | 'popular' | 'all' | 'restaurants' | (string & {}) }

export type Service = {
  id: ServiceId
  /** Nom complet */
  name: string
  /** Libellé affiché dans la tuile, sous « NEAM » */
  short: string
  /** Libellé de la tuile quand ce n'est pas « NEAM xxx » (Brico&Deco, Tremplin…) */
  tileTitle?: string
  tileSub?: string
  description: string
  tagline: string
  gradient: string
  color: string
  soft: string
  kind: ServiceKind
  eta: string
  cta: string
  searchHint: string
  categories: string[]
  /** Arguments affichés à gauche sur desktop (comme sur les visuels) */
  features: { icon: IconName; label: string }[]
  hero: { title: string; text: string; cta: string; emoji: string[] }
  quick: Quick[]
  sections: Section[]
  banner?: { title: string; text: string; cta: string; emoji: string[]; to?: string }
  nav: NavItem[]
  /** Visuel composé pour les cartes « services phares » */
  visual: string[]
  isNew?: boolean
}

export const logoOf = (id: ServiceId) => `./brand/${id}-logo.webp`
export const markOf = (id: ServiceId) => `./brand/${id}-mark.webp`
export const markWhiteOf = (id: ServiceId) => `./brand/${id}-mark-white.webp`

const shopNav = (third: NavItem = { label: 'Panier', icon: 'cart', to: '/panier' }): NavItem[] => [
  { label: 'Accueil', icon: 'home', to: '' },
  { label: 'Catégories', icon: 'grid', to: 'categories' },
  third,
  { label: 'Commandes', icon: 'package', to: 'commandes' },
  { label: 'NEAM', icon: 'neam', to: '/' },
]

export const SERVICES: Service[] = [
  {
    id: 'market',
    name: 'NEAM Market',
    short: 'Market',
    description: 'Courses et produits du quotidien',
    tagline: 'Tout ce dont vous avez besoin, plus simplement.',
    gradient: 'linear-gradient(145deg, #ffa21a 0%, #ff6a00 100%)',
    color: '#f06400',
    soft: '#fff3e6',
    kind: 'shop',
    eta: '30-50 min',
    cta: 'Ajouter',
    searchHint: 'Rechercher un produit…',
    categories: ['Fruits & Légumes Frais', 'Produits alimentaires', 'Boissons', 'Hygiène & Beauté', 'Produits d’entretien', 'Bébé & Mum', 'Électronique & Maison'],
    features: [
      { icon: 'cart', label: 'Courses et produits du quotidien' },
      { icon: 'truck', label: 'Livraison rapide à domicile' },
      { icon: 'percent', label: 'Des prix compétitifs' },
      { icon: 'shield', label: 'Paiement sécurisé' },
    ],
    hero: { title: 'Tout pour votre quotidien', text: 'Fraîcheur, qualité et prix imbattables.', cta: 'Commander', emoji: ['🧺', '🍅', '🍌', '🥬', '🧃'] },
    quick: [
      { label: 'Fruits & Légumes Frais', icon: 'basket', tint: '#e5f8e9', cat: 'Fruits & Légumes Frais' },
      { label: 'Produits alimentaires', icon: 'wheat', tint: '#ffeede', cat: 'Produits alimentaires' },
      { label: 'Boissons', icon: 'bottle', tint: '#e5efff', cat: 'Boissons' },
      { label: 'Hygiène & Beauté', icon: 'sparkles', tint: '#ffe8f2', cat: 'Hygiène & Beauté' },
      { label: 'Produits d’entretien', icon: 'spray', tint: '#efe8ff', cat: 'Produits d’entretien' },
      { label: 'Bébé & Mum', icon: 'baby', tint: '#ffe8ee', cat: 'Bébé & Mum' },
      { label: 'Électronique & Maison', icon: 'washer', tint: '#e3f4ff', cat: 'Électronique & Maison' },
      { label: 'Et plus encore', icon: 'more', tint: '#f1f2f4', to: 'categories' },
    ],
    sections: [
      { title: 'Promotions du jour', filter: 'promo' },
      { title: 'Fruits & légumes frais', filter: 'Fruits & Légumes Frais' },
    ],
    banner: { title: 'Livraison rapide à domicile', text: 'Partout à Libreville et ses environs.', cta: 'Commander maintenant', emoji: ['🛵', '📦'] },
    nav: shopNav({ label: 'Promos', icon: 'tag', to: 'promos' }),
    visual: ['🧺', '🍍', '🥑', '🥖', '🍅'],
  },
  {
    id: 'food',
    name: 'NEAM Food',
    short: 'Food',
    description: 'Repas et livraison de repas',
    tagline: 'Des repas délicieux livrés chez vous.',
    gradient: 'linear-gradient(145deg, #ff4b4b 0%, #e3112f 100%)',
    color: '#e3112f',
    soft: '#ffecee',
    kind: 'shop',
    eta: '25-40 min',
    cta: 'Ajouter',
    searchHint: 'Rechercher un plat ou restaurant…',
    categories: ['Plats locaux', 'Fast food', 'Grillades', 'Healthy', 'Boissons', 'Desserts'],
    features: [
      { icon: 'chef', label: 'Restaurants à proximité' },
      { icon: 'menu', label: 'Large choix de menus' },
      { icon: 'truck', label: 'Livraison rapide' },
      { icon: 'route', label: 'Suivi de commande en temps réel' },
    ],
    hero: { title: 'Vos plats préférés livrés plus vite.', text: 'Les meilleurs restaurants de votre ville.', cta: 'Commander', emoji: ['🍗', '🍚', '🌶️', '🥘'] },
    quick: [
      { label: 'Plats locaux', icon: 'soup', tint: '#fff1e2', cat: 'Plats locaux' },
      { label: 'Fast food', icon: 'burger', tint: '#ffe9e9', cat: 'Fast food' },
      { label: 'Grillades', icon: 'flame', tint: '#ffe4e6', cat: 'Grillades' },
      { label: 'Healthy', icon: 'salad', tint: '#efe7ff', cat: 'Healthy' },
    ],
    sections: [
      { title: 'Restaurants populaires', filter: 'restaurants' },
      { title: 'Promotions', filter: 'promo' },
      { title: 'Les plus commandés', filter: 'popular' },
    ],
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Restaurants', icon: 'chef', to: 'restaurants' },
      { label: 'Panier', icon: 'cart', to: '/panier' },
      { label: 'Commandes', icon: 'package', to: 'commandes' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['🍲', '🍗', '🥘', '🌶️', '🍚'],
  },
  {
    id: 'express',
    name: 'NEAM Express',
    short: 'Express',
    description: 'Livraison rapide de courses, repas et colis',
    tagline: 'Plus loin pour vous, plus vite.',
    gradient: 'linear-gradient(145deg, #2fe08d 0%, #089b5a 100%)',
    color: '#079b5a',
    soft: '#e7fbf1',
    kind: 'express',
    eta: '2-6 h',
    cta: 'Envoyer',
    searchHint: 'Rechercher un envoi…',
    categories: [],
    features: [
      { icon: 'box', label: 'Livraison de colis' },
      { icon: 'zap', label: 'Courses express' },
      { icon: 'route', label: 'Suivi en temps réel' },
      { icon: 'pin', label: 'Partout au Gabon' },
    ],
    hero: { title: 'Plus loin pour vous, plus vite.', text: 'Un coursier à votre porte en quelques minutes.', cta: 'Envoyer un colis', emoji: ['🛵', '📦'] },
    quick: [],
    sections: [],
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Envois', icon: 'mail', to: 'commandes' },
      { label: 'Suivi', icon: 'pin', to: 'suivi' },
      { label: 'Tarifs', icon: 'receipt', to: 'tarifs' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['🛵', '📦', '⚡', '📍', '✉️'],
  },
  {
    id: 'health',
    name: 'NEAM Health',
    short: 'Health',
    description: 'Santé, parapharmacie et bien-être',
    tagline: 'Votre santé à portée de main.',
    gradient: 'linear-gradient(145deg, #2ab4ff 0%, #1361ef 100%)',
    color: '#1361ef',
    soft: '#e9f2ff',
    kind: 'shop',
    eta: '30-45 min',
    cta: 'Ajouter',
    searchHint: 'Rechercher un service de santé…',
    categories: ['Consultation', 'Pharmacie', 'Analyses', 'Parapharmacie', 'Bébé', 'Matériel'],
    features: [
      { icon: 'monitor', label: 'Consultations en ligne' },
      { icon: 'pill', label: 'Pharmacie en ligne' },
      { icon: 'calendar', label: 'Prise de rendez-vous' },
      { icon: 'clipboard', label: 'Suivi médical' },
      { icon: 'heart', label: 'Santé et bien-être' },
    ],
    hero: { title: 'Consultez un médecin en ligne', text: 'Où que vous soyez, 7j/7.', cta: 'Prendre rendez-vous', emoji: ['👩🏾‍⚕️', '🩺', '💊'] },
    quick: [
      { label: 'Consultation médicale', icon: 'doctor', tint: '#e3f6ff', cat: 'Consultation' },
      { label: 'Pharmacie en ligne', icon: 'pill', tint: '#e5f8e9', cat: 'Pharmacie' },
      { label: 'Rendez-vous', icon: 'calendar', tint: '#ffe8ec', to: 'commandes' },
      { label: 'Analyses médicales', icon: 'flask', tint: '#e3f2ff', cat: 'Analyses' },
    ],
    sections: [
      { title: 'Nos spécialités', filter: 'specialites' },
      { title: 'Pharmacie & parapharmacie', filter: 'Pharmacie' },
    ],
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Services', icon: 'grid', to: 'categories' },
      { label: 'Rendez-vous', icon: 'calendar', to: 'commandes' },
      { label: 'Panier', icon: 'cart', to: '/panier' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['💊', '🩺', '🧴', '🌡️', '💉'],
  },
  {
    id: 'print',
    name: 'NEAM Print',
    short: 'Print',
    description: 'Impression et supports marketing',
    tagline: 'Vos idées prennent vie.',
    gradient: 'linear-gradient(145deg, #b05cff 0%, #6a24d6 100%)',
    color: '#6a24d6',
    soft: '#f3ebff',
    kind: 'shop',
    eta: '24-48 h',
    cta: 'Commander',
    searchHint: 'Rechercher un produit…',
    categories: ['Impressions', 'Goodies', 'Supports pub', 'Papeterie'],
    features: [
      { icon: 'printer', label: 'Impression tous supports' },
      { icon: 'gift', label: 'Objets personnalisés' },
      { icon: 'megaphone', label: 'Supports marketing' },
      { icon: 'laptop', label: 'Commande en ligne' },
    ],
    hero: { title: 'Imprimez votre image de marque.', text: 'Cartes, flyers, textiles et objets personnalisés.', cta: 'Découvrir', emoji: ['🖨️', '📇', '👕'] },
    quick: [
      { label: 'Impressions', icon: 'printer', tint: '#ffe9e1', cat: 'Impressions' },
      { label: 'Goodies', icon: 'shirt', tint: '#eef0f3', cat: 'Goodies' },
      { label: 'Supports pub', icon: 'megaphone', tint: '#e5efff', cat: 'Supports pub' },
      { label: 'Papeterie', icon: 'folder', tint: '#ffe8f2', cat: 'Papeterie' },
    ],
    sections: [
      { title: 'Nos produits', filter: 'all' },
    ],
    banner: { title: 'Personnalisez vos supports en quelques clics.', text: 'Envoyez votre visuel, on s’occupe du reste.', cta: 'Commencer', emoji: ['👕', '☕'] },
    nav: shopNav(),
    visual: ['🖨️', '👕', '☕', '📇', '🪧'],
  },
  {
    id: 'services',
    name: 'NEAM Services',
    short: 'Services',
    description: 'Assistance, conciergerie, réservation, etc.',
    tagline: 'Des solutions pour le quotidien.',
    gradient: 'linear-gradient(145deg, #ffcf2e 0%, #ff9a00 100%)',
    color: '#d97a00',
    soft: '#fff8e1',
    kind: 'shop',
    eta: 'Sur rendez-vous',
    cta: 'Réserver',
    searchHint: 'Rechercher un service…',
    categories: ['Ménage', 'Plomberie', 'Électricité', 'Informatique', 'Climatisation', 'Jardinage', 'Garde d’enfants', 'Autres'],
    features: [
      { icon: 'concierge', label: 'Conciergerie' },
      { icon: 'home', label: 'Assistance à domicile' },
      { icon: 'calendar', label: 'Réservation de services' },
      { icon: 'clipboard', label: 'Devis rapide' },
      { icon: 'wallet', label: 'Paiement' },
    ],
    hero: { title: 'On s’occupe de tout, vous profitez.', text: 'Des pros vérifiés, à domicile, au bon moment.', cta: 'Réserver', emoji: ['🧹', '🔧', '💡'] },
    quick: [
      { label: 'Ménage', icon: 'broom', tint: '#fff3d9', cat: 'Ménage' },
      { label: 'Plomberie', icon: 'wrench', tint: '#e2f7ee', cat: 'Plomberie' },
      { label: 'Électricité', icon: 'plug', tint: '#ffeedd', cat: 'Électricité' },
      { label: 'Informatique', icon: 'monitor', tint: '#e3f2ff', cat: 'Informatique' },
      { label: 'Climatisation', icon: 'snow', tint: '#e5f1ff', cat: 'Climatisation' },
      { label: 'Jardinage', icon: 'sprout', tint: '#e8f8e3', cat: 'Jardinage' },
      { label: 'Garde d’enfants', icon: 'baby', tint: '#ffe8ee', cat: 'Garde d’enfants' },
      { label: 'Autres', icon: 'more', tint: '#f1f2f4', cat: 'Autres' },
    ],
    sections: [{ title: 'Services populaires', filter: 'popular' }],
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Services', icon: 'grid', to: 'categories' },
      { label: 'Réservations', icon: 'calendar', to: 'commandes' },
      { label: 'Favoris', icon: 'heart', to: '/favoris' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['🛎️', '🧹', '🚗', '📅', '🗂️'],
  },
  {
    id: 'brico',
    name: 'Brico&Deco by NEAM',
    short: 'Brico&Deco',
    tileTitle: 'Brico&Deco',
    tileSub: 'by NEAM',
    description: 'Bricolage, décoration et équipement',
    tagline: 'Bricolage, décoration et équipement.',
    gradient: 'linear-gradient(145deg, #ff8a2b 0%, #e5530a 100%)',
    color: '#e5530a',
    soft: '#fff0e6',
    kind: 'shop',
    eta: '2-4 h',
    cta: 'Ajouter',
    searchHint: 'Rechercher un produit…',
    categories: ['Bricolage', 'Décoration', 'Peinture', 'Électricité', 'Plomberie', 'Jardin', 'Sécurité', 'Maison'],
    features: [
      { icon: 'tools', label: 'Outils et matériel' },
      { icon: 'home', label: 'Décoration maison' },
      { icon: 'hardhat', label: 'Équipement pro' },
      { icon: 'truck', label: 'Livraison partout' },
    ],
    hero: { title: 'Tout pour construire, réparer et embellir.', text: 'Outils, peinture, déco et artisans vérifiés.', cta: 'Découvrir', emoji: ['🧰', '🪛', '🎨'] },
    quick: [
      { label: 'Bricolage', icon: 'hammer', tint: '#ffeadb', cat: 'Bricolage' },
      { label: 'Décoration', icon: 'lamp', tint: '#e2f6ee', cat: 'Décoration' },
      { label: 'Peinture', icon: 'paint', tint: '#efe8ff', cat: 'Peinture' },
      { label: 'Électricité', icon: 'bulb', tint: '#fff4d6', cat: 'Électricité' },
      { label: 'Plomberie', icon: 'droplet', tint: '#e3f2ff', cat: 'Plomberie' },
      { label: 'Jardin', icon: 'sprout', tint: '#e8f8e3', cat: 'Jardin' },
      { label: 'Sécurité', icon: 'lock', tint: '#fff1dd', cat: 'Sécurité' },
      { label: 'Maison', icon: 'home', tint: '#ece8ff', cat: 'Maison' },
    ],
    sections: [{ title: 'Produits populaires', filter: 'popular' }],
    banner: { title: 'Équipez vos projets de A à Z.', text: 'Outillage pro et conseils d’experts.', cta: 'Découvrir', emoji: ['🧰', '🔨'] },
    nav: shopNav(),
    visual: ['🧰', '🔨', '🎨', '💡', '🪛'],
  },
  {
    id: 'beauty',
    name: 'NEAM Beauty',
    short: 'Beauty',
    description: 'Beauté, soins et cosmétiques',
    tagline: 'Beauté, soins et cosmétiques.',
    gradient: 'linear-gradient(145deg, #ff5fae 0%, #e0157a 100%)',
    color: '#d6136f',
    soft: '#ffebf5',
    kind: 'shop',
    eta: '45-90 min',
    cta: 'Ajouter',
    searchHint: 'Rechercher un produit…',
    categories: ['Maquillage', 'Soins visage', 'Soins corps', 'Cheveux', 'Parfums', 'Hommes', 'Accessoires', 'Nouveautés'],
    features: [
      { icon: 'bottle', label: 'Produits de beauté' },
      { icon: 'sparkles', label: 'Soins visage & corps' },
      { icon: 'gift', label: 'Parfums' },
      { icon: 'check', label: 'Conseils beauté' },
      { icon: 'truck', label: 'Livraison rapide' },
    ],
    hero: { title: 'Sublimez-vous, à domicile.', text: 'Cosmétiques, soins et prestations beauté.', cta: 'Découvrir', emoji: ['💄', '🧴', '💅'] },
    quick: [
      { label: 'Maquillage', icon: 'brush', tint: '#ffe8ef', cat: 'Maquillage' },
      { label: 'Soins visage', icon: 'smile', tint: '#ffe8f2', cat: 'Soins visage' },
      { label: 'Soins corps', icon: 'spray', tint: '#ffe8f2', cat: 'Soins corps' },
      { label: 'Cheveux', icon: 'scissors', tint: '#fff0de', cat: 'Cheveux' },
      { label: 'Parfums', icon: 'bottle', tint: '#e5efff', cat: 'Parfums' },
      { label: 'Hommes', icon: 'user', tint: '#e2f6ee', cat: 'Hommes' },
      { label: 'Accessoires', icon: 'gem', tint: '#ffe9e9', cat: 'Accessoires' },
      { label: 'Nouveautés', icon: 'star', tint: '#e3f2ff', cat: 'Nouveautés' },
    ],
    sections: [{ title: 'Nos best-sellers', filter: 'popular' }],
    banner: { title: 'Révélez votre beauté au quotidien.', text: 'Prestations à domicile par des pros.', cta: 'Découvrir', emoji: ['💅🏾', '✨'] },
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Catégories', icon: 'grid', to: 'categories' },
      { label: 'Panier', icon: 'cart', to: '/panier' },
      { label: 'Favoris', icon: 'heart', to: '/favoris' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['💄', '🧴', '💅', '🌸', '✨'],
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
    kind: 'shop',
    eta: '1-3 h',
    cta: 'Ajouter',
    searchHint: 'Rechercher un produit tech…',
    categories: ['Smartphones', 'Informatique', 'Audio', 'Accessoires', 'Réparation', 'Digital'],
    features: [
      { icon: 'phone', label: 'Smartphones et accessoires' },
      { icon: 'laptop', label: 'Informatique' },
      { icon: 'wrench', label: 'Réparation et maintenance' },
      { icon: 'globe', label: 'Solutions digitales' },
    ],
    hero: { title: 'La tech au meilleur prix.', text: 'Garantie, livraison et service après-vente.', cta: 'Découvrir', emoji: ['💻', '📱', '🎧'] },
    quick: [
      { label: 'Smartphones', icon: 'phone', tint: '#e3f2ff', cat: 'Smartphones' },
      { label: 'Informatique', icon: 'laptop', tint: '#e8eefc', cat: 'Informatique' },
      { label: 'Audio', icon: 'headphones', tint: '#efe8ff', cat: 'Audio' },
      { label: 'Accessoires', icon: 'plug', tint: '#e2f6ee', cat: 'Accessoires' },
      { label: 'Réparation', icon: 'wrench', tint: '#fff1dd', cat: 'Réparation' },
      { label: 'Digital', icon: 'globe', tint: '#e3f7ff', cat: 'Digital' },
    ],
    sections: [
      { title: 'Bons plans', filter: 'promo' },
      { title: 'Les incontournables', filter: 'popular' },
    ],
    nav: shopNav(),
    visual: ['💻', '🎧', '📱', '⌚', '🔌'],
  },
  {
    id: 'tremplin',
    name: 'Tremplin by NEAM',
    short: 'Tremplin',
    tileTitle: 'Tremplin',
    tileSub: 'by NEAM',
    description: 'Stages, emplois et formations',
    tagline: 'Mon avenir commence ici !',
    gradient: 'linear-gradient(145deg, #1aa5ff 0%, #1450e6 100%)',
    color: '#1450e6',
    soft: '#eaf2ff',
    kind: 'tremplin',
    eta: '',
    cta: 'Postuler',
    searchHint: 'Quel stage ou emploi ?',
    categories: [],
    features: [
      { icon: 'search', label: 'Trouve des offres' },
      { icon: 'file', label: 'Crée ton CV' },
      { icon: 'graduation', label: 'Développe tes compétences' },
      { icon: 'building', label: 'Découvre les entreprises' },
    ],
    hero: { title: 'De je cherche un stage à je suis prêt à candidater.', text: 'Tremplin t’accompagne à chaque étape.', cta: 'Rechercher', emoji: [] },
    quick: [],
    sections: [],
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Offres', icon: 'briefcase', to: 'offres' },
      { label: 'CV', icon: 'file', to: 'cv' },
      { label: 'Formations', icon: 'graduation', to: 'formations' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['🎓', '💼', '📄', '🚀', '🏢'],
    isNew: true,
  },
  {
    id: 'gurutools',
    name: 'GuruTools by NEAM',
    short: 'GuruTools',
    tileTitle: 'GuruTools',
    tileSub: 'by NEAM',
    description: 'Recrutement simplifié pour TPE et PME',
    tagline: 'Le recrutement, sans la paperasse.',
    gradient: 'linear-gradient(145deg, #22c3ff 0%, #0b5cf0 100%)',
    color: '#0b5cf0',
    soft: '#e8f1ff',
    kind: 'gurutools',
    eta: '',
    cta: 'Créer une annonce',
    searchHint: 'Rechercher un candidat…',
    categories: [],
    features: [
      { icon: 'file', label: 'Créez votre annonce' },
      { icon: 'share', label: 'Partagez votre lien' },
      { icon: 'users', label: 'Recevez et classez' },
      { icon: 'check', label: 'Choisissez en toute confiance' },
    ],
    hero: { title: 'Le recrutement, sans la paperasse.', text: 'Candidatures classées par pertinence grâce à l’IA.', cta: 'Créer une annonce', emoji: [] },
    quick: [],
    sections: [],
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Recrutements', icon: 'briefcase', to: 'tableau' },
      { label: 'Annonce', icon: 'plus', to: 'annonce' },
      { label: 'Candidats', icon: 'users', to: 'candidats' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['🧑🏾‍💼', '📋', '🤝', '📈', '✅'],
    isNew: true,
  },
  {
    id: 'legal',
    name: 'Guru Légal by NEAM',
    short: 'Guru Légal',
    tileTitle: 'Guru Légal',
    tileSub: 'by NEAM',
    description: 'Conseil juridique et documents légaux',
    tagline: 'Des solutions juridiques simples pour avancer sereinement.',
    gradient: 'linear-gradient(145deg, #1f62e0 0%, #0b2a6b 100%)',
    color: '#0b3a8f',
    soft: '#eef3fc',
    kind: 'legal',
    eta: 'Sous 24 h',
    cta: 'Commander',
    searchHint: 'Rechercher un service juridique…',
    categories: ['Entreprise', 'Contrats', 'Travail', 'Immobilier', 'Famille', 'Recouvrement'],
    features: [
      { icon: 'scale', label: 'Conseil juridique' },
      { icon: 'file', label: 'Contrats et actes' },
      { icon: 'building', label: 'Création d’entreprise' },
      { icon: 'shield', label: 'Confidentialité garantie' },
    ],
    hero: { title: 'Le droit, enfin simple.', text: 'Juristes qualifiés, documents conformes au droit gabonais.', cta: 'Consulter un juriste', emoji: [] },
    quick: [],
    sections: [],
    nav: [
      { label: 'Accueil', icon: 'home', to: '' },
      { label: 'Documents', icon: 'file', to: 'categories' },
      { label: 'Rendez-vous', icon: 'calendar', to: 'commandes' },
      { label: 'Panier', icon: 'cart', to: '/panier' },
      { label: 'NEAM', icon: 'neam', to: '/' },
    ],
    visual: ['⚖️', '📜', '🏛️', '✍️', '🤝'],
    isNew: true,
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
