"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, ChevronRight, Footprints, GraduationCap, Map as MapIcon, MapPin, Search as SearchIcon, ShieldCheck, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, Empty, Loading, Alert, money, useToast } from "@/components/app/kit";
import { useSession } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { etablissements, etabById } from "@/lib/data";
import { AMENITIES, Cover, GENDERS, PAYS, TYPES, VERIF, etabName, modeLabel, typeLabel, type Housing, type Verification } from "./shared";
import { PseudoMap, pricePin } from "./PseudoMap";

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
  const { data, error, loading, reload } = useApi<Housing[]>(`/logements${qs ? `?${qs}` : ""}`);

  useEffect(() => { router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }); }, [qs, pathname, router]);

  const apply = (next: F = f) => { setApplied(next); setFiltersOpen(false); };
  const set = <K extends keyof F>(k: K, v: F[K], live = false) => { const n = { ...f, [k]: v }; setF(n); if (live) setApplied(n); };
  const etab = applied.etablissement ? etabById[applied.etablissement] : null;
  const schools = useMemo(() => etablissements.filter((e) => !f.pays || e.pays === f.pays).sort((a, b) => a.nom.localeCompare(b.nom)), [f.pays]);

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

  const title = loading && !data ? "Logements étudiants" : `${rows.length} logement${rows.length > 1 ? "s" : ""} ${etab ? `près de ${etabName(etab.id)}` : applied.ville ? `à ${applied.ville}` : applied.pays ? `au ${PAYS.find(([k]) => k === applied.pays)?.[1]}` : "disponibles"}`;
  const activeCount = [applied.type, applied.genre, applied.budget, applied.verifies ? "1" : ""].filter(Boolean).length + applied.equipement.length;

  const filters = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Filtres</h2><button type="button" className="text-sm font-bold text-brand-600 hover:underline" onClick={() => { setF(EMPTY); apply(EMPTY); }}>Effacer</button></div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-bold">Budget mensuel max{f.pays ? ` (${({ GA: "F CFA", SN: "F CFA", MA: "MAD" } as Record<string, string>)[f.pays]})` : ""}</legend>
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

  return (
    <div className="bg-[#f6f8fe] pb-16">
      <div className="bg-gradient-to-b from-[#fff8e8] to-[#f6f8fe]">
        <div className="mx-auto max-w-[1280px] px-4 pb-6 pt-8 sm:px-6">
          <nav className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-ink-mute" aria-label="Fil d'Ariane">
            <Link href="/navilease" className="hover:text-brand-600">Navilease</Link><ChevronRight size={13} /><span>Logements</span>
            {applied.ville && <><ChevronRight size={13} /><span>{applied.ville}</span></>}
          </nav>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[36px]">{title}</h1>
              <p className="text-ink-mute">Studios, colocations et résidences vérifiés · paiement protégé en séquestre</p>
            </div>
            <Button variant="ghost" icon={Bell} loading={alertBusy} onClick={createAlert}>Créer une alerte</Button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="card mt-5 grid grid-cols-2 gap-1 rounded-[22px] p-2 sm:gap-2 lg:grid-cols-[1.4fr_.8fr_1fr_.9fr_auto]">
            <label className="col-span-2 flex flex-col rounded-xl px-3 py-1.5 hover:bg-[#f6f8fe] lg:col-span-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-mute"><GraduationCap size={13} />Mon établissement</span>
              <select className="w-full bg-transparent text-sm font-bold outline-none" value={f.etablissement} onChange={(e) => { const id = e.target.value; const s = etabById[id]; setF({ ...f, etablissement: id, pays: s ? s.pays : f.pays, ville: s ? s.ville : f.ville }); }}>
                <option value="">Tous les établissements</option>
                {schools.map((e) => <option key={e.id} value={e.id}>{e.nom.length > 60 ? e.sigle : e.nom} · {e.ville}</option>)}
              </select>
            </label>
            <label className="flex flex-col rounded-xl px-3 py-1.5 hover:bg-[#f6f8fe]">
              <span className="text-[11px] font-bold text-ink-mute">Pays</span>
              <select className="w-full bg-transparent text-sm font-bold outline-none" value={f.pays} onChange={(e) => setF({ ...f, pays: e.target.value, etablissement: e.target.value && etabById[f.etablissement]?.pays !== e.target.value ? "" : f.etablissement })}>
                <option value="">Tous</option>{PAYS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
            <label className="flex flex-col rounded-xl px-3 py-1.5 hover:bg-[#f6f8fe]">
              <span className="text-[11px] font-bold text-ink-mute">Ville</span>
              <input className="w-full bg-transparent text-sm font-bold outline-none placeholder:font-normal placeholder:text-ink-mute" placeholder="Casablanca, Rabat, Marrakech…" value={f.ville} onChange={(e) => setF({ ...f, ville: e.target.value })} />
            </label>
            <label className="flex flex-col rounded-xl px-3 py-1.5 hover:bg-[#f6f8fe]">
              <span className="text-[11px] font-bold text-ink-mute">Budget max / mois</span>
              <input type="number" min={0} inputMode="numeric" className="w-full bg-transparent text-sm font-bold outline-none placeholder:font-normal placeholder:text-ink-mute" placeholder="Sans limite" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} />
            </label>
            <Button type="submit" icon={SearchIcon} className="col-span-2 lg:col-span-1">Rechercher</Button>
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-5 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_380px]">
        <aside className="card hidden h-max rounded-[22px] p-5 lg:block">{filters}</aside>

        <section className="flex min-w-0 flex-col gap-3" aria-label="Résultats">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setFiltersOpen(true)} className="chip border border-brand-200 bg-white py-1.5 text-brand-700 lg:hidden"><SlidersHorizontal size={14} />Filtres{activeCount ? ` (${activeCount})` : ""}</button>
            <button type="button" onClick={() => setMapOpen(true)} className="chip border border-brand-200 bg-white py-1.5 text-brand-700 xl:hidden"><MapIcon size={14} />Carte</button>
            {applied.verifies && <span className="chip bg-[#e8f8ef] text-[#0f8a46]">Bailleurs vérifiés<button aria-label="Retirer le filtre" onClick={() => { const n = { ...applied, verifies: false }; setF(n); apply(n); }}><X size={12} /></button></span>}
            {applied.equipement.map((a) => <span key={a} className="chip bg-brand-50 text-brand-700">{AMENITIES.find((x) => x.id === a)?.label}<button aria-label="Retirer le filtre" onClick={() => { const n = { ...applied, equipement: applied.equipement.filter((x) => x !== a) }; setF(n); apply(n); }}><X size={12} /></button></span>)}
            <label className="ml-auto flex items-center gap-2 text-[13px] text-ink-mute">Trier
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg bg-transparent font-bold text-ink outline-none focus:ring-2 focus:ring-brand-100">{SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </label>
          </div>
          {loading && !data ? <Loading label="Recherche des logements…" /> : error ? <Alert tone="error" title="Recherche impossible" action={<Button size="sm" variant="ghost" onClick={reload}>Réessayer</Button>}>{error.message}</Alert>
            : !rows.length ? <Empty icon={SearchIcon} title="Aucun logement ne correspond" text="Élargis ton budget ou retire des filtres. Tu peux aussi créer une alerte : on te prévient dès qu'une annonce correspond." action={<Button variant="ghost" icon={Bell} onClick={createAlert}>Créer une alerte</Button>} />
            : rows.map((h, i) => <ResultCard key={h.id} h={h} i={i} near={near(h)} hovered={hover === h.id} onHover={setHover} />)}
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#f6dd9a] bg-[#fff7dd] p-4 text-sm text-[#8a4b00]"><ShieldCheck size={18} className="mt-0.5 shrink-0" />Les adresses exactes et les coordonnées des bailleurs sont communiquées après le paiement en séquestre. Ne payez jamais en dehors de Navilease.</div>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <PseudoMap pins={pins} school={schoolPin} hovered={hover} onPin={(id) => router.push(`/navilease/logements/${id}`)} className="h-[560px]" caption={etab ? `Positions approximatives (~500 m) · autour de ${etabName(etab.id)}` : "Positions approximatives (~500 m)"} />
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

function ResultCard({ h, i, near, hovered, onHover }: { h: Housing; i: number; near?: Housing["nearEstablishments"][number]; hovered: boolean; onHover: (id: string | null) => void }) {
  const v = VERIF[h.verification] ?? VERIF.non_verifie;
  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05 }} onMouseEnter={() => onHover(h.id)} onMouseLeave={() => onHover(null)}
      className={`card group relative grid overflow-hidden rounded-[22px] transition sm:grid-cols-[210px_minmax(0,1fr)] ${hovered ? "border-brand-500 ring-2 ring-brand-500/30" : "hover:-translate-y-0.5 hover:shadow-lift"}`}>
      <div className="relative h-44 sm:h-full sm:min-h-[180px]">
        <Cover h={h} className="transition duration-500 group-hover:scale-[1.04]" />
        <span className={`chip absolute left-3 top-3 shadow-sm ${v.cls}`}><v.Icon size={13} />{v.label}</span>
        {h.photos.length > 1 && <span className="chip absolute bottom-3 left-3 bg-ink/70 text-white">{h.photos.length} photos</span>}
      </div>
      <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-extrabold leading-snug"><Link href={`/navilease/logements/${h.id}`} className="after:absolute after:inset-0 focus:outline-none">{h.title}</Link></h3>
          {h.rating ? <span className="flex shrink-0 items-center gap-1 text-sm font-bold"><Star size={14} className="fill-sun-400 text-sun-500" />{h.rating.toFixed(1).replace(".", ",")} <span className="font-normal text-ink-mute">({h.reviews})</span></span> : <span className="shrink-0 text-xs text-ink-mute">Nouveau</span>}
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-mute"><span className="flex items-center gap-1"><MapPin size={13} />{[h.quartier, h.ville].filter(Boolean).join(", ")}</span><span>{typeLabel(h.type)}{h.surface ? ` · ${h.surface} m²` : ""}</span></p>
        {near && <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#0f8a46]"><Footprints size={14} />{near.minutes} min {modeLabel(near.mode)} de {etabName(near.id)}</p>}
        <div className="flex flex-wrap gap-1.5">
          {h.furnished && <span className="chip bg-[#f1f4fb] text-ink-soft">Meublé</span>}
          {h.amenities.filter((a) => a !== "meuble").slice(0, 3).map((a) => <span key={a} className="chip bg-[#f1f4fb] text-ink-soft">{AMENITIES.find((x) => x.id === a)?.label ?? a}</span>)}
          <span className="chip bg-[#f1f4fb] text-ink-soft">{GENDERS.find(([k]) => k === h.gender)?.[1]}</span>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-[#eef1f8] pt-3">
          <p><b className="text-xl text-brand-600">{money(h.rent, h.currency)}</b> <span className="text-xs text-ink-mute">/mois{h.charges ? ` + ${money(h.charges, h.currency)} ch.` : " charges incl."}</span></p>
          <span className="text-xs text-ink-mute">{h.availableFrom ? `dispo. ${new Date(h.availableFrom).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}` : "disponible"} · {h.minMonths} mois min.</span>
        </div>
      </div>
    </motion.article>
  );
}

