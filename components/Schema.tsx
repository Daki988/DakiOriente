import { faq, getCategories, settings, MENU_PDF } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/** Injecte un objet JSON-LD. */
export function LdJson({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}

/** Menu complet au format schema.org (sections + plats + prix en XAF). */
export function menuSchema(onlySlug?: string) {
  const cats = getCategories().filter((c) => !onlySlug || c.slug === onlySlug);
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${SITE_URL}/menu#menu`,
    name: `Menu ${settings.name}`,
    url: `${SITE_URL}/menu`,
    inLanguage: "fr",
    subjectOf: { "@type": "DigitalDocument", name: "Carte Jackboy (PDF)", url: `${SITE_URL}${MENU_PDF.href}`, encodingFormat: "application/pdf" },
    hasMenuSection: cats.map((c) => ({
      "@type": "MenuSection",
      name: c.name,
      url: `${SITE_URL}/menu/${c.slug}`,
      ...(c.image ? { image: `${SITE_URL}${c.image}` } : {}),
      hasMenuItem: c.products.filter((p) => p.available).map((p) => ({
        "@type": "MenuItem",
        name: p.name,
        ...(p.description ? { description: p.description } : {}),
        offers: (p.variants?.length ? p.variants : [{ label: "", price: p.price }])
          .filter((v) => v.price)
          .map((v) => ({ "@type": "Offer", price: v.price, priceCurrency: "XAF", ...(v.label ? { name: v.label } : {}) })),
      })),
    })),
  };
}
