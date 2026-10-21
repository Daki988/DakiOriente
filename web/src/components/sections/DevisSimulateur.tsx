"use client";
import Link from "@/components/ui/Link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BadgeCheck, Bus, Calculator, Calendar, Coins, Check, CloudSun, FileDown, GraduationCap, Handshake, HeartPulse, Info, Lightbulb, Mail, MessageCircle, Scale, Share2, Shield, ShieldCheck, Users, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Reveal } from "@/components/motion/Reveal";
import { DONUT_COLORS, Donut } from "./Donut";
import { DevisPdf } from "./DevisPdf";
import { STATUT_LONG, VILLES_ETUDES, etabById, etablissements, fmt, formationById, labelById, paysDetailById } from "@/lib/data";
import { paysOrigine, paysOrigineById, visaResume } from "@/lib/pays-origine";
import { COUTS, HYP, LOGEMENT_LABEL, SOURCES, devis, formationParDefaut, type Logement } from "@/lib/devis";
import { useDevise } from "@/components/ui/Devise";
import { MARGE_PRUDENCE, convertir, devisePays, formatMontant, symbole } from "@/lib/devises";

const field = "w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export function DevisSimulateur() {
  const params = useSearchParams();
  const router = useRouter();
  const [eid, setEid] = useState(etabById[params.get("etab") ?? ""] ? params.get("etab")! : "ma-esa-casa");
  const [fid, setFid] = useState(() => { const f = params.get("f"); return f && etabById[eid].formations.includes(f) ? f : formationParDefaut(eid); });
  const { pays, devise, taux, setPays } = useDevise();
  const [origine, setOrigine] = useState(paysOrigineById[params.get("o") ?? ""] ? params.get("o")! : "");
  useEffect(() => { if (!origine && pays && paysOrigineById[pays]) setOrigine(pays); }, [pays]); // eslint-disable-line react-hooks/exhaustive-deps
  // Le pays de départ fixe la devise de tout le site : c'est de là que les parents enverront l'argent.
  useEffect(() => { if (origine && origine !== pays) setPays(origine === "MA" ? null : origine); }, [origine]); // eslint-disable-line react-hooks/exhaustive-deps
  const choisirOrigine = (o: string) => { setOrigine(o); if (o) setPays(o === "MA" ? null : o); };
  const [dirhamsSeuls, setDirhamsSeuls] = useState(false);
  const [logement, setLogement] = useState<Logement>(params.get("l") === "colocation" ? "colocation" : "studio");
  const [eleve, setEleve] = useState("");
  const [payeur, setPayeur] = useState("");
  const e = etabById[eid];
  const F = formationById[fid];
  const P = paysDetailById[e.pays];
  const C = COUTS[e.pays];
  const D = useMemo(() => devis(eid, fid, origine, logement), [eid, fid, origine, logement]);
  const cv = (v: number) => v;
  // Devise de lecture : celle du pays de départ (ou du profil), le dirham restant affiché en dessous.
  const devLocale = origine ? (origine === "MA" ? null : devisePays(origine)) : devise;
  const dev = !dirhamsSeuls && devLocale && devLocale !== "MAD" && taux.taux[devLocale] ? devLocale : null;
  const loc = (v: number) => (dev ? convertir(v, dev, taux) ?? v : v);
  const unit = dev ? symbole(dev) : "MAD";
  const nb = (v: number) => fmt(Math.round(v));
  /** Fourchette dans la devise de lecture, avec l'équivalent en dirhams en dessous. */
  const Plage = ({ v, className = "" }: { v: readonly number[]; className?: string }) => dev
    ? <span className={`inline-flex flex-col items-end leading-tight ${className}`}><span>{nb(loc(v[0]))} – {nb(loc(v[1]))}</span><span className="text-[11px] font-semibold text-ink-mute">{nb(v[0])} – {nb(v[1])} MAD</span></span>
    : <span className={className}>{nb(v[0])} – {nb(v[1])}</span>;
  const mois = [D.total[0] / (D.years * 12), D.total[1] / (D.years * 12)];

  useEffect(() => { if (!etabById[eid].formations.includes(fid)) setFid(formationParDefaut(eid)); }, [eid, fid]);
  useEffect(() => {
    const q = new URLSearchParams({ etab: eid, f: fid, l: logement });
    if (origine) q.set("o", origine);
    router.replace(`/devis/?${q.toString()}`, { scroll: false });
  }, [eid, fid, origine, logement, router]);

  const [faits, setFaits] = useState<number[]>([]);
  useEffect(() => { try { setFaits(JSON.parse(localStorage.getItem(`navigoal-demarches-${e.pays}`) || "[]")); } catch { setFaits([]); } }, [e.pays]);
  const toggle = (k: number) => { const n = faits.includes(k) ? faits.filter((x) => x !== k) : [...faits, k]; setFaits(n); try { localStorage.setItem(`navigoal-demarches-${e.pays}`, JSON.stringify(n)); } catch { /* ignore */ } };

  const nbMetiers = new Set(e.formations.flatMap((f) => formationById[f]?.metiers ?? [])).size;
  const qual = [
    [ShieldCheck, "Reconnaissance", labelById[e.label]?.description ?? "Établissement autorisé"],
    [Calendar, "Ancienneté", e.annee_creation ? `Créé en ${e.annee_creation}` : "Date de création à confirmer"],
    [GraduationCap, "Programmes", `${e.filieres.length} filières homologuées, reliées à ${nbMetiers} métiers`],
    [Handshake, "Ouverture internationale", "Accueil des étudiants étrangers, accompagnement visa et logement via Navigoal"],
  ] as const;
  const env = [[Shield, "Sécurité", C.environnement.securite], [HeartPulse, "Santé", C.environnement.sante], [Bus, "Transports", C.environnement.transports], [Users, "Communauté", C.environnement.communaute], [CloudSun, "Climat", C.environnement.climat]] as const;
  const cats = Object.entries(D.cats);
  const resume = `Devis Navigoal : ${F.intitule} à ${e.sigle} (${e.ville}) — ${dev ? `${nb(loc(D.total[0]))} à ${nb(loc(D.total[1]))} ${unit} (soit ` : ""}${fmt(cv(D.total[0]))} à ${fmt(cv(D.total[1]))} MAD${dev ? ")" : ""} sur ${D.years} an${D.years > 1 ? "s" : ""}, tout compris.`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const parVille = VILLES_ETUDES.map((v) => [v, etablissements.filter((x) => x.ville === v).sort((a, b) => a.sigle.localeCompare(b.sigle))] as const);

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
          <Reveal className="card grid gap-3 rounded-3xl p-4 shadow-[0_30px_60px_-24px_rgba(11,21,51,.35)] sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.6fr_.9fr]">
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Votre enfant part de</span>
              <select value={origine} onChange={(ev) => choisirOrigine(ev.target.value)} className={field}><option value="">Choisir un pays…</option><optgroup label="Afrique">{paysOrigine.filter((p) => p.continent === "afrique").map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</optgroup><optgroup label="Autres pays">{paysOrigine.filter((p) => p.continent === "autre").map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</optgroup></select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Établissement</span>
              <select value={eid} onChange={(ev) => setEid(ev.target.value)} className={field}>{parVille.map(([v, xs]) => <optgroup key={v} label={v}>{xs.map((x) => <option key={x.id} value={x.id}>{x.sigle}</option>)}</optgroup>)}</select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Formation</span>
              <select value={fid} onChange={(ev) => setFid(ev.target.value)} className={field}>{e.formations.filter((f) => formationById[f]).map((f) => <option key={f} value={f}>{formationById[f].intitule} ({formationById[f].duree_annees} ans)</option>)}</select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Logement</span>
              <select value={logement} onChange={(ev) => setLogement(ev.target.value as Logement)} className={field}>{(["studio", "colocation"] as const).map((l) => <option key={l} value={l}>{LOGEMENT_LABEL[l]}</option>)}</select></label>
          </Reveal>
        </div>

        <div className="container mt-7 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
          <div className="flex min-w-0 flex-col gap-6">
            {devLocale && devLocale !== "MAD" && (
              <div className="flex flex-col gap-3 rounded-3xl border border-brand-100 bg-brand-50/70 p-4 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-start gap-2.5"><Coins size={18} className="mt-0.5 shrink-0 text-brand-600" /><span>{dev
                  ? <>Montants en <b className="text-ink">{symbole(dev)} ({dev})</b>{origine ? <>, la monnaie {paysOrigineById[origine] ? `du pays de départ (${paysOrigineById[origine].nom})` : "du pays de départ"}</> : null} : c&apos;est dans cette monnaie que vous enverrez l&apos;argent. Le dirham (MAD), monnaie du Maroc, est indiqué en dessous pour vous familiariser avec les prix sur place. Taux du {new Date(taux.date).toLocaleDateString("fr-FR")} : <b className="whitespace-nowrap text-ink">1 000 MAD ≈ {formatMontant(convertir(1000, dev, taux)!, dev)}</b>, marge de prudence de {MARGE_PRUDENCE * 100} % incluse.</>
                  : <>Montants affichés en dirhams (MAD) uniquement.</>}</span></span>
                <button type="button" onClick={() => setDirhamsSeuls((x) => !x)} className="shrink-0 self-start rounded-xl border border-brand-200 bg-white px-3 py-2 text-[13px] font-bold text-brand-700 hover:bg-brand-50 sm:self-center">{dev ? "Afficher en dirhams seulement" : `Afficher aussi en ${symbole(devLocale)}`}</button>
              </div>
            )}
            <Reveal className="card flex flex-col gap-6 rounded-[26px] p-6 sm:p-7">
              <div className="flex flex-col justify-between gap-4 2xl:flex-row">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-[13px] font-bold uppercase text-ink-mute">Coût total estimé · {D.years} an{D.years > 1 ? "s" : ""} · {F.diplome}</span>
                  <div className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[40px]"><span className="whitespace-nowrap"><AnimatedNumber value={loc(D.total[0])} /> –</span> <span className="whitespace-nowrap"><AnimatedNumber value={loc(D.total[1])} /> <span className="text-xl">{unit}</span></span></div>
                  {dev && <span className="text-[15px] font-bold text-ink-soft">soit {nb(D.total[0])} – {nb(D.total[1])} MAD au Maroc</span>}
                  <span className="text-sm text-ink-mute">environ <b className="text-ink-soft">{dev ? `${nb(loc(mois[0]))} – ${nb(loc(mois[1]))} ${unit}` : `${nb(mois[0])} – ${nb(mois[1])} MAD`}</b> par mois{dev ? <span className="whitespace-nowrap"> ({nb(mois[0])} – {nb(mois[1])} MAD)</span> : ""}{origine ? "" : " · choisissez le pays de départ pour inclure les billets d'avion et lire les montants dans votre monnaie"}</span>
                </div>
                <div className="flex shrink-0 flex-wrap items-start gap-2 2xl:flex-col 2xl:items-end">
                  <span className="chip bg-sun-100 text-[#a55a00]"><Info size={14} className="mr-1 inline" />Estimation · frais à confirmer par l&apos;école</span>
                  <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><BadgeCheck size={14} className="mr-1 inline" />Devient « frais confirmés » dès réponse de l&apos;école</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <div className="relative h-[220px] w-[220px] shrink-0">
                  <Donut key={`${eid}${fid}${origine}${logement}`} values={cats.map(([, v]) => v[1])} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-ink-mute">par an</span><b className="text-lg"><AnimatedNumber value={loc(D.total[1] / D.years)} /></b><span className="text-[11px] text-ink-mute">{unit} max.</span></div>
                </div>
                <div className="flex w-full flex-col gap-3">
                  <span className="text-xs font-bold text-ink-mute">RÉPARTITION ({unit})</span>
                  {cats.map(([k, v], i) => <div key={k} className="flex justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ background: DONUT_COLORS[i] }} />{k}</span><Plage v={v} className="whitespace-nowrap text-right text-[13px] font-bold sm:text-sm" /></div>)}
                </div>
              </div>
            </Reveal>

            <Reveal className="card flex flex-col gap-3 rounded-3xl p-6">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center"><h3 className="text-lg font-extrabold">Échéancier année par année</h3><span className="text-xs text-ink-mute">inflation {Math.round(HYP.inflation_annuelle * 100)} %/an incluse · montants en {dev ? `${unit} (dirhams en dessous)` : unit}</span></div>
              <div className="-mx-2 overflow-x-auto">
                <table className={`w-full ${dev ? "min-w-[760px]" : "min-w-[640px]"} border-collapse whitespace-nowrap ${dev ? "text-[13px] [&_td]:px-1.5 [&_th]:px-1.5" : "text-sm"}`}>
                  <thead><tr className="text-left text-xs font-extrabold text-ink-mute"><th className="p-2">ANNÉE</th><th className="p-2 text-right">SCOLARITÉ + FRAIS</th><th className="p-2 text-right">VIE (10 MOIS)</th><th className="p-2 text-right">SÉJOUR & ASSURANCE</th><th className="p-2 text-right">TOTAL</th></tr></thead>
                  <tbody>
                    {D.rows.map((r) => (
                      <motion.tr key={`${r.annee}-${D.total[1]}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: r.annee * 0.06 }} className="border-t border-[#eef1f8]">
                        <td className="px-2 py-3 font-bold">Année {r.annee}</td>
                        {([[r.scolarite[0] + r.annexes[0], r.scolarite[1] + r.annexes[1]], r.vie, r.renouvellements] as const).map((x, j) => <td key={j} className="px-2 py-3 text-right"><Plage v={x} /></td>)}
                        <td className="px-2 py-3 text-right font-extrabold text-brand-600"><Plage v={r.total} /></td>
                      </motion.tr>
                    ))}
                    <tr className="border-t-2 border-slate-200"><td className="px-2 py-3 font-bold">Installation & voyages</td><td colSpan={3} className="whitespace-normal px-2 py-3 text-[13px] text-ink-mute">visa, billets aller-retour, caution logement, équipement</td><td className="px-2 py-3 text-right font-extrabold"><Plage v={D.installation} /></td></tr>
                    <tr className="border-t border-[#eef1f8]"><td className="px-2 py-3 font-bold">Imprévus & transferts</td><td colSpan={3} className="whitespace-normal px-2 py-3 text-[13px] text-ink-mute">marge {Math.round(HYP.marge_imprevus * 100)} % + frais de transfert {Math.round(HYP.frais_transfert * 100)} %</td><td className="px-2 py-3 text-right font-extrabold"><Plage v={D.cats["Imprévus & transferts"]} /></td></tr>
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
                <Link href={`/pays/${e.pays.toLowerCase()}/`} className="text-[13px] font-bold text-brand-600">Étudier au {P.nom} : la fiche pays →</Link>
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
              <Link href={`/espace/candidatures/nouvelle?etab=${eid}&formation=${fid}`} className="btn-ghost"><MessageCircle size={16} /> Candidater et demander les frais exacts</Link>
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#fff7dd] p-3 text-[13px]"><Lightbulb size={18} className="shrink-0 text-[#a55a00]" /><span><b>Astuce :</b> comparez ce devis avec d&apos;autres écoles qui mènent au même métier. <Link href={`/comparateur/?f=${fid}&e=${eid}`} className="font-bold text-brand-600"><Scale size={13} className="inline" /> Comparer</Link></span></div>
            </div>
            <div className="card flex flex-col gap-3.5 rounded-3xl p-5">
              <div className="flex items-center justify-between"><b className="text-[17px]">Démarches de régularisation</b><span className="chip bg-brand-50 text-brand-700">{P.nom}</span></div>
              <p className="rounded-xl bg-[#f6f8fe] p-3 text-[13px] text-ink-soft">{origine ? <><b>Visa depuis {paysOrigineById[origine]?.nom} :</b> {visaResume(origine)}.</> : <>Choisissez le pays de départ pour connaître le régime d&apos;entrée au Maroc.</>}</p>
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
          Estimation Navigoal basée sur les frais publiés par l&apos;établissement lorsqu&apos;ils sont disponibles, sur des grilles publiques et sur le coût de la vie observé ({SOURCES.slice(0, 4).map((u) => u.split("/")[2]).join(", ")}). Montants calculés en dirhams (MAD){dev ? ` et convertis en ${symbole(dev)} (${dev})` : ""} ; conversion au taux du {new Date(taux.date).toLocaleDateString("fr-FR")}, majorée de {MARGE_PRUDENCE * 100} % par prudence. Marge d&apos;imprévus {Math.round(HYP.marge_imprevus * 100)} % et frais de transfert {Math.round(HYP.frais_transfert * 100)} % inclus{logement === "colocation" ? " ; colocation : environ −15 % sur le coût de la vie" : ""}. Établissement : {STATUT_LONG[e.statut] ?? "privé"}, catégorie « {D.typ} ».
        </p>
        <div className="container mt-8 flex justify-center"><span className="flex items-center gap-2 text-sm text-ink-mute"><Calculator size={16} /> Chaque changement recalcule le devis en direct.</span></div>
      </div>
      <DevisPdf e={e} F={F} D={D} devise={dev} taux={taux} origine={origine} logement={logement} eleve={eleve} payeur={payeur} />
    </>
  );
}
