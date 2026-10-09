"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconMenu, IconSpark, IconPin, IconPhone } from "./Icons";

const items = [
  { href: "/", label: "Accueil", Icon: IconHome },
  { href: "/menu", label: "Menu", Icon: IconMenu },
  { href: "/ambiance", label: "Ambiance", Icon: IconSpark },
  { href: "/acces", label: "Accès", Icon: IconPin },
];

/** Barre de navigation mobile : 4 accès + bouton d'appel central, hauteur modeste, safe area iOS. */
export function BottomNav({ phone }: { phone: string }) {
  const path = usePathname();
  const link = (it: (typeof items)[number]) => {
    const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
    return (
      <li key={it.href} className="flex-1">
        <Link
          href={it.href}
          aria-current={active ? "page" : undefined}
          className={`flex h-[var(--bottom-nav-h)] flex-col items-center justify-center gap-1 text-[11px] transition ${active ? "text-accent" : "text-text/70"}`}
        >
          <it.Icon className="h-5 w-5" />
          {it.label}
        </Link>
      </li>
    );
  };
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-bg/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.slice(0, 2).map(link)}
        <li className="flex w-16 items-center justify-center">
          <a
            href={`tel:${phone}`}
            aria-label="Appeler Jackboy"
            className="-mt-5 flex h-13 w-13 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_6px_24px_rgba(140,198,63,.35)] ring-4 ring-bg"
          >
            <IconPhone className="h-5 w-5" />
          </a>
        </li>
        {items.slice(2).map(link)}
      </ul>
    </nav>
  );
}
