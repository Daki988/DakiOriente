'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Icone } from '@casier/design-system';

/**
 * Menu mobile : fonctionne sans JavaScript (élément details), et se referme seul après un choix, en changeant de page,
 * avec la touche Échap ou en touchant en dehors du menu.
 */
export function MenuMobile({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const chemin = usePathname();

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [chemin]);

  useEffect(() => {
    const fermer = (e: Event) => {
      const m = menu.current;
      if (!m?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Escape') return;
        m.open = false;
        m.querySelector('summary')?.focus();
        return;
      }
      if (!m.contains(e.target as Node)) m.open = false;
    };
    document.addEventListener('keydown', fermer);
    document.addEventListener('pointerdown', fermer);
    return () => {
      document.removeEventListener('keydown', fermer);
      document.removeEventListener('pointerdown', fermer);
    };
  }, []);

  return (
    <details className="cj-menu-mobile" ref={menu}
      onClick={(e) => { if ((e.target as HTMLElement).closest('a') && menu.current) menu.current.open = false; }}>
      <summary><Icone nom="menu" taille={20} /><span>Menu</span></summary>
      <div className="cj-menu-mobile__panneau">{children}</div>
    </details>
  );
}
