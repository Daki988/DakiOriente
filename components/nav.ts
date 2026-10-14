import { loft } from "@/lib/content";

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/menu", label: "Menu" },
  { href: "/ambiance", label: "Ambiance" },
  { href: "/evenements", label: "Événements" },
  ...(loft.visible ? [{ href: "/loft", label: "Loft" }] : []),
  { href: "/acces", label: "Accès" },
];
