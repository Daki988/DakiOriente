"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";
import { useState } from "react";
import { WordsReveal } from "@/components/motion/Reveal";
import { CHIFFRES } from "@/lib/catalogue";

/** Métiers populaires : domaines qui comptent le plus d'établissements au Maroc (liens vers la liste filtrée). */
const POPULAIRES: [string, string][] = [["Informatique", "dom-numerique"], ["Santé", "dom-sante"], ["Gestion", "dom-gestion"], ["Génie civil", "dom-btp"], ["Finance", "dom-finance"], ["Droit", "dom-droit"]];

export function Hero() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (term: string) => router.push(term.trim() ? `/recherche/?q=${encodeURIComponent(term.trim())}` : "/recherche/");

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(1100px_560px_at_90%_10%,#dae6ff_0%,transparent_60%),radial-gradient(700px_420px_at_0%_100%,#fff3c4_0%,transparent_60%)]">
      <div className="container relative grid grid-cols-1 items-center gap-6 pb-6 pt-8 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:pb-10 lg:pt-12">
        <div className="relative z-10 flex min-w-0 flex-col gap-5 lg:gap-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold uppercase tracking-[.16em] text-ink-soft sm:text-[13px]">
            <span>Orienter</span><span className="h-1.5 w-1.5 rounded-full bg-sun-400" /><span>Former</span><span className="h-1.5 w-1.5 rounded-full bg-sun-400" /><span>Construire demain</span>
          </motion.div>
          <h1 className="text-[44px] font-extrabold leading-[1] tracking-tight text-brand-950 sm:text-6xl lg:text-[76px]">
            <WordsReveal text="Ton avenir" /><br />
            <span className="relative inline-block">
              <WordsReveal text="commence ici." delay={0.15} />
              <svg className="absolute -bottom-3 left-0 w-[72%]" viewBox="0 0 220 16" fill="none" aria-hidden>
                <motion.path d="M4 11 C 60 3, 150 3, 216 9" stroke="#ffc21f" strokeWidth="6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7, duration: 0.8, ease: "easeInOut" }} />
              </svg>
            </span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            La plateforme d&apos;orientation, de formation et de candidature pour <b className="text-ink">étudier au Maroc</b>, depuis toute l&apos;Afrique.
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            onSubmit={(e) => { e.preventDefault(); go(q); }} role="search"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 pl-4 shadow-[0_20px_50px_-18px_rgba(11,21,51,.35)] focus-within:ring-4 focus-within:ring-brand-100 sm:pl-5"
          >
            <Search size={20} className="shrink-0 text-ink-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un métier, une formation ou un établissement…" className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-ink-mute" aria-label="Rechercher un métier, une formation ou un établissement" />
            <button className="btn-sun min-h-[44px] px-4 sm:px-5" aria-label="Rechercher"><Search size={18} /><span className="hidden sm:inline">Rechercher</span></button>
          </motion.form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-bold text-ink">Métiers populaires :</span>
            {POPULAIRES.map(([l, d]) => (
              <button key={l} type="button" onClick={() => router.push(`/metiers/?domaine=${d}`)} className="chip min-h-[36px] border border-brand-100 bg-white px-3 text-brand-700 transition hover:border-brand-300 hover:bg-brand-50">{l}</button>
            ))}
          </motion.div>
        </div>

        <div className="relative mx-auto h-[330px] w-full max-w-[560px] sm:h-[480px] lg:h-[540px]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="absolute left-[8%] top-[6%] h-[80%] w-[84%] rounded-[42%_58%_70%_30%/45%_45%_55%_55%] animate-blob bg-gradient-to-br from-brand-600 via-brand-500 to-brand-300" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="absolute left-[2%] top-[4%] h-[34%] w-[34%] rounded-[46%_54%_40%_60%] bg-sun-400" />
          <div className="absolute right-[4%] top-[58%] hidden h-24 w-24 animate-spin-slow rounded-full border-[3px] border-dashed border-sun-400 sm:block" />
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-x-[4%] bottom-0">
            <Image src="/images/etudiante.webp" alt="Étudiante souriante tenant ses cahiers" width={1326} height={1186} priority sizes="(max-width: 1024px) 90vw, 560px" className="h-auto w-full" />
          </motion.div>
          <p className="absolute -right-2 top-2 hidden w-52 -rotate-6 font-hand text-[26px] leading-tight text-brand-800 xl:block">S&apos;orienter aujourd&apos;hui pour construire l&apos;Afrique de demain.</p>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="card absolute bottom-6 left-0 flex animate-float items-center gap-3 px-3.5 py-2.5 sm:bottom-10 sm:px-4 sm:py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sun-100 text-[#a55a00]"><MapPin size={20} /></span>
            <span><b className="block text-sm">{CHIFFRES.villes} villes d&apos;études</b><span className="text-xs text-ink-mute">{CHIFFRES.campus} campus au Maroc</span></span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
