"use client";
// Interface propre à chaque service : barre commune des services, en-tête (logo, menu, options) et pied de page.
import Link from "@/components/ui/Link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PAGES_LEGALES, SERVICES, SERVICES_LISTE, lienLegal, serviceDe, type ServiceId } from "@/lib/services";
import { ParOapsPied } from "./ParOaps";

/** Barre fine au-dessus de l'en-tête : passer d'un service à l'autre. */
export function BarreServices({ actif }: { actif: ServiceId }) {
  return (
    <div className="bg-ink text-[12.5px]">
      <div className="container flex h-[34px] items-center gap-0.5 overflow-x-auto">
        {SERVICES_LISTE.map((s) => (
          <Link key={s.id} href={s.base || "/"} aria-current={s.id === actif ? "page" : undefined}
            className={`flex h-full shrink-0 items-center gap-1.5 px-3 font-semibold transition sm:px-3.5 ${s.id === actif ? "bg-white/[.12] font-extrabold text-white" : "text-[#aab3c8] hover:text-white"}`}>
            <span className="h-2 w-2 rounded-[3px]" style={{ background: s.id === "navigoal" ? "#4f7bff" : s.c }} />{s.nom}
          </Link>
        ))}
        <span className="ml-auto hidden shrink-0 text-xs text-[#7d88a6] md:inline">Un seul compte pour les trois services</span>
      </div>
    </div>
  );
}

/** En-tête de Navilease ou NaviTravel : logo, menu et options du service, retour sur Navigoal. */
export function EnteteService({ id }: { id: Exclude<ServiceId, "navigoal"> }) {
  const s = SERVICES[id];
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { const f = () => setHash(window.location.hash); f(); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const actif = (href: string) => { const [p, h] = href.split("#"); return h ? path === p && hash === `#${h}` : path.startsWith(p); };
  return (
    <header className="sticky top-0 z-50 print:hidden">
      <BarreServices actif={id} />
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="container flex h-[72px] items-center gap-5">
          <Link href={s.base} aria-label={`${s.nom}, accueil`} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.logoHorizontal} alt={s.nom} width={150} height={42} className="h-[42px] w-auto" />
          </Link>
          <span className="hidden h-7 w-px bg-slate-200 xl:block" />
          <nav className="hidden items-center gap-1 xl:flex" aria-label={`Menu ${s.nom}`}>
            {s.menu.map((m) => (
              <Link key={m.href} href={m.href} className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold 2xl:px-2.5 transition hover:opacity-80" style={{ color: actif(m.href) ? s.c : "#3b4566" }}>{m.label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-[#f1f4fd] md:flex xl:hidden 2xl:flex"><ArrowLeft size={16} />Retour sur Navigoal</Link>
            <Link href="/" title="Retour sur Navigoal" aria-label="Retour sur Navigoal" className="hidden h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#f1f4fd] text-ink-soft xl:flex 2xl:hidden"><ArrowLeft size={18} /></Link>
            <Link href={s.perso.href} className="hidden items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-[#f1f4fd] md:flex xl:hidden 2xl:flex"><UserRound size={16} />{s.perso.label}</Link>
            <Link href={s.perso.href} title={s.perso.label} aria-label={s.perso.label} className="hidden h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#f1f4fd] text-ink-soft xl:flex 2xl:hidden"><UserRound size={18} /></Link>
            <Link href={s.cta.href} className="hidden whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110 sm:inline-flex" style={{ background: s.c }}>{s.cta.label}</Link>
            <button onClick={() => setOpen(!open)} className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#f1f4fd] xl:hidden" aria-label="Menu" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 bg-white xl:hidden">
              <div className="container flex max-h-[calc(100dvh-110px)] flex-col gap-1 overflow-y-auto py-3">
                {s.menu.map((m) => <Link key={m.href} href={m.href} onClick={() => setOpen(false)} className="flex items-center rounded-xl px-3 py-3 font-bold text-ink">{m.label}<ChevronRight size={16} className="ml-auto text-ink-mute" /></Link>)}
                <div className="mt-2 flex flex-col gap-2 rounded-2xl p-4" style={{ background: s.fond }}>
                  <span className="text-xs font-extrabold tracking-wide" style={{ color: s.c }}>MON ESPACE</span>
                  {s.perso.espace.map((e) => <Link key={e.href} href={e.href} onClick={() => setOpen(false)} className="text-sm font-semibold text-ink-soft">{e.label}</Link>)}
                </div>
                <Link href={s.cta.href} onClick={() => setOpen(false)} className="mt-2 rounded-xl py-3 text-center font-extrabold text-white" style={{ background: s.c }}>{s.cta.label}</Link>
                <Link href="/" className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-ink-soft"><ArrowLeft size={16} />Retour sur Navigoal</Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

/** Pied de page de Navilease ou NaviTravel, avec ses pages légales. */
export function PiedService({ id }: { id: Exclude<ServiceId, "navigoal"> }) {
  const s = SERVICES[id];
  return (
    <footer className="mt-24 pb-8 pt-14 text-white print:hidden" style={{ background: s.fonce }}>
      <div className="container flex flex-col gap-10">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <div className="flex max-w-sm flex-col gap-4">
            <span className="w-fit rounded-2xl bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.logoHorizontal} alt={s.nom} width={150} height={42} className="h-[38px] w-auto" />
            </span>
            <p className="text-sm leading-relaxed text-white/70">{s.nom} : {s.accroche.toLowerCase()}. Un service de la plateforme Navigoal, avec le même compte.</p>
            <Link href="/" className="flex w-fit items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15"><ArrowLeft size={16} />Retour sur Navigoal</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3"><span className="text-sm font-extrabold">{s.nom}</span>{s.menu.map((m) => <Link key={m.href} href={m.href} className="text-sm text-white/65 hover:text-white">{m.label}</Link>)}</div>
            <div className="flex flex-col gap-3"><span className="text-sm font-extrabold">Mon espace</span>{s.perso.espace.map((m) => <Link key={m.href} href={m.href} className="text-sm text-white/65 hover:text-white">{m.label}</Link>)}<Link href="mailto:contact@navigoal.net" className="text-sm text-white/65 hover:text-white">contact@navigoal.net</Link></div>
            <div className="flex flex-col gap-3"><span className="text-sm font-extrabold">Informations légales</span>{PAGES_LEGALES.map((p) => <Link key={p.id} href={lienLegal(id, p.id)} className="text-sm text-white/65 hover:text-white">{p.long}</Link>)}</div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-white/55 sm:flex-row sm:items-center">
          <span>© 2026 {s.nom} · un service Navigoal, édité par OAPS Consulting Group</span><ParOapsPied />
        </div>
      </div>
    </footer>
  );
}

/** Pied de page selon le service : celui de Navigoal (rendu côté serveur, passé en enfant) ou celui du service. */
export function PiedSelonService({ children }: { children: React.ReactNode }) {
  const id = serviceDe(usePathname());
  return id === "navigoal" ? <>{children}</> : <PiedService id={id} />;
}
