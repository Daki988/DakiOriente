/**
 * Photos de présentation des produits (style catalogue : produit imprimé, fond uni, format carré 1080 px).
 * Licences Unsplash, Pexels et Pixabay : usage commercial libre, sans attribution obligatoire (créditée quand même).
 */
export type ProductPhoto = { src: string; alt: string; credit: { author: string; site: "Unsplash" | "Pexels" | "Pixabay"; url: string } };

const p = (file: string, alt: string, author: string, site: ProductPhoto["credit"]["site"], url: string): ProductPhoto =>
  ({ src: `/produits/${file}.jpg`, alt, credit: { author, site, url } });

const PH = {
  cartesGeo: p("cartes-geometriques", "Cartes imprimées aux motifs géométriques sur fond lilas", "Daniel Romero", "Unsplash", "https://unsplash.com/photos/white-blue-yellow-and-red-heart-print-card-VMw2NdUzHKQ"),
  cartesPile: p("cartes-pile", "Pile de cartes de visite imprimées", "Brando Makes Branding", "Unsplash", "https://unsplash.com/photos/blue-text-on-white-paper-8bvlWmX4qOs"),
  cartesPeche: p("cartes-peche", "Cartes de visite sur fond pêche", "Karola G (Kaboompics)", "Pexels", "https://www.pexels.com/photo/close-up-of-paper-on-colored-background-5706015/"),
  invitations: p("invitations-roses", "Faire-part de mariage fleuris sur fond rose", "Larysa Stratiichuk", "Pexels", "https://www.pexels.com/photo/elegant-floral-wedding-invitation-flat-lay-design-29821871/"),
  badge: p("badge", "Badge porte-nom avec son cordon", "Angela Roma", "Pexels", "https://www.pexels.com/photo/empty-name-tag-on-black-background-7319158/"),
  flyerFormes: p("flyer-formes", "Flyer posé sur des formes colorées", "Daria Liudnaya", "Pexels", "https://www.pexels.com/photo/a-piece-of-paper-on-a-blue-circle-cutout-8166636/"),
  flyerMain: p("flyer-main", "Flyer tenu en main sur fond vert d’eau", "MART PRODUCTION", "Pexels", "https://www.pexels.com/photo/photo-of-a-person-s-hands-holding-a-white-card-8217432/"),
  papeterie: p("papeterie", "Papeterie d’entreprise imprimée", "Rochelle Lee", "Unsplash", "https://unsplash.com/photos/orange-card-with-one-logo-surrounded-by-other-cards-OEIix2awZr4"),
  magazine: p("magazine-rose", "Catalogue ouvert tenu en main sur fond rose", "pmv chamara", "Unsplash", "https://unsplash.com/photos/a-hand-holding-a-book-open-to-a-mockup-qomIC8mCr0Y"),
  brochure: p("brochure-ouverte", "Brochure ouverte", "Faune Magazine", "Unsplash", "https://unsplash.com/photos/opened-page-valentine-magazine-DQP03Vq78Z4"),
  rollup: p("rollup", "Roll-up déployés", "NoPixelZone", "Pixabay", "https://pixabay.com/vectors/rollup-roll-up-display-advert-7371480/"),
  plaque: p("plaque-plexi", "Plaque murale en plexiglas", "Brett Sayles", "Pexels", "https://www.pexels.com/photo/4005-sign-3217673/"),
  urne: p("urne", "Urnes utilisées lors d’un vote", "Edmond Dantès", "Pexels", "https://www.pexels.com/photo/people-casting-their-voting-ballots-in-a-box-7103201/"),
  sticker: p("sticker", "Sticker découpé à la forme tenu en main", "Cup of Couple", "Pexels", "https://www.pexels.com/photo/a-person-holding-a-white-sticky-note-8015726/"),
  etiquette: p("etiquette-flacon", "Étiquette sur un flacon, fond rose", "Supplements On Demand", "Pexels", "https://www.pexels.com/photo/a-gummies-supplement-in-plastic-bottle-14433549/"),
  tshirts: p("tshirts", "T-shirts blancs sur fond rose", "Artem Podrez", "Pexels", "https://www.pexels.com/photo/fashion-man-person-woman-6787008/"),
  boites: p("boites", "Boîtes d’expédition étiquetées sur fond jaune", "Ron Lach", "Pexels", "https://www.pexels.com/photo/brown-cardboard-boxes-on-yellow-surface-9594434/"),
};

/** Photos par produit (slug du catalogue), la principale en premier. Bâche et vinyle : la mise en scène suffit. */
export const PRODUCT_PHOTOS: Record<string, ProductPhoto[]> = {
  "carte-de-visite-standard": [PH.cartesGeo, PH.cartesPile],
  "carte-de-visite-vernis-selectif-3d": [PH.cartesPile, PH.cartesGeo],
  "carte-de-visite-aimantee": [PH.cartesPeche],
  "carte-d-invitation": [PH.invitations],
  "invitation-de-mariage": [PH.invitations],
  "badge-pvc-petit-format": [PH.badge],
  "flyer-a6": [PH.flyerFormes],
  "flyer-a5": [PH.flyerMain, PH.flyerFormes],
  "flyer-a4": [PH.flyerMain],
  "flyer-dl": [PH.flyerFormes],
  "chemise-a-rabat-collee": [PH.papeterie],
  "catalogues-brochures": [PH.magazine, PH.brochure],
  "roll-up-85x200": [PH.rollup],
  "plaque-professionnelle-plexiglas": [PH.plaque],
  "urne-en-plexiglas": [PH.urne],
  "stickers-decoupe-a-la-forme": [PH.sticker],
  "etiquettes-adhesives": [PH.etiquette],
  "etiquettes-en-bobine": [PH.etiquette],
  "impression-dtf": [PH.tshirts],
  "packagings-boites": [PH.boites],
};

export const photosFor = (slug: string): ProductPhoto[] => PRODUCT_PHOTOS[slug] ?? [];
