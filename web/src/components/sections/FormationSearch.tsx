"use client";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FormationOfferCard } from "@/components/ui/Cards";
import { PAYS_NOM, compatibilite, domaines, etablissements, formationById, metierById, niveauLabel, type PaysCode } from "@/lib/data";
import { PROFILE_KEY } from "./OrientationTest";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const OFFERS = etablissements.flatMap((e) => e.formations.map((f) => ({ f: formationById[f], e })).filter((o) => o.f));
const NIVEAUX = ["niv-bac2", "niv-bac3", "niv-bac5", "niv-bac7", "niv-bac8"];
const STATUTS: [string, (s: string) => boolean][] = [["Public", (s) => s.startsWith("public") || s === "inter_etats"], ["Privé", (s) => s.startsWith("prive")]];
const ADMISSIONS = [["dossier", "Sur dossier"], ["concours", "Concours"], ["bac", "De droit"], ["dossier+entretien", "Dossier + entretien"]];

function Check2({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 text-left text-sm">
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${on ? "bg-brand-600 text-white" : "border-[1.5px] border-[#cdd5ea] bg-white"}`}>{on && <Check size={13} strokeWidth={3} />}</span>{label}
    </button>
  );
}

export function FormationSearch() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pays, setPays] = useState<PaysCode[]>([]);
  const [niv, setNiv] = useState<string[]>([]);
  const [dom, setDom] = useState<string[]>(params.get("domaine") ? [params.get("domaine")!] : []);
  const [stat, setStat] = useState<string[]>([]);
  const [adm, setAdm] = useState<string[]>([]);
  const [sort, setSort] = useState<"compat" | "az">("compat");
  const [limit, setLimit] = useState(12);
  const [profil, setProfil] = useState<string[]>(["I", "C"]);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); if (p?.top) setProfil(p.top); } catch { /* ignore */ } }, []);
  useEffect(() => setLimit(12), [q, pays, niv, dom, stat, adm]);

  const toggle = <T,>(arr: T[], set: (v: T[]) => void, v: T) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return OFFERS.filter(({ f, e }) => {
      if (pays.length && !pays.includes(e.pays)) return false;
      if (niv.length && !niv.includes(f.niveau)) return false;
      if (dom.length && !dom.includes(f.domaine)) return false;
      if (adm.length && !adm.includes(f.mode_admission)) return false;
      if (stat.length && !stat.some((s) => STATUTS.find(([l]) => l === s)![1](e.statut))) return false;
      if (terms.length) {
        const hay = norm([f.intitule, f.diplome, e.nom, e.sigle, e.ville, PAYS_NOM[e.pays], ...f.metiers.map((m) => metierById[m]?.nom ?? "")].join(" "));
        return terms.every((t) => hay.includes(t));
      }
      return true;
    })
      .map((o) => ({ ...o, score: compatibilite(profil, o.f.id) }))
      .sort((a, b) => (sort === "compat" ? b.score - a.score || a.f.intitule.localeCompare(b.f.intitule) : a.f.intitule.localeCompare(b.f.intitule)));
  }, [q, pays, niv, dom, stat, adm, sort, profil]);

  const reset = () => { setPays([]); setNiv([]); setDom([]); setStat([]); setAdm([]); setQ(""); };
  const nbFilters = pays.length + niv.length + dom.length + stat.length + adm.length;

  const filters = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">Filtres</h3><button onClick={reset} className="text-[13px] font-bold text-brand-600">Réinitialiser</button></div>
      <div className="flex flex-col gap-2.5"><b className="text-sm">Pays</b>{(["GA", "MA", "SN"] as const).map((p) => <Check2 key={p} on={pays.includes(p)} label={PAYS_NOM[p]} onClick={() => toggle(pays, setPays, p)} />)}</div>
      <div className="flex flex-col gap-2.5"><b className="text-sm">Niveau</b>{NIVEAUX.map((n) => <Check2 key={n} on={niv.includes(n)} label={niveauLabel(n)} onClick={() => toggle(niv, setNiv, n)} />)}</div>
      <div className="flex flex-col gap-2.5"><b className="text-sm">Statut</b>{STATUTS.map(([l]) => <Check2 key={l} on={stat.includes(l)} label={l} onClick={() => toggle(stat, setStat, l)} />)}</div>
      <div className="flex flex-col gap-2.5"><b className="text-sm">Admission</b>{ADMISSIONS.map(([v, l]) => <Check2 key={v} on={adm.includes(v)} label={l} onClick={() => toggle(adm, setAdm, v)} />)}</div>
      <div className="flex flex-col gap-2.5"><b className="text-sm">Domaine</b>{domaines.map((d) => <Check2 key={d.id} on={dom.includes(d.id)} label={d.libelle} onClick={() => toggle(dom, setDom, d.id)} />)}</div>
    </div>
  );

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-transparent pb-8 pt-10">
        <div className="container flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div><h1 className="h-section">Rechercher une formation</h1><p className="mt-2 text-ink-mute">{OFFERS.length.toLocaleString("fr-FR")} offres · {etablissements.length} établissements · triées selon ton profil {profil.join("+")}</p></div>
            <span className="hidden -rotate-3 font-hand text-[28px] text-brand-700 md:block">Trouve ta voie →</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 pl-5 shadow-[0_20px_50px_-18px_rgba(11,21,51,.3)] focus-within:ring-4 focus-within:ring-brand-100">
            <Search size={20} className="text-ink-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex : informatique Dakar, médecine, BTS, UCAD…" className="min-w-0 flex-1 bg-transparent py-2.5 outline-none" aria-label="Rechercher une formation" />
            {q && <button onClick={() => setQ("")} aria-label="Effacer" className="text-ink-mute"><X size={18} /></button>}
            <button onClick={() => setShowFilters(true)} className="btn-ghost relative py-2.5 lg:hidden"><SlidersHorizontal size={16} />{nbFilters > 0 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-sun-400 px-1.5 text-xs">{nbFilters}</span>}</button>
          </div>
        </div>
      </section>
      <div className="container grid items-start gap-8 lg:grid-cols-[290px_1fr]">
        <aside className="card sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-6 lg:block">{filters}</aside>
        <AnimatePresence>
          {showFilters && (
            <motion.div className="fixed inset-0 z-[70] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)}>
              <motion.div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-white p-6" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={(e) => e.stopPropagation()}>
                {filters}<button onClick={() => setShowFilters(false)} className="btn-primary mt-6 w-full">Voir {results.length} résultats</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <b><motion.span key={results.length} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="inline-block">{results.length.toLocaleString("fr-FR")}</motion.span> formations trouvées</b>
            <label className="relative flex items-center gap-2 text-sm text-ink-mute">Trier par
              <select value={sort} onChange={(e) => setSort(e.target.value as "compat" | "az")} className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 font-semibold text-ink outline-none">
                <option value="compat">Compatibilité</option><option value="az">Ordre alphabétique</option>
              </select><ChevronDown size={14} className="pointer-events-none absolute right-2.5" />
            </label>
          </div>
          <motion.div layout className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {results.slice(0, limit).map(({ f, e, score }, k) => (
                <motion.div key={f.id + e.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(k, 8) * 0.04 } }} exit={{ opacity: 0, scale: 0.97 }}>
                  <FormationOfferCard f={f} etabId={e.id} score={score} highlight={k === 0} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {results.length === 0 && <div className="card p-10 text-center text-ink-mute">Aucune formation ne correspond. <button onClick={reset} className="font-bold text-brand-600">Réinitialiser les filtres</button></div>}
          {limit < results.length && <button onClick={() => setLimit(limit + 12)} className="btn-ghost self-center">Afficher plus ({results.length - limit} restantes)</button>}
        </div>
      </div>
    </>
  );
}
