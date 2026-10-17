import type { Field } from "./model.ts";
import type { IconId, PatternId } from "./motifs.ts";
import type { Kind } from "./templates.ts";

type Texts = Record<Field, string>;
export type Sector = {
  id: string; name: string; icon: IconId; palette: string; pattern: PatternId;
  /** Textes d'exemple par type de produit ; à défaut, ceux de « promo ». */
  texts: Partial<Record<Kind, Texts>> & { promo: Texts };
};

const tel = "+241 77 12 34 56";

/** Métiers courants à Libreville : textes d'exemple, couleurs, motif et pictogramme assortis. */
export const SECTORS: Sector[] = [
  {
    id: "restaurant", name: "Restaurant", icon: "restaurant", palette: "terre", pattern: "wax",
    texts: {
      carte: { titre: "Rodrigue Ondo", sousTitre: "Chef cuisinier", texte: "Le Nyanga", l1: tel, l2: "Bord de mer, Libreville", l3: "7 j/7 · 11 h – 23 h" },
      promo: { titre: "Le Nyanga", sousTitre: "Cuisine gabonaise & braisés", texte: "Poulet nyembwe, poisson braisé, feuilles de manioc… Sur place, à emporter ou livré.", l1: "Ouvert 7 j/7 · 11 h – 23 h", l2: "Bord de mer, Libreville", l3: `Commandes ${tel}` },
      marque: { titre: "Le Nyanga", sousTitre: "Cuisine gabonaise", texte: "Fait maison", l1: tel, l2: "Libreville", l3: "" },
    },
  },
  {
    id: "beaute", name: "Beauté & coiffure", icon: "beaute", palette: "orchidee", pattern: "cauris",
    texts: {
      carte: { titre: "Grâce Moussavou", sousTitre: "Coiffeuse & esthéticienne", texte: "Studio Grâce", l1: "+241 66 12 34 56", l2: "Quartier Louis, Libreville", l3: "Sur rendez-vous" },
      promo: { titre: "Studio Grâce", sousTitre: "Tresses, tissages, onglerie", texte: "Une équipe passionnée pour sublimer votre beauté. Produits professionnels, ambiance détente.", l1: "–20 % tous les mercredis", l2: "Quartier Louis, Libreville", l3: "RDV +241 66 12 34 56" },
      marque: { titre: "Studio Grâce", sousTitre: "Beauté & coiffure", texte: "Soin karité", l1: "+241 66 12 34 56", l2: "", l3: "" },
    },
  },
  {
    id: "btp", name: "BTP & bâtiment", icon: "btp", palette: "chantier", pattern: "dents",
    texts: {
      carte: { titre: "Paul Nguema", sousTitre: "Directeur de travaux", texte: "Nguema Construction", l1: tel, l2: "contact@nguema-btp.ga", l3: "Owendo · Libreville" },
      promo: { titre: "Nguema Construction", sousTitre: "Bâtiment, rénovation, gros œuvre", texte: "Plus de 15 ans d’expérience au Gabon. Devis gratuit sous 48 h, travaux garantis.", l1: "Devis gratuit", l2: "Zone industrielle d’Owendo", l3: tel },
    },
  },
  {
    id: "eglise", name: "Église", icon: "eglise", palette: "royal", pattern: "losanges",
    texts: {
      carte: { titre: "Pasteur Samuel Mba", sousTitre: "Pasteur principal", texte: "Église La Source", l1: tel, l2: "lasource@eglise.ga", l3: "Nzeng-Ayong, Libreville" },
      evenement: { titre: "Grande croisade", sousTitre: "Venez comme vous êtes", texte: "Trois jours de louange, d’enseignement et de prière. Entrée libre.", l1: "Du 12 au 14 avril · 17 h", l2: "Stade Omnisport, Libreville", l3: `Infos ${tel}` },
      promo: { titre: "Grande croisade d’évangélisation", sousTitre: "Venez comme vous êtes", texte: "Trois jours de louange, d’enseignement et de prière. Entrée libre.", l1: "Du 12 au 14 avril · 17 h", l2: "Stade Omnisport, Libreville", l3: `Infos ${tel}` },
    },
  },
  {
    id: "mariage", name: "Mariage", icon: "mariage", palette: "ivoire", pattern: "losanges",
    texts: {
      evenement: { titre: "Mélissa & Arnaud", sousTitre: "Ont la joie de vous inviter à leur mariage", texte: "Cérémonie suivie d’un dîner dansant. Votre présence sera notre plus beau cadeau.", l1: "Samedi 20 juin · 15 h", l2: "Mairie du 1er arrondissement, Libreville", l3: `RSVP ${tel}` },
      carte: { titre: "Mélissa & Arnaud", sousTitre: "20 juin", texte: "M & A", l1: "Mairie du 1er arrondissement", l2: "Libreville", l3: `RSVP ${tel}` },
      promo: { titre: "Mélissa & Arnaud", sousTitre: "Ont la joie de vous inviter à leur mariage", texte: "Cérémonie suivie d’un dîner dansant. Votre présence sera notre plus beau cadeau.", l1: "Samedi 20 juin · 15 h", l2: "Mairie du 1er arrondissement, Libreville", l3: `RSVP ${tel}` },
    },
  },
  {
    id: "ecole", name: "École", icon: "ecole", palette: "ocean", pattern: "kente",
    texts: {
      carte: { titre: "Clarisse Ella", sousTitre: "Directrice", texte: "Complexe scolaire Les Okoumés", l1: tel, l2: "direction@okoumes.ga", l3: "Akanda, Libreville" },
      promo: { titre: "Complexe scolaire Les Okoumés", sousTitre: "Inscriptions ouvertes", texte: "De la maternelle au lycée. Effectifs réduits, cantine et transport scolaire.", l1: "Inscriptions dès le 1er juillet", l2: "Akanda, Libreville", l3: tel },
    },
  },
  {
    id: "transport", name: "Transport & livraison", icon: "transport", palette: "neam", pattern: "dents",
    texts: {
      carte: { titre: "Serge Ntoutoume", sousTitre: "Gérant", texte: "Rapide Express", l1: tel, l2: "contact@rapide-express.ga", l3: "Owendo, Libreville" },
      promo: { titre: "Rapide Express", sousTitre: "Transport & livraison partout au Gabon", texte: "Déménagements, colis, marchandises. Véhicules assurés, chauffeurs expérimentés.", l1: "Libreville · Port-Gentil · Franceville", l2: "Owendo, Libreville", l3: tel },
    },
  },
  {
    id: "commerce", name: "Boutique", icon: "commerce", palette: "corail", pattern: "wax",
    texts: {
      carte: { titre: "Aminata Diallo", sousTitre: "Gérante", texte: "Boutique Mbolo", l1: tel, l2: "Mont-Bouët, Libreville", l3: "Lun – Sam · 9 h – 20 h" },
      promo: { titre: "Boutique Mbolo", sousTitre: "Nouvelle collection wax", texte: "Pagnes, sacs, bijoux et accessoires. Arrivages chaque semaine.", l1: "–15 % sur toute la collection", l2: "Mont-Bouët, Libreville", l3: tel },
      marque: { titre: "Boutique Mbolo", sousTitre: "Mode & accessoires", texte: "Merci pour votre achat", l1: tel, l2: "", l3: "" },
    },
  },
  {
    id: "sante", name: "Santé", icon: "sante", palette: "clinique", pattern: "losanges",
    texts: {
      carte: { titre: "Dr Nadège Obiang", sousTitre: "Médecin généraliste", texte: "Cabinet Santé Plus", l1: tel, l2: "rdv@santeplus.ga", l3: "Batterie IV, Libreville" },
      promo: { titre: "Cabinet Santé Plus", sousTitre: "Consultations avec ou sans rendez-vous", texte: "Médecine générale, pédiatrie, analyses. Une équipe à votre écoute.", l1: "Lun – Sam · 8 h – 19 h", l2: "Batterie IV, Libreville", l3: tel },
    },
  },
];

export const sectorTexts = (s: Sector, kind: Kind): Texts => s.texts[kind] ?? s.texts.promo;
