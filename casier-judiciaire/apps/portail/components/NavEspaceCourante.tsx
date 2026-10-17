'use client';
import { usePathname } from 'next/navigation';
import { NavEspace, type LienEspace } from '@casier/design-system';

/** Navigation de l'espace avec la page courante déduite de l'adresse. */
export function NavEspaceCourante({ liens }: { liens: LienEspace[] }) {
  return <NavEspace liens={liens} courant={usePathname()} />;
}
