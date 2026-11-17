import Link from "next/link";
import { Logo } from "./Logo";

const LIENS = [
  { href: "/comparer", label: "Comparer" },
  { href: "/transitaires", label: "Transitaires" },
  { href: "/calculateur", label: "Calculateur" },
  { href: "/guide", label: "Guide import" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="conteneur flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Neam Transit — accueil">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {LIENS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-marine-50 hover:text-marine-900">
              {l.label}
            </Link>
          ))}
          <Link href="/pro" className="btn-contour ml-2">
            Espace transitaire
          </Link>
        </nav>
        <details className="relative md:hidden">
          <summary className="btn-contour list-none" aria-label="Ouvrir le menu">
            Menu
          </summary>
          <div className="carte absolute right-0 mt-2 flex w-56 flex-col p-2">
            {[...LIENS, { href: "/pro", label: "Espace transitaire" }].map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-800 hover:bg-marine-50">
                {l.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
