"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Briefcase, KeyRound, Building2, Compass, FileText, Folder, GraduationCap, House, LayoutDashboard, MessageCircle, Search, Settings, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "./Brand";

const ITEMS = [
  { href: "/espace", Icon: LayoutDashboard, t: "Tableau de bord" },
  { href: "/espace#profil", Icon: UserRound, t: "Mon profil" },
  { href: "/orientation", Icon: Compass, t: "Mon orientation" },
  { href: "/metiers", Icon: Briefcase, t: "Métiers" },
  { href: "/formations", Icon: GraduationCap, t: "Formations" },
  { href: "/etablissements", Icon: Building2, t: "Établissements" },
  { href: "/espace#candidatures", Icon: FileText, t: "Mes candidatures" },
  { href: "/espace#documents", Icon: Folder, t: "Mes documents" },
  { href: "/navilease", Icon: House, t: "Mon logement" },
  { href: "/espace#messages", Icon: MessageCircle, t: "Messages", badge: 2 },
  { href: "/espace#parametres", Icon: Settings, t: "Paramètres" },
];

const MOBILE = [
  { href: "/", Icon: House, t: "Accueil" },
  { href: "/orientation", Icon: Compass, t: "Orientation" },
  { href: "/formations", Icon: Search, t: "Explorer" },
  { href: "/navilease", Icon: KeyRound, t: "Logement" },
  { href: "/espace", Icon: UserRound, t: "Mon espace" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-6 border-r border-slate-200/70 bg-white px-4 py-6 lg:flex">
        <div className="px-2"><Brand /></div>
        <nav className="flex flex-col gap-1">
          {ITEMS.map(({ href, Icon, t, badge }) => {
            const on = href === path || (href !== "/espace" && !href.includes("#") && path.startsWith(href)) || (href === "/espace" && path === "/espace");
            return (
              <Link key={t} href={href} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${on ? "text-brand-600" : "text-ink-soft hover:bg-[#f6f8fe]"}`}>
                {on && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <Icon size={18} className="relative" /><span className="relative">{t}</span>
                {badge && <span className="relative ml-auto rounded-full bg-sun-400 px-2 text-xs font-bold text-ink">{badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 rounded-[18px] bg-gradient-to-br from-brand-600 to-brand-400 p-4 text-white">
          <b>Besoin d&apos;aide ?</b><span className="text-xs text-brand-100">Échange avec un conseiller d&apos;orientation.</span>
          <button className="btn-sun btn-shine py-2 text-[13px]">Prendre rendez-vous</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between gap-4 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="lg:hidden"><Brand /></div>
          <div className="hidden w-[420px] items-center gap-2.5 rounded-xl bg-[#f6f8fe] px-4 py-2.5 text-sm text-ink-mute md:flex"><Search size={18} />Rechercher…</div>
          <div className="flex items-center gap-4">
            <button aria-label="Notifications" className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#f6f8fe]"><Bell size={20} /><span className="absolute right-2.5 top-2.5 h-2 w-2 animate-ping rounded-full bg-[#ff3d7f]" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff3d7f]" /></button>
            <div className="flex items-center gap-2.5"><span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-gradient-to-br from-sun-400 to-sun-500 font-extrabold">AM</span><span className="hidden sm:block"><b className="block text-sm">Amina Mba</b><span className="text-xs text-ink-mute">Terminale C · Libreville</span></span></div>
          </div>
        </header>
        <main className="flex-1 p-4 pb-28 sm:p-8 lg:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden" aria-label="Navigation de l'espace">
          {MOBILE.map(({ href, Icon, t }) => {
            const on = href === "/" ? false : path.startsWith(href);
            return (
              <Link key={t} href={href} className={`relative flex flex-col items-center gap-1 px-2 text-[11px] font-bold ${on ? "text-brand-600" : "text-ink-mute"}`}>
                {on && <motion.span layoutId="mob-pill" className="absolute -top-2 h-1 w-8 rounded-full bg-brand-600" />}<Icon size={22} />{t}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
