"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Download, Lightbulb, RotateCcw, Share2, Sparkles, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "@/lib/test";
import { TestIcon } from "@/components/ui/TestIcon";
import { Radar } from "./Radar";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { domStyle } from "@/components/ui/Cards";
import { Counter } from "@/components/motion/Counter";
import { domaineById, etabById, formationById, metiers, niveauLabel, riasec, PAYS_NOM, type PaysCode } from "@/lib/data";

const PALETTE = [["#eef4ff", "#1a47f5"], ["#f1edff", "#6a3df0"], ["#ffecef", "#d42a50"], ["#e8f8ef", "#0f8a46"]];
const CODES = ["R", "I", "A", "S", "E", "C"];
export const PROFILE_KEY = "navigoal-profil";

function computeResult(answers: (number | null)[]) {
  const raw: Record<string, number> = Object.fromEntries(CODES.map((c) => [c, 0]));
  answers.forEach((a, i) => { if (a !== null) QUESTIONS[i].choices[a].codes.forEach((c, j) => (raw[c] += j === 0 ? 2 : 1)); });
  const max = Math.max(1, ...Object.values(raw));
  const values = Object.fromEntries(CODES.map((c) => [c, Math.round(25 + (75 * raw[c]) / max)]));
  const top = [...CODES].sort((a, b) => raw[b] - raw[a]).slice(0, 2);
  return { values, top };
}

export function OrientationTest() {
  const [step, setStep] = useState<"intro" | "test" | "result">("intro");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [pays, setPays] = useState<PaysCode | "ALL">("ALL");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
      if (saved?.answers?.length === QUESTIONS.length) { setAnswers(saved.answers); setStep("result"); }
    } catch { /* stockage indisponible : on repart de zéro */ }
  }, []);

  const result = useMemo(() => computeResult(answers), [answers]);

  const finish = () => {
    setStep("result");
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ answers, top: computeResult(answers).top, date: new Date().toISOString() })); } catch { /* ignore */ }
    // Connecté·e : le résultat est aussi enregistré dans le profil (recommandations personnalisées).
    const r = computeResult(answers);
    fetch("/api/orientation/resultats/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, scores: r.values, top: [...CODES].sort((a, b) => r.values[b] - r.values[a]).slice(0, 3) }) }).catch(() => {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const choose = (k: number) => {
    const next = [...answers]; next[i] = k; setAnswers(next);
    setTimeout(() => { if (i < QUESTIONS.length - 1) { setDir(1); setI(i + 1); } }, 380);
  };
  const restart = () => { setAnswers(QUESTIONS.map(() => null)); setI(0); setStep("test"); try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignore */ } };

  if (step === "intro")
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden rounded-[28px] p-8 sm:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 animate-blob bg-gradient-to-br from-brand-400 to-brand-200 opacity-40" />
        <div className="relative flex max-w-2xl flex-col gap-5">
          <span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-brand-600">Test d&apos;orientation · Lycée</span>
          <h1 className="h-section">Découvre ton profil et les métiers qui te correspondent</h1>
          <p className="leading-relaxed text-ink-soft">{QUESTIONS.length} questions rapides sur tes goûts et ta façon de travailler. Ton résultat : un profil visuel (modèle RIASEC), des domaines, des métiers et des formations recommandés au Gabon, au Maroc et au Sénégal.</p>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-ink-soft"><span className="chip bg-brand-50 text-brand-700"><Timer size={14} /> 5 minutes</span><span className="chip bg-[#e8f8ef] text-[#0f8a46]"><Check size={14} /> Gratuit</span><span className="chip bg-sun-100 text-[#a55a00]">Pas de mauvaise réponse</span></div>
          <button onClick={() => setStep("test")} className="btn-primary btn-shine self-start px-7 py-4 text-base">Commencer le test <ArrowRight size={18} /></button>
        </div>
      </motion.div>
    );

  if (step === "test") {
    const q = QUESTIONS[i];
    const progress = ((i + (answers[i] !== null ? 1 : 0)) / QUESTIONS.length) * 100;
    return (
      <div className="card flex flex-col gap-7 rounded-[28px] p-6 sm:p-9">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5"><span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-brand-600">Test d&apos;orientation · Lycée</span><span className="text-ink-mute">Choisis la réponse qui te correspond le plus.</span></div>
          <div className="flex w-full flex-col items-end gap-2 sm:w-56"><span className="text-[13px] font-bold">Question {i + 1} sur {QUESTIONS.length}</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8edfa]"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} /></div></div>
        </div>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={i} custom={dir} initial={{ opacity: 0, x: dir * 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -60 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} className="flex flex-col gap-6">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{q.q}</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {q.choices.map((c, k) => {
                const sel = answers[i] === k;
                const [bg, fg] = PALETTE[k];
                return (
                  <motion.button key={c.t} onClick={() => choose(k)} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }} animate={sel ? { scale: [1, 1.04, 1] } : {}}
                    className={`relative flex flex-col gap-4 rounded-[22px] bg-white p-4 text-left transition-shadow sm:p-5 ${sel ? "border-[2.5px] border-brand-600 shadow-glow" : "border-[1.5px] border-slate-200 hover:border-brand-300"}`} aria-pressed={sel}>
                    <AnimatePresence>{sel && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={16} strokeWidth={3} /></motion.span>}</AnimatePresence>
                    <span className="flex h-28 w-full items-center justify-center rounded-2xl sm:h-36" style={{ background: bg, color: fg }}><TestIcon name={c.icon} size={56} strokeWidth={1.6} /></span>
                    <span className="text-[15px] font-extrabold leading-snug">{c.t}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-between gap-4">
          <button disabled={i === 0} onClick={() => { setDir(-1); setI(i - 1); }} className="btn-ghost disabled:opacity-40"><ArrowLeft size={16} /> Précédent</button>
          <div className="hidden gap-1.5 sm:flex">{QUESTIONS.map((_, k) => <motion.span key={k} animate={{ width: k === i ? 22 : 8, background: answers[k] !== null || k === i ? "#1a47f5" : "#e8edfa" }} className="h-2 rounded-full" />)}</div>
          {i < QUESTIONS.length - 1
            ? <button disabled={answers[i] === null} onClick={() => { setDir(1); setI(i + 1); }} className="btn-primary disabled:opacity-40">Suivant <ArrowRight size={16} /></button>
            : <button disabled={answers.some((a) => a === null)} onClick={finish} className="btn-sun btn-shine disabled:opacity-40">Voir mon résultat <Sparkles size={16} /></button>}
        </div>
      </div>
    );
  }

  // ---------- Résultat ----------
  const { values, top } = result;
  const profil = top.map((c) => riasec.find((r) => r.code === c)!.profil.split(" / ")[0]).join(" / ");
  const desc = top.map((c) => riasec.find((r) => r.code === c)!.description.toLowerCase().replace(/\.$/, "")).join(" ; ");
  const w = (codes: string[]) =>
    codes.reduce((s, c, j) => s + values[c] * (j === 0 ? 1 : 0.7), 0) / (codes.length === 1 ? 1 : 1.7) +
    (codes[0] === top[0] ? 6 : 0) + (codes.includes(top[1]) ? 4 : 0) + (codes.length > 1 && codes.every((c) => top.includes(c)) ? 4 : 0);
  const ranked = [...metiers].map((m) => ({ m, s: w(m.riasec) })).sort((a, b) => b.s - a.s);
  const best = ranked[0].s, floor = ranked[30].s;
  const pct = (s: number) => Math.max(52, Math.min(97, Math.round(62 + (34 * (s - floor)) / Math.max(1, best - floor))));
  const domScores: Record<string, number[]> = {};
  ranked.slice(0, 24).forEach(({ m, s }) => (domScores[m.domaine] ||= []).push(pct(s)));
  const doms = Object.entries(domScores).map(([d, arr]) => [d, Math.round(arr.reduce((a, b) => a + b, 0) / arr.length - (4 - Math.min(arr.length, 4)) * 3)] as const).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const formRec: { f: string; e: string; s: number }[] = [];
  for (const { m, s } of ranked.slice(0, 12)) {
    for (const f of m.formations) {
      if (formRec.some((x) => x.f === f)) continue;
      const etab = formationById[f]?.etablissements.map((id) => etabById[id]).find((e) => pays === "ALL" || e.pays === pays);
      if (etab) formRec.push({ f, e: etab.id, s: pct(s) - formRec.length });
      if (formRec.length >= 4) break;
    }
    if (formRec.length >= 4) break;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-brand-600">Résultat · {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span><h1 className="text-3xl font-extrabold tracking-tight">Mon profil d&apos;orientation</h1></div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={restart} className="btn-ghost"><RotateCcw size={16} /> Refaire le test</button>
          <button onClick={() => window.print()} className="btn-ghost"><Download size={16} /> Télécharger mon rapport</button>
          <button onClick={() => navigator.share?.({ title: "Mon profil Navigoal", text: `Mon profil : ${profil}`, url: location.href }).catch(() => {})} className="btn-primary"><Share2 size={16} /> Partager avec mes parents</button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-white via-white to-brand-50 p-6 md:flex-row">
          <div className="w-[300px] max-w-full shrink-0"><Radar values={values} size={300} /></div>
          <div className="flex flex-col gap-4">
            <span className="text-[13px] font-bold text-ink-mute">PROFIL DOMINANT · {top.join(" + ")}</span>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="text-3xl font-extrabold leading-tight tracking-tight">{profil.split(" / ")[0]} <span className="text-sun-500">/</span> {profil.split(" / ")[1]}</motion.div>
            <p className="text-sm leading-relaxed text-ink-soft">Tu {desc.replace(/^aime/, "aimes").replace(/ ; aime/, " et tu aimes aussi")}.</p>
            <div className="grid grid-cols-3 gap-2">{CODES.map((c) => <div key={c} className="rounded-xl bg-white p-2 text-center shadow-sm"><div className="text-xs font-bold text-ink-mute">{c}</div><div className={`font-extrabold ${top.includes(c) ? "text-brand-600" : ""}`}><Counter to={values[c]} suffix="%" /></div></div>)}</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card flex flex-col gap-5 rounded-3xl p-6">
          <h3 className="text-xl font-extrabold">Domaines recommandés</h3>
          {doms.map(([d, v], k) => { const s = domStyle(d); const Icon = s.icon; return (
            <div key={d} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.fg }}><Icon size={20} /></span>
              <div className="flex flex-1 flex-col gap-1.5"><div className="flex justify-between text-sm font-bold"><span>{domaineById[d].libelle}</span><span className="text-brand-600">{v} %</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e8edfa]"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ delay: 0.4 + k * 0.12, duration: 1 }} /></div></div>
            </div>); })}
        </motion.div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card flex flex-col gap-3 rounded-3xl p-6">
          <div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">Métiers recommandés</h3><Link href="/metiers" className="text-[13px] font-bold text-brand-600">Voir tout</Link></div>
          {ranked.slice(0, 6).map(({ m, s }, k) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + k * 0.07 }}>
              <Link href={`/metiers/${m.id}/`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
                {(() => { const st = domStyle(m.domaine); const I = st.icon; return <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-white" style={{ background: st.solid }}><I size={20} /></span>; })()}
                <span className="flex-1"><b className="block text-sm">{m.nom}</b><span className="text-xs text-ink-mute">{m.formations.length} formation{m.formations.length > 1 ? "s" : ""} · {niveauLabel(m.niveau_min)} · {m.riasec.join("·")}</span></span>
                <span className="chip bg-[#e8f8ef] text-[#0f8a46]">{pct(s) - k} %</span>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="card flex flex-col gap-3 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-extrabold">Formations recommandées</h3>
            <div className="flex gap-1 rounded-xl bg-[#f6f8fe] p-1 text-xs font-bold">{(["ALL", "GA", "MA", "SN"] as const).map((p) => <button key={p} onClick={() => setPays(p)} className={`rounded-lg px-2.5 py-1.5 transition ${pays === p ? "bg-white text-brand-600 shadow" : "text-ink-mute"}`}>{p === "ALL" ? "Tous" : PAYS_NOM[p]}</button>)}</div></div>
          <AnimatePresence mode="popLayout">
            {formRec.map(({ f, e, s }) => (
              <motion.div key={f + e} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                <Link href={`/formations/${f}/?etab=${e}`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
                  <EtabLogo e={etabById[e]} size={46} />
                  <span className="min-w-0 flex-1"><b className="block truncate text-sm">{formationById[f].intitule}</b><span className="text-xs text-ink-mute">{etabById[e].sigle} · {etabById[e].ville.split("(")[0]}</span></span>
                  <span className="chip bg-[#e8f8ef] text-[#0f8a46]">{s} %</span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="mt-1 flex items-center gap-3 rounded-2xl bg-[#fff7dd] p-3.5 text-[13px]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sun-400"><Lightbulb size={18} /></span><span><b>Conseil :</b> regarde aussi « Ma série au lycée » ci-dessous pour voir quelles séries ouvrent ces formations dans ton pays.</span></div>
        </div>
      </div>
    </div>
  );
}
