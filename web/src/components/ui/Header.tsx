"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/orientation", label: "Orientation" },
  { href: "/metiers", label: "Métiers" },
  { href: "/formations", label: "Formations" },
  { href: "/etablissements", label: "Établissements" },
  { href: "/pays", label: "Pays" },
  { href: "/navilease", label: "Navilease" },
  { href: "/actualites", label: "Actualités" },
];

export function Header() {
  const path = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 240 && !open);
    setScrolled(y > 12);
  });
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <motion.header
      animate={{ y: hidden ? -90 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled ? "border-slate-200/70 bg-white/80 backdrop-blur-xl" : "border-transparent bg-white/60 backdrop-blur"}`}
    >
      <div className="container flex h-[76px] items-center justify-between gap-6">
        <Brand />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) ? "text-brand-600" : "text-ink-soft hover:text-brand-600"}`}>
              {n.label}
              {active(n.href) && <motion.span layoutId="nav-pill" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-600" />}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/formations" aria-label="Rechercher" className="hidden h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#f1f4fd] text-ink-soft transition hover:bg-brand-50 hover:text-brand-600 sm:flex">
            <Search size={18} />
          </Link>
          <Link href="/espace" className="btn-ghost hidden py-2.5 sm:inline-flex">Se connecter</Link>
          <Link href="/espace" className="btn-sun hidden py-2.5 sm:inline-flex">S&apos;inscrire</Link>
          <button onClick={() => setOpen(!open)} className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#f1f4fd] xl:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 bg-white xl:hidden">
            <div className="container grid gap-1 py-4">
              {NAV.map((n, i) => (
                <motion.div key={n.href} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <Link href={n.href} onClick={() => setOpen(false)} className={`block rounded-xl px-4 py-3 font-semibold ${active(n.href) ? "bg-brand-50 text-brand-600" : "text-ink-soft"}`}>{n.label}</Link>
                </motion.div>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2"><Link href="/espace" className="btn-ghost">Se connecter</Link><Link href="/espace" className="btn-sun">S&apos;inscrire</Link></div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
