"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, ChevronRight, GraduationCap, KeyRound, Newspaper, Search as SearchIcon, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Tabs } from "@/components/app/kit";
import { api } from "@/lib/api";
import { PAYS_NOM, etabById, formationById, metierById, type PaysCode } from "@/lib/data";

type R = { metiers: { id: string; nom: string }[]; formations: { id: string; intitule: string }[]; etablissements: { id: string; nom: string; sigle: string; ville: string; pays: string; logo: string | null }[]; articles: { slug: string; title: string; category: string }[]; logements: { id: string; title: string; ville: string; rent: number; currency: string }[] };
const EMPTY: R = { metiers: [], formations: [], etablissements: [], articles: [], logements: [] };
const SUGGEST = ["informatique", "médecine", "commerce", "ingénieur", "Casablanca", "Rabat", "data", "kinésithérapie"];

/** Recherche globale (maquette 48) : résultats instantanés pendant la frappe. */
export function GlobalSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [r, setR] = useState<R>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"tout" | keyof R>("tout");
  useEffect(() => {
    const t = setTimeout(async () => {
      router.replace(q ? `/recherche/?q=${encodeURIComponent(q)}` : "/recherche/", { scroll: false });
      if (q.trim().length < 2) { setR(EMPTY); return; }
      setBusy(true);
      try { setR(await api<R>(`/recherche?q=${encodeURIComponent(q)}`)); } catch { setR(EMPTY); } finally { setBusy(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [q, router]);
  const total = Object.values(r).reduce((a, x) => a + x.length, 0);
  const show = (k: keyof R) => (tab === "tout" || tab === k) && r[k].length > 0;
  const H = ({ t, n, href, l }: { t: string; n: number; href?: string; l?: string }) => <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-extrabold">{t}<span className="chip bg-[#eef1f8] text-ink-soft">{n}</span></h2>{href && <Link href={href} className="text-[13px] font-bold text-brand-600">{l}</Link>}</div>;

  return (
    <div className="container flex flex-col gap-8 pt-8">
      <form onSubmit={(e) => e.preventDefault()} className="card flex items-center gap-3 rounded-2xl p-2 pl-5 shadow-[0_20px_50px_-20px_rgba(26,71,245,.35)]">
        <SearchIcon size={22} className="shrink-0 text-brand-600" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un métier, une formation, une école, une ville…" aria-label="Rechercher" className="min-w-0 flex-1 bg-transparent py-3 text-lg font-semibold outline-none" />
        {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f4fd] text-ink-mute"><X size={16} /></button>}
        <button className="btn-primary hidden sm:inline-flex">Rechercher</button>
      </form>
      {q.trim().length < 2 ? (
        <div className="flex flex-col gap-3"><span className="text-sm font-bold text-ink-mute">Recherches populaires</span><div className="flex flex-wrap gap-2">{SUGGEST.map((s) => <button key={s} onClick={() => setQ(s)} className="chip border border-slate-200 bg-white px-3 py-1.5 text-ink-soft hover:border-brand-300">{s}</button>)}</div></div>
      ) : (
        <>
          <div className="flex flex-col gap-1"><h1 className="text-[30px] font-extrabold tracking-tight">Résultats pour « {q} »</h1><p className="text-ink-mute">{busy ? "Recherche…" : `${total} résultat${total > 1 ? "s" : ""}`}</p></div>
          <Tabs value={tab} onChange={setTab} items={[["tout", `Tout (${total})`], ["metiers", `Métiers (${r.metiers.length})`], ["formations", `Formations (${r.formations.length})`], ["etablissements", `Établissements (${r.etablissements.length})`], ["articles", `Articles (${r.articles.length})`], ["logements", `Logements (${r.logements.length})`]]} />
          {!busy && total === 0 && <p className="card p-8 text-center text-ink-mute">Aucun résultat. Essaie un autre mot-clé ou passe le test d&apos;orientation.</p>}
          <div className="grid items-start gap-8 xl:grid-cols-[1fr_340px]">
            <div className="flex min-w-0 flex-col gap-8">
              {show("metiers") && <section className="flex flex-col gap-4"><H t="Métiers" n={r.metiers.length} href="/metiers" l="Tous les métiers" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{r.metiers.map((m, k) => <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }}><Link href={`/metiers/${m.id}/`} className="card flex h-full flex-col gap-2 p-4 hover:shadow-lift"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Briefcase size={18} /></span><b>{m.nom}</b><span className="line-clamp-2 text-[13px] text-ink-mute">{metierById[m.id]?.description}</span><span className="mt-auto text-xs font-bold text-brand-600">{metierById[m.id]?.formations.length ?? 0} formations →</span></Link></motion.div>)}</div></section>}
              {show("formations") && <section className="flex flex-col gap-3"><H t="Formations" n={r.formations.length} href="/formations" l="Toutes les formations" />
                {r.formations.map((f) => { const ref = formationById[f.id]; return <Link key={f.id} href={`/formations/${f.id}/`} className="card flex items-center gap-4 p-4 hover:shadow-lift"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"><GraduationCap size={20} /></span><span className="min-w-0 flex-1"><b className="block">{f.intitule}</b><span className="text-xs text-ink-mute">{ref ? `${ref.diplome} · ${ref.duree_annees} ans · ${ref.etablissements.filter((x) => etabById[x]).length} écoles sur Navigoal` : ""}</span></span><span className="hidden -space-x-2 sm:flex">{(ref?.etablissements ?? []).filter((x) => etabById[x]).slice(0, 4).map((x) => <EtabLogo key={x} e={etabById[x]} size={30} className="ring-2 ring-white" />)}</span><ChevronRight size={18} className="text-ink-mute" /></Link>; })}</section>}
              {show("etablissements") && <section className="flex flex-col gap-4"><H t="Établissements" n={r.etablissements.length} href="/etablissements" l="Toutes les écoles" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{r.etablissements.map((e) => <Link key={e.id} href={`/etablissements/${e.id}/`} className="card flex items-center gap-3 p-3 hover:shadow-lift"><EtabLogo e={etabById[e.id] ?? e} size={42} /><span className="min-w-0"><b className="block text-sm">{e.sigle}</b><span className="text-xs text-ink-mute">{e.ville.split("/")[0].trim()}, {PAYS_NOM[e.pays as PaysCode]}</span></span></Link>)}</div></section>}
            </div>
            <aside className="flex flex-col gap-5">
              {show("articles") && <section className="card flex flex-col gap-3 rounded-[22px] p-5"><H t="Articles" n={r.articles.length} href="/actualites" l="Tout" />{r.articles.map((a) => <Link key={a.slug} href={`/actualites/${a.slug}/`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 hover:border-brand-200"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"><Newspaper size={18} /></span><span><b className="block text-sm">{a.title}</b><span className="text-xs text-ink-mute">{a.category}</span></span></Link>)}</section>}
              {show("logements") && <section className="card flex flex-col gap-3 rounded-[22px] p-5"><H t="Logements" n={r.logements.length} href="/navilease/logements" l="Navilease" />{r.logements.map((h) => <Link key={h.id} href={`/navilease/logements/${h.id}`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 hover:border-brand-200"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sun-400"><KeyRound size={18} /></span><span><b className="block text-sm">{h.title}</b><span className="text-xs text-ink-mute">{h.ville} · {h.rent.toLocaleString("fr-FR")} {h.currency}/mois</span></span></Link>)}</section>}
              <section className="card flex flex-col gap-3 rounded-[22px] p-5"><b className="flex items-center gap-2"><Sparkles size={18} className="text-[#0f8a46]" />Pas sûr·e de ton choix ?</b><span className="text-[13px] text-ink-mute">Le test d&apos;orientation compare les domaines selon ton profil.</span><Link href="/orientation" className="btn-primary py-2.5">Passer le test <ArrowRight size={16} /></Link></section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
