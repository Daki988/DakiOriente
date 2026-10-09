"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Briefcase, Calendar, Check, ChevronRight, CircleCheck, Heart, KeyRound, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { domStyle } from "@/components/ui/Cards";
import { LOGEMENTS } from "@/lib/content";
import { PAYS_NOM, admissionLabel, compatibilite, competenceLabel, domaineById, etabById, formationById, metierById, niveauLabel, residences, serieById, statutLabel } from "@/lib/data";
import { PROFILE_KEY } from "./OrientationTest";

const TABS = ["Présentation", "Admission", "Débouchés", "Établissements", "Logement"];

export function FormationDetail({ id }: { id: string }) {
  const f = formationById[id];
  const params = useSearchParams();
  const etabId = params.get("etab") && f.etablissements.includes(params.get("etab")!) ? params.get("etab")! : f.etablissements[0];
  const e = etabById[etabId];
  const [tab, setTab] = useState(TABS[0]);
  const [fav, setFav] = useState(false);
  const [profil, setProfil] = useState<string[]>(["I", "C"]);
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); if (p?.top) setProfil(p.top); } catch { /* ignore */ } }, []);
  const score = compatibilite(profil, id);
  const s = domStyle(f.domaine);
  const Icon = s.icon;
  const seriesPays = (f.series_recommandees[e.pays] ?? []).map((x) => serieById[x]?.code).filter(Boolean);
  const res = residences.filter((r) => r.etablissements_desservis.includes(e.id));
  const logs = LOGEMENTS.filter((l) => l.pays === e.pays).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-950 via-brand-700 to-brand-400 pb-24 pt-8 text-white">
        <motion.div className="absolute right-[8%] top-6 opacity-15" initial={{ opacity: 0, scale: 0.8, rotate: -8 }} animate={{ opacity: 0.15, scale: 1, rotate: 0 }} transition={{ duration: 1 }}><Icon size={260} strokeWidth={1} /></motion.div>
        <div className="absolute -bottom-52 -left-24 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,194,31,.35),transparent_70%)]" />
        <div className="container relative flex flex-col gap-5">
          <nav className="flex items-center gap-1.5 text-[13px] text-brand-200"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/formations">Formations</Link><ChevronRight size={14} /><span className="text-white">{f.intitule}</span></nav>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}><EtabLogo e={e} size={84} /></motion.div>
            <div className="flex flex-col gap-2">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold tracking-tight sm:text-[44px] sm:leading-tight">{f.intitule}</motion.h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-brand-100"><Link href={`/etablissements/${e.id}/`} className="hover:text-white">{e.nom}</Link>·<span className="flex items-center gap-1"><MapPin size={16} />{e.ville.split("(")[0]}, {PAYS_NOM[e.pays]}</span>·<span>{statutLabel(e.statut)}</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="container relative -mt-14 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card grid grid-cols-2 gap-5 px-6 py-5 sm:grid-cols-5">
            {[["Diplôme", f.diplome], ["Durée", `${f.duree_annees} ans`], ["Niveau", niveauLabel(f.niveau)], ["Admission", admissionLabel(f.mode_admission)], ["Séries conseillées", seriesPays.slice(0, 4).join(", ") || "—"]].map(([a, b]) => (
              <div key={a}><div className="text-xs text-ink-mute">{a}</div><div className="font-extrabold">{b}</div></div>
            ))}
          </motion.div>
          <div className="scrollbar-none flex gap-6 overflow-x-auto border-b border-slate-200">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`relative shrink-0 py-3 text-sm font-bold transition ${tab === t ? "text-brand-600" : "text-ink-mute hover:text-ink"}`}>
                {t}{tab === t && <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-brand-600" />}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex flex-col gap-6">
              {tab === "Présentation" && (
                <>
                  <div className="card flex flex-col gap-4 p-7">
                    <h2 className="text-xl font-extrabold">Présentation de la formation</h2>
                    <p className="leading-relaxed text-ink-soft">Cette formation ({f.diplome}, domaine {domaineById[f.domaine].libelle.toLowerCase()}) se prépare en {f.duree_annees} ans après le baccalauréat. Elle forme aux compétences clés du domaine et prépare notamment aux métiers de {f.metiers.slice(0, 3).map((m) => metierById[m].nom.toLowerCase()).join(", ")}.</p>
                    <h3 className="mt-2 text-lg font-extrabold">Objectifs</h3>
                    {f.competences.map((c, k) => <motion.div key={c} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.07 }} className="flex items-center gap-2.5 text-ink-soft"><CircleCheck size={18} className="text-[#0f8a46]" />Maîtriser : {competenceLabel(c).toLowerCase()}</motion.div>)}
                  </div>
                  <div className="card flex flex-col gap-3 p-6"><h3 className="text-lg font-extrabold">Compétences visées</h3><div className="flex flex-wrap gap-2">{f.competences.map((c) => <span key={c} className="chip bg-brand-50 text-brand-700">{competenceLabel(c)}</span>)}</div></div>
                </>
              )}
              {tab === "Admission" && (
                <div className="card flex flex-col gap-4 p-7">
                  <h2 className="text-xl font-extrabold">Conditions d&apos;admission</h2>
                  <p className="text-ink-soft">Mode d&apos;admission : <b>{admissionLabel(f.mode_admission)}</b>. Les conditions précises (notes, quotas, frais, calendrier) sont publiées par l&apos;établissement.</p>
                  {(["GA", "MA", "SN"] as const).map((p) => f.series_recommandees[p]?.length ? (
                    <div key={p}><b className="text-sm">Séries conseillées · {PAYS_NOM[p]}</b><div className="mt-2 flex flex-wrap gap-1.5">{f.series_recommandees[p]!.map((x) => <span key={x} title={serieById[x].intitule} className="chip bg-[#f6f8fe] text-ink-soft">{serieById[x].code}</span>)}</div></div>
                  ) : null)}
                  <div className="rounded-xl bg-sun-50 p-4 text-sm text-[#8a5a00]">Documents habituels : pièce d&apos;identité, relevés de notes, diplôme du baccalauréat (ou attestation), photo d&apos;identité.</div>
                </div>
              )}
              {tab === "Débouchés" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {f.metiers.map((m) => (
                    <Link key={m} href={`/metiers/${m}/`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lift">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: domStyle(metierById[m].domaine).solid }}><Briefcase size={20} /></span>
                      <span className="flex-1"><b className="block">{metierById[m].nom}</b><span className="text-xs text-ink-mute">{metierById[m].secteurs.slice(0, 2).join(" · ")}</span></span><ArrowUpRight size={18} className="text-ink-mute" />
                    </Link>
                  ))}
                </div>
              )}
              {tab === "Établissements" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {f.etablissements.map((id2) => { const x = etabById[id2]; return (
                    <Link key={id2} href={`/formations/${f.id}/?etab=${id2}`} scroll={false} className={`card flex items-center gap-3 p-3.5 transition hover:shadow-lift ${id2 === e.id ? "border-brand-400 ring-2 ring-brand-100" : ""}`}>
                      <EtabLogo e={x} size={46} /><span className="min-w-0"><b className="block truncate text-sm">{x.nom}</b><span className="text-xs text-ink-mute">{x.ville.split("(")[0]} · {PAYS_NOM[x.pays]} · {statutLabel(x.statut)}</span></span>
                    </Link>); })}
                </div>
              )}
              {tab === "Logement" && (
                <div className="card flex flex-col gap-3 p-6"><h2 className="text-xl font-extrabold">Se loger près de {e.sigle}</h2>
                  {res.map((r) => <div key={r.id} className="flex justify-between rounded-xl border border-[#eef1f8] p-3 text-sm"><span><b>{r.nom}</b><span className="block text-ink-mute">{r.gestionnaire} · cité universitaire</span></span><b className="text-brand-600">Public</b></div>)}
                  {logs.map((l) => <div key={l.id} className="flex justify-between rounded-xl border border-[#eef1f8] p-3 text-sm"><span><b>{l.titre} · {l.quartier}</b><span className="block text-ink-mute">{l.trajet}</span></span><b className="text-brand-600">{l.prix}</b></div>)}
                  <Link href="/navilease" className="btn-primary self-start">Voir sur Navilease <ArrowRight size={16} /></Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: "spring", stiffness: 120 }} className="card flex flex-col gap-4 rounded-3xl p-6 shadow-[0_30px_60px_-24px_rgba(26,71,245,.45)]">
            <div className="flex items-center justify-between"><span className="chip bg-[#e8f8ef] px-3.5 py-2 text-sm text-[#0f8a46]"><Sparkles size={16} /> {score} % compatible</span><span className="text-xs text-ink-mute">profil {profil.join("+")}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e8edfa]"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.5, duration: 1.1 }} /></div>
            <div className="flex flex-col gap-2 text-[13px]">{["Ta série est acceptée", "Correspond à ton profil", "Dans ton pays de recherche"].map((t) => <span key={t} className="flex items-center gap-2"><Check size={14} strokeWidth={3} className="text-[#0f8a46]" />{t}</span>)}</div>
            <Link href={`/espace/candidatures/nouvelle?etab=${e.id}&formation=${f.id}`} className="btn-primary btn-shine w-full">Candidater maintenant <ArrowRight size={16} /></Link>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFav(!fav)} className={`btn w-full border ${fav ? "border-[#ffc5cf] bg-[#ffecef] text-[#d42a50]" : "border-brand-200 bg-white text-brand-700"}`}>
              <motion.span animate={fav ? { scale: [1, 1.4, 1] } : {}}><Heart size={16} fill={fav ? "currentColor" : "none"} /></motion.span>{fav ? "Dans mes favoris" : "Ajouter aux favoris"}
            </motion.button>
            <span className="flex items-center justify-center gap-1.5 text-xs text-ink-mute"><Calendar size={14} /> Candidatures ouvertes · campagne 2026-2027</span>
          </motion.div>
          <div className="card flex flex-col gap-3 bg-gradient-to-br from-white to-[#fff7dd] p-5">
            <div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Se loger près de {e.sigle}</b></div>
            {[...res.slice(0, 1).map((r) => [r.nom, `${r.gestionnaire} · sur dossier`, "Public"]), ...logs.slice(0, 2).map((l) => [`${l.titre} · ${l.quartier.split(",")[0]}`, l.trajet, l.prix])].map(([a, b, c]) => (
              <div key={a} className="flex justify-between gap-2 rounded-xl border border-[#f3e6bd] bg-white px-3 py-2.5 text-[13px]"><span><b>{a}</b><span className="block text-ink-mute">{b}</span></span><b className="shrink-0 text-brand-600">{c}</b></div>
            ))}
            <Link href="/navilease" className="text-[13px] font-bold text-brand-600">Voir les logements Navilease →</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
