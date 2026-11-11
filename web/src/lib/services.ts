// Les trois services de la plateforme : Navigoal, Navilease, NaviTravel.
// Chacun a son interface (logo, couleur, menu, bouton principal, pied de page) et ses 4 pages légales.
export type ServiceId = "navigoal" | "navilease" | "navitravel";
export type PageLegale = "cgu" | "confidentialite" | "mentions-legales" | "cookies";

export const PAGES_LEGALES: { id: PageLegale; court: string; long: string }[] = [
  { id: "cgu", court: "CGU", long: "Conditions d'utilisation" },
  { id: "confidentialite", court: "Confidentialité", long: "Politique de confidentialité" },
  { id: "mentions-legales", court: "Mentions légales", long: "Mentions légales" },
  { id: "cookies", court: "Cookies", long: "Politique cookies" },
];

type Lien = { href: string; label: string };
export type Service = {
  id: ServiceId; nom: string; base: string; accroche: string;
  /** Couleur principale, couleur d'accent et fond clair (tirés du logo). */
  c: string; accent: string; fond: string; fonce: string;
  logo: string; logoHorizontal: string; symbole: string;
  menu: Lien[]; cta: Lien; perso: Lien & { espace: Lien[] };
};

export const SERVICES: Record<ServiceId, Service> = {
  navigoal: {
    id: "navigoal", nom: "Navigoal", base: "", accroche: "S'orienter, comparer, candidater",
    c: "#1a47f5", accent: "#ffc21f", fond: "#eef4ff", fonce: "#0b1a4f",
    logo: "/brand/navigoal-logo-ui.png", logoHorizontal: "/brand/navigoal-wordmark-ui.png", symbole: "/brand/navigoal-mark-96.png",
    menu: [], cta: { href: "/inscription", label: "S'inscrire" }, perso: { href: "/espace", label: "Mon espace", espace: [] },
  },
  navilease: {
    id: "navilease", nom: "Navilease", base: "/navilease", accroche: "Se loger en toute sécurité",
    c: "#2b6a4c", accent: "#e9a33a", fond: "#e9f4ed", fonce: "#0f2e20",
    logo: "/brand/navilease-logo.webp", logoHorizontal: "/brand/navilease-horizontal.webp", symbole: "/brand/navilease-symbole.webp",
    menu: [
      { href: "/navilease/logements", label: "Logements" },
      { href: "/navilease/residences", label: "Résidences universitaires" },
      { href: "/navilease/comment-ca-marche", label: "Comment ça marche" },
      { href: "/navilease/bailleurs", label: "Bailleurs" },
      { href: "/navilease/cgu", label: "Aide et règles" },
    ],
    cta: { href: "/bailleur/annonces/nouvelle", label: "Publier une annonce" },
    perso: {
      href: "/navilease/reservations", label: "Mes réservations",
      espace: [{ href: "/navilease/reservations", label: "Mes réservations" }, { href: "/espace/logement", label: "Mon logement et mes alertes" }, { href: "/bailleur", label: "Espace bailleur" }],
    },
  },
  navitravel: {
    id: "navitravel", nom: "NaviTravel", base: "/navitravel", accroche: "Voyager et s'installer",
    c: "#246c88", accent: "#ec7d5c", fond: "#e5f1f6", fonce: "#0d2a36",
    logo: "/brand/navitravel-logo.webp", logoHorizontal: "/brand/navitravel-horizontal.webp", symbole: "/brand/navitravel-symbole.webp",
    menu: [
      { href: "/navitravel#billet", label: "Billet d'avion" },
      { href: "/navitravel#visa", label: "Visa" },
      { href: "/navitravel#accueil", label: "Accueil" },
      { href: "/navitravel#assurance", label: "Assurance" },
      { href: "/navitravel#comment", label: "Comment ça marche" },
      { href: "/navitravel#questions", label: "Questions" },
    ],
    cta: { href: "/navitravel#devis", label: "Demander un devis" },
    perso: {
      href: "/espace/conseiller", label: "Mes demandes",
      espace: [{ href: "/espace/conseiller", label: "Mes demandes et mon conseiller" }, { href: "/espace/documents", label: "Mes documents de voyage" }],
    },
  },
};
export const SERVICES_LISTE = Object.values(SERVICES);

/** Service affiché pour une adresse (les pages /navilease et /navitravel ont leur propre interface). */
export const serviceDe = (path: string): ServiceId => (path.startsWith("/navilease") ? "navilease" : path.startsWith("/navitravel") ? "navitravel" : "navigoal");
export const lienLegal = (s: ServiceId, p: PageLegale) => `${SERVICES[s].base}/${p}`;
