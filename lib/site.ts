import settings from "@/content/settings.json";

export { settings };
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/** Lien WhatsApp vers Neam Print. */
export const waNeam = (text = "Bonjour Neam Print, je souhaite un devis pour une impression.") =>
  waLink(settings.whatsapp, text);
