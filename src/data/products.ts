import type { ServiceId } from './services'

export type Product = {
  id: string
  serviceId: ServiceId
  name: string
  category: string
  price: number
  oldPrice?: number
  emoji: string
  unit: string
  rating: number
  vendor: string
  description: string
  badge?: string
  popular?: boolean
}

type Row = [
  id: string,
  name: string,
  category: string,
  price: number,
  emoji: string,
  unit: string,
  vendor: string,
  description: string,
  extra?: { oldPrice?: number; badge?: string; popular?: boolean; rating?: number },
]

const rows: Record<ServiceId, Row[]> = {
  market: [
    ['m1', 'Banane plantain', 'Fruits & légumes', 3500, '🍌', 'le régime', 'Marché Mont-Bouët', 'Régime de bananes plantain mûres à point, idéales pour l’alloco ou en accompagnement.', { popular: true }],
    ['m2', 'Bâtons de manioc', 'Fruits & légumes', 1500, '🥖', 'lot de 3', 'Marché Nkembo', 'Bâtons de manioc frais, préparés de façon traditionnelle.'],
    ['m3', 'Ananas du Gabon', 'Fruits & légumes', 1000, '🍍', 'la pièce', 'Ferme d’Okolassi', 'Ananas sucré et juteux, cultivé localement.', { badge: 'Local' }],
    ['m4', 'Avocats', 'Fruits & légumes', 1200, '🥑', 'lot de 4', 'Marché Mont-Bouët', 'Avocats crémeux, prêts à consommer.'],
    ['m5', 'Riz parfumé 5 kg', 'Épicerie', 6500, '🍚', 'le sac', 'NEAM Market', 'Riz long grain parfumé, sac de 5 kg.', { oldPrice: 7500, badge: '-13%', popular: true }],
    ['m6', 'Huile végétale 1 L', 'Épicerie', 1800, '🫗', 'la bouteille', 'NEAM Market', 'Huile végétale raffinée pour toutes vos cuissons.'],
    ['m7', 'Eau minérale x6', 'Boissons', 2400, '💧', 'pack 6 x 1,5 L', 'NEAM Market', 'Pack de 6 bouteilles d’eau minérale naturelle.'],
    ['m8', 'Jus de bissap', 'Boissons', 1000, '🧃', '1 L', 'Saveurs d’Afrique', 'Jus d’hibiscus artisanal, légèrement sucré.'],
    ['m9', 'Poulet fermier', 'Frais', 5500, '🍗', '≈ 1,5 kg', 'Ferme d’Okolassi', 'Poulet fermier élevé en plein air, vidé et prêt à cuire.'],
    ['m10', 'Œufs frais x30', 'Frais', 4200, '🥚', 'le plateau', 'Ferme d’Okolassi', 'Plateau de 30 œufs frais extra.'],
    ['m11', 'Savon & lessive', 'Maison', 3200, '🧼', 'kit', 'NEAM Market', 'Kit entretien : lessive 1 kg + 4 savons.'],
  ],
  food: [
    ['f1', 'Poulet nyembwe', 'Gabonais', 6500, '🍲', 'la portion', 'Chez Maman Lucie', 'Le plat national : poulet mijoté à la sauce graine de palme, servi avec riz ou manioc.', { popular: true, badge: 'Top', rating: 4.9 }],
    ['f2', 'Poisson braisé', 'Grillades', 7000, '🐟', 'la pièce', 'Le Braisé du Bord de Mer', 'Capitaine braisé aux épices, bananes plantain frites et piment.', { popular: true }],
    ['f3', 'Brochettes de bœuf', 'Grillades', 3000, '🍢', 'x5', 'Le Coin Grillades', 'Brochettes marinées et grillées au feu de bois.'],
    ['f4', 'Feuilles de manioc', 'Gabonais', 4500, '🥬', 'la portion', 'Chez Maman Lucie', 'Feuilles de manioc pilées au poisson fumé et à la pâte d’arachide.'],
    ['f5', 'Poulet DG', 'Gabonais', 7500, '🍗', 'la portion', 'Saveurs d’Afrique', 'Poulet sauté aux plantains, carottes et poivrons.', { oldPrice: 9000, badge: '-17%' }],
    ['f6', 'Burger NEAM', 'Fast-food', 5000, '🍔', 'menu', 'Urban Burger', 'Double steak, cheddar, sauce maison, frites et boisson.'],
    ['f7', 'Pizza Reine', 'Fast-food', 8000, '🍕', '33 cm', 'Pizza Bella', 'Tomate, mozzarella, jambon, champignons.'],
    ['f8', 'Jus de gingembre', 'Boissons', 1000, '🥤', '50 cl', 'Saveurs d’Afrique', 'Jus de gingembre frais, citron et menthe.'],
    ['f9', 'Beignets & bouillie', 'Desserts', 1500, '🍩', 'x6', 'Chez Maman Lucie', 'Beignets de farine moelleux et bouillie de maïs.'],
  ],
  express: [],
  health: [
    ['h1', 'Paracétamol 500 mg', 'Médicaments', 1500, '💊', 'boîte de 16', 'Pharmacie du Centre', 'Antalgique et antipyrétique. Lire attentivement la notice.', { popular: true }],
    ['h2', 'Vitamine C 1000', 'Parapharmacie', 3500, '🍊', '20 comprimés', 'Pharmacie du Centre', 'Comprimés effervescents pour renforcer vos défenses.'],
    ['h3', 'Test rapide paludisme', 'Matériel', 2500, '🧪', 'l’unité', 'Pharmacie de Glass', 'Test de diagnostic rapide, résultat en 15 minutes.', { badge: 'Essentiel' }],
    ['h4', 'Gel hydroalcoolique', 'Parapharmacie', 2000, '🧴', '500 ml', 'Pharmacie de Glass', 'Gel désinfectant pour les mains, 70% d’alcool.'],
    ['h5', 'Thermomètre digital', 'Matériel', 6000, '🌡️', 'la pièce', 'Pharmacie du Centre', 'Mesure rapide en 10 secondes, embout flexible.'],
    ['h6', 'Couches bébé T3', 'Bébé', 9500, '👶', 'paquet de 50', 'Pharmacie de Glass', 'Couches ultra-absorbantes, 6-10 kg.', { oldPrice: 11000, badge: '-14%' }],
    ['h7', 'Moustiquaire imprégnée', 'Matériel', 7000, '🛏️', '2 places', 'Pharmacie du Centre', 'Moustiquaire longue durée imprégnée d’insecticide.'],
    ['h8', 'Téléconsultation', 'Consultation', 10000, '🩺', '20 min', 'NEAM Health', 'Consultez un médecin généraliste en vidéo, ordonnance numérique incluse.', { popular: true, badge: 'Nouveau' }],
  ],
  print: [
    ['p1', 'Cartes de visite', 'Papeterie', 15000, '📇', 'x250', 'NEAM Print Studio', 'Cartes 350 g, recto-verso, pelliculage mat.', { popular: true }],
    ['p2', 'Flyers A5', 'Papeterie', 35000, '📄', 'x500', 'NEAM Print Studio', 'Flyers couleur recto-verso, papier 135 g.'],
    ['p3', 'T-shirt personnalisé', 'Textile', 7500, '👕', 'la pièce', 'NEAM Print Studio', 'T-shirt 100% coton avec votre logo ou visuel.', { badge: 'Top' }],
    ['p4', 'Mug personnalisé', 'Objets', 5000, '☕', 'la pièce', 'NEAM Print Studio', 'Mug céramique 33 cl, impression haute définition.'],
    ['p5', 'Kakémono roll-up', 'Grand format', 45000, '🪧', '85 x 200 cm', 'NEAM Print Studio', 'Roll-up avec structure et housse de transport.'],
    ['p6', 'Banderole PVC', 'Grand format', 25000, '🎏', '3 x 1 m', 'NEAM Print Studio', 'Bâche PVC 440 g avec œillets.'],
    ['p7', 'Impression documents', 'Papeterie', 100, '🖨️', 'la page', 'NEAM Print Studio', 'Impression A4 noir & blanc ou couleur, retrait ou livraison.'],
  ],
  services: [
    ['s1', 'Ménage à domicile', 'Maison', 15000, '🧹', '4 heures', 'NEAM Services', 'Aide ménagère vérifiée, produits inclus.', { popular: true }],
    ['s2', 'Chauffeur privé', 'Transport', 30000, '🚗', 'la journée', 'NEAM Services', 'Véhicule climatisé avec chauffeur pour vos déplacements.'],
    ['s3', 'Transfert aéroport', 'Transport', 10000, '✈️', 'le trajet', 'NEAM Services', 'Accueil à l’aéroport Léon Mba et transfert jusqu’à votre adresse.'],
    ['s4', 'Démarches administratives', 'Administratif', 20000, '🗂️', 'le dossier', 'NEAM Services', 'Nous gérons vos démarches : légalisations, dépôts, retraits.'],
    ['s5', 'Réservation restaurant', 'Conciergerie', 0, '🍽️', 'gratuit', 'NEAM Services', 'Réservez une table dans les meilleurs restaurants.', { badge: 'Gratuit' }],
    ['s6', 'Courses personnalisées', 'Conciergerie', 5000, '🛍️', 'la mission', 'NEAM Services', 'Un concierge fait vos achats où vous voulez.'],
  ],
  brico: [
    ['b1', 'Perceuse visseuse', 'Outillage', 45000, '🪛', 'la pièce', 'Brico&Deco', 'Perceuse sans fil 18 V, 2 batteries et coffret.', { popular: true }],
    ['b2', 'Caisse à outils', 'Outillage', 28000, '🧰', '108 pièces', 'Brico&Deco', 'Coffret complet : clés, tournevis, marteau, pinces.'],
    ['b3', 'Peinture blanche 20 L', 'Peinture', 38000, '🎨', 'le seau', 'Brico&Deco', 'Peinture acrylique mate, haute couvrance, intérieur.', { oldPrice: 42000, badge: '-10%' }],
    ['b4', 'Ampoules LED x4', 'Électricité', 6000, '💡', 'lot', 'Brico&Deco', 'Ampoules LED E27 9 W, lumière chaude.'],
    ['b5', 'Multiprise parafoudre', 'Électricité', 9000, '🔌', '5 prises', 'Brico&Deco', 'Protection contre les surtensions, câble 1,5 m.'],
    ['b6', 'Plante décorative', 'Déco', 15000, '🪴', 'avec pot', 'Brico&Deco', 'Plante d’intérieur en pot céramique.'],
    ['b7', 'Plombier à domicile', 'Artisans', 15000, '🔧', 'intervention', 'Artisans NEAM', 'Artisan vérifié, devis gratuit, intervention rapide.', { badge: 'Pro' }],
  ],
  beauty: [
    ['be1', 'Beurre de karité pur', 'Soins', 4000, '🧈', '250 g', 'Karité d’Or', 'Beurre de karité brut, non raffiné, pour peau et cheveux.', { popular: true }],
    ['be2', 'Tresses à domicile', 'À domicile', 20000, '💇🏾‍♀️', 'la prestation', 'Beauty Home', 'Coiffeuse professionnelle à domicile, mèches non incluses.', { badge: 'Top' }],
    ['be3', 'Rouge à lèvres mat', 'Maquillage', 6500, '💄', 'la pièce', 'Glow Cosmetics', 'Tenue longue durée, fini velours.'],
    ['be4', 'Parfum floral', 'Parfums', 25000, '🌸', '50 ml', 'Maison Parfums', 'Eau de parfum aux notes de jasmin et d’ylang-ylang.'],
    ['be5', 'Manucure & pédicure', 'À domicile', 12000, '💅', 'la prestation', 'Beauty Home', 'Soin complet des mains et des pieds à domicile.'],
    ['be6', 'Huile de coco', 'Cheveux', 3500, '🥥', '200 ml', 'Karité d’Or', 'Huile de coco vierge pour nourrir les cheveux.'],
    ['be7', 'Sérum éclat', 'Soins', 14000, '✨', '30 ml', 'Glow Cosmetics', 'Sérum vitamine C pour un teint lumineux.', { oldPrice: 17000, badge: '-18%' }],
  ],
  tech: [
    ['t1', 'Smartphone Android', 'Smartphones', 145000, '📱', '128 Go', 'NEAM Tech Store', 'Écran 6,6", 128 Go, double SIM, garantie 12 mois.', { popular: true }],
    ['t2', 'Écouteurs sans fil', 'Audio', 25000, '🎧', 'la paire', 'NEAM Tech Store', 'Réduction de bruit, autonomie 30 h avec boîtier.', { oldPrice: 32000, badge: '-22%' }],
    ['t3', 'Ordinateur portable', 'Informatique', 420000, '💻', '15,6"', 'NEAM Tech Store', 'Intel Core i5, 16 Go RAM, SSD 512 Go.'],
    ['t4', 'Power bank 20 000 mAh', 'Accessoires', 15000, '🔋', 'la pièce', 'NEAM Tech Store', 'Charge rapide, 2 ports USB + USB-C.', { popular: true }],
    ['t5', 'Montre connectée', 'Accessoires', 35000, '⌚', 'la pièce', 'NEAM Tech Store', 'Suivi santé, notifications, étanche.'],
    ['t6', 'Réparation d’écran', 'Informatique', 30000, '🛠️', 'à partir de', 'NEAM Tech Lab', 'Remplacement d’écran smartphone, garantie 3 mois.'],
    ['t7', 'Création de site web', 'Digital', 250000, '🌐', 'le projet', 'NEAM Digital', 'Site vitrine responsive, nom de domaine et hébergement 1 an.', { badge: 'Pro' }],
  ],
}

export const PRODUCTS: Product[] = Object.entries(rows).flatMap(([serviceId, list]) =>
  list.map(([id, name, category, price, emoji, unit, vendor, description, extra]) => ({
    id,
    serviceId: serviceId as ServiceId,
    name,
    category,
    price,
    emoji,
    unit,
    vendor,
    description,
    rating: extra?.rating ?? Math.round((4.3 + ((id.charCodeAt(id.length - 1) * 7) % 7) / 10) * 10) / 10,
    oldPrice: extra?.oldPrice,
    badge: extra?.badge,
    popular: extra?.popular,
  })),
)

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<string, Product>

export const productsOf = (serviceId: ServiceId) => PRODUCTS.filter((p) => p.serviceId === serviceId)
