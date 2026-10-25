import type { Quad } from "./perspective.ts";
import type { MockupKind } from "./templates.ts";

/** Zone de la photo où le design est plaqué (coins dans l'ordre HG, HD, BD, BG, en px de la photo). */
export type PhotoZone = { quad: Quad; side?: number; shade?: number };
export type MockupPhoto = {
  kind: MockupKind; src: string; w: number; h: number; alt: string; zones: PhotoZone[];
  /** Largeur / hauteur réelle de la surface imprimée : sert à choisir une photo adaptée au format. */
  ratio: number;
  /** Crédit facultatif (licences Unsplash et Pexels : usage commercial libre, attribution appréciée). */
  credit?: { author: string; site: string; url: string };
};

/** Toutes les photos sont recadrées en 4:3, à 1440 × 1080 px. */
const W = 1440, H = 1080;
const photo = (
  kind: MockupKind, file: string, alt: string, ratio: number, zones: PhotoZone[], author: string, url: string,
): MockupPhoto => ({ kind, src: `/mockups/${file}.jpg`, w: W, h: H, alt, ratio, zones, credit: { author, site: "Unsplash", url } });

/** Photos de mise en scène disponibles, par type de support. */
export const PHOTOS: MockupPhoto[] = [
  photo("cards", "cartes-bureau", "Cartes de visite recto et verso sur un bureau en bois", 1.8, [
    { quad: [[496, 219], [945, 219], [945, 466], [496, 464]], side: 0 },
    { quad: [[496, 614], [945, 614], [945, 861], [502, 861]], side: 1 },
  ], "grey wight", "https://unsplash.com/photos/white-printer-paper-on-brown-wooden-surface-YREw6bUXAT8"),
  photo("invite", "invitation-fleurs", "Invitation posée sur son enveloppe, avec des fleurs", 0.67, [
    { quad: [[301, 119], [856, 119], [856, 943], [301, 943]] },
  ], "Jennie Razumnaya", "https://unsplash.com/photos/daffodils-and-a-card-on-a-gray-surface-IE8bSD-pBto"),
  photo("invite", "invitation-enveloppe", "Carte d’invitation posée sur son enveloppe", 1.44, [
    { quad: [[456, 516], [1056, 329], [1179, 747], [591, 932]], shade: 0.85 },
  ], "Mediamodifier", "https://unsplash.com/photos/white-printer-paper-on-brown-envelope-ehI8qokwP7s"),
  photo("paper", "flyer-bois", "Flyer pincé sur une table en bois", 0.71, [
    { quad: [[376, 27], [1095, 35], [1102, 1049], [377, 1050]], shade: 0.85 },
  ], "Elena Joland", "https://unsplash.com/photos/white-printer-paper-on-brown-wooden-table-oCdG2sTjDDQ"),
  photo("poster", "affiche-cadre", "Affiche encadrée posée contre un mur", 0.79, [
    { quad: [[384, 91], [1058, 93], [1064, 949], [382, 951]], shade: 0.5 },
  ], "Dmitry Mashkin", "https://unsplash.com/photos/picture-frame-with-hourglass-and-horse-hyGXlmNeK-I"),
  photo("banner", "bache-panneau", "Bâche tendue sur un panneau en hauteur", 1.8, [
    { quad: [[384, 343], [890, 107], [897, 695], [392, 851]], shade: 0.75 },
  ], "Kate Trysh", "https://unsplash.com/photos/rectangular-blank-billboard-Dnkr_lmdKi8"),
  photo("tshirt", "tshirt-cintre", "T-shirt blanc imprimé sur un cintre", 0.565, [
    { quad: [[564, 324], [877, 324], [877, 878], [564, 878]] },
  ], "Avtar Singh", "https://unsplash.com/photos/a-plain-white-t-shirt-hangs-on-a-wooden-hanger-8ACmRoleM24"),
  photo("box", "boite-blanche", "Boîte d’expédition imprimée, vue de dessus", 1.7, [
    { quad: [[240, 252], [1210, 252], [1210, 824], [240, 824]], shade: 0.8 },
  ], "mockupbee", "https://unsplash.com/photos/a-white-rectangular-object-hDn3V_DPka4"),
  photo("bottle", "flacon", "Étiquette collée sur un flacon", 1, [
    { quad: [[548, 442], [891, 442], [891, 786], [548, 786]], shade: 0.75 },
  ], "Suleman Serwar", "https://unsplash.com/photos/a-bottle-of-medicine-on-a-pink-background-tFTWq1R3ukQ"),
  photo("vehicle", "utilitaire", "Lettrage sur le flanc d’un utilitaire", 1.75, [
    { quad: [[273, 234], [505, 228], [505, 362], [272, 362]], shade: 0.85 },
  ], "Autotrader UK", "https://unsplash.com/photos/a-white-delivery-van-parked-on-a-dirt-road-3D_e8UPMw_E"),
  photo("window", "vitrine", "Adhésif collé sur la vitrine d’une boutique", 2, [
    { quad: [[260, 344], [847, 344], [847, 638], [260, 638]], shade: 0.4 },
  ], "Maria Lupan", "https://unsplash.com/photos/a-store-front-with-a-window-that-has-a-reflection-of-a-car-in-the-window-x2SdB_gN6wo"),
  photo("folder", "chemise", "Deux chemises imprimées posées l’une sur l’autre", 0.7, [
    { quad: [[356, -83], [955, -83], [955, 767], [356, 767]], shade: 0.6 },
    { quad: [[498, 129], [1128, 129], [1128, 1026], [498, 1026]], shade: 0.6 },
  ], "MJH SHIKDER", "https://unsplash.com/photos/white-printer-paper-on-white-surface-sWaBlk7OWrE"),
  photo("brochure", "catalogue-pile", "Catalogue posé sur une pile d’exemplaires", 0.7, [
    { quad: [[232, 267], [732, 15], [1079, 722], [586, 967]], shade: 0.6 },
  ], "MJH SHIKDER", "https://unsplash.com/photos/white-rectangular-box-on-white-surface-rPKftEOfBuk"),
  photo("plaque", "plaque-brique", "Plaque fixée sur un mur de briques à l’entrée", 1.76, [
    { quad: [[382, 511], [1053, 510], [1053, 891], [382, 891]], shade: 0.8 },
  ], "akhmad jazuli", "https://unsplash.com/photos/a-picture-frame-hanging-on-a-brick-wall-2HnYoVPL7wM"),
];

/** Écart toléré entre le format du design et celui de la surface photographiée (≈ 28 %). */
const TOLERANCE = 0.25;

/**
 * Photo pour ce support dont la surface a des proportions proches du design (largeur / hauteur) ;
 * aucune si le format est trop différent : la scène dessinée prend alors le relais, sans déformer le design.
 */
export function photoFor(kind: MockupKind, ratio?: number): MockupPhoto | undefined {
  const all = PHOTOS.filter((p) => p.kind === kind);
  if (!ratio) return all[0];
  const gap = (p: MockupPhoto) => Math.abs(Math.log(ratio / p.ratio));
  const best = all.sort((a, b) => gap(a) - gap(b))[0];
  return best && gap(best) <= TOLERANCE ? best : undefined;
}
