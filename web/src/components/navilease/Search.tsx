"use client";
import Link from "@/components/ui/Link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, ChevronRight, GraduationCap, Map as MapIcon, MapPin, Search as SearchIcon, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, Empty, Loading, Alert, useToast } from "@/components/app/kit";
import { useSession } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { VILLES_ETUDES, etablissements, etabById, villesOf } from "@/lib/data";
import { AMENITIES, GENDERS, TYPES, VERIF, etabName, type Housing, type Verification } from "./shared";
import { PseudoMap, pricePin } from "./PseudoMap";
import { CarteLogement } from "./CarteLogement";
import { residencesEtudiantes } from "@/lib/residences";

type F = { pays: string; ville: string; etablissement: string; budget: string; type: string; genre: string; equipement: string[]; verifies: boolean };
const EMPTY: F = { pays: "", ville: "", etablissement: "", budget: "", type: "", genre: "", equipement: [], verifies: false };
const SORTS: [string, string][] = [["pertinence", "Pertinence"], ["prix", "Prix croissant"], ["distance", "Distance à l'école"], ["note", "Mieux notés"]];

function fromParams(sp: URLSearchParams): F {
  return { pays: sp.get("pays") ?? "", ville: sp.get("ville") ?? "", etablissement: sp.get("etablissement") ?? "", budget: sp.get("budget") ?? "", type: sp.get("type") ?? "", genre: sp.get("genre") ?? "", equipement: sp.getAll("equipement"), verifies: sp.get("verifies") === "1" };
}
function toQuery(f: F) {
  const q = new URLSearchParams();
  for (const k of ["pays", "ville", "etablissement", "budget", "type", "genre"] as const) if (f[k]) q.set(k, f[k]);
  f.equipement.forEach((e) => q.append("equipement", e));
  if (f.verifies) q.set("verifies", "1");
  return q.toString();
}

export function NavileaseSearch() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSession();
  const toast = useToast();
  const [f, setF] = useState<F>(() => fromParams(new URLSearchParams(sp.toString())));
  const [applied, setApplied] = useState<F>(f);
  const [sort, setSort] = useState("pertinence");
  const [hover, setHover] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [alertBusy, setAlertBusy] = useState(false);
  const qs = toQuery(applied);
  const { data: page1, error, loading, reload } = useApi<Housing[]>(`/logements${qs ? `?${qs}` : ""}`);
  // L'API renvoie 24 annonces par page : on charge les suivantes pour un compteur exact.
  const [suite, setSuite] = useState<Housing[]>([]);
  useEffect(() => {
    setSuite([]);
    if (!page1 || page1.length < 24) return;
    let actif = true;
    (async () => {
      const acc: Housing[] = [];
      for (let p = 2; p < 40; p++) {
        try { const r = await api<Housing[]>(`/logements?${qs ? `${qs}&` : ""}page=${p}`); acc.push(...r); if (r.length < 24) break; } catch { break; }
      }
      if (actif) setSuite(acc);
    })();
    return () => { actif = false; };
  }, [page1, qs]);
  const data = useMemo(() => (page1 ? [...page1, ...suite] : undefined), [page1, suite]);

  useEffect(() => { router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }); }, [qs, pathname, router]);

  const apply = (next: F = f) => { setApplied(next); setFiltersOpen(false); };
  const set = <K extends keyof F>(k: K, v: F[K], live = false) => { const n = { ...f, [k]: v }; setF(n); if (live) setApplied(n); };
  const etab = applied.etablissement ? etabById[applied.etablissement] : null;
  const schools = useMemo(() => etablissements.filter((e) => !f.ville || villesOf(e).includes(f.ville)).sort((a, b) => a.nom.localeCompare(b.nom, "fr")), [f.ville]);

  const near = (h: Housing) => (applied.etablissement ? h.nearEstablishments.find((n) => n.id === applied.etablissement) : null) ?? [...h.nearEstablishments].sort((a, b) => a.minutes - b.minutes)[0];
  const rows = useMemo(() => {
    const r = [...(data ?? [])];
    if (sort === "prix") r.sort((a, b) => a.rent - b.rent);
    if (sort === "distance") r.sort((a, b) => (near(a)?.minutes ?? 999) - (near(b)?.minutes ?? 999));
    if (sort === "note") r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sort, applied.etablissement]);

  const pins = rows.filter((h) => h.lat != null && h.lng != null).map((h) => ({ id: h.id, lat: h.lat!, lng: h.lng!, label: pricePin(h.rent, h.currency) }));
  const schoolPin = etab?.coordonnees ? { ...etab.coordonnees, label: etabName(etab.id) } : etab && pins.length ? { lat: pins.reduce((a, p) => a + p.lat, 0) / pins.length, lng: pins.reduce((a, p) => a + p.lng, 0) / pins.length, label: etabName(etab.id) } : null;

  const createAlert = async () => {
    const here = `${pathname}${qs ? `?${qs}` : ""}`;
    if (!user) { router.push(`/connexion/?suite=${encodeURIComponent(here)}`); return; }
    setAlertBusy(true);
    try {
      await api("/logements/alertes", { body: { pays: applied.pays || undefined, ville: applied.ville || undefined, etablissement: applied.etablissement || undefined, budgetMax: Number(applied.budget) || undefined, type: applied.type || undefined } });
      toast("Alerte créée : tu seras prévenu·e dès qu'un logement correspond.");
    } catch (e) { toast(e instanceof Error ? e.message : "Impossible de créer l'alerte.", "error"); } finally { setAlertBusy(false); }
  };

  const title = loading && !data ? "Logements étudiants" : `${rows.length} logement${rows.length > 1 ? "s" : ""} ${etab && applied.ville ? `près de ${etabName(etab.id)} à ${applied.ville}` : etab ? `près de ${etabName(etab.id)}` : applied.ville ? `à ${applied.ville}` : "disponibles"}`;
  const activeCount = [applied.type, applied.genre, applied.budget, applied.verifies ? "1" : ""].filter(Boolean).length + applied.equipement.length;

  const filters = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Filtres</h2><button type="button" className="text-sm font-bold text-brand-600 hover:underline" onClick={() => { setF(EMPTY); apply(EMPTY); }}>Effacer</button></div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-bold">Budget mensuel max (MAD)</legend>
        <input type="number" min={0} inputMode="numeric" className="input" placeholder="Ex. 3500" value={f.budget} onChange={(e) => set("budget", e.target.value)} aria-label="Budget mensuel maximum" />
      </fieldset>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-2 text-[13px] font-bold">Type de logement</legend>
        <label className="flex items-center gap-2.5 text-sm text-ink-soft"><input type="radio" name="type" className="h-4 w-4 accent-brand-600" checked={!f.type} onChange={() => set("type", "")} />Tous les types</label>
        {TYPES.map(([k, l]) => <label key={k} className="flex items-center gap-2.5 text-sm text-ink-soft"><input type="radio" name="type" className="h-4 w-4 accent-brand-600" checked={f.type === k} onChange={() => set("type", k)} />{l}</label>)}
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[13px] font-bold">Équipements</legend>
        <div className="flex flex-wrap gap-1.5">
          {AMENITIES.map((a) => {
            const on = f.equipement.includes(a.id);
            return <button key={a.id} type="button" aria-pressed={on} onClick={() => set("equipement", on ? f.equipement.filter((x) => x !== a.id) : [...f.equipement, a.id])}
              className={`chip border transition ${on ? "border-brand-200 bg-brand-50 text-brand-700" : "border-transparent bg-[#f1f4fb] text-ink-soft hover:bg-brand-50"}`}>{a.label}</button>;
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[13px] font-bold">Colocation / résidence</legend>
        <div className="flex rounded-xl bg-[#eef1f8] p-1" role="radiogroup">
          {[["", "Tous"] as [string, string], ...GENDERS].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.genre === k} onClick={() => set("genre", k)} className={`flex-1 rounded-[10px] px-2 py-1.5 text-[13px] font-bold ${f.genre === k ? "bg-white text-brand-600 shadow-sm" : "text-ink-mute"}`}>{l}</button>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[13px] font-bold">Niveau de vérification</legend>
        <label className="flex items-start gap-2.5 text-sm text-ink-soft"><input type="checkbox" className="mt-0.5 h-[18px] w-[18px] accent-brand-600" checked={f.verifies} onChange={(e) => set("verifies", e.target.checked)} />Uniquement les bailleurs vérifiés (identité, visite ou partenaire)</label>
        <ul className="mt-3 flex flex-col gap-1.5 text-xs text-ink-mute">
          {(Object.keys(VERIF) as Verification[]).reverse().map((v) => <li key={v} className="flex items-center gap-2"><span className={`chip ${VERIF[v].cls}`}>{VERIF[v].short}</span>{VERIF[v].label}</li>)}
        </ul>
      </fieldset>
      <Button onClick={() => apply()} className="w-full">Afficher les logements</Button>
    </div>
  );

  const titre = applied.ville ? <>Se loger à <em className="text-nl-vert2">{applied.ville}</em></> : etab ? <>Se loger près de <em className="text-nl-vert2">{etabName(etab.id)}</em></> : <>Logements étudiants <em className="text-nl-vert2">au Maroc</em></>;
  const pastille = (on: boolean) => `chip min-h-[40px] shrink-0 px-4 text-[13.5px] transition ${on ? "bg-nl-encre text-white" : "border border-nl-bord bg-white text-[#3b4238] hover:border-nl-vert2"}`;

  return (
    <div className="pb-6">
      <div className="mx-auto max-w-[1360px] px-4 pb-4 pt-7 sm:px-6">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-nl-gris" aria-label="Fil d'Ariane">
          <Link href="/navilease" className="hover:text-nl-vert">Navilease</Link><ChevronRight size={13} /><span>Logements</span>
          {applied.ville && <><ChevronRight size={13} /><span>{applied.ville}</span></>}
        </nav>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-[36px] leading-[1.05] text-nl-encre sm:text-[50px]">{titre}</h1>
            <p className="mt-2 text-nl-gris">{loading && !data ? "Recherche des logements…" : title} · bailleurs vérifiés, paiement protégé en séquestre</p>
          </div>
          <Button variant="ghost" icon={Bell} loading={alertBusy} onClick={createAlert} className="rounded-full border-[1.5px] border-nl-vert bg-transparent text-nl-vert">Créer une alerte</Button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="mt-6 grid grid-cols-2 gap-1 rounded-[28px] border border-nl-bord bg-white p-2 shadow-[0_20px_50px_-24px_rgba(16,35,26,.35)] lg:grid-cols-[1.5fr_1fr_.9fr_auto] lg:items-center lg:rounded-full">
          <label className="col-span-2 flex min-w-0 flex-col px-4 py-1.5 lg:col-span-1">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-nl-gris"><GraduationCap size={13} className="text-nl-vert2" />Mon école</span>
            <select className="w-full bg-transparent text-[15px] font-bold outline-none" value={f.etablissement} onChange={(e) => setF({ ...f, etablissement: e.target.value })}>
              <option value="">Toutes les écoles</option>
              {schools.map((e) => <option key={e.id} value={e.id}>{e.nom.length > 60 ? e.sigle : e.nom} · {villesOf(e).join(", ")}</option>)}
            </select>
          </label>
          <label className="flex flex-col border-nl-bord px-4 py-1.5 lg:border-l">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-nl-gris"><MapPin size={13} className="text-nl-vert2" />Ville</span>
            <select className="w-full bg-transparent text-[15px] font-bold outline-none" value={f.ville} onChange={(e) => { const v = e.target.value; setF({ ...f, ville: v, etablissement: v && f.etablissement && !villesOf(etabById[f.etablissement]).includes(v) ? "" : f.etablissement }); }}><option value="">Toutes les villes</option>{VILLES_ETUDES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          </label>
          <label className="flex flex-col border-nl-bord px-4 py-1.5 lg:border-l">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-nl-gris">Budget / mois (DH)</span>
            <input type="number" min={0} inputMode="numeric" className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:font-semibold placeholder:text-nl-gris" placeholder="Sans limite" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} />
          </label>
          <button type="submit" className="col-span-2 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-nl-ocre px-7 text-[15px] font-extrabold text-nl-encre transition hover:brightness-105 lg:col-span-1"><SearchIcon size={18} />Rechercher</button>
        </form>
        <div className="scrollbar-none -mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {[["", "Tous"] as [string, string], ...TYPES].map(([k, l]) => <button key={k} type="button" aria-pressed={applied.type === k} onClick={() => set("type", k, true)} className={pastille(applied.type === k)}>{k ? l.replace("Résidence étudiante", "Résidences") : l}</button>)}
          <span className="mx-1 hidden h-7 w-px bg-nl-bord sm:block" />
          <button type="button" onClick={() => setFiltersOpen(true)} className={pastille(false)}><SlidersHorizontal size={14} />Filtres{activeCount ? ` (${activeCount})` : ""}</button>
          <button type="button" aria-pressed={applied.verifies} onClick={() => set("verifies", !applied.verifies, true)} className={pastille(applied.verifies)}><ShieldCheck size={14} />Vérifiés uniquement</button>
          <button type="button" onClick={() => setMapOpen(true)} className={`${pastille(false)} xl:hidden`}><MapIcon size={14} />Carte</button>
          {applied.equipement.map((a) => <span key={a} className="chip min-h-[40px] shrink-0 bg-[#e9f4ed] px-3.5 text-nl-vert">{AMENITIES.find((x) => x.id === a)?.label}<button aria-label="Retirer le filtre" onClick={() => { const n = { ...applied, equipement: applied.equipement.filter((x) => x !== a) }; setF(n); apply(n); }}><X size={12} /></button></span>)}
          <label className="ml-auto flex shrink-0 items-center gap-2 text-[13px] text-nl-gris">Trier
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg bg-transparent font-bold text-nl-encre outline-none focus:ring-2 focus:ring-brand-100">{SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </label>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1360px] gap-6 px-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <section className="flex min-w-0 flex-col gap-5" aria-label="Résultats">
          {loading && !data ? <Loading label="Recherche des logements…" /> : error ? <Alert tone="error" title="Recherche impossible" action={<Button size="sm" variant="ghost" onClick={reload}>Réessayer</Button>}>{error.message}</Alert>
            : !rows.length ? <Empty icon={SearchIcon} title="Aucun logement ne correspond" text="Élargis ton budget ou retire des filtres. Tu peux aussi créer une alerte : on te prévient dès qu'une annonce correspond." action={<Button variant="ghost" icon={Bell} onClick={createAlert}>Créer une alerte</Button>} />
            : <div className="grid gap-5 sm:grid-cols-2">{rows.map((h, i) => <motion.div key={h.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05 }} className="flex"><div className="flex w-full flex-col [&>article]:flex-1"><CarteLogement h={h} near={near(h)} survol={hover === h.id} onSurvol={setHover} /></div></motion.div>)}</div>}
          <div className="flex items-start gap-3 rounded-[20px] border border-[#f3dfb2] bg-[#fff8e8] p-4 text-sm text-[#7a4600]"><ShieldCheck size={20} className="mt-0.5 shrink-0" /><span><b>Ne payez jamais en dehors de Navilease.</b> L&apos;adresse exacte et les coordonnées du bailleur sont communiquées après le paiement en séquestre.</span></div>
          <p className="text-sm text-nl-gris">Tu cherches une résidence universitaire ? <Link href="/navilease/residences/" className="font-bold text-nl-vert underline-offset-4 hover:underline">Voir les {residencesEtudiantes.length} résidences et leurs loyers officiels</Link></p>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-24 [html[data-entete=cache]_&]:top-4 transition-[top] duration-300">
            <PseudoMap pins={pins} school={schoolPin} hovered={hover} onPin={(id) => router.push(`/navilease/logements/${id}`)} className="h-[620px] rounded-[24px]" caption={etab ? `Positions approximatives (~500 m) · autour de ${etabName(etab.id)}` : "Positions approximatives (~500 m)"} />
          </div>
        </aside>
      </div>

      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtrer les logements">{filters}</Dialog>
      <Dialog open={mapOpen} onClose={() => setMapOpen(false)} title="Carte des logements" wide>
        {pins.length ? <PseudoMap pins={pins} school={schoolPin} onPin={(id) => router.push(`/navilease/logements/${id}`)} className="h-[60vh]" caption="Positions approximatives (~500 m)" /> : <p className="text-sm text-ink-mute">Aucune position à afficher.</p>}
      </Dialog>
    </div>
  );
}
