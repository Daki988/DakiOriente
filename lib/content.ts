/**
 * Couche d'accès au contenu.
 * Toutes les données éditables vivent dans /content (JSON). Pour modifier un prix,
 * un horaire ou un produit : éditer le JSON, committer → le site est republié automatiquement.
 */
import settingsData from "@/content/settings.json";
import menuData from "@/content/menu.json";
import eventsData from "@/content/events.json";
import galleryData from "@/content/gallery.json";
import loftData from "@/content/loft.json";
import seoData from "@/content/seo.json";
import faqData from "@/content/faq.json";

export type Phone = { label: string; number: string; display: string };
/** `close` vide = heure de fermeture non communiquée. */
export type DayHours = { day: string; open: string; close: string; closed: boolean };
export type Social = { network: string; url: string | null };
export type Settings = {
  demoMode: boolean;
  name: string;
  tagline: string;
  taglineFr: string;
  phones: Phone[];
  whatsapp: string;
  address: {
    street: string; city: string; country: string; landmark: string;
    mapsQuery: string; googleName?: string; lat: number | null; lng: number | null;
  };
  hours: DayHours[];
  hoursNote: string;
  residentDj: string;
  ordering: { enabled: boolean; modes: string[]; note: string };
  socials: Social[];
};

export type Variant = { label: string; price: number };
export type Product = {
  name: string;
  description: string;
  price: number;
  image: string | null;
  featured: boolean;
  available: boolean;
  isNew: boolean;
  variants?: Variant[];
};
export type Category = {
  name: string; slug: string; visible: boolean; intro: string;
  image: string | null; note: string; products: Product[];
};

export type JackboyEvent = {
  title: string; date: string; time: string; dj: string; description: string; poster: string | null; visible: boolean;
  endNote?: string; genres?: string[]; perks?: string[]; infoPhones?: string[];
  posterWidth?: number; posterHeight?: number; video?: string; videoPoster?: string;
};
export type GalleryItem = { src: string | null; alt: string; mood: string; caption: string };
export type TeamMember = { name: string; role: string; photo: string | null };

export const settings = settingsData as unknown as Settings;
export const loft = loftData;
export const primaryPhone: Phone = settings.phones[0];

export function getCategories(): Category[] {
  return (menuData.categories as unknown as Category[]).filter((c) => c.visible);
}

export function getSignatureProducts(limit = 4): (Product & { category: string })[] {
  return getCategories()
    .flatMap((c) => c.products.map((p) => ({ ...p, category: c.name })))
    .filter((p) => p.featured && p.available)
    .slice(0, limit);
}

/** Événements visibles, à venir, triés par date. */
export function getUpcomingEvents(now = new Date()): JackboyEvent[] {
  const today = now.toISOString().slice(0, 10);
  return (eventsData.events as unknown as JackboyEvent[])
    .filter((e) => e.visible && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const gallery = galleryData.items as GalleryItem[];
export const team = galleryData.team as TeamMember[];
export type Poster = { src: string; alt: string; w: number; h: number };
export const posters = galleryData.posters as Poster[];
export type Drink = { src: string; alt: string; caption: string; bg: string };
export const drinks = galleryData.drinks as Drink[];

/** « 3 500 FCFA » ; un prix à 0 signifie « non renseigné ». */
export function formatPrice(price: number): string {
  if (!price) return "Prix sur place";
  return `${new Intl.NumberFormat("fr-FR").format(price).replace(/ | /g, " ")} FCFA`;
}

export function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** Liens d'itinéraire : coordonnées GPS si connues, sinon recherche par repère. */
export function directionsLinks() {
  const { lat, lng, mapsQuery } = settings.address;
  const hasGps = lat != null && lng != null;
  const dest = hasGps ? `${lat},${lng}` : encodeURIComponent(mapsQuery);
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
    waze: hasGps ? `https://waze.com/ul?ll=${dest}&navigate=yes` : `https://waze.com/ul?q=${dest}&navigate=yes`,
    apple: `https://maps.apple.com/?daddr=${dest}`,
    embed: `https://maps.google.com/maps?q=${dest}&z=16&output=embed`,
  };
}

export function fullAddress(): string {
  const a = settings.address;
  return `${a.street}, ${a.city}, ${a.country}`;
}

export function whatsappLink(text?: string): string {
  const n = (settings.whatsapp || primaryPhone.number).replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export type CategorySeo = { h1: string; title: string; description: string; intro: string };
export const seo = seoData as { home: { title: string; description: string }; categories: Record<string, CategorySeo> };
export const faq = faqData.items as { q: string; a: string }[];

export function getCategory(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

/** Prix minimum d'un produit (variantes comprises). */
export function minPrice(p: Product): number {
  return p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;
}

/** Carte officielle téléchargeable. */
export const MENU_PDF = {
  href: "/menu/carte-jackboy-241-libreville.pdf",
  filename: "Carte-Jackboy-241-Libreville.pdf",
  sizeLabel: "PDF · 1,9 Mo · 2 pages",
  pages: [
    { src: "/menu/carte-bar-jackboy-libreville.webp", alt: "Carte du bar Jackboy Libreville : bières, cocktails, spiritueux, vins, chicha" },
    { src: "/menu/carte-fast-food-jackboy-libreville.webp", alt: "Carte fast food Jackboy Libreville : burgers, paninis, wings, brochettes, nems, frites" },
  ],
};

/** Groupes de produits utilisés par le composeur de soirée. */
export function getComposerPools() {
  const by = (slugs: string[], variant?: string) =>
    getCategories()
      .filter((c) => slugs.includes(c.slug))
      .flatMap((c) => c.products)
      .filter((p) => p.available)
      .flatMap((p) => {
        if (p.variants?.length) {
          const v = variant ? p.variants.find((x) => x.label === variant) : p.variants[0];
          return v ? [{ name: p.name, variant: v.label, price: v.price }] : [];
        }
        return p.price ? [{ name: p.name, price: p.price }] : [];
      });
  return {
    food: by(["burgers", "paninis", "wings", "brochettes", "nems"]),
    side: by(["frites"]),
    drink: by(["bieres-locales", "bieres-etrangeres", "cocktails"]),
    soft: by(["jus"]),
    share: [...by(["shoot-punch"]), ...by(["chicha"], "Chicha")],
    bottle: by(["spiritueux"], "Bouteille"),
  };
}
