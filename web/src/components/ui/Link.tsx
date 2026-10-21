import NextLink from "next/link";
import { forwardRef, type ComponentProps } from "react";

/**
 * Lien interne sans préchargement automatique : Next.js préchargerait sinon chaque lien visible
 * (jusqu'à 3,6 Mo sur la liste des établissements), coûteux sur les forfaits mobiles.
 * Le préchargement reste actif au survol (ordinateur) ; `prefetch` peut être forcé au cas par cas.
 */
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Link({ prefetch = false, ...props }, ref) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />;
});
export default Link;
