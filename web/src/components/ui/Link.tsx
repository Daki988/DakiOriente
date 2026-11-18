"use client";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, type ComponentProps } from "react";

/**
 * Lien interne sans préchargement automatique des liens visibles (Next.js préchargerait sinon chaque lien affiché :
 * jusqu'à 3,6 Mo sur la liste des établissements, coûteux sur les forfaits mobiles), mais avec préchargement à
 * l'INTENTION : survol de la souris, doigt posé sur le lien (≈ 100 à 300 ms avant le clic) ou focus au clavier.
 * La page est ainsi souvent déjà là au moment du clic. `prefetch` peut être forcé au cas par cas.
 */
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Link({ prefetch = false, href, onMouseEnter, onTouchStart, onFocus, ...props }, ref) {
  const router = useRouter();
  const precharger = () => {
    if (prefetch !== false || typeof href !== "string" || !href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) return;
    try { router.prefetch(href); } catch { /* préchargement facultatif */ }
  };
  return (
    <NextLink
      ref={ref}
      href={href}
      prefetch={prefetch}
      onMouseEnter={(e) => { precharger(); onMouseEnter?.(e); }}
      onTouchStart={(e) => { precharger(); onTouchStart?.(e); }}
      onFocus={(e) => { precharger(); onFocus?.(e); }}
      {...props}
    />
  );
});
export default Link;
