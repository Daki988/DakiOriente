import type { ServiceId } from './services'

export type Product = {
  id: string
  serviceId: ServiceId
  name: string
  category: string
  /** Sous-catégorie (ex. Fruits / Légumes / Tubercules) */
  sub?: string
  price: number
  oldPrice?: number
  emoji: string
  unit: string
  rating: number
  vendor: string
  description: string
  badge?: string
  popular?: boolean
  /** Prix affiché « à partir de » */
  from?: boolean
  /** Prestation à réserver (créneau) plutôt qu'un article livré */
  booking?: boolean
  /** Article personnalisable (envoi d'un visuel) */
  custom?: boolean
}

type Extra = Partial<Pick<Product, 'oldPrice' | 'badge' | 'popular' | 'rating' | 'sub' | 'from' | 'booking' | 'custom'>>
type Row = [id: string, name: string, category: string, price: number, emoji: string, unit: string, vendor: string, description: string, extra?: Extra]

const rows: Partial<Record<ServiceId, Row[]>> = {
  market: [
    ['m1', 'Tomate', 'Fruits & Légumes Frais', 1000, '🍅', '1 kg', 'Marché Mont-Bouët', 'Tomates fraîches et bien mûres, idéales pour vos sauces.', { sub: 'Légumes' }],
    ['m2', 'Oignon', 'Fruits & Légumes Frais', 800, '🧅', '1 kg', 'Marché Mont-Bouët', 'Oignons jaunes, indispensables en cuisine.', { sub: 'Légumes' }],
    ['m3', 'Piment', 'Fruits & Légumes Frais', 300, '🌶️', '100 g', 'Marché Nkembo', 'Piment frais local, pour relever tous vos plats.', { sub: 'Légumes' }],
    ['m4', 'Carotte', 'Fruits & Légumes Frais', 900, '🥕', '1 kg', 'Ferme d’Okolassi', 'Carottes croquantes cultivées localement.', { sub: 'Légumes' }],
    ['m5', 'Poivron', 'Fruits & Légumes Frais', 1200, '🫑', '1 kg', 'Ferme d’Okolassi', 'Poivrons rouges, jaunes et verts.', { sub: 'Légumes' }],
    ['m6', 'Chou', 'Fruits & Légumes Frais', 1000, '🥬', '1 pièce', 'Marché Nkembo', 'Chou pommé frais.', { sub: 'Légumes' }],
    ['m7', 'Banane plantain', 'Fruits & Légumes Frais', 600, '🍌', '1 kg', 'Marché Mont-Bouët', 'Bananes plantain mûres à point, pour l’alloco ou en accompagnement.', { sub: 'Fruits', oldPrice: 750, badge: '-20%', popular: true }],
    ['m8', 'Manioc', 'Fruits & Légumes Frais', 700, '🍠', '1 kg', 'Marché Nkembo', 'Tubercules de manioc frais.', { sub: 'Tubercules' }],
    ['m9', 'Avocat', 'Fruits & Légumes Frais', 1500, '🥑', '1 kg', 'Marché Mont-Bouët', 'Avocats crémeux, prêts à consommer.', { sub: 'Fruits' }],
    ['m10', 'Ananas du Gabon', 'Fruits & Légumes Frais', 1000, '🍍', 'la pièce', 'Ferme d’Okolassi', 'Ananas sucré et juteux, cultivé localement.', { sub: 'Fruits', badge: 'Local' }],
    ['m11', 'Igname', 'Fruits & Légumes Frais', 1200, '🥔', '1 kg', 'Marché Nkembo', 'Igname blanche, ferme et savoureuse.', { sub: 'Tubercules' }],
    ['m12', 'Riz parfumé', 'Produits alimentaires', 4250, '🍚', '5 kg', 'NEAM Market', 'Riz long grain parfumé, sac de 5 kg.', { oldPrice: 5000, badge: '-15%', popular: true }],
    ['m13', 'Huile végétale', 'Produits alimentaires', 1200, '🫗', '1 L', 'NEAM Market', 'Huile végétale raffinée pour toutes vos cuissons.', { popular: true }],
    ['m14', 'Bâtons de manioc', 'Produits alimentaires', 1500, '🥖', 'lot de 3', 'Marché Nkembo', 'Bâtons de manioc préparés de façon traditionnelle.'],
    ['m15', 'Sardines à l’huile', 'Produits alimentaires', 2000, '🐟', 'lot de 4', 'NEAM Market', 'Sardines à l’huile végétale, boîtes de 125 g.'],
    ['m16', 'Eau minérale', 'Boissons', 2400, '💧', 'pack 6 x 1,5 L', 'NEAM Market', 'Pack de 6 bouteilles d’eau minérale naturelle.'],
    ['m17', 'Jus de bissap', 'Boissons', 1000, '🧃', '1 L', 'Saveurs d’Afrique', 'Jus d’hibiscus artisanal, légèrement sucré.', { oldPrice: 1300, badge: '-23%' }],
    ['m18', 'Savon de toilette', 'Hygiène & Beauté', 1500, '🧼', 'lot de 4', 'NEAM Market', 'Savons parfumés pour toute la famille.'],
    ['m19', 'Dentifrice', 'Hygiène & Beauté', 1200, '🪥', '100 ml', 'NEAM Market', 'Protection complète, haleine fraîche.'],
    ['m20', 'Lessive en poudre', 'Produits d’entretien', 3200, '🧺', '2 kg', 'NEAM Market', 'Lessive efficace dès 30 °C.'],
    ['m21', 'Eau de Javel', 'Produits d’entretien', 900, '🧴', '1 L', 'NEAM Market', 'Désinfecte et blanchit.'],
    ['m22', 'Lait infantile', 'Bébé & Mum', 8500, '🍼', '800 g', 'NEAM Market', 'Lait 2e âge, de 6 à 12 mois.'],
    ['m23', 'Couches T4', 'Bébé & Mum', 9000, '👶', 'paquet de 44', 'NEAM Market', 'Couches ultra-absorbantes 9-14 kg.', { oldPrice: 10500, badge: '-14%' }],
    ['m24', 'Ventilateur sur pied', 'Électronique & Maison', 18000, '🌀', 'la pièce', 'NEAM Market', 'Ventilateur 3 vitesses, oscillant, 40 cm.'],
    ['m25', 'Bouilloire électrique', 'Électronique & Maison', 9500, '🫖', '1,7 L', 'NEAM Market', 'Arrêt automatique, base 360°.'],
  ],
  food: [
    ['f1', 'Poulet nyembwe', 'Plats locaux', 6500, '🍲', 'la portion', 'Chez Mami', 'Le plat national : poulet mijoté à la sauce graine de palme, servi avec riz ou manioc.', { popular: true, badge: 'Top', rating: 4.9 }],
    ['f2', 'Feuilles de manioc', 'Plats locaux', 4500, '🥬', 'la portion', 'Chez Mami', 'Feuilles de manioc pilées au poisson fumé et à la pâte d’arachide.'],
    ['f3', 'Poulet DG', 'Plats locaux', 7500, '🍗', 'la portion', 'Le Gourmet', 'Poulet sauté aux plantains, carottes et poivrons.', { popular: true }],
    ['f4', 'Menu Poulet braisé + Boisson', 'Grillades', 3500, '🍗', 'menu', 'Jackboy 241', 'Poulet braisé, alloco, piment et boisson au choix.', { oldPrice: 4400, badge: '-20%', popular: true }],
    ['f5', 'Poisson braisé', 'Grillades', 7000, '🐟', 'la pièce', 'Le Gourmet', 'Capitaine braisé aux épices, bananes plantain frites.'],
    ['f6', 'Brochettes de bœuf', 'Grillades', 3000, '🍢', 'x5', 'Jackboy 241', 'Brochettes marinées et grillées au feu de bois.'],
    ['f7', 'Burger NEAM', 'Fast food', 5000, '🍔', 'menu', 'Jackboy 241', 'Double steak, cheddar, sauce maison, frites et boisson.'],
    ['f8', 'Pizza Reine', 'Fast food', 8000, '🍕', '33 cm', 'Le Gourmet', 'Tomate, mozzarella, jambon, champignons.', { oldPrice: 9500, badge: '-16%' }],
    ['f9', 'Chawarma poulet', 'Fast food', 2500, '🌯', 'la pièce', 'Jackboy 241', 'Poulet mariné, crudités et sauce blanche.'],
    ['f10', 'Bowl avocat & quinoa', 'Healthy', 5500, '🥗', 'le bol', 'Green Corner', 'Quinoa, avocat, légumes croquants, vinaigrette citron.'],
    ['f11', 'Salade de fruits', 'Healthy', 2500, '🍉', 'le pot', 'Green Corner', 'Fruits de saison frais coupés.'],
    ['f12', 'Jus de gingembre', 'Boissons', 1000, '🥤', '50 cl', 'Chez Mami', 'Jus de gingembre frais, citron et menthe.'],
    ['f13', 'Beignets & bouillie', 'Desserts', 1500, '🍩', 'x6', 'Chez Mami', 'Beignets moelleux et bouillie de maïs.'],
  ],
  health: [
    ['h1', 'Téléconsultation généraliste', 'Consultation', 10000, '👩🏾‍⚕️', '20 min en vidéo', 'NEAM Health', 'Consultez un médecin généraliste en vidéo, ordonnance numérique incluse.', { popular: true, badge: 'Nouveau', booking: true }],
    ['h2', 'Consultation pédiatrique', 'Consultation', 15000, '🧒🏾', '30 min', 'Clinique partenaire', 'Pédiatre au cabinet ou en vidéo.', { booking: true }],
    ['h3', 'Consultation gynécologique', 'Consultation', 20000, '🩺', '30 min', 'Clinique partenaire', 'Suivi gynécologique et prénatal.', { booking: true }],
    ['h4', 'Paracétamol 500 mg', 'Pharmacie', 1500, '💊', 'boîte de 16', 'Pharmacie du Centre', 'Antalgique et antipyrétique. Lire attentivement la notice.', { popular: true }],
    ['h5', 'Vitamine C 1000', 'Pharmacie', 3500, '🍊', '20 comprimés', 'Pharmacie du Centre', 'Comprimés effervescents pour renforcer vos défenses.'],
    ['h6', 'Test rapide paludisme', 'Pharmacie', 2500, '🧪', 'l’unité', 'Pharmacie de Glass', 'Test de diagnostic rapide, résultat en 15 minutes.', { badge: 'Essentiel' }],
    ['h7', 'Bilan sanguin complet', 'Analyses', 25000, '🩸', 'à domicile', 'Laboratoire partenaire', 'Prélèvement à domicile, résultats en 24 h sur l’application.', { booking: true, popular: true }],
    ['h8', 'Glycémie & cholestérol', 'Analyses', 8000, '🧫', 'prélèvement', 'Laboratoire partenaire', 'Dépistage rapide au laboratoire ou à domicile.', { booking: true }],
    ['h9', 'Gel hydroalcoolique', 'Parapharmacie', 2000, '🧴', '500 ml', 'Pharmacie de Glass', 'Gel désinfectant pour les mains, 70% d’alcool.'],
    ['h10', 'Crème solaire SPF 50', 'Parapharmacie', 9000, '🧴', '200 ml', 'Pharmacie de Glass', 'Haute protection, résistante à l’eau.', { oldPrice: 11000, badge: '-18%' }],
    ['h11', 'Couches bébé T3', 'Bébé', 9500, '👶', 'paquet de 50', 'Pharmacie de Glass', 'Couches ultra-absorbantes, 6-10 kg.'],
    ['h12', 'Thermomètre digital', 'Matériel', 6000, '🌡️', 'la pièce', 'Pharmacie du Centre', 'Mesure rapide en 10 secondes.'],
    ['h13', 'Tensiomètre électronique', 'Matériel', 22000, '❤️‍🩹', 'au bras', 'Pharmacie du Centre', 'Mesure automatique de la tension, mémoire 60 mesures.'],
  ],
  print: [
    ['p1', 'Cartes de visite', 'Papeterie', 10000, '📇', 'x100', 'NEAM Print Studio', 'Cartes 350 g, recto-verso, pelliculage mat.', { from: true, popular: true, custom: true }],
    ['p2', 'T-shirts personnalisés', 'Goodies', 5000, '👕', 'la pièce', 'NEAM Print Studio', 'T-shirt 100% coton avec votre logo ou visuel.', { from: true, popular: true, custom: true }],
    ['p3', 'Roll-up', 'Supports pub', 25000, '🪧', '85 x 200 cm', 'NEAM Print Studio', 'Roll-up avec structure et housse de transport.', { from: true, popular: true, custom: true }],
    ['p4', 'Flyers A5', 'Impressions', 35000, '📄', 'x500', 'NEAM Print Studio', 'Flyers couleur recto-verso, papier 135 g.', { custom: true }],
    ['p5', 'Mug personnalisé', 'Goodies', 5000, '☕', 'la pièce', 'NEAM Print Studio', 'Mug céramique 33 cl, impression haute définition.', { custom: true }],
    ['p6', 'Banderole PVC', 'Supports pub', 25000, '🎏', '3 x 1 m', 'NEAM Print Studio', 'Bâche PVC 440 g avec œillets.', { custom: true }],
    ['p7', 'Impression documents', 'Impressions', 100, '🖨️', 'la page', 'NEAM Print Studio', 'Impression A4 noir & blanc ou couleur, retrait ou livraison.', { custom: true }],
    ['p8', 'Casquette brodée', 'Goodies', 6000, '🧢', 'la pièce', 'NEAM Print Studio', 'Broderie de votre logo, coloris au choix.', { from: true, custom: true }],
    ['p9', 'Carnet personnalisé', 'Papeterie', 4500, '📒', 'A5', 'NEAM Print Studio', 'Couverture personnalisée, 100 pages lignées.', { custom: true }],
  ],
  services: [
    ['s1', 'Ménage à domicile', 'Ménage', 15000, '🧹', '4 heures', 'NEAM Services', 'Aide ménagère vérifiée, produits inclus.', { popular: true, from: true, booking: true }],
    ['s2', 'Dépannage électrique', 'Électricité', 10000, '💡', 'intervention', 'NEAM Services', 'Électricien qualifié, diagnostic et réparation.', { popular: true, from: true, booking: true }],
    ['s3', 'Assistance IT', 'Informatique', 20000, '💻', 'intervention', 'NEAM Services', 'Installation, dépannage et configuration à domicile ou au bureau.', { popular: true, from: true, booking: true }],
    ['s4', 'Plombier à domicile', 'Plomberie', 12000, '🔧', 'intervention', 'NEAM Services', 'Fuites, robinetterie, sanitaires. Devis gratuit.', { from: true, booking: true }],
    ['s5', 'Entretien climatisation', 'Climatisation', 18000, '❄️', 'par appareil', 'NEAM Services', 'Nettoyage, recharge de gaz et contrôle.', { from: true, booking: true }],
    ['s6', 'Entretien de jardin', 'Jardinage', 15000, '🌿', 'demi-journée', 'NEAM Services', 'Tonte, taille et désherbage.', { from: true, booking: true }],
    ['s7', 'Garde d’enfants', 'Garde d’enfants', 5000, '🧸', 'l’heure', 'NEAM Services', 'Nounous vérifiées et expérimentées.', { from: true, booking: true }],
    ['s8', 'Transfert aéroport', 'Autres', 10000, '✈️', 'le trajet', 'NEAM Services', 'Accueil à l’aéroport Léon Mba et transfert jusqu’à votre adresse.', { booking: true }],
    ['s9', 'Démarches administratives', 'Autres', 20000, '🗂️', 'le dossier', 'NEAM Services', 'Légalisations, dépôts, retraits : on s’en charge.', { from: true, booking: true }],
  ],
  brico: [
    ['b1', 'Perceuse', 'Bricolage', 25000, '🪛', 'sans fil 18 V', 'Brico&Deco', 'Perceuse visseuse sans fil, 2 batteries et coffret.', { popular: true }],
    ['b2', 'Peinture murale', 'Peinture', 15000, '🎨', '5 L', 'Brico&Deco', 'Peinture acrylique mate, haute couvrance.', { popular: true }],
    ['b3', 'Lampe suspendue', 'Décoration', 20000, '💡', 'la pièce', 'Brico&Deco', 'Suspension design en métal cuivré.', { popular: true }],
    ['b4', 'Caisse à outils', 'Bricolage', 28000, '🧰', '108 pièces', 'Brico&Deco', 'Coffret complet : clés, tournevis, marteau, pinces.', { oldPrice: 32000, badge: '-12%' }],
    ['b5', 'Ampoules LED x4', 'Électricité', 6000, '💡', 'lot', 'Brico&Deco', 'Ampoules LED E27 9 W, lumière chaude.'],
    ['b6', 'Multiprise parafoudre', 'Électricité', 9000, '🔌', '5 prises', 'Brico&Deco', 'Protection contre les surtensions.'],
    ['b7', 'Mitigeur cuisine', 'Plomberie', 22000, '🚰', 'la pièce', 'Brico&Deco', 'Mitigeur chromé à bec orientable.'],
    ['b8', 'Tuyau d’arrosage 25 m', 'Jardin', 12000, '🌱', 'avec pistolet', 'Brico&Deco', 'Tuyau renforcé anti-torsion.'],
    ['b9', 'Serrure 3 points', 'Sécurité', 35000, '🔐', 'la pièce', 'Brico&Deco', 'Serrure haute sécurité, 3 clés.'],
    ['b10', 'Caméra de surveillance', 'Sécurité', 30000, '📹', 'Wi-Fi', 'Brico&Deco', 'Vision nocturne, détection de mouvement, application mobile.'],
    ['b11', 'Plante décorative', 'Maison', 15000, '🪴', 'avec pot', 'Brico&Deco', 'Plante d’intérieur en pot céramique.'],
    ['b12', 'Coussins déco x2', 'Décoration', 10000, '🛋️', '45 x 45 cm', 'Brico&Deco', 'Coussins en tissu wax.'],
    ['b13', 'Peintre à domicile', 'Peinture', 25000, '👷🏾', 'par pièce', 'Artisans NEAM', 'Artisan vérifié, devis gratuit.', { booking: true, from: true }],
  ],
  beauty: [
    ['be1', 'Fond de teint', 'Maquillage', 12000, '🧴', '30 ml', 'Glow Cosmetics', 'Couvrance modulable, adapté aux peaux noires et métissées.', { popular: true }],
    ['be2', 'Parfum', 'Parfums', 35000, '🌸', '50 ml', 'Maison Parfums', 'Eau de parfum aux notes de jasmin et d’ylang-ylang.', { popular: true }],
    ['be3', 'Crème visage', 'Soins visage', 8500, '🫙', '50 ml', 'Glow Cosmetics', 'Crème hydratante éclat, 24 h.', { popular: true }],
    ['be4', 'Rouge à lèvres mat', 'Maquillage', 6500, '💄', 'la pièce', 'Glow Cosmetics', 'Tenue longue durée, fini velours.'],
    ['be5', 'Sérum éclat', 'Soins visage', 14000, '✨', '30 ml', 'Glow Cosmetics', 'Sérum vitamine C pour un teint lumineux.', { oldPrice: 17000, badge: '-18%' }],
    ['be6', 'Beurre de karité pur', 'Soins corps', 4000, '🧈', '250 g', 'Karité d’Or', 'Beurre de karité brut, non raffiné.'],
    ['be7', 'Huile de coco', 'Cheveux', 3500, '🥥', '200 ml', 'Karité d’Or', 'Huile de coco vierge pour nourrir les cheveux.'],
    ['be8', 'Tresses à domicile', 'Cheveux', 20000, '💇🏾‍♀️', 'la prestation', 'Beauty Home', 'Coiffeuse professionnelle à domicile.', { booking: true, from: true }],
    ['be9', 'Coffret barbe', 'Hommes', 12000, '🧔🏾', 'coffret', 'Maison Parfums', 'Huile, baume et peigne pour barbe.'],
    ['be10', 'Pinceaux maquillage', 'Accessoires', 9000, '🖌️', 'set de 12', 'Glow Cosmetics', 'Pinceaux synthétiques doux.'],
    ['be11', 'Manucure & pédicure', 'Nouveautés', 12000, '💅🏾', 'à domicile', 'Beauty Home', 'Soin complet des mains et des pieds à domicile.', { booking: true, badge: 'Nouveau' }],
  ],
  tech: [
    ['t1', 'Smartphone Android', 'Smartphones', 145000, '📱', '128 Go', 'NEAM Tech Store', 'Écran 6,6", 128 Go, double SIM, garantie 12 mois.', { popular: true }],
    ['t2', 'Écouteurs sans fil', 'Audio', 25000, '🎧', 'la paire', 'NEAM Tech Store', 'Réduction de bruit, autonomie 30 h.', { oldPrice: 32000, badge: '-22%', popular: true }],
    ['t3', 'Ordinateur portable', 'Informatique', 420000, '💻', '15,6"', 'NEAM Tech Store', 'Intel Core i5, 16 Go RAM, SSD 512 Go.'],
    ['t4', 'Power bank 20 000 mAh', 'Accessoires', 15000, '🔋', 'la pièce', 'NEAM Tech Store', 'Charge rapide, 2 ports USB + USB-C.', { popular: true }],
    ['t5', 'Montre connectée', 'Accessoires', 35000, '⌚', 'la pièce', 'NEAM Tech Store', 'Suivi santé, notifications, étanche.', { oldPrice: 42000, badge: '-17%' }],
    ['t6', 'Enceinte Bluetooth', 'Audio', 18000, '🔊', 'la pièce', 'NEAM Tech Store', 'Son 360°, étanche, 12 h d’autonomie.'],
    ['t7', 'Réparation d’écran', 'Réparation', 30000, '🛠️', 'smartphone', 'NEAM Tech Lab', 'Remplacement d’écran, garantie 3 mois.', { from: true, booking: true }],
    ['t8', 'Création de site web', 'Digital', 250000, '🌐', 'le projet', 'NEAM Digital', 'Site vitrine responsive, nom de domaine et hébergement 1 an.', { badge: 'Pro', from: true, booking: true }],
  ],
  legal: [
    ['l1', 'Consultation juridique', 'Entreprise', 15000, '⚖️', '30 min en visio', 'Guru Légal', 'Un juriste répond à toutes vos questions, en visio ou par téléphone.', { popular: true, booking: true }],
    ['l2', 'Création de SARL', 'Entreprise', 150000, '🏢', 'clé en main', 'Guru Légal', 'Statuts, immatriculation au RCCM et formalités. Hors frais administratifs.', { from: true, popular: true }],
    ['l3', 'Contrat de travail CDD/CDI', 'Travail', 20000, '📝', 'modèle + relecture', 'Guru Légal', 'Contrat conforme au Code du travail gabonais, personnalisé.', { popular: true }],
    ['l4', 'Bail d’habitation', 'Immobilier', 15000, '🏠', 'modèle + relecture', 'Guru Légal', 'Bail meublé ou non meublé, clauses adaptées.'],
    ['l5', 'Mise en demeure', 'Recouvrement', 25000, '📨', 'rédaction + envoi', 'Guru Légal', 'Courrier de mise en demeure rédigé par un juriste.'],
    ['l6', 'Recouvrement de créances', 'Recouvrement', 50000, '💼', 'à partir de', 'Guru Légal', 'Procédure amiable puis judiciaire si nécessaire.', { from: true }],
    ['l7', 'Conditions générales de vente', 'Contrats', 35000, '📜', 'rédaction', 'Guru Légal', 'CGV pour votre commerce ou votre site.'],
    ['l8', 'Contrat de prestation', 'Contrats', 25000, '🤝', 'rédaction', 'Guru Légal', 'Sécurisez vos relations clients et fournisseurs.'],
    ['l9', 'Succession & héritage', 'Famille', 30000, '👪', 'accompagnement', 'Guru Légal', 'Conseil et accompagnement dans les démarches de succession.', { from: true, booking: true }],
  ],
}

const SEED_RATING = (id: string) => Math.round((4.3 + ((id.charCodeAt(id.length - 1) * 7) % 7) / 10) * 10) / 10

export const PRODUCTS: Product[] = Object.entries(rows).flatMap(([serviceId, list]) =>
  list!.map(([id, name, category, price, emoji, unit, vendor, description, extra]) => ({
    id,
    serviceId: serviceId as ServiceId,
    name,
    category,
    price,
    emoji,
    unit,
    vendor,
    description,
    ...extra,
    rating: extra?.rating ?? SEED_RATING(id),
  })),
)

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<string, Product>

export const productsOf = (serviceId: ServiceId) => PRODUCTS.filter((p) => p.serviceId === serviceId)

/** Restaurants partenaires NEAM Food */
export const RESTAURANTS = [
  { name: 'Le Gourmet', emoji: '🍽️', rating: 4.8, eta: '25-35 min', tags: 'Gabonais · Pizzas', cover: '🥘' },
  { name: 'Chez Mami', emoji: '👩🏾‍🍳', rating: 4.6, eta: '20-30 min', tags: 'Cuisine locale', cover: '🍲' },
  { name: 'Jackboy 241', emoji: '🔥', rating: 4.7, eta: '25-40 min', tags: 'Grillades · Burgers', cover: '🍗' },
  { name: 'Green Corner', emoji: '🥗', rating: 4.5, eta: '20-30 min', tags: 'Healthy', cover: '🥗' },
]

/** Spécialités médicales de NEAM Health */
export const SPECIALTIES = [
  { label: 'Médecine générale', emoji: '🩺', price: 10000 },
  { label: 'Pédiatrie', emoji: '🧒🏾', price: 15000 },
  { label: 'Gynécologie', emoji: '🌸', price: 20000 },
  { label: 'Dermatologie', emoji: '🧴', price: 18000 },
  { label: 'Cardiologie', emoji: '❤️', price: 25000 },
  { label: 'Ophtalmologie', emoji: '👁️', price: 20000 },
  { label: 'Santé mentale', emoji: '🧠', price: 20000 },
  { label: 'Nutrition', emoji: '🍎', price: 12000 },
]
