"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BadgeCheck, Bus, Calculator, Calendar, Check, CloudSun, FileDown, GraduationCap, Handshake, HeartPulse, Info, Lightbulb, Mail, MessageCircle, Scale, Share2, Shield, ShieldCheck, Users, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Reveal } from "@/components/motion/Reveal";
import { DONUT_COLORS, Donut } from "./Donut";
import { DevisPdf } from "./DevisPdf";
import { PAYS_NOM, STATUT_LONG, etabById, etablissements, fmt, formationById, paysDetailById, type PaysCode } from "@/lib/data";
import { COUTS, DEVISE_COURT, DEVISE_LABEL, HYP, LOGEMENT_LABEL, SOURCES, TAUX, convert, devis, formationParDefaut, type Devise, type Logement } from "@/lib/devis";

const FLAG: Record<PaysCode, string> = { GA: "🇬🇦", SN: "🇸🇳", MA: "🇲🇦" };
const VILLE: Record<PaysCode, string> = { GA: "Libreville", SN: "Dakar", MA: "Casablanca" };
const field = "w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export function DevisSimulateur() {
  const params = useSearchParams();
  const router = useRouter();
  const [eid, setEid] = useState(etabById[params.get("etab") ?? ""] ? params.get("etab")! : "ma-esa-casa");
  const [fid, setFid] = useState(() => { const f = params.get("f"); return f && etabById[eid].formations.includes(f) ? f : formationParDefaut(eid); });
  const [origine, setOrigine] = useState<PaysCode>((["GA", "SN", "MA"].includes(params.get("o") ?? "") ? params.get("o") : "GA") as PaysCode);
  const [logement, setLogement] = useState<Logement>(params.get("l") === "colocation" ? "colocation" : "studio");
  const [devise, setDevise] = useState<Devise>((params.get("d") as Devise) || "XAF");
  const [eleve, setEleve] = useState("");
  const [payeur, setPayeur] = useState("");
  const e = etabById[eid];
  const F = formationById[fid];
  const P = paysDetailById[e.pays];
  const C = COUTS[e.pays];
  const D = useMemo(() => devis(eid, fid, origine, logement), [eid, fid, origine, logement]);
  const cv = (v: number) => convert(v, D.devise, devise);
  const unit = DEVISE_COURT[devise];

  useEffect(() => { if (!etabById[eid].formations.includes(fid)) setFid(formationParDefaut(eid)); }, [eid, fid]);
  useEffect(() => {
    const q = new URLSearchParams({ etab: eid, f: fid, o: origine, l: logement, d: devise });
    router.replace(`/devis/?${q.toString()}`, { scroll: false });
  }, [eid, fid, origine, logement, devise, router]);

  const [faits, setFaits] = useState<number[]>([]);
  useEffect(() => { try { setFaits(JSON.parse(localStorage.getItem(`navigoal-demarches-${e.pays}`) || "[]")); } catch { setFaits([]); } }, [e.pays]);
  const toggle = (k: number) => { const n = faits.includes(k) ? faits.filter((x) => x !== k) : [...faits, k]; setFaits(n); try { localStorage.setItem(`navigoal-demarches-${e.pays}`, JSON.stringify(n)); } catch { /* ignore */ } };

  const nbMetiers = new Set(e.formations.flatMap((f) => formationById[f]?.metiers ?? [])).size;
  const qual = [
    [ShieldCheck, "Reconnaissance", e.statut === "prive_reconnu" ? "Privé reconnu par l'État : diplôme équivalent au diplôme national" : e.statut === "inter_etats" ? "Établissement inter-États, diplômes reconnus par les États membres" : "Établissement agréé ; vérifier l'accréditation du programme"],
    [Calendar, "Ancienneté", e.annee_creation ? `Créé en ${e.annee_creation}` : "Date de création à confirmer"],
    [GraduationCap, "Programmes", `${e.formations.length} programmes, reliés à ${nbMetiers} métiers`],
    [Handshake, "Ouverture internationale", "Accueil des étudiants étrangers, accompagnement visa et logement via Navigoal"],
  ] as const;
  const env = [[Shield, "Sécurité", C.environnement.securite], [HeartPulse, "Santé", C.environnement.sante], [Bus, "Transports", C.environnement.transports], [Users, "Communauté", C.environnement.communaute], [CloudSun, "Climat", C.environnement.climat]] as const;
  const cats = Object.entries(D.cats);
  const resume = `Devis Navigoal : ${F.intitule} à ${e.sigle} (${e.ville}) — ${fmt(cv(D.total[0]))} à ${fmt(cv(D.total[1]))} ${unit} sur ${D.years} an${D.years > 1 ? "s" : ""}, tout compris.`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const parPays = (["MA", "SN", "GA"] as const).map((p) => [p, etablissements.filter((x) => x.pays === p).sort((a, b) => a.sigle.localeCompare(b.sigle))] as const);

  return (
    <>
      <div className="print:hidden">
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-700 to-brand-400 pb-24 pt-10 text-white">
          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] animate-float rounded-full bg-[radial-gradient(circle,rgba(255,194,31,.35),transparent_70%)]" />
          <div className="container relative flex flex-col gap-4">
            <span className="chip self-start bg-white/15 text-white"><UsersRound size={14} className="mr-1.5 inline" />Espace parents</span>
            <h1 className="h-display">Combien coûtent vraiment <span className="text-sun-400">ses études</span> ?</h1>
            <p className="max-w-[720px] text-[17px] text-[#c9d6ff]">Un devis complet sur toute la durée de la formation : scolarité, vie quotidienne, installation, visa et carte de séjour. Pour décider sereinement, avant de vous engager.</p>
          </div>
        </section>

        <div className="container relative -mt-16">
          <Reveal className="card grid gap-3 rounded-3xl p-4 shadow-[0_30px_60px_-24px_rgba(11,21,51,.35)] sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.6fr_.9fr_.9fr]">
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Votre enfant part de</span>
              <select value={origine} onChange={(ev) => setOrigine(ev.target.value as PaysCode)} className={field}>{(["GA", "SN", "MA"] as const).map((p) => <option key={p} value={p}>{FLAG[p]} {PAYS_NOM[p]} ({VILLE[p]})</option>)}</select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Établissement</span>
              <select value={eid} onChange={(ev) => setEid(ev.target.value)} className={field}>{parPays.map(([p, xs]) => <optgroup key={p} label={PAYS_NOM[p]}>{xs.map((x) => <option key={x.id} value={x.id}>{x.sigle} · {x.ville.split("/")[0].trim()}</option>)}</optgroup>)}</select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Formation</span>
              <select value={fid} onChange={(ev) => setFid(ev.target.value)} className={field}>{e.formations.filter((f) => formationById[f]).map((f) => <option key={f} value={f}>{formationById[f].intitule} ({formationById[f].duree_annees} ans)</option>)}</select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Logement</span>
              <select value={logement} onChange={(ev) => setLogement(ev.target.value as Logement)} className={field}>{(["studio", "colocation"] as const).map((l) => <option key={l} value={l}>{LOGEMENT_LABEL[l]}</option>)}</select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Devise d&apos;affichage</span>
              <select value={devise} onChange={(ev) => setDevise(ev.target.value as Devise)} className={field}>{(Object.keys(DEVISE_LABEL) as Devise[]).map((d) => <option key={d} value={d}>{DEVISE_LABEL[d]}</option>)}</select></label>
          </Reveal>
        </div>

        <div className="container mt-7 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
          <div className="flex min-w-0 flex-col gap-6">
            <Reveal className="card flex flex-col gap-6 rounded-[26px] p-6 sm:p-7">
              <div className="flex flex-col justify-between gap-4 2xl:flex-row">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-[13px] font-bold uppercase text-ink-mute">Coût total estimé · {D.years} an{D.years > 1 ? "s" : ""} · {F.diplome}</span>
                  <div className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[40px]"><span className="whitespace-nowrap"><AnimatedNumber value={cv(D.total[0])} /> –</span> <span className="whitespace-nowrap"><AnimatedNumber value={cv(D.total[1])} /> <span className="text-xl">{unit}</span></span></div>
                  <span className="text-sm text-ink-mute">soit {fmt(D.total[0])} – {fmt(D.total[1])} {D.devise} · {fmt(convert(D.total[0], D.devise, "EUR"))} – {fmt(convert(D.total[1], D.devise, "EUR"))} € · environ {fmt(cv(D.total[0]) / (D.years * 12))} – {fmt(cv(D.total[1]) / (D.years * 12))} {unit} par mois</span>
                </div>
                <div className="flex shrink-0 flex-wrap items-start gap-2 2xl:flex-col 2xl:items-end">
                  <span className="chip bg-sun-100 text-[#a55a00]"><Info size={14} className="mr-1 inline" />Estimation · frais à confirmer par l&apos;école</span>
                  <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><BadgeCheck size={14} className="mr-1 inline" />Devient « frais confirmés » dès réponse de l&apos;école</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <div className="relative h-[220px] w-[220px] shrink-0">
                  <Donut key={`${eid}${fid}${origine}${logement}`} values={cats.map(([, v]) => v[1])} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-ink-mute">par an</span><b className="text-lg"><AnimatedNumber value={cv(D.total[1]) / D.years} /></b><span className="text-[11px] text-ink-mute">{unit} max.</span></div>
                </div>
                <div className="flex w-full flex-col gap-3">
                  <span className="text-xs font-bold text-ink-mute">RÉPARTITION ({unit})</span>
                  {cats.map(([k, v], i) => <div key={k} className="flex justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ background: DONUT_COLORS[i] }} />{k}</span><b className="whitespace-nowrap text-right text-[13px] sm:text-sm">{fmt(cv(v[0]))} – {fmt(cv(v[1]))}</b></div>)}
                </div>
              </div>
            </Reveal>

            <Reveal className="card flex flex-col gap-3 rounded-3xl p-6">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center"><h3 className="text-lg font-extrabold">Échéancier année par année</h3><span className="text-xs text-ink-mute">inflation {Math.round(HYP.inflation_annuelle * 100)} %/an incluse · montants en {unit}</span></div>
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse whitespace-nowrap text-sm">
                  <thead><tr className="text-left text-xs font-extrabold text-ink-mute"><th className="p-2">ANNÉE</th><th className="p-2 text-right">SCOLARITÉ + FRAIS</th><th className="p-2 text-right">VIE (10 MOIS)</th><th className="p-2 text-right">SÉJOUR & ASSURANCE</th><th className="p-2 text-right">TOTAL</th></tr></thead>
                  <tbody>
                    {D.rows.map((r) => (
                      <motion.tr key={`${r.annee}-${D.total[1]}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: r.annee * 0.06 }} className="border-t border-[#eef1f8]">
                        <td className="px-2 py-3 font-bold">Année {r.annee}</td>
                        {([[r.scolarite[0] + r.annexes[0], r.scolarite[1] + r.annexes[1]], r.vie, r.renouvellements] as const).map((x, j) => <td key={j} className="px-2 py-3 text-right">{fmt(cv(x[0]))} – {fmt(cv(x[1]))}</td>)}
                        <td className="px-2 py-3 text-right font-extrabold text-brand-600">{fmt(cv(r.total[0]))} – {fmt(cv(r.total[1]))}</td>
                      </motion.tr>
                    ))}
                    <tr className="border-t-2 border-slate-200"><td className="px-2 py-3 font-bold">Installation & voyages</td><td colSpan={3} className="whitespace-normal px-2 py-3 text-[13px] text-ink-mute">visa, billets aller-retour, caution logement, équipement</td><td className="px-2 py-3 text-right font-extrabold">{fmt(cv(D.installation[0]))} – {fmt(cv(D.installation[1]))}</td></tr>
                    <tr className="border-t border-[#eef1f8]"><td className="px-2 py-3 font-bold">Imprévus & transferts</td><td colSpan={3} className="whitespace-normal px-2 py-3 text-[13px] text-ink-mute">marge {Math.round(HYP.marge_imprevus * 100)} % + frais de transfert {Math.round(HYP.frais_transfert * 100)} %</td><td className="px-2 py-3 text-right font-extrabold">{fmt(cv(D.cats["Imprévus & transferts"][0]))} – {fmt(cv(D.cats["Imprévus & transferts"][1]))}</td></tr>
                  </tbody>
                </table>
              </div>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-2">
              <Reveal className="card flex flex-col gap-3 rounded-3xl p-6"><h3 className="text-lg font-extrabold">Qualité de la formation</h3>
                {qual.map(([I, t, s]) => <div key={t} className="flex items-start gap-3"><span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I size={18} /></span><span><b className="block text-sm">{t}</b><span className="text-[13px] text-ink-mute">{s}</span></span></div>)}
                <Link href={`/etablissements/${e.id}/`} className="text-[13px] font-bold text-brand-600">Voir la fiche de l&apos;établissement →</Link>
              </Reveal>
              <Reveal delay={0.1} className="card flex flex-col gap-3 rounded-3xl p-6"><h3 className="text-lg font-extrabold">Cadre de vie à {e.ville.split(/[ /(]/)[0]}</h3>
                {env.map(([I, t, s]) => <div key={t} className="flex items-start gap-3"><span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#e8f8ef] text-[#0f8a46]"><I size={18} /></span><span><b className="block text-sm">{t}</b><span className="text-[13px] text-ink-mute">{s}</span></span></div>)}
                <Link href={`/pays/${e.pays}/`} className="text-[13px] font-bold text-brand-600">Étudier au {P.nom} : la fiche pays →</Link>
              </Reveal>
            </div>
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="card flex flex-col gap-3 rounded-3xl p-5 shadow-[0_30px_60px_-24px_rgba(26,71,245,.4)]">
              <b className="text-[17px]">Votre devis</b>
              <div className="grid grid-cols-2 gap-2">
                <input value={eleve} onChange={(ev) => setEleve(ev.target.value)} placeholder="Prénom de l'élève" className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-400" aria-label="Prénom de l'élève (facultatif)" />
                <input value={payeur} onChange={(ev) => setPayeur(ev.target.value)} placeholder="Responsable financier" className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-400" aria-label="Responsable financier (facultatif)" />
              </div>
              <button onClick={() => window.print()} className="btn-primary btn-shine"><FileDown size={18} /> Télécharger le devis PDF</button>
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(resume + " " + url)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2.5 text-[13px]"><Share2 size={15} /> WhatsApp</a>
                <a href={`mailto:?subject=${encodeURIComponent("Devis d'études Navigoal")}&body=${encodeURIComponent(resume + "\n\n" + url)}`} className="btn-ghost px-3 py-2.5 text-[13px]"><Mail size={15} /> E-mail</a>
              </div>
              <Link href="/espace#messages" className="btn-ghost"><MessageCircle size={16} /> Demander les frais exacts à l&apos;école</Link>
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#fff7dd] p-3 text-[13px]"><Lightbulb size={18} className="shrink-0 text-[#a55a00]" /><span><b>Astuce :</b> comparez ce devis avec d&apos;autres écoles qui mènent au même métier. <Link href={`/comparateur/?f=${fid}&e=${eid}`} className="font-bold text-brand-600"><Scale size={13} className="inline" /> Comparer</Link></span></div>
            </div>
            <div className="card flex flex-col gap-3.5 rounded-3xl p-5">
              <div className="flex items-center justify-between"><b className="text-[17px]">Démarches de régularisation</b><span className="chip bg-brand-50 text-brand-700">{P.nom}</span></div>
              <span className="text-xs text-ink-mute">Cochez les étapes au fur et à mesure ({faits.length}/{C.demarches.length}).</span>
              <div className="flex flex-col">
                {C.demarches.map((d, k) => { const ok = faits.includes(k); return (
                  <div key={k} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <button onClick={() => toggle(k)} aria-pressed={ok} aria-label={`Étape ${k + 1} ${ok ? "faite" : "à faire"}`} className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-[11px] font-extrabold transition ${ok ? "bg-brand-600 text-white" : "border-2 border-brand-200 bg-white text-brand-600 hover:border-brand-400"}`}>{ok ? <Check size={15} strokeWidth={3} /> : k + 1}</button>
                      {k < C.demarches.length - 1 && <div className={`h-6 w-0.5 ${ok ? "bg-brand-600" : "bg-[#dbe3f7]"}`} />}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 pt-1.5"><span className="chip self-start bg-sun-100 px-2 py-0.5 text-[#a55a00]">{d.quand}</span><span className={`text-[13px] ${ok ? "text-ink-mute line-through" : "text-ink-soft"}`}>{d.etape}</span></div>
                  </div>); })}
              </div>
            </div>
          </aside>
        </div>
        <p className="container mt-5 text-xs leading-relaxed text-ink-mute">
          Estimation Navigoal basée sur les frais publiés par l&apos;établissement lorsqu&apos;ils sont disponibles, sur des grilles publiques et sur le coût de la vie observé ({SOURCES.slice(0, 4).map((u) => u.split("/")[2]).join(", ")}). Taux indicatif 1 € = 655,957 F CFA = {TAUX.MAD} MAD. Marge d&apos;imprévus {Math.round(HYP.marge_imprevus * 100)} % et frais de transfert {Math.round(HYP.frais_transfert * 100)} % inclus{logement === "colocation" ? " ; colocation : environ −15 % sur le coût de la vie" : ""}. Établissement : {STATUT_LONG[e.statut] ?? "privé"}, catégorie « {D.typ} ».
        </p>
        <div className="container mt-8 flex justify-center"><span className="flex items-center gap-2 text-sm text-ink-mute"><Calculator size={16} /> Chaque changement recalcule le devis en direct.</span></div>
      </div>
      <DevisPdf e={e} F={F} D={D} origine={origine} logement={logement} eleve={eleve} payeur={payeur} />
    </>
  );
}
