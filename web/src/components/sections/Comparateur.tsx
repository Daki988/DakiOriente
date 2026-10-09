"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Download, GraduationCap, MessageCircle, Plus, Share2, Target, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScoreBar } from "@/components/motion/Bar";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { PAYS_NOM, STATUT_LONG, admissionLabel, compatibilite, etabById, etablissements, fmt, formationById, formations, formationsLiees, metierById, metiers, paysDetailById, type Etablissement, type PaysCode } from "@/lib/data";
import { COUTS, DEVISE_COURT, convert, devis, type Devise } from "@/lib/devis";
import { PROFILE_KEY } from "./OrientationTest";

type Mode = "formation" | "metier";
const VISA: Record<PaysCode, string> = { MA: "Dispense pour plusieurs nationalités · carte de séjour", SN: "Visa ou dispense selon nationalité · carte de séjour", GA: "Visa (hors CEMAC) · carte de séjour" };
const RECONNU = ["prive_reconnu", "prive_non_lucratif", "inter_etats"];

export function Comparateur() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(params.get("m") ? "metier" : "formation");
  const [fid, setFid] = useState(params.get("f") && formationById[params.get("f")!] ? params.get("f")! : "frm-ingenieur-informatique");
  const [mid, setMid] = useState(params.get("m") && metierById[params.get("m")!] ? params.get("m")! : "met-data-analyst");
  const [pays, setPays] = useState<PaysCode | "">((params.get("pays") as PaysCode) || "");
  const [origine, setOrigine] = useState<PaysCode>("GA");
  const [profil, setProfil] = useState<string[]>(["I", "C"]);
  useEffect(() => { try { const t = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null")?.top; if (t) setProfil(t); } catch { /* ignore */ } }, []);

  // Formations de référence : la formation choisie, ou toutes celles qui mènent au métier.
  const cibles = useMemo(() => (mode === "formation" ? [fid] : metierById[mid].formations.filter((f) => formationById[f])), [mode, fid, mid]);
  const metiersVises = mode === "formation" ? formationById[fid].metiers : [mid];
  const matchOf = (e: Etablissement) => {
    const direct = e.formations.filter((f) => cibles.includes(f));
    return direct.length ? direct : mode === "formation" ? formationsLiees(e, fid).filter((f) => f !== fid) : [];
  };
  const candidats = useMemo(() => etablissements.filter((e) => (!pays || e.pays === pays) && e.formations.some((f) => cibles.includes(f)))
    .sort((a, b) => b.photos.length - a.photos.length || b.formations.length - a.formations.length), [cibles, pays]);

  const initial = (params.get("e") ?? "").split(",").filter((id) => etabById[id]);
  const [ids, setIds] = useState<string[]>(initial);
  useEffect(() => {
    setIds((cur) => {
      const keep = cur.filter((id) => candidats.some((c) => c.id === id) || initial.includes(id));
      const fill = candidats.filter((c) => !keep.includes(c.id)).map((c) => c.id);
      // Diversité : on complète en priorité avec d'autres pays.
      fill.sort((a, b) => Number(keep.some((k) => etabById[k].pays === etabById[a].pays)) - Number(keep.some((k) => etabById[k].pays === etabById[b].pays)));
      return [...keep, ...fill].slice(0, Math.max(3, Math.min(keep.length, 4)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidats]);
  useEffect(() => {
    const q = new URLSearchParams();
    if (mode === "formation") q.set("f", fid); else q.set("m", mid);
    if (pays) q.set("pays", pays);
    if (ids.length) q.set("e", ids.join(","));
    router.replace(`/comparateur/?${q.toString()}`, { scroll: false });
  }, [mode, fid, mid, pays, ids, router]);

  const dev: Devise = "XAF";
  const cols = ids.map((id) => {
    const e = etabById[id];
    const m = matchOf(e);
    const ref = m[0] ?? (mode === "formation" ? fid : cibles[0]);
    const score = Math.min(98, compatibilite(profil, ref) + (RECONNU.includes(e.statut) ? 3 : 0));
    const D = devis(e.id, ref, origine);
    const C = COUTS[e.pays];
    const sco = C.scolarite_annuelle[e.type] ?? C.scolarite_annuelle.universite;
    return { e, m, ref, score, D, sco, tot: D.total.map((x) => convert(x, D.devise, dev)) as [number, number] };
  });
  const bestIdx = cols.length ? cols.reduce((b, c, k) => (c.score > cols[b].score || (c.score === cols[b].score && c.tot[1] < cols[b].tot[1]) ? k : b), 0) : -1;
  const cheapest = cols.length ? Math.min(...cols.map((c) => c.tot[1])) : 0;
  const maxLiees = cols.length ? Math.max(...cols.map((c) => c.m.length)) : 0;

  const rows: { lab: string; cell: (c: (typeof cols)[number], k: number) => ReactNode; good?: (c: (typeof cols)[number]) => boolean }[] = [
    { lab: "COMPATIBILITÉ AVEC TON PROFIL", cell: (c, k) => <div className="flex items-center gap-2"><ScoreBar value={c.score} delay={k * 0.1} /><span className="text-[#0f8a46]">{c.score} %</span></div> },
    { lab: "STATUT", cell: (c) => STATUT_LONG[c.e.statut] ?? "Privé", good: (c) => RECONNU.includes(c.e.statut) },
    { lab: "PROGRAMME CORRESPONDANT", cell: (c) => c.m.slice(0, 2).map((f) => <Link key={f} href={`/formations/${f}/?etab=${c.e.id}`} className="block hover:text-brand-600">{formationById[f].intitule}</Link>) },
    { lab: "DIPLÔME · DURÉE", cell: (c) => `${formationById[c.ref].diplome} · ${formationById[c.ref].duree_annees} ans` },
    { lab: "ADMISSION", cell: (c) => admissionLabel(formationById[c.ref].mode_admission) },
    { lab: "FRAIS DE SCOLARITÉ (estim.)", cell: (c) => `${fmt(c.sco.min)} – ${fmt(c.sco.max)} ${c.D.devise}/an` },
    { lab: `COÛT TOTAL ${"{n}"} (devis)`, cell: (c) => <Link href={`/devis/?etab=${c.e.id}&f=${c.ref}&o=${origine}`} className="hover:text-brand-600">{fmt(c.tot[0])} – {fmt(c.tot[1])} {DEVISE_COURT[dev]}<span className="block text-xs font-semibold text-ink-mute">sur {c.D.years} an{c.D.years > 1 ? "s" : ""} · voir le devis →</span></Link>, good: (c) => c.tot[1] === cheapest },
    { lab: "COÛT DE LA VIE / MOIS", cell: (c) => { const b = paysDetailById[c.e.pays].budget; return `${fmt(b.total_mensuel.min)} – ${fmt(b.total_mensuel.max)} ${b.devise}`; } },
    { lab: `VISA (au départ du ${PAYS_NOM[origine]})`, cell: (c) => (c.e.pays === origine ? "Aucun (étudiant national)" : <Link href={`/pays/${c.e.pays.toLowerCase()}/`} className="hover:text-brand-600">{VISA[c.e.pays]}</Link>) },
    { lab: "MÉTIERS VISÉS", cell: () => <div className="flex flex-wrap gap-1.5">{metiersVises.slice(0, 2).map((m) => <span key={m} className="chip bg-[#f1edff] text-[#6a3df0]">{metierById[m].nom}</span>)}</div> },
    { lab: "LOGEMENT NAVILEASE", cell: (c) => { const b = paysDetailById[c.e.pays].budget; return `Logements vérifiés · dès ${fmt(b.lignes[0].min)} ${b.devise}/mois`; } },
    { lab: "AUTRES FORMATIONS LIÉES", cell: (c) => `${c.m.length} programme${c.m.length > 1 ? "s" : ""}`, good: (c) => c.m.length === maxLiees && maxLiees > 0 },
  ];
  const ajoutables = candidats.filter((c) => !ids.includes(c.id));
  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: "Comparaison Navigoal", url }); else { await navigator.clipboard.writeText(url); alert("Lien copié : partage-le avec tes parents."); } } catch { /* annulé */ }
  };

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-[#f6f8fe] pb-7 pt-10 print:hidden">
        <div className="container flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="flex max-w-3xl flex-col gap-2.5"><span className="eyebrow">Comparateur</span><h1 className="h-section">Compare et choisis en confiance</h1><p className="text-ink-mute sm:text-base">Mêmes formations ou mêmes métiers visés : vois d&apos;un coup d&apos;œil les différences de coût, d&apos;admission, de visa et de logement.</p></div>
            <p className="hidden -rotate-[4deg] font-hand text-[28px] text-brand-700 lg:block">Tu as vraiment le choix !</p>
          </div>
          <div className="card flex flex-col gap-3 rounded-2xl p-2.5 xl:flex-row xl:items-center">
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-[13px] font-bold text-brand-700"><Target size={16} /> Comparer par</div>
            <div className="flex rounded-xl bg-[#f6f8fe] p-[3px]">
              {(["formation", "metier"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`relative rounded-[10px] px-3.5 py-2 text-[13px] font-bold ${mode === m ? "text-brand-600" : "text-ink-mute"}`}>{mode === m && <motion.span layoutId="cmp-mode" className="absolute inset-0 rounded-[10px] bg-white shadow-sm" />}<span className="relative">{m === "formation" ? "Formation" : "Métier visé"}</span></button>)}
            </div>
            <label className="flex min-w-0 flex-1 items-center gap-2.5 px-2 xl:border-l xl:border-[#eef1f8] xl:pl-4">
              <GraduationCap size={18} className="shrink-0 text-brand-600" />
              {mode === "formation"
                ? <select value={fid} onChange={(ev) => setFid(ev.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm font-bold outline-none" aria-label="Formation">{formations.filter((f) => f.etablissements.some((x) => etabById[x])).sort((a, b) => a.intitule.localeCompare(b.intitule)).map((f) => <option key={f.id} value={f.id}>{f.intitule}</option>)}</select>
                : <select value={mid} onChange={(ev) => setMid(ev.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm font-bold outline-none" aria-label="Métier">{metiers.filter((m) => m.formations.some((f) => formationById[f]?.etablissements.some((x) => etabById[x]))).sort((a, b) => a.nom.localeCompare(b.nom)).map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select>}
            </label>
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              {(["", "MA", "SN", "GA"] as const).map((p) => <button key={p} onClick={() => setPays(p)} className={`chip px-3 py-1.5 ${pays === p ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"}`}>{p ? PAYS_NOM[p] : "Tous pays"}</button>)}
            </div>
            <select value={origine} onChange={(ev) => setOrigine(ev.target.value as PaysCode)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold" aria-label="Pays de départ">{(["GA", "SN", "MA"] as const).map((p) => <option key={p} value={p}>Je pars du {PAYS_NOM[p]}</option>)}</select>
          </div>
          <span className="text-[13px] text-ink-mute">{candidats.length} établissement{candidats.length > 1 ? "s" : ""} proposent {mode === "formation" ? "cette formation" : "une formation menant à ce métier"}.</span>
        </div>
      </section>

      <div className="container mt-3">
        <div className="-mx-4 overflow-x-auto px-4 pb-4 pt-3">
          <div className="flex min-w-max items-stretch gap-4 lg:min-w-0">
            <AnimatePresence mode="popLayout">
              {cols.map((c, k) => {
                const best = k === bestIdx;
                return (
                  <motion.div key={c.e.id} layout initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, transition: { delay: k * 0.12, type: "spring", stiffness: 110, damping: 18 } }} exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative flex w-[290px] flex-col overflow-hidden rounded-3xl bg-white lg:w-auto lg:flex-1 ${best ? "border-[2.5px] border-brand-600 shadow-[0_30px_60px_-24px_rgba(26,71,245,.45)]" : "border border-slate-200 shadow-card"}`}>
                    <div className="relative">
                      <EtabPhoto e={c.e} rounded="rounded-none" className="h-[150px]" />
                      {best && <span className="chip absolute left-3 top-3 bg-sun-400 text-ink">★ Meilleur choix pour toi</span>}
                      <button onClick={() => setIds(ids.filter((x) => x !== c.e.id))} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-soft hover:text-[#d42a50]" aria-label={`Retirer ${c.e.sigle}`}><X size={16} /></button>
                      <EtabLogo e={c.e} size={56} className="absolute -bottom-7 left-4 shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-1 px-[18px] pb-3.5 pt-9"><b className="leading-snug">{c.e.nom}</b><span className="text-xs text-ink-mute">{c.e.ville}, {PAYS_NOM[c.e.pays]}</span></div>
                    {rows.map((r, j) => {
                      const ok = cols.length > 1 && r.good?.(c);
                      return (
                        <div key={j} className={`flex min-h-[64px] flex-col gap-1 border-t border-[#eef1f8] px-[18px] py-3 transition-colors hover:bg-brand-50/60 ${j % 2 ? "bg-white" : "bg-[#fbfcff]"}`}>
                          <span className="text-[11px] font-extrabold text-ink-mute">{r.lab.replace("{n}", `${c.D.years} ANS`)}</span>
                          <div className={`text-sm font-bold ${ok ? "text-[#0f8a46]" : ""}`}>{r.cell(c, k)}</div>
                        </div>
                      );
                    })}
                    <div className="mt-auto flex flex-col gap-2 p-[18px]"><Link href="/espace#candidatures" className={best ? "btn-primary" : "btn-ghost"}>Candidater</Link><Link href={`/etablissements/${c.e.id}/`} className="text-center text-[13px] font-bold text-brand-600">Voir la fiche →</Link></div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {ids.length < 4 && ajoutables.length > 0 && (
              <div className="flex w-[220px] shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand-200 bg-white/60 p-5 text-center print:hidden lg:w-[220px]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Plus /></span>
                <b className="text-sm">Ajouter une école</b>
                <select value="" onChange={(ev) => ev.target.value && setIds([...ids, ev.target.value])} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-[13px] font-semibold" aria-label="Ajouter une école"><option value="">Choisir…</option>{ajoutables.map((e) => <option key={e.id} value={e.id}>{e.sigle} · {PAYS_NOM[e.pays]}</option>)}</select>
              </div>
            )}
          </div>
        </div>
        {!cols.length && <p className="card p-8 text-center text-ink-mute">Aucun établissement pour ce choix dans ce pays. Essaie « Tous pays ».</p>}
        <p className="mt-2 text-xs text-ink-mute">En vert : la meilleure valeur de chaque ligne. Coûts estimés (scolarité, vie, installation, voyages) convertis au taux indicatif 1 € = 655,957 F CFA ; frais à confirmer par chaque école.</p>
      </div>

      <div className="container mt-6 grid gap-4 md:grid-cols-3 print:hidden">
        {([[Share2, "bg-brand-50 text-brand-600", "Partager la comparaison", "avec tes parents ou ton conseiller", share], [Download, "bg-[#e8f8ef] text-[#0f8a46]", "Exporter en PDF", "pour décider à tête reposée", () => window.print()], [MessageCircle, "bg-sun-100 text-[#a55a00]", "Poser une question", "directement aux établissements", () => (window.location.href = "/espace#messages")]] as const).map(([I, cls, t, s, fn]) => (
          <button key={t} onClick={fn} className="card flex items-center gap-3 rounded-[18px] p-[18px] text-left transition hover:-translate-y-0.5 hover:shadow-lift"><span className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl ${cls}`}><I size={20} /></span><span><b className="block text-sm">{t}</b><span className="text-xs text-ink-mute">{s}</span></span></button>
        ))}
      </div>
    </>
  );
}
