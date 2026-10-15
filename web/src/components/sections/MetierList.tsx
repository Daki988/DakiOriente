"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronRight, GraduationCap, LayoutGrid, Search, SlidersHorizontal, Sparkles, Target, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { domStyle } from "@/components/ui/Cards";
import { Illustration } from "@/components/ui/Illustration";
import { useFiltres } from "@/hooks/useFiltres";
import { METIERS_UNE, NIVEAUX_METIER, QUALITES, SECTEURS, ecolesPourMetier, norm, secteursOf } from "@/lib/catalogue";
import { competenceById, domaineById, domaines, metierById, metiers, niveauLabel, type Metier } from "@/lib/data";
import { photoMetier } from "@/lib/photos";

const ORDRE_NIV = NIVEAUX_METIER.map(([k]) => k);
const DEFAUTS = { q: "", domaine: "", niveau: "", secteur: "", qualite: "", tri: "az" };
const TRIS: [string, string][] = [["az", "Ordre alphabétique"], ["ecoles", "Nombre d'établissements"], ["niveau", "Niveau d'études"]];
const DOMAINES = domaines.filter((d) => metiers.some((m) => m.domaine === d.id));
const court = (l: string) => l.split(",")[0];
/** Métier présenté en « zoom » : la data et l'IA, parmi les filières les plus proposées au Maroc. */
const ZOOM = metierById["met-data-scientist"];
const select = "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-semibold text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

function MetierCarte({ m }: { m: Metier }) {
  const s = domStyle(m.domaine);
  const qualite = m.competences.map((c) => competenceById[c]).find((c) => c?.categorie === "transversale");
  return (
    <Link href={`/metiers/${m.id}/`} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <Illustration p={photoMetier(m.id, m.domaine)} domaine={m.domaine} className="h-36 transition duration-700 group-hover:scale-105" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <b className="text-[17px] leading-snug">{m.nom}</b>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-mute">{m.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <span className="chip max-w-full truncate" style={{ background: s.bg, color: s.fg }}>{court(domaineById[m.domaine].libelle)}</span>
            {qualite && <span className="chip max-w-full truncate bg-[#f1f4fb] text-ink-soft">{qualite.libelle.split(" et ")[0]}</span>}
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun-400 text-ink transition group-hover:translate-x-1"><ArrowRight size={16} /></span>
        </div>
      </div>
    </Link>
  );
}

export function MetierList() {
  const { f, set, reset } = useFiltres(DEFAUTS);
  const [saisie, setSaisie] = useState(f.q);
  const [limit, setLimit] = useState(12);
  const [panneau, setPanneau] = useState(false);
  useEffect(() => setSaisie(f.q), [f.q]);

  const list = useMemo(() => {
    const terms = norm(f.q).split(/\s+/).filter(Boolean);
    return metiers.filter((m) =>
      (!f.domaine || m.domaine === f.domaine) &&
      (!f.niveau || m.niveau_min === f.niveau) &&
      (!f.secteur || secteursOf(m).includes(f.secteur)) &&
      (!f.qualite || m.competences.includes(f.qualite)) &&
      (!terms.length || terms.every((t) => norm([m.nom, m.description, ...m.missions, ...m.secteurs, domaineById[m.domaine].libelle].join(" ")).includes(t))),
    ).sort((a, b) => f.tri === "ecoles" ? ecolesPourMetier(b) - ecolesPourMetier(a) || a.nom.localeCompare(b.nom, "fr")
      : f.tri === "niveau" ? ORDRE_NIV.indexOf(a.niveau_min) - ORDRE_NIV.indexOf(b.niveau_min) || a.nom.localeCompare(b.nom, "fr")
      : a.nom.localeCompare(b.nom, "fr"));
  }, [f]);
  const actifs = [f.domaine, f.niveau, f.secteur, f.qualite, f.q].filter(Boolean).length;
  const tout = () => { reset(); setSaisie(""); setLimit(12); };
  const appliquer = (patch: Partial<typeof DEFAUTS>) => { set(patch); setLimit(12); };

  const filtres = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Filtrer les métiers</h2>{actifs > 0 && <button onClick={tout} className="min-h-[40px] text-[13px] font-bold text-brand-600">Réinitialiser</button>}</div>
      {([
        ["Domaine", "domaine", "Tous les domaines", DOMAINES.map((d) => [d.id, court(d.libelle)] as [string, string])],
        ["Niveau d'études", "niveau", "Tous les niveaux", NIVEAUX_METIER.filter(([k]) => metiers.some((m) => m.niveau_min === k))],
        ["Secteur d'activité", "secteur", "Tous les secteurs", SECTEURS.map((s) => [s.id, s.libelle] as [string, string])],
        ["Qualités requises", "qualite", "Toutes les qualités", QUALITES.map((q) => [q.id, q.libelle] as [string, string])],
      ] as const).map(([lab, k, vide, opts]) => (
        <label key={k} className="flex flex-col gap-1.5 text-sm font-bold">{lab}
          <span className="relative"><select value={f[k]} onChange={(e) => appliquer({ [k]: e.target.value })} className={select}><option value="">{vide}</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" /></span>
        </label>
      ))}
      <p className="text-xs text-ink-mute">Niveau : diplôme minimum habituel pour exercer. Secteurs : employeurs cités dans les fiches.</p>
    </div>
  );

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(900px_420px_at_85%_0%,#dae6ff,transparent_60%),radial-gradient(600px_300px_at_0%_100%,#fff3c4,transparent_60%)]">
        <div className="container relative grid items-end gap-6 pt-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4 pb-8 lg:pb-12">
            <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Métiers</span></nav>
            <h1 className="h-display">Découvre les <span className="text-sun-500">métiers</span></h1>
            <p className="max-w-xl text-lg text-ink-soft">Explore les métiers, leurs missions, les compétences requises et les formations pour y accéder au Maroc.</p>
            <form role="search" onSubmit={(e) => { e.preventDefault(); appliquer({ q: saisie.trim() }); }} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 pl-4 shadow-[0_20px_50px_-18px_rgba(11,21,51,.3)] focus-within:ring-4 focus-within:ring-brand-100">
              <Search size={19} className="shrink-0 text-ink-mute" />
              <input value={saisie} onChange={(e) => { setSaisie(e.target.value); if (!e.target.value) appliquer({ q: "" }); }} placeholder="Rechercher un métier (ex : informaticien, médecin, juriste…)" aria-label="Rechercher un métier" className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none" />
              {saisie && <button type="button" onClick={() => { setSaisie(""); appliquer({ q: "" }); }} aria-label="Effacer" className="flex h-10 w-10 items-center justify-center text-ink-mute"><X size={18} /></button>}
              <button className="btn-sun min-h-[44px] px-4 sm:px-5"><Search size={17} className="sm:hidden" /><span className="hidden sm:inline">Rechercher</span></button>
            </form>
          </div>
          <div className="relative mx-auto hidden h-[300px] w-full max-w-[420px] lg:block">
            <div className="absolute inset-x-[8%] bottom-0 top-[12%] animate-blob bg-gradient-to-br from-brand-500 to-brand-300" />
            <Image src="/images/etudiante.webp" alt="" width={1326} height={1186} sizes="420px" className="absolute inset-x-0 bottom-0 h-auto w-full" />
            <p className="absolute -right-4 top-0 w-44 -rotate-6 font-hand text-[22px] leading-tight text-brand-800">Des métiers d&apos;aujourd&apos;hui pour construire l&apos;Afrique de demain.</p>
          </div>
        </div>
      </section>

      <div className="border-y border-[#eef1f8] bg-white">
        <div className="container scrollbar-none flex gap-2 overflow-x-auto py-3" role="tablist" aria-label="Domaines">
          <button role="tab" aria-selected={!f.domaine} onClick={() => appliquer({ domaine: "" })} className={`flex min-h-[64px] min-w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-xs font-bold transition ${!f.domaine ? "bg-brand-600 text-white shadow-glow" : "border border-slate-200 text-ink-soft hover:border-brand-300"}`}><LayoutGrid size={18} />Tous</button>
          {DOMAINES.map((d) => { const s = domStyle(d.id); const I = s.icon; const on = f.domaine === d.id; return (
            <button key={d.id} role="tab" aria-selected={on} onClick={() => appliquer({ domaine: on ? "" : d.id })} className={`flex min-h-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-xs font-bold transition ${on ? "text-white shadow-lift" : "border border-slate-200 text-ink-soft hover:border-brand-300"}`} style={on ? { background: s.solid } : {}}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={on ? {} : { background: s.bg, color: s.fg }}><I size={16} /></span><span className="whitespace-nowrap">{court(d.libelle).split(" et ")[0]}</span>
            </button>); })}
        </div>
      </div>

      <div className="container mt-8 grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold sm:text-2xl">{f.domaine ? court(domaineById[f.domaine].libelle) : "Tous les métiers"} <span className="text-ink-mute">({list.length})</span></h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setPanneau(true)} className="btn-ghost relative min-h-[42px] px-3.5 py-2 lg:hidden"><SlidersHorizontal size={16} />Filtres{actifs > 0 && <span className="rounded-full bg-sun-400 px-1.5 text-xs text-ink">{actifs}</span>}</button>
              <label className="relative flex items-center gap-2 text-sm text-ink-mute"><span className="hidden sm:inline">Tri :</span>
                <select value={f.tri} onChange={(e) => set({ tri: e.target.value })} className="min-h-[42px] appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 font-semibold text-ink outline-none" aria-label="Trier les métiers">{TRIS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5" />
              </label>
            </div>
          </div>
          {actifs > 0 && (
            <div className="flex flex-wrap gap-2">
              {f.q && <span className="chip bg-brand-50 py-1.5 text-brand-700">« {f.q} »<button aria-label="Retirer" onClick={() => { setSaisie(""); appliquer({ q: "" }); }}><X size={13} /></button></span>}
              {f.domaine && <span className="chip bg-brand-50 py-1.5 text-brand-700">{court(domaineById[f.domaine].libelle)}<button aria-label="Retirer" onClick={() => appliquer({ domaine: "" })}><X size={13} /></button></span>}
              {f.niveau && <span className="chip bg-brand-50 py-1.5 text-brand-700">{niveauLabel(f.niveau)}<button aria-label="Retirer" onClick={() => appliquer({ niveau: "" })}><X size={13} /></button></span>}
              {f.secteur && <span className="chip bg-brand-50 py-1.5 text-brand-700">{SECTEURS.find((s) => s.id === f.secteur)?.libelle}<button aria-label="Retirer" onClick={() => appliquer({ secteur: "" })}><X size={13} /></button></span>}
              {f.qualite && <span className="chip bg-brand-50 py-1.5 text-brand-700">{competenceById[f.qualite]?.libelle}<button aria-label="Retirer" onClick={() => appliquer({ qualite: "" })}><X size={13} /></button></span>}
              <button onClick={tout} className="chip py-1.5 font-bold text-brand-600">Tout effacer</button>
            </div>
          )}
          <motion.div layout className="grid gap-5 min-[520px]:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {list.slice(0, limit).map((m, k) => <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { delay: Math.min(k, 9) * 0.03 } }} exit={{ opacity: 0, scale: 0.96 }}><MetierCarte m={m} /></motion.div>)}
            </AnimatePresence>
          </motion.div>
          {!list.length && <div className="card p-10 text-center text-ink-mute">Aucun métier ne correspond à ces filtres. <button onClick={tout} className="font-bold text-brand-600">Réinitialiser</button></div>}
          {limit < list.length && <button onClick={() => setLimit(limit + 12)} className="btn-ghost self-center">Afficher plus de métiers ({list.length - limit} restants)</button>}

          <ZoomMetier />
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="card hidden p-5 lg:block">{filtres}</div>
          <div className="card flex flex-col gap-3 p-5">
            <div><h2 className="text-lg font-extrabold">Métiers à la une</h2><p className="text-xs text-ink-mute">Ceux auxquels préparent le plus d&apos;établissements au Maroc.</p></div>
            {METIERS_UNE.map((m, k) => (
              <Link key={m.id} href={`/metiers/${m.id}/`} className="group flex min-h-[48px] items-center gap-3 rounded-xl p-1 hover:bg-[#f6f8fe]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-700">{k + 1}</span>
                <Illustration p={photoMetier(m.id, m.domaine)} domaine={m.domaine} iconSize={18} rounded="rounded-lg" className="h-10 w-10 shrink-0" />
                <span className="min-w-0 flex-1"><b className="block truncate text-sm">{m.nom}</b><span className="text-xs text-ink-mute">{ecolesPourMetier(m)} établissements</span></span>
                <ChevronRight size={16} className="shrink-0 text-ink-mute transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#ffe9a8] bg-[#fffaf0] p-5">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#e2541b] shadow-sm"><Target size={22} /></span><b className="leading-snug">Tu ne sais pas quel métier te correspond ?</b></div>
            <p className="text-sm text-ink-soft">Fais le test d&apos;orientation et découvre les métiers qui correspondent à ton profil.</p>
            <Link href="/orientation" className="btn-sun w-fit">Faire le test gratuitement <ArrowRight size={16} /></Link>
          </div>
        </aside>
      </div>

      <section className="mt-14 bg-[#f6f8fe] py-12">
        <div className="container flex flex-col gap-6">
          <div><h2 className="h-section">Explorer par secteur d&apos;activité</h2><p className="mt-1 text-ink-mute">Les métiers regroupés selon les employeurs qui recrutent, pour mieux cibler tes intérêts.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {SECTEURS.map((s) => {
              const n = metiers.filter((m) => secteursOf(m).includes(s.id)).length;
              const on = f.secteur === s.id;
              return (
                <button key={s.id} onClick={() => { appliquer({ secteur: on ? "" : s.id }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`card flex min-h-[96px] flex-col items-center justify-center gap-1 p-3 text-center transition hover:-translate-y-0.5 hover:shadow-lift ${on ? "border-brand-400 ring-2 ring-brand-100" : ""}`}>
                  <b className="text-[13px] leading-snug">{s.libelle}</b><span className="text-xs text-ink-mute">{n} métiers</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {panneau && (
          <motion.div className="fixed inset-0 z-[70] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanneau(false)}>
            <motion.div role="dialog" aria-label="Filtrer les métiers" className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-white p-5" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPanneau(false)} aria-label="Fermer" className="mb-2 flex h-10 w-10 items-center justify-center self-end rounded-xl bg-[#f1f4fd]"><X size={18} /></button>
              {filtres}
              <button onClick={() => setPanneau(false)} className="btn-primary mt-6 w-full">Voir {list.length} métier{list.length > 1 ? "s" : ""}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ZoomMetier() {
  const m = ZOOM;
  if (!m) return null;
  const qualites = m.competences.map((c) => competenceById[c]).filter((c) => c && c.categorie === "transversale").slice(0, 2).map((c) => c.libelle);
  const secteurs = SECTEURS.filter((s) => secteursOf(m).includes(s.id)).map((s) => s.libelle);
  return (
    <section className="mt-4 grid overflow-hidden rounded-[24px] bg-gradient-to-r from-brand-950 to-brand-800 text-white sm:grid-cols-[220px_1fr]">
      <Illustration p={photoMetier(m.id, m.domaine)} domaine={m.domaine} className="h-44 sm:h-full" />
      <div className="flex flex-col gap-3 p-6">
        <span className="text-sm font-bold text-sun-400">Zoom sur un métier</span>
        <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-2xl font-extrabold">{m.nom}</h2><Link href={`/metiers/${m.id}/`} className="btn-sun px-4 py-2.5 text-[13px]">Voir la fiche métier <ArrowRight size={15} /></Link></div>
        <p className="text-sm leading-relaxed text-[#c9d6ff]">{m.description} {m.missions.slice(0, 2).join(" ; ")}.</p>
        <div className="grid gap-3 text-[13px] sm:grid-cols-3">
          <span className="flex items-start gap-2"><GraduationCap size={18} className="shrink-0 text-sun-400" /><span><b className="block">Niveau</b>{niveauLabel(m.niveau_min)} minimum</span></span>
          <span className="flex items-start gap-2"><Sparkles size={18} className="shrink-0 text-sun-400" /><span><b className="block">Secteurs</b>{secteurs.slice(0, 2).join(", ") || "Variés"}</span></span>
          <span className="flex items-start gap-2"><Target size={18} className="shrink-0 text-sun-400" /><span><b className="block">Qualités</b>{qualites.join(", ") || "—"}</span></span>
        </div>
        <p className="text-[11px] text-[#9fb0ec]">Choix de la rédaction : la data et l&apos;intelligence artificielle font partie des filières les plus proposées par les établissements marocains.</p>
      </div>
    </section>
  );
}
