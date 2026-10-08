"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Brain, Briefcase, Check, GraduationCap, Heart, KeyRound, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { compatibilite, etabById, formationById } from "@/lib/data";
import { PROFILE_KEY } from "./OrientationTest";

const STEPS = ["Profil complété", "Test d'orientation", "Recommandations", "Candidatures", "Admission", "Logement"];
const CANDS = [
  { t: "Licence en Informatique", e: "ga-uob", s: "Soumise", c: "bg-brand-50 text-brand-700", n: 2 },
  { t: "Cycle ingénieur — CPGE", e: "ma-emi", s: "En cours de traitement", c: "bg-sun-100 text-[#a55a00]", n: 3 },
  { t: "Licence en Gestion", e: "ga-insg", s: "Acceptée", c: "bg-[#e8f8ef] text-[#0f8a46]", n: 5 },
];
const RECOS = [["frm-licence-informatique", "ga-uob"], ["frm-ingenieur-informatique", "ma-emi"], ["frm-master-data-science-ia", "ma-um6p"]];

export function Dashboard() {
  const [top, setTop] = useState<string[] | null>(null);
  useEffect(() => { try { setTop(JSON.parse(localStorage.getItem(PROFILE_KEY) || "null")?.top ?? null); } catch { /* ignore */ } }, []);
  const profil = top ?? ["I", "C"];
  const done = top ? 2 : 1;
  const [tab, setTab] = useState("Formations");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Bienvenue Amina <motion.span className="inline-block origin-[70%_70%]" animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ delay: 0.6, duration: 1.4 }}>👋</motion.span></h1><p className="text-ink-mute">Continue ton parcours vers ton avenir.</p></div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <svg width="56" height="56" className="-rotate-90"><circle cx="28" cy="28" r="23" stroke="#e8edfa" strokeWidth="7" fill="none" /><motion.circle cx="28" cy="28" r="23" stroke="#1a47f5" strokeWidth="7" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 0.8 }} transition={{ duration: 1.4, ease: "easeOut" }} /></svg>
          <div><b className="block">Profil complété à 80 %</b><span className="text-xs text-ink-mute">Ajoute ton relevé de notes</span></div>
        </div>
      </div>

      <div className="card flex flex-col gap-5 p-6">
        <b>Mon parcours</b>
        <div className="relative">
          <div className="absolute left-[8%] right-[8%] top-4 h-[3px] bg-[#e8edfa] sm:top-5" />
          <motion.div className="absolute left-[8%] top-4 h-[3px] bg-gradient sm:top-5-to-r from-[#0f8a46] to-brand-600" initial={{ width: 0 }} animate={{ width: `${(done / (STEPS.length - 1)) * 84}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
          <div className="relative grid grid-cols-6">
            {STEPS.map((t, k) => {
              const ok = k < done, cur = k === done;
              return (
                <motion.div key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.1 }} className="flex flex-col items-center gap-2 text-center">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold sm:h-10 sm:w-10 ${ok ? "bg-[#0f8a46] text-white" : cur ? "bg-brand-600 text-white ring-[6px] ring-brand-100" : "border-2 border-[#dbe3f7] bg-white text-[#9aa3c0]"}`}>{ok ? <Check size={18} strokeWidth={3} /> : k + 1}</span>
                  <span className={`hidden text-xs font-bold sm:block ${ok || cur ? "" : "text-[#9aa3c0]"}`}>{t}</span>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-sm font-bold sm:hidden">Étape {done + 1}/{STEPS.length} : {STEPS[done]}</p>
        </div>
      </div>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[[Brain, top ? "Repasser le test" : "Passer le test d'orientation", "from-brand-600 to-brand-400", "/orientation"], [Briefcase, "Découvrir les métiers", "from-[#0f8a46] to-[#34d399]", "/metiers"], [GraduationCap, "Rechercher une formation", "from-sun-500 to-sun-300", "/formations"], [KeyRound, "Trouver un logement", "from-[#6a3df0] to-[#a78bfa]", "/navilease"]].map(([Icon, t, g, href]) => {
          const I = Icon as typeof Brain;
          return (
            <StaggerItem key={t as string}>
              <Link href={href as string} className={`group relative flex h-32 flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br p-4 text-white transition hover:-translate-y-1 hover:shadow-lift ${g}`}>
                <I size={110} strokeWidth={1.5} className="absolute -bottom-6 -right-4 opacity-25 transition duration-500 group-hover:scale-110 group-hover:rotate-6" />
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><I size={20} /></span>
                <span className="flex items-center justify-between font-extrabold">{t as string}<ArrowUpRight size={18} /></span>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">Recommandations pour toi</h3><Link href="/orientation" className="text-[13px] font-bold text-brand-600">Voir tout</Link></div>
          <div className="flex gap-2">{["Formations", "Métiers", "Établissements", "Logements"].map((t) => <button key={t} onClick={() => setTab(t)} className={`chip px-3 py-1.5 ${tab === t ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-ink-soft"}`}>{t}</button>)}</div>
          <div className="grid gap-4 md:grid-cols-3">
            {RECOS.map(([f, e]) => (
              <Link key={f} href={`/formations/${f}/?etab=${e}`} className="card flex flex-col gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-center gap-2.5"><EtabLogo e={etabById[e]} size={44} /><span className="min-w-0"><b className="line-clamp-2 text-sm">{formationById[f].intitule}</b><span className="text-xs text-ink-mute">{etabById[e].sigle} · {etabById[e].ville.split("(")[0]}</span></span></div>
                <div className="flex items-center justify-between"><span className="chip bg-[#e8f8ef] text-[#0f8a46]">{compatibilite(profil, f)} % compatible</span><Heart size={16} className="text-ink-mute" /></div>
              </Link>
            ))}
          </div>
          <div id="candidatures" className="card flex scroll-mt-24 flex-col gap-3 p-5">
            <div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">Mes candidatures</h3><span className="text-[13px] font-bold text-brand-600">Suivre</span></div>
            {CANDS.map((c, k) => (
              <div key={c.t} className="flex items-center gap-4 rounded-2xl border border-[#eef1f8] p-3.5">
                <EtabLogo e={etabById[c.e]} size={46} />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{c.t}</b><span className={`chip ${c.c}`}>{c.s}</span></div>
                  <div className="flex gap-1">{Array.from({ length: 5 }).map((_, j) => <motion.span key={j} className="h-1.5 flex-1 rounded-full" initial={{ background: "#e8edfa" }} animate={{ background: j < c.n ? "#1a47f5" : "#e8edfa" }} transition={{ delay: 0.4 + k * 0.15 + j * 0.08 }} />)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3 p-5"><h3 className="text-lg font-extrabold">Échéances</h3>
            {[["15", "NOV", "Clôture UOB", "Licence Informatique", "bg-[#ffecef]"], ["22", "NOV", "Concours CNC", "Inscriptions Maroc", "bg-sun-100"], ["03", "DÉC", "Résultats BBS", "Admission", "bg-brand-50"]].map(([d, m, t, s, bg]) => (
              <div key={t} className="flex items-center gap-3"><span className={`flex w-12 flex-col items-center rounded-xl py-1.5 ${bg}`}><b className="text-lg">{d}</b><span className="text-[10px] font-bold">{m}</span></span><span><b className="block text-[13px]">{t}</b><span className="text-xs text-ink-mute">{s}</span></span></div>
            ))}
          </div>
          <div className="card flex flex-col gap-3 bg-gradient-to-br from-white to-[#fff7dd] p-5"><div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Mon logement</b></div>
            <p className="text-[13px] text-ink-mute">Admise en Licence de Gestion à l&apos;INSG ? 14 logements vérifiés à moins de 15 min.</p><Link href="/navilease" className="btn-primary py-2.5">Voir sur Navilease</Link></div>
          <div id="messages" className="card flex scroll-mt-24 flex-col gap-3 p-5"><b>Mon conseiller</b>
            <div className="flex items-center gap-2.5"><span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#e8f8ef] font-extrabold text-[#0f8a46]">JN</span><span><b className="block text-sm">Jean Ndong</b><span className="text-xs text-ink-mute">Conseiller · répond en ~2 h</span></span></div>
            <button className="btn-ghost py-2.5"><MessageCircle size={16} /> Écrire</button></div>
        </div>
      </div>
    </div>
  );
}
