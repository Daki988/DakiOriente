import { settings, seo } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { LdJson } from "./Schema";

const DAY_EN: Record<string, string> = {
  lundi: "Monday", mardi: "Tuesday", mercredi: "Wednesday", jeudi: "Thursday",
  vendredi: "Friday", samedi: "Saturday", dimanche: "Sunday",
};

/** Données structurées globales : établissement local (Restaurant + BarOrPub) et site web. */
export function JsonLd() {
  const business = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "BarOrPub", "FastFoodRestaurant"],
    "@id": `${SITE_URL}/#etablissement`,
    name: settings.name,
    alternateName: ["Jackboy", "Jack Boy", "Jack Boy Bar-Resto 241", "Jackboy 241"],
    description: seo.home.description,
    slogan: settings.tagline,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-dark.png`,
    image: [`${SITE_URL}/opengraph-image`, `${SITE_URL}/images/menu/burger.webp`, `${SITE_URL}/images/menu/mojito.webp`],
    telephone: settings.phones[0]?.number,
    servesCuisine: ["Fast food", "Burgers", "Paninis", "Chicken wings", "Brochettes", "Cocktails"],
    priceRange: "1 000 – 90 000 FCFA",
    currenciesAccepted: "XAF",
    acceptsReservations: false,
    hasMenu: `${SITE_URL}/menu`,
    areaServed: { "@type": "City", name: "Libreville" },
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.street,
      addressLocality: settings.address.city,
      addressRegion: "Estuaire",
      addressCountry: "GA",
      postOfficeBoxNumber: "111",
    },
    ...(settings.address.lat != null ? { geo: { "@type": "GeoCoordinates", latitude: settings.address.lat, longitude: settings.address.lng } } : {}),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address.mapsQuery)}`,
    openingHoursSpecification: settings.hours.filter((h) => !h.closed).map((h) => ({
      "@type": "OpeningHoursSpecification", dayOfWeek: DAY_EN[h.day], opens: h.open, ...(h.close ? { closes: h.close } : {}),
    })),
    contactPoint: settings.phones.map((p) => ({ "@type": "ContactPoint", telephone: p.number, contactType: "customer service", areaServed: "GA", availableLanguage: "French" })),
    potentialAction: { "@type": "OrderAction", target: `${SITE_URL}/menu`, deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet", "http://purl.org/goodrelations/v1#DeliveryModePickUp"] },
    keywords: "bar Libreville, restaurant Libreville, fast food Libreville, burger Libreville, chicha Libreville, cocktails Libreville, bar quartier Louis, sortir à Libreville",
    sameAs: settings.socials.filter((s) => s.url).map((s) => s.url),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#site`,
    url: SITE_URL,
    name: "Jackboy Bar-Resto 241",
    inLanguage: "fr-GA",
    publisher: { "@id": `${SITE_URL}/#etablissement` },
  };
  return (
    <>
      <LdJson data={business} />
      <LdJson data={website} />
    </>
  );
}
