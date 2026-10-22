-- Données de départ (développement et démonstration).
-- Boutiques NEAM Market à Libreville : sans propriétaire au départ (gérées par l'admin),
-- un marchand validé reçoit sa propre boutique.
insert into public.stores (id, name, district, address, phone, emoji, prep_minutes) values
  ('11111111-1111-4111-8111-000000000001', 'Marché Mont-Bouët', 'Mont-Bouët', 'Grand marché de Mont-Bouët, allée des primeurs', '+241 07 00 00 11', '🧺', 20),
  ('11111111-1111-4111-8111-000000000002', 'Marché Nkembo', 'Nkembo', 'Marché de Nkembo, entrée principale', '+241 07 00 00 12', '🥬', 25),
  ('11111111-1111-4111-8111-000000000003', 'Ferme d’Okolassi', 'Okolassi', 'Route d’Okolassi, PK 12', '+241 07 00 00 13', '🐔', 30),
  ('11111111-1111-4111-8111-000000000004', 'NEAM Market Louis', 'Louis', 'Boulevard Triomphal, quartier Louis', '+241 07 00 00 14', '🛒', 15);

insert into public.products (store_id, name, category, sub, unit, emoji, description, price, old_price, popular) values
  ('11111111-1111-4111-8111-000000000001', 'Tomate', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🍅', 'Tomates fraîches et bien mûres, idéales pour vos sauces.', 1000, null, false),
  ('11111111-1111-4111-8111-000000000001', 'Oignon', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🧅', 'Oignons jaunes, indispensables en cuisine.', 800, null, false),
  ('11111111-1111-4111-8111-000000000002', 'Piment', 'Fruits & Légumes Frais', 'Légumes', '100 g', '🌶️', 'Piment frais local, pour relever tous vos plats.', 300, null, false),
  ('11111111-1111-4111-8111-000000000003', 'Carotte', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🥕', 'Carottes croquantes cultivées localement.', 900, null, false),
  ('11111111-1111-4111-8111-000000000003', 'Poivron', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🫑', 'Poivrons rouges, jaunes et verts.', 1200, null, false),
  ('11111111-1111-4111-8111-000000000002', 'Chou', 'Fruits & Légumes Frais', 'Légumes', '1 pièce', '🥬', 'Chou pommé frais.', 1000, null, false),
  ('11111111-1111-4111-8111-000000000001', 'Banane plantain', 'Fruits & Légumes Frais', 'Fruits', '1 kg', '🍌', 'Bananes plantain mûres à point, pour l’alloco ou en accompagnement.', 600, 750, true),
  ('11111111-1111-4111-8111-000000000002', 'Manioc', 'Fruits & Légumes Frais', 'Tubercules', '1 kg', '🍠', 'Tubercules de manioc frais.', 700, null, false),
  ('11111111-1111-4111-8111-000000000001', 'Avocat', 'Fruits & Légumes Frais', 'Fruits', '1 kg', '🥑', 'Avocats crémeux, prêts à consommer.', 1500, null, false),
  ('11111111-1111-4111-8111-000000000003', 'Ananas du Gabon', 'Fruits & Légumes Frais', 'Fruits', 'la pièce', '🍍', 'Ananas sucré et juteux, cultivé localement.', 1000, null, false),
  ('11111111-1111-4111-8111-000000000002', 'Igname', 'Fruits & Légumes Frais', 'Tubercules', '1 kg', '🥔', 'Igname blanche, ferme et savoureuse.', 1200, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Riz parfumé', 'Produits alimentaires', null, '5 kg', '🍚', 'Riz long grain parfumé, sac de 5 kg.', 4250, 5000, true),
  ('11111111-1111-4111-8111-000000000004', 'Huile végétale', 'Produits alimentaires', null, '1 L', '🫗', 'Huile végétale raffinée pour toutes vos cuissons.', 1200, null, true),
  ('11111111-1111-4111-8111-000000000002', 'Bâtons de manioc', 'Produits alimentaires', null, 'lot de 3', '🥖', 'Bâtons de manioc préparés de façon traditionnelle.', 1500, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Sardines à l’huile', 'Produits alimentaires', null, 'lot de 4', '🐟', 'Sardines à l’huile végétale, boîtes de 125 g.', 2000, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Eau minérale', 'Boissons', null, 'pack 6 x 1,5 L', '💧', 'Pack de 6 bouteilles d’eau minérale naturelle.', 2400, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Jus de bissap', 'Boissons', null, '1 L', '🧃', 'Jus d’hibiscus artisanal, légèrement sucré.', 1000, 1300, false),
  ('11111111-1111-4111-8111-000000000004', 'Savon de toilette', 'Hygiène & Beauté', null, 'lot de 4', '🧼', 'Savons parfumés pour toute la famille.', 1500, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Dentifrice', 'Hygiène & Beauté', null, '100 ml', '🪥', 'Protection complète, haleine fraîche.', 1200, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Lessive en poudre', 'Produits d’entretien', null, '2 kg', '🧺', 'Lessive efficace dès 30 °C.', 3200, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Eau de Javel', 'Produits d’entretien', null, '1 L', '🧴', 'Désinfecte et blanchit.', 900, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Lait infantile', 'Bébé & Mum', null, '800 g', '🍼', 'Lait 2e âge, de 6 à 12 mois.', 8500, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Couches T4', 'Bébé & Mum', null, 'paquet de 44', '👶', 'Couches ultra-absorbantes 9-14 kg.', 9000, 10500, false),
  ('11111111-1111-4111-8111-000000000004', 'Ventilateur sur pied', 'Électronique & Maison', null, 'la pièce', '🌀', 'Ventilateur 3 vitesses, oscillant, 40 cm.', 18000, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Bouilloire électrique', 'Électronique & Maison', null, '1,7 L', '🫖', 'Arrêt automatique, base 360°.', 9500, null, false);
