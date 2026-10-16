"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Briefcase, Calculator, ChevronDown, ChevronRight, Compass, Download, FileCheck2, FileText, House, LayoutGrid, ListChecks, MapPin, Plane, Repeat, Scale, Search, ShieldCheck, SlidersHorizontal, Wallet, Wrench, X, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Illustration } from "@/components/ui/Illustration";
import { useFiltres } from "@/hooks/useFiltres";
import { norm } from "@/lib/catalogue";
import { photo } from "@/lib/photos";
import { FORMATS, GUIDES, OUTILS, PUBLICS, RESSOURCES, THEMES, TYPES, type Format, type Public, type Ressource } from "@/lib/ressources";

export const ICONES: Record<string, LucideIcon> = { "book-open": BookOpen, briefcase: Briefcase, compass: Compass, wrench: Wrench, "map-pin": MapPin, plane: Plane, house: House, "file-check": FileCheck2, "file-text": FileText, "list-checks": ListChecks, calculator: Calculator, repeat: Repeat, wallet: Wallet, scale: Scale, "shield-check": ShieldCheck };
const DEFAUTS = { q: "", type: [] as string[], public: [] as string[], format: [] as string[], theme: "" };
const LIB_TYPE = Object.fromEntries(TYPES.map((t) => [t.id, t.libelle]));
const THEMES_UTILES = THEMES.filter((t) => RESSOURCES.some((r) => r.theme === t.id));

function Carte({ r }: { r: Ressource }) {
  const I = ICONES[r.icone] ?? BookOpen;
  const p = r.photo ? photo(r.photo) : null;
  const externe = r.format === "docx";
  const contenu = (
    <>
      {p ? <Illustration p={p} className="h-32" /> : <div className="relative flex h-32 items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${r.couleur}, ${r.couleur}99)` }}><span className="absolute -bottom-8 -right-6 h-28 w-28 rounded-full bg-white/10" /><I size={44} strokeWidth={1.5} className="text-white/85" /></div>}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5"><span className="chip bg-brand-50 text-[11px] uppercase tracking-wide text-brand-700">{LIB_TYPE[r.type]}</span><span className="chip bg-[#f1f4fb] text-[11px] text-ink-soft">{FORMATS[r.format]}</span></div>
        <b className="leading-snug">{r.titre}</b>
        <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-mute">{r.resume}</p>
        <span className="mt-auto flex items-center gap-1.5 pt-1 text-[13px] font-bold text-brand-600">{externe ? <><Download size={15} />Télécharger</> : r.format === "interactif" ? <>Utiliser l&apos;outil <ArrowRight size={15} /></> : <>{r.lecture ? `Lire · ${r.lecture} min` : "Consulter"} <ArrowRight size={15} /></>}</span>
      </div>
    </>
  );
  const cls = "card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift";
  return externe ? <a href={r.href} download className={cls}>{contenu}</a> : <Link href={r.href} className={cls}>{contenu}</Link>;
}

function Case({ on, label, n, onClick }: { on: boolean; label: string; n: number; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on} disabled={!n && !on} className={`flex min-h-[36px] w-full items-center gap-2.5 text-left text-sm ${!n && !on ? "opacity-40" : ""}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${on ? "bg-brand-600 text-white" : "border-[1.5px] border-[#cdd5ea] bg-white"}`}>{on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12l5 5L20 7" /></svg>}</span>
      <span className="flex-1">{label}</span><span className="text-xs text-ink-mute">{n}</span>
    </button>
  );
}

export function Ressources() {
  const { f, set, reset, toggle } = useFiltres(DEFAUTS);
  const [limit, setLimit] = useState(9);
  const [panneau, setPanneau] = useState(false);
  const passe = (r: Ressource, sauf?: string) => {
    if (sauf !== "type" && f.type.length && !f.type.includes(r.type)) return false;
    if (sauf !== "public" && f.public.length && !r.publics.some((p) => f.public.includes(p))) return false;
    if (sauf !== "format" && f.format.length && !f.format.includes(r.format)) return false;
    if (sauf !== "theme" && f.theme && r.theme !== f.theme) return false;
    if (f.q) { const t = norm(f.q).split(/\s+/).filter(Boolean); const h = norm(`${r.titre} ${r.resume} ${THEMES.find((x) => x.id === r.theme)?.libelle ?? ""}`); if (!t.every((x) => h.includes(x))) return false; }
    return true;
  };
  const list = useMemo(() => RESSOURCES.filter((r) => passe(r)), [f]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = (k: "type" | "public" | "format", v: string) => RESSOURCES.filter((r) => passe(r, k) && (k === "type" ? r.type === v : k === "format" ? r.format === v : r.publics.includes(v as Public))).length;
  const actifs = f.type.length + f.public.length + f.format.length + (f.theme ? 1 : 0) + (f.q ? 1 : 0);
  const maj = (p: Partial<typeof DEFAUTS>) => { set(p); setLimit(9); };

  const filtres = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Filtres de recherche</h2><button onClick={() => { reset(); setLimit(9); }} disabled={!actifs} className="min-h-[40px] text-[13px] font-bold text-brand-600 disabled:opacity-40">Réinitialiser</button></div>
      <div className="flex flex-col gap-1"><b className="mb-1 text-sm">Type de ressource</b>{TYPES.map((t) => <Case key={t.id} on={f.type.includes(t.id)} label={t.libelle} n={n("type", t.id)} onClick={() => { toggle("type", t.id); setLimit(9); }} />)}</div>
      <div className="flex flex-col gap-1"><b className="mb-1 text-sm">Pour qui ?</b>{(Object.keys(PUBLICS) as Public[]).map((p) => <Case key={p} on={f.public.includes(p)} label={PUBLICS[p]} n={n("public", p)} onClick={() => { toggle("public", p); setLimit(9); }} />)}</div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">Thématique
        <span className="relative"><select value={f.theme} onChange={(e) => maj({ theme: e.target.value })} className="min-h-[42px] w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold"><option value="">Toutes les thématiques</option>{THEMES_UTILES.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" /></span>
      </label>
      <div className="flex flex-col gap-1"><b className="mb-1 text-sm">Format</b>{(Object.keys(FORMATS) as Format[]).map((k) => <Case key={k} on={f.format.includes(k)} label={FORMATS[k]} n={n("format", k)} onClick={() => { toggle("format", k); setLimit(9); }} />)}</div>
    </div>
  );

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(900px_420px_at_85%_0%,#dae6ff,transparent_60%),radial-gradient(600px_300px_at_0%_100%,#fff3c4,transparent_60%)]">
        <div className="container relative grid items-end gap-6 pt-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4 pb-8 lg:pb-12">
            <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Ressources</span></nav>
            <h1 className="h-display">Des ressources pour s&apos;orienter, candidater et <span className="text-sun-500">réussir</span>.</h1>
            <p className="max-w-xl text-lg text-ink-soft">Guides pratiques, fiches métiers, outils et modèles pour t&apos;accompagner à chaque étape de ton projet d&apos;études au Maroc.</p>
            <form role="search" onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 pl-4 shadow-[0_20px_50px_-18px_rgba(11,21,51,.3)] focus-within:ring-4 focus-within:ring-brand-100">
              <Search size={19} className="shrink-0 text-ink-mute" />
              <input value={f.q} onChange={(e) => maj({ q: e.target.value })} placeholder="Rechercher une ressource (ex : visa, logement, CV, infirmier…)" aria-label="Rechercher une ressource" className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none" />
              {f.q && <button type="button" onClick={() => maj({ q: "" })} aria-label="Effacer" className="flex h-10 w-10 items-center justify-center text-ink-mute"><X size={18} /></button>}
            </form>
          </div>
          <div className="relative mx-auto hidden h-[300px] w-full max-w-[420px] lg:block">
            <div className="absolute inset-x-[8%] bottom-0 top-[12%] rounded-[42%_58%_70%_30%/45%_45%_55%_55%] animate-blob bg-gradient-to-br from-brand-500 to-brand-300" />
            <Image src="/images/etudiante.webp" alt="" width={1326} height={1186} sizes="420px" className="absolute inset-x-0 bottom-0 h-auto w-full" />
            <p className="absolute -left-36 bottom-8 hidden w-40 -rotate-6 xl:block font-hand text-[22px] leading-tight text-brand-800">Apprendre aujourd&apos;hui pour construire l&apos;Afrique de demain.</p>
          </div>
        </div>
      </section>

      <div className="container -mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button onClick={() => maj({ type: [] })} className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center text-[13px] font-bold transition ${!f.type.length ? "bg-brand-600 text-white shadow-glow" : "card hover:shadow-lift"}`}><LayoutGrid size={22} />Toutes les ressources</button>
        {TYPES.map((t) => { const I = ICONES[t.icone]; const on = f.type.length === 1 && f.type[0] === t.id; return (
          <button key={t.id} onClick={() => maj({ type: on ? [] : [t.id] })} className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center text-[13px] font-bold transition ${on ? "bg-brand-600 text-white shadow-glow" : "card hover:shadow-lift"}`}><I size={22} className={on ? "" : "text-brand-600"} />{t.libelle}</button>); })}
      </div>

      <div className="container mt-8 grid items-start gap-6 lg:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_280px]">
        <aside className="card hidden p-5 lg:sticky lg:top-24 lg:block">{filtres}</aside>
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">{list.length} ressource{list.length > 1 ? "s" : ""} disponible{list.length > 1 ? "s" : ""}</h2>
            <button onClick={() => setPanneau(true)} className="btn-ghost relative min-h-[42px] px-3.5 py-2 lg:hidden"><SlidersHorizontal size={16} />Filtres{actifs > 0 && <span className="rounded-full bg-sun-400 px-1.5 text-xs text-ink">{actifs}</span>}</button>
          </div>
          <motion.div layout className="grid gap-5 min-[520px]:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {list.slice(0, limit).map((r) => <motion.div key={r.type + r.slug} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}><Carte r={r} /></motion.div>)}
            </AnimatePresence>
          </motion.div>
          {!list.length && <div className="card p-10 text-center text-ink-mute">Aucune ressource ne correspond. <button onClick={reset} className="font-bold text-brand-600">Réinitialiser les filtres</button></div>}
          {limit < list.length && <button onClick={() => setLimit(limit + 9)} className="btn-ghost self-center">Afficher plus ({list.length - limit} restantes)</button>}
        </div>
        <aside className="flex flex-col gap-5 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-24">
          <div id="outils" className="flex scroll-mt-28 flex-col gap-2 rounded-2xl border border-[#ffe9a8] bg-[#fffaf0] p-5">
            <b className="flex items-center gap-2 text-lg"><Wrench size={19} className="text-[#a55a00]" />Outils pratiques</b>
            <p className="text-[13px] text-ink-soft">Des modèles et outils pour t&apos;aider dans tes démarches.</p>
            {OUTILS.map((o) => { const I = ICONES[o.icone] ?? Wrench; const cls = "flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-sm font-semibold hover:bg-white"; const inner = <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white" style={{ color: o.couleur }}><I size={16} /></span><span className="flex-1">{o.titre}</span>{o.format === "docx" ? <Download size={15} className="text-ink-mute" /> : <ChevronRight size={15} className="text-ink-mute" />}</>; return o.format === "docx" ? <a key={o.slug} href={o.href} download className={cls}>{inner}</a> : <Link key={o.slug} href={o.href} className={cls}>{inner}</Link>; })}
          </div>
          <div className="card flex flex-col gap-2 p-5">
            <b className="text-lg">Guides essentiels</b>
            {GUIDES.map((g, k) => <Link key={g.slug} href={g.href} className="flex min-h-[44px] items-center gap-3 rounded-xl p-1 text-sm hover:bg-[#f6f8fe]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-700">{k + 1}</span><span className="flex-1 font-semibold leading-snug">{g.titre}</span></Link>)}
          </div>
          <div className="card flex flex-col gap-2 p-5">
            <b>Besoin d&apos;un accompagnement ?</b>
            <p className="text-[13px] text-ink-soft">Échange avec un conseiller Navigoal depuis ton espace pour préparer ton projet.</p>
            <Link href="/espace/conseiller" className="btn-ghost py-2.5">Prendre rendez-vous <ArrowRight size={15} /></Link>
          </div>
        </aside>
      </div>

      <section className="container mt-14 flex flex-col gap-5">
        <div><h2 className="h-section">Explorer par thématique</h2><p className="mt-1 text-ink-mute">Accède rapidement aux ressources selon tes centres d&apos;intérêt.</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {THEMES_UTILES.slice(0, 15).map((t) => { const I = ICONES[t.icone] ?? Briefcase; const nb = RESSOURCES.filter((r) => r.theme === t.id).length; return (
            <button key={t.id} onClick={() => { maj({ theme: t.id, type: [] }); window.scrollTo({ top: 280, behavior: "smooth" }); }} className={`card flex min-h-[92px] flex-col items-center justify-center gap-1.5 p-3 text-center transition hover:-translate-y-0.5 hover:shadow-lift ${f.theme === t.id ? "border-brand-400 ring-2 ring-brand-100" : ""}`}>
              <I size={22} style={{ color: t.couleur }} /><b className="text-[13px] leading-snug">{t.libelle}</b><span className="text-xs text-ink-mute">{nb} ressource{nb > 1 ? "s" : ""}</span>
            </button>); })}
        </div>
      </section>

      <AnimatePresence>
        {panneau && (
          <motion.div className="fixed inset-0 z-[70] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanneau(false)}>
            <motion.div role="dialog" aria-label="Filtres" className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-white p-5" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPanneau(false)} aria-label="Fermer" className="mb-2 flex h-10 w-10 items-center justify-center self-end rounded-xl bg-[#f1f4fd]"><X size={18} /></button>
              {filtres}
              <button onClick={() => setPanneau(false)} className="btn-primary mt-6 w-full">Voir {list.length} ressource{list.length > 1 ? "s" : ""}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
