// Contenus éditoriaux pour les pages publiques : base de données, avec repli sur les contenus de démonstration.
import { ACTUALITES } from "@/lib/content";
import { getArticle, listArticles } from "./services/admin";

const STYLE: Record<string, { tone: string; grad: string; icon: string }> = {
  Bourses: { tone: "sun", grad: "from-brand-600 to-brand-400", icon: "award" }, Orientation: { tone: "green", grad: "from-[#0f8a46] to-[#34d399]", icon: "compass" },
  International: { tone: "violet", grad: "from-[#6a3df0] to-[#a78bfa]", icon: "plane" }, "Vie étudiante": { tone: "rose", grad: "from-[#d42a50] to-[#fb7185]", icon: "users" },
  Innovation: { tone: "blue", grad: "from-[#0e7490] to-[#22d3ee]", icon: "cpu" }, Métiers: { tone: "sun", grad: "from-[#c2410c] to-[#fb923c]", icon: "hard-hat" },
};
export type Card = { slug: string; cat: string; tone: string; titre: string; date: string; grad: string; icon: string; resume: string };

export async function articleCards(): Promise<Card[]> {
  try {
    const rows = await listArticles(true);
    if (!rows.length) throw new Error("vide");
    return rows.map((a) => ({ slug: a.slug, cat: a.category, titre: a.title, resume: a.excerpt, date: (a.publishedAt ?? a.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }), ...(STYLE[a.category] ?? STYLE.Orientation) }));
  } catch {
    return ACTUALITES.map((a) => ({ ...a }));
  }
}

export async function articleBySlug(slug: string) {
  try {
    const a = await getArticle(slug);
    return { ...a, style: STYLE[a.category] ?? STYLE.Orientation };
  } catch {
    return null;
  }
}

/** Données saisies par l'établissement (description, contacts, formations publiées) pour la fiche publique. */
export async function establishmentLive(id: string) {
  try {
    const { getEstablishment, listPrograms } = await import("./services/establishments");
    const [e, programs] = await Promise.all([getEstablishment(id), listPrograms(id)]);
    return { description: e.description, email: e.email, phone: e.phone, siteWeb: e.siteWeb, status: e.status, programs };
  } catch {
    return null;
  }
}
