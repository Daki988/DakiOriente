// Les 33 points de vue de référence du cahier de mission.
// pos / target en mètres dans le repère du plan (voir plan.js).
// cutaway : masque plafond et toiture (vues architecturales).

export const VIEWS = [
  // A. Extérieur et accueil
  { n: 1, id: 'facade-jour', title: 'Façade principale de jour', zone: 'exterieur', pos: [-7.5, 2.0, 15], target: [5, 2.2, 3.5], fov: 50 },
  { n: 2, id: 'facade-nuit', title: 'Façade principale de nuit', zone: 'exterieur', pos: [-7.5, 2.0, 15], target: [5, 2.2, 3.5], fov: 50, night: true },
  { n: 3, id: 'facade-terrasse', title: 'Façade latérale et terrasse', zone: 'exterieur', pos: [14.8, 1.7, 8.7], target: [7.5, 1.5, 6.9], fov: 60 },
  { n: 4, id: 'parking', title: 'Parking clients', zone: 'exterieur', pos: [21, 2.2, 17], target: [6, 0.8, 11], fov: 55 },
  { n: 5, id: 'entree', title: 'Entrée principale', zone: 'exterieur', pos: [-5.5, 1.6, 3.0], target: [3, 1.5, 3.0], fov: 55 },
  { n: 6, id: 'accueil', title: 'Accueil et orientation', zone: 'superette', pos: [3.0, 1.65, 3.1], target: [0.4, 1.3, 1.0], fov: 66 },
  // B. Supérette
  { n: 7, id: 'superette-axiale', title: 'Vue générale axiale', zone: 'superette', pos: [0.4, 1.7, 2.9], target: [12, 1.4, 2.9], fov: 62 },
  { n: 8, id: 'superette-cafe', title: 'Vue générale côté café', zone: 'superette', pos: [1.2, 2.1, 5.4], target: [8.5, 1.2, 2.2], fov: 62 },
  { n: 9, id: 'allee-centrale', title: 'Allée centrale', zone: 'superette', pos: [1.5, 1.6, 2.9], target: [5.6, 1.2, 2.9], fov: 58 },
  { n: 10, id: 'epicerie', title: 'Rayons épicerie', zone: 'superette', pos: [3.7, 1.65, 1.3], target: [1.4, 1.1, 0.1], fov: 68 },
  { n: 11, id: 'boissons', title: 'Réfrigérateurs et boissons', zone: 'superette', pos: [2.4, 1.65, 1.3], target: [5.2, 1.1, 0.1], fov: 68 },
  { n: 12, id: 'produits-frais', title: 'Zone produits frais', zone: 'superette', pos: [4.2, 1.6, 4.55], target: [5.0, 1.2, 6.0], fov: 62 },
  { n: 13, id: 'fruits-legumes', title: 'Fruits et légumes', zone: 'superette', pos: [3.7, 1.6, 4.55], target: [2.5, 0.9, 5.9], fov: 62 },
  { n: 14, id: 'hygiene', title: 'Hygiène et entretien', zone: 'superette', pos: [5.6, 1.6, 4.6], target: [2.4, 1.0, 4.1], fov: 58 },
  { n: 15, id: 'caisse', title: 'Caisse supérette', zone: 'superette', pos: [2.6, 1.6, 4.1], target: [0.9, 1.1, 4.9], fov: 60 },
  // C. Café
  { n: 16, id: 'cafe', title: 'Vue principale du café', zone: 'cafe', pos: [5.3, 1.7, 4.2], target: [9.5, 1.2, 2.0], fov: 62 },
  { n: 17, id: 'comptoir', title: 'Comptoir café', zone: 'cafe', pos: [8.4, 1.6, 3.7], target: [7.8, 1.4, 0.6], fov: 60 },
  { n: 18, id: 'detente', title: 'Espace détente', zone: 'cafe', pos: [7.9, 1.6, 3.8], target: [10.4, 0.8, 4.9], fov: 62 },
  { n: 19, id: 'coworking', title: 'Espace coworking', zone: 'cafe', pos: [8.7, 1.6, 4.5], target: [6.4, 1.0, 5.7], fov: 62 },
  // D. Laverie
  { n: 20, id: 'acces-laverie', title: 'Accès laverie', zone: 'laverie', pos: [8.4, 1.6, 2.95], target: [13, 1.4, 3.0], fov: 60 },
  { n: 21, id: 'laverie', title: 'Vue générale laverie', zone: 'laverie', pos: [11.3, 2.0, 3.0], target: [16, 1.0, 3.0], fov: 72 },
  { n: 22, id: 'lave-linge', title: 'Machines à laver', zone: 'laverie', pos: [14.4, 1.6, 2.1], target: [12.0, 0.9, 0.4], fov: 60 },
  { n: 23, id: 'seche-linge', title: 'Sèche-linge', zone: 'laverie', pos: [14.4, 1.6, 3.9], target: [12.0, 1.0, 5.7], fov: 60 },
  { n: 24, id: 'attente', title: "Espace d'attente", zone: 'laverie', pos: [13.3, 1.6, 3.9], target: [11.0, 0.7, 4.5], fov: 62 },
  { n: 25, id: 'pliage', title: 'Pliage et repassage', zone: 'laverie', pos: [13.0, 1.6, 4.6], target: [15.3, 1.0, 3.0], fov: 62 },
  { n: 26, id: 'depot-retrait', title: 'Dépôt et retrait du linge', zone: 'laverie', pos: [14.3, 1.6, 2.3], target: [16.0, 1.2, 0.2], fov: 60 },
  { n: 27, id: 'stockage-laverie', title: 'Stockage des produits de laverie', zone: 'laverie', pos: [14.2, 1.6, 3.0], target: [16.6, 1.2, 3.0], fov: 60 },
  // E. Espaces techniques
  { n: 28, id: 'reserve', title: 'Réserve supérette', zone: 'annexes', pos: [17.0, 1.7, 2.15], target: [19.5, 1.1, 0.5], fov: 75 },
  { n: 29, id: 'technique', title: 'Local technique', zone: 'annexes', pos: [16.85, 2.1, 2.55], target: [19.8, 1.0, 3.3], fov: 90 },
  { n: 30, id: 'wc-hommes', title: 'Sanitaires hommes', zone: 'annexes', pos: [16.75, 1.65, 4.6], target: [19.6, 0.9, 3.9], fov: 90 },
  { n: 31, id: 'wc-femmes', title: 'Sanitaires femmes', zone: 'annexes', pos: [16.75, 1.65, 5.15], target: [19.6, 0.9, 5.6], fov: 90 },
  // F. Vues architecturales
  { n: 32, id: 'plan', title: "Plan d'aménagement 3D de 120 m²", zone: 'plan', pos: [10, 30, 3.02], target: [10, 0, 3], fov: 40, cutaway: true },
  { n: 33, id: 'isometrique', title: "Vue isométrique générale", zone: 'plan', pos: [-5, 15, 19], target: [10, 0, 3], fov: 45, cutaway: true },
];
