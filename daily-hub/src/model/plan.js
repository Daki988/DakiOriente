// Plan coté DAILY HUB — source unique de vérité du modèle.
// Repère : X = longueur (0 → 20 m, de l'entrée vers le fond),
//          Z = profondeur (0 = mur arrière, 6 = façade sur parking),
//          Y = hauteur. Unités : mètres.
// Toutes les vues (visite, rendus, film) lisent ces valeurs : ne rien
// déplacer ailleurs qu'ici.

export const BUILDING = {
  length: 20,
  depth: 6,
  height: 3.4, // hauteur sous plafond
  wall: 0.2, // épaisseur des murs extérieurs (posés hors du rectangle 20×6)
  partition: 0.1,
};

const X_CAFE = 35 / 6; // 5,833
const X_LAV = X_CAFE + 30 / 6; // 10,833
const X_BACK = X_LAV + 35 / 6; // 16,667

export const X = { cafe: X_CAFE, laverie: X_LAV, back: X_BACK, end: 20 };

// Zones (rectangles x0,z0 → x1,z1). Surfaces = 120 m² au total.
export const ZONES = [
  { id: 'superette', name: 'Supérette', x0: 0, z0: 0, x1: X_CAFE, z1: 6, floor: 'tile' },
  { id: 'cafe', name: 'Café', x0: X_CAFE, z0: 0, x1: X_LAV, z1: 6, floor: 'wood' },
  { id: 'laverie', name: 'Laverie', x0: X_LAV, z0: 0, x1: X_BACK, z1: 6, floor: 'tileCool' },
  { id: 'reserve', name: 'Réserve', x0: X_BACK, z0: 0, x1: 20, z1: 2.4, floor: 'concrete' },
  { id: 'technique', name: 'Local technique', x0: X_BACK, z0: 2.4, x1: 20, z1: 3.6, floor: 'concrete' },
  { id: 'wc-h', name: 'Sanitaires hommes', x0: X_BACK, z0: 3.6, x1: 20, z1: 4.8, floor: 'tileDark' },
  { id: 'wc-f', name: 'Sanitaires femmes', x0: X_BACK, z0: 4.8, x1: 20, z1: 6, floor: 'tileDark' },
];

export const area = (z) => (z.x1 - z.x0) * (z.z1 - z.z0);

// Ouvertures dans les murs extérieurs.
// side : 'west' (x=0, façade d'entrée), 'south' (z=6, façade parking),
//        'north' (z=0, mur arrière), 'east' (x=20).
export const OPENINGS = [
  { side: 'west', from: 2.2, to: 3.8, type: 'door', name: 'Entrée principale' },
  { side: 'west', from: 0.3, to: 2.1, type: 'window' },
  { side: 'west', from: 3.9, to: 5.7, type: 'window' },
  { side: 'south', from: 0.3, to: 5.6, type: 'window' },
  { side: 'south', from: 6.0, to: 7.9, type: 'window' },
  { side: 'south', from: 8.0, to: 9.3, type: 'door', name: 'Accès terrasse' },
  { side: 'south', from: 9.4, to: 10.7, type: 'window' },
  { side: 'south', from: 11.0, to: 16.5, type: 'window', sill: 1.9 }, // bandeau haut (sèche-linge dessous)
  { side: 'north', from: 18.6, to: 19.6, type: 'door', name: 'Livraisons' },
];

// Cloisons intérieures : segments [x0,z0]→[x1,z1] avec ouvertures éventuelles
// (en distance le long du segment).
export const PARTITIONS = [
  // Café ↔ Laverie : cloison vitrée, passage de 1,4 m
  { a: [X_LAV, 0], b: [X_LAV, 6], kind: 'glass', openings: [{ from: 2.3, to: 3.7 }] },
  // Laverie ↔ bloc arrière
  {
    a: [X_BACK, 0], b: [X_BACK, 6], kind: 'solid',
    openings: [
      { from: 1.3, to: 2.2, door: 'Réserve' },
      { from: 3.8, to: 4.6, door: 'Hommes' },
      { from: 5.0, to: 5.8, door: 'Femmes' },
    ],
  },
  { a: [X_BACK, 2.4], b: [20, 2.4], kind: 'solid', openings: [{ from: 2.2, to: 3.0, door: 'Technique' }] },
  { a: [X_BACK, 3.6], b: [20, 3.6], kind: 'solid' },
  { a: [X_BACK, 4.8], b: [20, 4.8], kind: 'solid' },
];

// Extérieur
export const SITE = {
  sidewalk: 2.0, // trottoir devant les façades
  terrace: { x0: 6.0, z0: 6.2, x1: 10.6, z1: 8.6 },
  parking: { x0: 0, z0: 9.0, x1: 18, z1: 14.5, spaces: 7 },
};
