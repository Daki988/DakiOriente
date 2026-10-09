"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { NAV } from "./nav";
import { IconPhone } from "./Icons";

export function Header({ phone, phoneDisplay }: { phone: string; phoneDisplay: string }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/80 backdrop-blur-md">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">
        Aller au contenu
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16">
        <Link href="/" aria-label="Jackboy — accueil"><Logo /></Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-sm transition hover:text-accent ${active ? "text-accent" : "text-text/80"}`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <a
          href={`tel:${phone}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/40 px-4 text-sm font-semibold text-accent transition hover:bg-accent hover:text-accent-ink"
          aria-label={`Appeler Jackboy au ${phoneDisplay}`}
        >
          <IconPhone className="h-4 w-4" />
          <span className="hidden sm:inline">Appeler</span>
        </a>
      </div>
    </header>
  );
}
