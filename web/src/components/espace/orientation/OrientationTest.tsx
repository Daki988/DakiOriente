"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Images, Sparkles, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { QUESTIONS } from "@/lib/test";
import { RESULT_KEY, computeResult } from "@/lib/riasec";
import { TestIcon } from "@/components/ui/TestIcon";
import { useSession } from "@/components/app/Session";
import { api } from "@/lib/api";
import { OrientationProfile } from "./OrientationProfile";

/** Test d'orientation à images (planche) : choix illustrés, progression, précédent / suivant. */
export function OrientationTest() {
  const user = useSession();
  const router = useRouter();
  const student = !!user && (user.role === "eleve" || user.role === "etudiant");
  const [step, setStep] = useState<"intro" | "test" | "result">("intro");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [saved, setSaved] = useState<{ date: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const N = QUESTIONS.length;

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(RESULT_KEY) || "null");
      if (s?.answers?.length === N) { setAnswers(s.answers); setSaved({ date: s.date }); }
    } catch { /* stockage indisponible */ }
  }, [N]);

  const start = () => { setAnswers(QUESTIONS.map(() => null)); setI(0); setDir(1); setStep("test"); window.scrollTo({ top: 0 }); };
  const choose = (k: number) => {
    const next = [...answers]; next[i] = k; setAnswers(next);
    if (i < N - 1) setTimeout(() => { setDir(1); setI((x) => Math.min(x + 1, N - 1)); }, 420);
  };
  const finish = async () => {
    const r = computeResult(answers);
    const date = new Date().toISOString();
    try { localStorage.setItem(RESULT_KEY, JSON.stringify({ answers, top: r.top, values: r.values, date })); } catch { /* ignore */ }
    if (student) {
      setSaving(true);
      try { await api("/orientation/resultats", { body: { answers, scores: r.values, top: r.top } }); router.push("/espace/orientation?nouveau=1"); return; }
      catch { /* hors ligne : résultat affiché localement */ } finally { setSaving(false); }
    }
    setSaved({ date }); setStep("result"); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (step === "result") {
    const r = computeResult(answers);
    return <OrientationProfile scores={r.values} top={r.top} date={saved?.date ?? null} guest={!student} onRestart={start} />;
  }

  if (step === "intro")
    return (
      <div className="flex flex-col gap-5">
        <div><h1 className="text-[26px] font-extrabold tracking-tight sm:text-3xl">Test d&apos;orientation</h1><p className="text-ink-mute">Découvre ton profil et les métiers qui te correspondent.</p></div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card relative grid overflow-hidden rounded-[28px] md:grid-cols-[1.1fr_.9fr]">
          <div className="relative flex flex-col gap-4 p-5 sm:p-10">
            <span className="text-[12px] font-extrabold uppercase tracking-[.16em] text-brand-600">Modèle RIASEC · lycée et études supérieures</span>
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">Quelle activité te ressemble le plus ?</h2>
            <p className="leading-relaxed text-ink-soft">{N} questions en images sur tes goûts et ta façon de travailler. Résultat : ton profil dominant, tes traits principaux, les domaines et les métiers recommandés, puis les formations des établissements au Maroc qui te correspondent.</p>
            <div className="flex flex-wrap gap-2 text-sm font-semibold"><span className="chip bg-brand-50 text-brand-700"><Timer size={14} /> 5 minutes</span><span className="chip bg-[#e8f8ef] text-[#0f8a46]"><Check size={14} /> Gratuit</span><span className="chip bg-sun-100 text-[#a55a00]"><Images size={14} /> Choix illustrés</span></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={start} className="btn-primary btn-shine min-h-[48px] px-7 text-base">{saved ? "Repasser le test" : "Commencer le test"} <ArrowRight size={18} /></button>
              {saved && (student ? <Link href="/espace/orientation" className="btn-ghost min-h-[48px]">Voir mon profil d&apos;orientation</Link> : <button onClick={() => setStep("result")} className="btn-ghost min-h-[48px]">Revoir mon dernier résultat</button>)}
            </div>
            {!user && <p className="text-xs text-ink-mute">Sans compte, ton résultat reste sur cet appareil. <Link href="/inscription?suite=/orientation" className="font-bold text-brand-600">Crée un compte</Link> pour le garder et recevoir tes recommandations.</p>}
          </div>
          <div className="grid grid-cols-2 content-center gap-2 p-3 md:p-4" aria-hidden>
            {QUESTIONS[0].choices.map((c) => c.img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c.t} src={c.img} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
            ))}
          </div>
        </motion.div>
        <p className="text-xs text-ink-mute">Photos : Pexels (licence libre). Ce test est une aide à la réflexion : parles-en avec tes parents, tes professeurs ou un conseiller Navigoal.</p>
      </div>
    );

  const q = QUESTIONS[i];
  const answered = answers.filter((a) => a !== null).length;
  const pct = Math.round((answered / N) * 100);
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div><h1 className="text-[24px] font-extrabold tracking-tight sm:text-3xl">Test d&apos;orientation</h1><p className="text-sm text-ink-mute sm:text-base">Découvre ton profil et les métiers qui te correspondent.</p></div>
      <div className="card flex flex-col gap-5 rounded-[24px] p-4 sm:gap-7 sm:p-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[13px] font-bold"><span>Question {i + 1} sur {N}</span><span className="text-ink-mute">{pct} %</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e8edfa]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progression du test"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#0f8a46] to-[#34d399]" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} /></div>
        </div>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={i} custom={dir} initial={{ opacity: 0, x: dir * 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -50 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="flex flex-col gap-4 sm:gap-6">
            <div><h2 className="text-xl font-extrabold tracking-tight sm:text-[28px]">{q.q}</h2><p className="text-sm text-ink-mute">Choisis la réponse qui te correspond le plus.</p></div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" role="radiogroup" aria-label={q.q}>
              {q.choices.map((c, k) => {
                const sel = answers[i] === k;
                return (
                  <motion.button key={c.t} type="button" role="radio" aria-checked={sel} onClick={() => choose(k)} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    className={`relative flex flex-col overflow-hidden rounded-[18px] bg-white text-left transition-shadow ${sel ? "border-[2.5px] border-brand-600 shadow-glow" : "border-[1.5px] border-slate-200 hover:border-brand-300"}`}>
                    {c.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.img} alt="" loading={i < 2 ? "eager" : "lazy"} className="aspect-[4/3] w-full object-cover" />
                    ) : <span className="flex aspect-[4/3] w-full items-center justify-center bg-brand-50 text-brand-600"><TestIcon name={c.icon} size={48} /></span>}
                    <AnimatePresence>{sel && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow"><Check size={16} strokeWidth={3} /></motion.span>}</AnimatePresence>
                    <span className="flex min-h-[56px] items-center p-2.5 text-[13px] font-bold leading-snug sm:p-3 sm:text-[15px]">{c.t}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Préchargement de la question suivante */}
        <div className="hidden" aria-hidden>{QUESTIONS[i + 1]?.choices.map((c) => c.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={c.t} src={c.img} alt="" loading="eager" />
        ))}</div>
        <div className="flex items-center justify-between gap-3">
          <button disabled={i === 0} onClick={() => { setDir(-1); setI(i - 1); }} className="btn-ghost min-h-[44px] disabled:opacity-40"><ArrowLeft size={16} /> Précédent</button>
          <div className="hidden gap-1.5 md:flex">{QUESTIONS.map((_, k) => <button key={k} onClick={() => { if (k <= answered) { setDir(k > i ? 1 : -1); setI(k); } }} aria-label={`Question ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-brand-600" : answers[k] !== null ? "w-2 bg-brand-400" : "w-2 bg-[#e8edfa]"}`} />)}</div>
          {i < N - 1
            ? <button disabled={answers[i] === null} onClick={() => { setDir(1); setI(i + 1); }} className="btn-primary min-h-[44px] disabled:opacity-40">Suivant <ArrowRight size={16} /></button>
            : <button disabled={answers.some((a) => a === null) || saving} onClick={finish} className="btn-sun btn-shine min-h-[44px] disabled:opacity-40">{saving ? "Enregistrement…" : "Voir mon profil"} <Sparkles size={16} /></button>}
        </div>
      </div>
    </div>
  );
}
