/* Catalogue Daki Oriente — prix en FCFA.
   Pour ajouter un produit : copiez un bloc, changez l'id, et c'est en ligne.
   art : forme de l'illustration (wand, bullet, egg, ring, sleeve, bottle, box, lingerie, candle, feather, kit)
   hue : teinte de l'illustration (0-360) */
window.CATEGORIES = [
  { id: "lingerie", label: "Lingerie légère", short: "Lingerie", hint: "Dentelle, satin, transparence", art: "lingerie", hue: 340 },
  { id: "elle", label: "Pour elle", short: "Pour elle", hint: "Vibromasseurs & stimulateurs", art: "wand", hue: 320 },
  { id: "lui", label: "Pour lui", short: "Pour lui", hint: "Masturbateurs, anneaux, endurance", art: "sleeve", hue: 220 },
  { id: "couple", label: "Pour le couple", short: "Couple", hint: "Jouer à deux, se redécouvrir", art: "ring", hue: 280 },
  { id: "essentiels", label: "Préservatifs & lubrifiants", short: "Essentiels", hint: "Protection & confort", art: "bottle", hue: 190 },
  { id: "sensualite", label: "Massage & sensualité", short: "Sensualité", hint: "Huiles, bougies, jeux coquins", art: "candle", hue: 30 }
];

window.PRODUCTS = [
  // Lingerie
  { id: "L01", cat: "lingerie", name: "Ensemble Nuit de Velours", price: 24900, old: 29900, art: "lingerie", hue: 345, badge: "Best-seller",
    desc: "Soutien-gorge en dentelle florale et culotte assortie. Une seconde peau, faite pour être vue… ou devinée.",
    points: ["Dentelle douce, sans armature", "Tailles S à XXL", "Noir, bordeaux ou ivoire"] },
  { id: "L02", cat: "lingerie", name: "Nuisette Satin Minuit", price: 19900, art: "lingerie", hue: 260,
    desc: "Satin fluide, fines bretelles réglables, finitions dentelle. Elle glisse sur la peau et fait tout le travail.",
    points: ["Satin léger et respirant", "Tailles S à XXL", "Livrée avec string assorti"] },
  { id: "L03", cat: "lingerie", name: "Body Dentelle Audace", price: 22500, art: "lingerie", hue: 0, badge: "Nouveau",
    desc: "Body échancré, dos nu et fermeture pression. Pour les soirs où vous avez envie de surprendre.",
    points: ["Dentelle extensible", "Ouverture pression", "Tailles S à XL"] },
  { id: "L04", cat: "lingerie", name: "Ensemble Porte-jarretelles Sérénade", price: 27900, art: "lingerie", hue: 320,
    desc: "Soutien-gorge, porte-jarretelles et string. Le grand classique de la séduction, revisité tout en finesse.",
    points: ["3 pièces + bas offerts", "Résille et dentelle", "Tailles S à XXL"] },
  { id: "L05", cat: "lingerie", name: "Boxer Homme Signature", price: 9900, art: "lingerie", hue: 210,
    desc: "Parce que les hommes aussi ont le droit d'être irrésistibles. Coupe ajustée, matière ultra-douce.",
    points: ["Microfibre & modal", "Tailles M à XXL", "Noir ou bleu nuit"] },

  // Pour elle
  { id: "E01", cat: "elle", name: "Stimulateur Onde Air", price: 39900, old: 45900, art: "egg", hue: 330, badge: "Best-seller",
    desc: "Technologie à ondes d'air : aucune friction, juste des pulsations qui font monter le plaisir en quelques minutes.",
    points: ["11 intensités", "Silicone médical", "Étanche · Rechargeable USB"] },
  { id: "E02", cat: "elle", name: "Vibro Wand Royale", price: 34900, art: "wand", hue: 300,
    desc: "Le masseur puissant par excellence. Vibrations profondes, tête souple, prise en main parfaite.",
    points: ["20 modes de vibration", "Moteur silencieux (<45 dB)", "Autonomie 2 h"] },
  { id: "E03", cat: "elle", name: "Rabbit Double Plaisir", price: 32900, art: "wand", hue: 280, badge: "Coup de cœur",
    desc: "Deux moteurs indépendants pour une stimulation interne et externe en même temps. Vous allez comprendre pourquoi c'est un culte.",
    points: ["2 moteurs indépendants", "Silicone body-safe", "Étanche IPX7"] },
  { id: "E04", cat: "elle", name: "Œuf Vibrant Télécommandé", price: 24900, art: "egg", hue: 350,
    desc: "Discret, sans fil, piloté à distance. Le petit secret que vous seule (ou presque) connaîtrez.",
    points: ["Télécommande portée 10 m", "10 programmes", "Rechargeable"] },
  { id: "E05", cat: "elle", name: "Bullet Mini Pocket", price: 12900, art: "bullet", hue: 315, badge: "Idéal pour débuter",
    desc: "Petit par la taille, grand par l'effet. Le premier vibro parfait : simple, discret, efficace.",
    points: ["Taille rouge à lèvres", "7 modes", "Voyage sans souci"] },

  // Pour lui
  { id: "H01", pos: "30% 50%", cat: "lui", name: "Masturbateur Sensation Pro", price: 27900, art: "sleeve", hue: 215, badge: "Best-seller",
    desc: "Texture interne en relief, aspiration réglable. Une sensation incroyablement réaliste, en toute intimité.",
    points: ["Matière ultra-douce", "Démontable, facile à laver", "Discret : ressemble à une gourde"] },
  { id: "H02", cat: "lui", name: "Anneau Vibrant Endurance", price: 11900, art: "ring", hue: 200,
    desc: "Il prolonge l'érection et ajoute des vibrations pour madame. Tout le monde y gagne.",
    points: ["Silicone extensible", "Mini-moteur intégré", "Rechargeable"] },
  { id: "H03", pos: "28% 50%", cat: "lui", name: "Masseur Prostatique Zénith", price: 29900, art: "wand", hue: 230, badge: "Nouveau",
    desc: "Conçu pour l'anatomie masculine. Une nouvelle façon de découvrir son corps, en douceur.",
    points: ["Forme ergonomique", "9 vibrations", "Silicone médical"] },
  { id: "H04", cat: "lui", name: "Spray Retardant Longue Durée", price: 8900, art: "bottle", hue: 180,
    desc: "Pour prendre votre temps et profiter plus longtemps. Formule légère, effet progressif.",
    points: ["Utilisation simple", "Sans odeur", "≈ 40 utilisations"] },

  // Couple
  { id: "C01", cat: "couple", name: "Vibro Couple Connecté", price: 44900, art: "ring", hue: 290, badge: "Coup de cœur",
    desc: "Se porte pendant l'amour, stimule les deux partenaires et se pilote depuis le téléphone. Même à distance.",
    points: ["Application gratuite", "Contrôle longue distance", "Silicone body-safe"] },
  { id: "C02", pos: "50% 50%", cat: "couple", name: "Coffret Découverte à Deux", price: 39900, old: 49900, art: "kit", hue: 270,
    desc: "Un bullet, un anneau, un lubrifiant, un bandeau et des dés coquins. Tout pour pimenter vos soirées.",
    points: ["5 accessoires", "Coffret cadeau", "Économisez 10 000 FCFA"] },
  { id: "C03", cat: "couple", name: "Kit Liens de Satin", price: 14900, art: "feather", hue: 340,
    desc: "Bandeau, liens doux et plumeau. Pour jouer avec le lâcher-prise, en toute confiance.",
    points: ["Satin doux", "Ajustable", "Idéal pour débuter"] },

  // Essentiels
  { id: "P01", cat: "essentiels", name: "Préservatifs Ultra-Fins ×12", price: 4900, art: "box", hue: 195, badge: "Best-seller",
    desc: "Fins comme une seconde peau, sans compromis sur la protection. Testés électroniquement un par un.",
    points: ["Norme CE / ISO 4074", "Lubrifiés", "Boîte neutre"] },
  { id: "P02", cat: "essentiels", name: "Préservatifs Texturés Plaisir ×12", price: 5500, art: "box", hue: 330,
    desc: "Nervures et points pour des sensations décuplées, pour elle comme pour lui.",
    points: ["Norme CE / ISO 4074", "Texture perlée", "Boîte neutre"] },
  { id: "P03", cat: "essentiels", name: "Préservatifs XL Confort ×10", price: 5900, art: "box", hue: 220,
    desc: "Une taille plus large pour un confort total. Parce qu'un bon préservatif, c'est d'abord un préservatif bien ajusté.",
    points: ["Norme CE / ISO 4074", "Largeur 57 mm", "Boîte neutre"] },
  { id: "P04", cat: "essentiels", name: "Lubrifiant Aqua Soie 100 ml", price: 6900, art: "bottle", hue: 190,
    desc: "Base eau, non collant, compatible avec tous les préservatifs et tous les jouets. L'indispensable.",
    points: ["Base eau", "Sans parabène", "Compatible jouets & préservatifs"] },
  { id: "P05", cat: "essentiels", name: "Lubrifiant Silicone Longue Tenue", price: 9900, art: "bottle", hue: 250,
    desc: "Glisse longue durée, idéal sous la douche. Quelques gouttes suffisent.",
    points: ["Base silicone", "Résiste à l'eau", "Non compatible jouets silicone"] },
  { id: "P06", pos: "62% 50%", cat: "essentiels", name: "Nettoyant Jouets Hygiène+", price: 5900, art: "bottle", hue: 160,
    desc: "Nettoie et désinfecte vos jouets en un geste. Pour un plaisir toujours sain.",
    points: ["Antibactérien", "Sans rinçage", "150 ml"] },
  { id: "P08", img: "assets/img/P04.jpg", cat: "essentiels", name: "Pack Essentiel Lubrifiant + Nettoyant", price: 9900, old: 12800, art: "bottle", hue: 200, badge: "Malin",
    desc: "Le duo que tout le monde finit par acheter : un lubrifiant à base d'eau pour le confort, un nettoyant pour garder vos jouets impeccables.",
    points: ["Lubrifiant Aqua Soie 100 ml", "Nettoyant Hygiène+ 150 ml", "Économisez 2 900 FCFA"] },
  { id: "P07", cat: "essentiels", name: "Pochette de Rangement Discrète", price: 2900, art: "box", hue: 30,
    desc: "Une pochette en coton neutre pour ranger vos jouets à l'abri de la poussière et des regards. Rien n'indique ce qu'elle contient.",
    points: ["Coton doux, fermeture à cordon", "Format 20 × 25 cm", "Se glisse dans un tiroir ou un sac"] },

  // Sensualité
  { id: "S01", cat: "sensualite", name: "Huile de Massage Ylang-Ylang", price: 8900, art: "bottle", hue: 35, badge: "Coup de cœur",
    desc: "Huile chauffante aux notes d'ylang-ylang. Le massage devient préliminaire.",
    points: ["Effet chauffant léger", "Comestible", "100 ml"] },
  { id: "S02", cat: "sensualite", name: "Bougie de Massage Ambre", price: 11900, art: "candle", hue: 25,
    desc: "Allumez-la, laissez fondre, versez. La cire se transforme en huile tiède et parfumée.",
    points: ["Cire de soja", "Basse température", "≈ 30 h de combustion"] },
  { id: "S03", cat: "sensualite", name: "Jeu « 50 Défis Coquins »", price: 7900, art: "kit", hue: 10,
    desc: "50 cartes de défis, du plus doux au plus osé. Le jeu qui fait tomber la timidité.",
    points: ["2 joueurs", "3 niveaux d'audace", "Format poche"] },
  { id: "S04", cat: "sensualite", name: "Plumeau Caresse", price: 4900, art: "feather", hue: 45,
    desc: "Frissons garantis. Le petit accessoire qui réveille toute la peau.",
    points: ["Plumes douces", "Manche satin", "Réutilisable"] }
];
