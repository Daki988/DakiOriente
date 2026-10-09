/**
 * Couche d'accès au contenu.
 * Toutes les données éditables vivent dans /content (JSON) et sont modifiées
 * via l'administration Keystatic (/keystatic). Ne jamais coder de contenu en dur ailleurs.
 */
import settingsData from "@/content/settings.json";
import menuData from "@/content/menu.json";
import eventsData from "@/content/events.json";
import galleryData from "@/content/gallery.json";
import loftData from "@/content/loft.json";

export type Phone = { label: string; number: string; display: string };
export type DayHours = { day: string; open: string; close: string; closed: boolean };
export type Social = { network: string; url: string | null };
export type Settings = Omit<typeof settingsData, "socials"> & { phones: Phone[]; hours: DayHours[]; socials: Social[] };

export type Product = {
  name: string;
  description: string;
  price: number;
  image: string | null;
  featured: boolean;
  available: boolean;
  isNew: boolean;
};
export type Category = { name: string; slug: string; visible: boolean; intro: string; products: Product[] };

export type JackboyEvent = {
  title: string;
  date: string;
  time: string;
  dj: string;
  description: string;
  poster: string | null;
  visible: boolean;
};

export type GalleryItem = { src: string | null; alt: string; mood: string; caption: string };
export type TeamMember = { name: string; role: string; photo: string | null };

export const settings = settingsData as unknown as Settings;
export const loft = loftData;

export const primaryPhone: Phone = settings.phones[0];

export function getCategories(): Category[] {
  return (menuData.categories as Category[]).filter((c) => c.visible);
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
  return (eventsData.events as JackboyEvent[])
    .filter((e) => e.visible && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const gallery = galleryData.items as GalleryItem[];
export const team = galleryData.team as TeamMember[];

/** « 3 500 FCFA » ; un prix à 0 signifie « non renseigné ». */
export function formatPrice(price: number): string {
  if (!price) return "Prix à confirmer";
  return `${new Intl.NumberFormat("fr-FR").format(price).replace(/ | /g, " ")} FCFA`;
}

export function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export function directionsLinks() {
  const { lat, lng } = settings.address;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}`,
  };
}

export function fullAddress(): string {
  const a = settings.address;
  return `${a.street}, ${a.city}, ${a.country}`;
}
