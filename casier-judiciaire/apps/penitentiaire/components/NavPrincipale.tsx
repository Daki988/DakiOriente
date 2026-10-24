'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Navigation principale ; la page courante est signalée aux lecteurs d'écran (aria-current). */
export function NavPrincipale({ liens }: { liens: { libelle: string; href: string }[] }) {
  const chemin = usePathname();
  const courant = (href: string) => (href === '/' ? chemin === '/' : chemin === href || chemin.startsWith(href + '/'));
  return (
    <ul className="cj-nav">
      {liens.map((l) => (
        <li key={l.href}>
          <Link href={l.href} aria-current={courant(l.href) ? 'page' : undefined}>{l.libelle}</Link>
        </li>
      ))}
    </ul>
  );
}
