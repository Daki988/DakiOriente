"use client";
import Link from "@/components/ui/Link";
import { usePartenaires } from "@/components/ui/Partenaires";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FormationOfferCard } from "@/components/ui/Cards";
import { useFiltres } from "@/hooks/useFiltres";
import { OFFRES, norm, villeHref, type Offre } from "@/lib/catalogue";
import { LABELS, VILLES_ETUDES, compatibilite, domaineById, domaines, labelById, metierById, niveauLabel } from "@/lib/data";
import { PROFILE_KEY } from "./OrientationTest";

const NIVEAUX = ["niv-bac2", "niv-bac3", "niv-bac5", "niv-bac7", "niv-bac8"].filter((n) => OFFRES.some((o) => o.f.niveau === n));
const ADMISSIONS: [string, string][] = ([["dossier", "Sur dossier"], ["concours", "Concours"], ["bac", "De droit"], ["dossier+entretien", "Dossier + entretien"]] as [string, string][]).filter(([v]) => OFFRES.some((o) => o.f.mode_admission === v));
const DOMAINES = domaines.filter((d) => OFFRES.some((o) => o.f.domaine === d.id));
const LABELS_PRESENTS = LABELS.filter((l) => OFFRES.some((o) => o.e.label === l.id));
const DEFAUTS = { q: "", ville: [] as string[], niveau: [] as string[], domaine: [] as string[], label: [] as string[], admission: [] as string[], tri: "compat" };
type Cle = "ville" | "niveau" | "domaine" | "label" | "admission";

/** Une offre passe-t-elle les filtres (en ignorant éventuellement l'un d'eux, pour les compteurs) ? */
function passe(o: Offre, f: typeof DEFAUTS, terms: string[], sauf?: Cle) {
  if (sauf !== "ville" && f.ville.length && !o.villes.some((v) => f.ville.includes(v))) return false;
  if (sauf !== "niveau" && f.niveau.length && !f.niveau.includes(o.f.niveau)) return false;
  if (sauf !== "domaine" && f.domaine.length && !f.domaine.includes(o.f.domaine)) return false;
  if (sauf !== "admission" && f.admission.length && !f.admission.includes(o.f.mode_admission)) return false;
  if (sauf !== "label" && f.label.length && !f.label.includes(o.e.label)) return false;
  if (terms.length) {
    const hay = norm([o.f.intitule, o.f.diplome, o.e.nom, o.e.sigle, ...o.villes, domaineById[o.f.domaine]?.libelle ?? "", ...o.e.filieres.filter((x) => x.formation === o.f.id).map((x) => x.intitule), ...o.f.metiers.map((m) => metierById[m]?.nom ?? "")].join(" "));
    return terms.every((t) => hay.includes(t));
  }
  return true;
}
const valeur = (o: Offre, k: Cle): string[] => (k === "ville" ? o.villes : k === "niveau" ? [o.f.niveau] : k === "domaine" ? [o.f.domaine] : k === "label" ? [o.e.label] : [o.f.mode_admission]);

function Case({ on, label, n, onClick }: { on: boolean; label: string; n: number; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={!n && !on} aria-pressed={on} className={`flex min-h-[36px] w-full items-center gap-2.5 text-left text-sm ${!n && !on ? "opacity-40" : ""}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${on ? "bg-brand-600 text-white" : "border-[1.5px] border-[#cdd5ea] bg-white"}`}>{on && <Check size={13} strokeWidth={3} />}</span>
      <span className="min-w-0 flex-1">{label}</span><span className="text-xs text-ink-mute">{n}</span>
    </button>
  );
}

export function FormationSearch() {
  const { f, set, reset, toggle, sync } = useFiltres(DEFAUTS);
  const [limit, setLimit] = useState(12);
  const [profil, setProfil] = useState<string[]>(["I", "C"]);
  const [panneau, setPanneau] = useState(false);
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); if (p?.top) setProfil(p.top); } catch { /* ignore */ } }, []);
  useEffect(() => setLimit(12), [f]);

  const terms = useMemo(() => norm(f.q).split(/\s+/).filter(Boolean), [f.q]);
  const partenaires = usePartenaires();
  const tries = useMemo(() => OFFRES.filter((o) => passe(o, f, terms))
    .map((o) => ({ ...o, score: compatibilite(profil, o.f.id), villesVues: f.ville.length ? o.villes.filter((v) => f.ville.includes(v)) : o.villes }))
    .sort((a, b) => (f.tri === "compat" ? b.score - a.score || a.f.intitule.localeCompare(b.f.intitule, "fr") : f.tri === "duree" ? a.f.duree_annees - b.f.duree_annees || a.f.intitule.localeCompare(b.f.intitule, "fr") : a.f.intitule.localeCompare(b.f.intitule, "fr") || a.e.sigle.localeCompare(b.e.sigle, "fr"))), [f, terms, profil]);
  // À pertinence égale, 3 offres au plus d'écoles partenaires (mises en avant) passent en tête, signalées sur leur carte.
  const results = useMemo(() => {
    const p = new Set(partenaires.map((x) => x.id));
    const tete = tries.filter((o) => p.has(o.e.id)).slice(0, 3);
    return tete.length ? [...tete, ...tries.filter((o) => !tete.includes(o))] : tries;
  }, [tries, partenaires]);
  // Compteurs par option : résultats si l'on cochait cette option (les autres filtres restant actifs).
  const compte = useMemo(() => {
    const c: Record<Cle, Record<string, number>> = { ville: {}, niveau: {}, domaine: {}, label: {}, admission: {} };
    for (const k of Object.keys(c) as Cle[]) for (const o of OFFRES) if (passe(o, f, terms, k)) for (const v of valeur(o, k)) c[k][v] = (c[k][v] ?? 0) + 1;
    return c;
  }, [f, terms]);
  const nbFormations = new Set(results.map((r) => r.f.id)).size;
  const nbEtabs = new Set(results.map((r) => r.e.id)).size;
  const actifs = f.ville.length + f.niveau.length + f.domaine.length + f.label.length + f.admission.length + (f.q ? 1 : 0);
  const chips: [Cle, string, string][] = [...f.ville.map((v) => ["ville", v, v] as [Cle, string, string]), ...f.niveau.map((v) => ["niveau", v, niveauLabel(v)] as [Cle, string, string]), ...f.domaine.map((v) => ["domaine", v, domaineById[v]?.libelle.split(",")[0] ?? v] as [Cle, string, string]), ...f.label.map((v) => ["label", v, labelById[v as keyof typeof labelById]?.court ?? v] as [Cle, string, string]), ...f.admission.map((v) => ["admission", v, ADMISSIONS.find(([a]) => a === v)?.[1] ?? v] as [Cle, string, string])];

  const groupe = (titre: string, k: Cle, opts: [string, string][]) => (
    <div className="flex flex-col gap-1"><b className="mb-1 text-sm">{titre}</b>{opts.map(([v, l]) => <Case key={v} on={(f[k] as string[]).includes(v)} label={l} n={compte[k][v] ?? 0} onClick={() => toggle(k, v)} />)}</div>
  );
  const filtres = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Filtres</h2><button onClick={reset} disabled={!actifs} className="min-h-[40px] text-[13px] font-bold text-brand-600 disabled:opacity-40">Réinitialiser</button></div>
      {groupe("Ville du campus", "ville", VILLES_ETUDES.map((v) => [v, v]))}
      {groupe("Niveau à la sortie", "niveau", NIVEAUX.map((n) => [n, niveauLabel(n)]))}
      {groupe("Domaine", "domaine", DOMAINES.map((d) => [d.id, d.libelle]))}
      {groupe("Label de l'établissement", "label", LABELS_PRESENTS.map((l) => [l.id, l.libelle]))}
      {groupe("Admission", "admission", ADMISSIONS)}
    </div>
  );

  return (
    <>
      {sync}
      <section className="bg-gradient-to-b from-brand-50 to-transparent pb-8 pt-8">
        <div className="container flex flex-col gap-5">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Formations</span></nav>
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div><h1 className="h-section">Rechercher une formation</h1><p className="mt-2 text-ink-mute">{OFFRES.length.toLocaleString("fr-FR")} offres de formation dans {new Set(OFFRES.map((o) => o.e.id)).size} établissements au Maroc, triées selon ton profil {profil.join("+")}.</p></div>
            <span className="hidden -rotate-3 font-hand text-[28px] text-brand-700 md:block">Trouve ta voie →</span>
          </div>
          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 pl-4 shadow-[0_20px_50px_-18px_rgba(11,21,51,.3)] focus-within:ring-4 focus-within:ring-brand-100 sm:pl-5">
            <Search size={20} className="shrink-0 text-ink-mute" />
            <input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Ex : informatique Rabat, médecine, kinésithérapie, EMSI…" className="min-w-0 flex-1 bg-transparent py-2.5 outline-none" aria-label="Rechercher une formation" />
            {f.q && <button type="button" onClick={() => set({ q: "" })} aria-label="Effacer" className="flex h-10 w-10 items-center justify-center text-ink-mute"><X size={18} /></button>}
            <button type="button" onClick={() => setPanneau(true)} className="btn-ghost relative min-h-[44px] px-3.5 py-2.5 lg:hidden" aria-label="Filtres"><SlidersHorizontal size={16} />{actifs > 0 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-sun-400 px-1.5 text-xs text-ink">{actifs}</span>}</button>
          </form>
        </div>
      </section>
      <div className="container grid items-start gap-8 lg:grid-cols-[290px_1fr]">
        <aside className="card sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-6 lg:block">{filtres}</aside>
        <AnimatePresence>
          {panneau && (
            <motion.div className="fixed inset-0 z-[70] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanneau(false)}>
              <motion.div role="dialog" aria-label="Filtres" className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={(e) => e.stopPropagation()}>
                <div className="flex-1 overflow-y-auto p-5">{filtres}</div>
                <div className="border-t border-slate-100 p-4"><button onClick={() => setPanneau(false)} className="btn-primary w-full">Voir {results.length} offre{results.length > 1 ? "s" : ""}</button></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p><b><motion.span key={results.length} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="inline-block">{results.length.toLocaleString("fr-FR")}</motion.span> offre{results.length > 1 ? "s" : ""}</b> <span className="text-sm text-ink-mute">· {nbFormations} formation{nbFormations > 1 ? "s" : ""} dans {nbEtabs} établissement{nbEtabs > 1 ? "s" : ""}</span></p>
            <label className="relative flex items-center gap-2 text-sm text-ink-mute">Trier par
              <select value={f.tri} onChange={(e) => set({ tri: e.target.value })} className="min-h-[40px] appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 font-semibold text-ink outline-none">
                <option value="compat">Compatibilité</option><option value="az">Ordre alphabétique</option><option value="duree">Durée</option>
              </select><ChevronDown size={14} className="pointer-events-none absolute right-2.5" />
            </label>
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map(([k, v, l]) => <span key={k + v} className="chip bg-brand-50 py-1.5 text-brand-700">{l}<button aria-label={`Retirer ${l}`} onClick={() => toggle(k, v)} className="-mr-1 flex h-6 w-6 items-center justify-center"><X size={13} /></button></span>)}
              <button onClick={reset} className="chip py-1.5 font-bold text-brand-600">Tout effacer</button>
            </div>
          )}
          {f.ville.length === 1 && <Link href={villeHref(f.ville[0])} className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm font-semibold text-brand-700">Étudier à {f.ville[0]} : quartiers, transports, coût de la vie <ChevronRight size={16} className="ml-auto" /></Link>}
          <motion.div layout className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {results.slice(0, limit).map(({ f: F, e, score, villesVues }, k) => (
                <motion.div key={F.id + e.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(k, 8) * 0.04 } }} exit={{ opacity: 0, scale: 0.97 }}>
                  <FormationOfferCard f={F} etabId={e.id} score={score} highlight={k === 0} villes={villesVues} />
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
