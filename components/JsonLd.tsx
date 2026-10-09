import { settings, fullAddress } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const DAY_EN: Record<string, string> = {
  lundi: "Monday", mardi: "Tuesday", mercredi: "Wednesday", jeudi: "Thursday",
  vendredi: "Friday", samedi: "Saturday", dimanche: "Sunday",
};

/** Données structurées schema.org (Restaurant + BarOrPub). */
export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "BarOrPub"],
    name: settings.name,
    slogan: settings.tagline,
    url: SITE_URL,
    telephone: settings.phones[0]?.number,
    servesCuisine: ["Paninis", "Grillades"],
    priceRange: "FCFA",
    hasMenu: `${SITE_URL}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.street,
      addressLocality: settings.address.city,
      addressCountry: "GA",
      description: `${fullAddress()} — ${settings.address.landmark}`,
    },
    geo: { "@type": "GeoCoordinates", latitude: settings.address.lat, longitude: settings.address.lng },
    openingHoursSpecification: settings.hours.filter((h) => !h.closed).map((h) => ({
      "@type": "OpeningHoursSpecification", dayOfWeek: DAY_EN[h.day], opens: h.open, closes: h.close,
    })),
    sameAs: settings.socials.filter((s) => s.url).map((s) => s.url),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
