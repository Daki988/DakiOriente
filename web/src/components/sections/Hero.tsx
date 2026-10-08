"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { House, Search, Sparkles } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { WordsReveal } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import { stats } from "@/lib/data";

const POPULAIRES = ["Médecine", "Data analyst", "UCAD", "Ingénieur", "BTS"];

export function Hero() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const blobX = useTransform(sx, (v) => v * -18);
  const blobY = useTransform(sy, (v) => v * -18);
  const imgX = useTransform(sx, (v) => v * 10);
  const imgY = useTransform(sy, (v) => v * 6);
  const badgeX = useTransform(sx, (v) => v * 24);
  const badgeY = useTransform(sy, (v) => v * 24);
  const onMove = (e: MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const go = (term: string) => router.push(`/formations/?q=${encodeURIComponent(term)}`);

  return (
    <section
      onMouseMove={onMove}
      className="relative overflow-hidden bg-[radial-gradient(1200px_600px_at_85%_20%,#dae6ff_0%,transparent_60%),radial-gradient(800px_500px_at_0%_100%,#fff3c4_0%,transparent_60%)]"
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
      <div className="container relative grid grid-cols-1 items-center gap-10 pb-8 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
        <div className="flex min-w-0 flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2.5">
            <span className="chip bg-brand-50 text-brand-700"><Sparkles size={14} /> Nouveau : test d&apos;orientation IA</span>
            <span className="chip bg-sun-100 text-[#a55a00]">🇬🇦 🇲🇦 🇸🇳 3 pays</span>
          </motion.div>
          <h1 className="h-display lg:text-[68px]">
            <WordsReveal text="Ton avenir commence" />{" "}
            <motion.span
              className="relative inline-block bg-gradient-to-r from-sun-400 to-sun-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 12 }}
            >
              ici.
              <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 120 14" fill="none" aria-hidden>
                <motion.path d="M3 10 C 30 2, 80 2, 117 8" stroke="#ffc21f" strokeWidth="5" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }} />
              </svg>
            </motion.span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-xl text-lg leading-relaxed text-ink-soft">
            La plateforme panafricaine d&apos;<b>orientation</b>, de <b>formation</b>, de <b>candidature</b> et de <b>logement étudiant</b>. Découvre qui tu es, ce que tu peux devenir et où te former.
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            onSubmit={(e) => { e.preventDefault(); go(q); }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 pl-5 shadow-[0_20px_50px_-18px_rgba(11,21,51,.35)] focus-within:ring-4 focus-within:ring-brand-100"
          >
            <Search size={20} className="shrink-0 text-ink-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un métier, une formation, un établissement…" className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-ink-mute" aria-label="Rechercher" />
            <button className="btn-primary btn-shine px-4 sm:px-5" aria-label="Rechercher"><Search size={18} className="sm:hidden" /><span className="hidden sm:inline">Rechercher</span></button>
          </motion.form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-ink-mute">Populaire :</span>
            {POPULAIRES.map((p) => (
              <button key={p} onClick={() => go(p)} className="chip border border-slate-200 bg-white text-ink-soft transition hover:border-brand-300 hover:text-brand-600">{p}</button>
            ))}
          </motion.div>
          <div className="mt-2 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[[stats.etablissements, "+", "établissements référencés"], [stats.metiers, "", "fiches métiers"], [stats.formations, "", "formations types"], [stats.pays, "", "pays au lancement"]].map(([n, s, l]) => (
              <div key={l as string}><div className="text-3xl font-extrabold tracking-tight"><Counter to={n as number} suffix={s as string} /></div><div className="text-[13px] text-ink-mute">{l}</div></div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-[420px] w-full max-w-[600px] sm:h-[560px]">
          <motion.div style={{ x: blobX, y: blobY }} className="absolute left-[10%] top-[8%] h-[78%] w-[82%] animate-blob bg-gradient-to-br from-brand-600 via-brand-400 to-brand-300" />
          <motion.div style={{ x: blobX, y: blobY }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="absolute right-[6%] top-0 h-[36%] w-[36%] rounded-full bg-sun-400/90" />
          <div className="absolute left-[2%] top-[52%] h-24 w-24 animate-spin-slow rounded-full border-[3px] border-dashed border-sun-400" />
          <motion.div style={{ x: imgX, y: imgY }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-x-[4%] bottom-0">
            <Image src="/images/etudiante.webp" alt="Étudiante souriante tenant ses cahiers" width={1326} height={1186} priority className="h-auto w-full" />
          </motion.div>
          <motion.div style={{ x: badgeX, y: badgeY }} className="absolute -left-2 top-[20%] sm:-left-6">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} className="card flex animate-float items-center gap-3 px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f8ef] text-[#0f8a46]"><Sparkles size={22} /></div>
              <div><div className="text-xs text-ink-mute">Profil dominant</div><div className="text-[15px] font-extrabold">Analyste · Organisateur</div></div>
            </motion.div>
          </motion.div>
          <motion.div style={{ x: badgeX, y: badgeY }} className="absolute -right-2 top-[44%] hidden sm:block">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }} className="card flex w-56 animate-float-late flex-col gap-2 px-4 py-3.5">
              <div className="flex items-center justify-between text-xs font-bold">Licence Informatique <span className="chip bg-[#e8f8ef] text-[#0f8a46]">87 %</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e8edfa]"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" initial={{ width: 0 }} animate={{ width: "87%" }} transition={{ delay: 1.4, duration: 1.2 }} /></div>
              <div className="text-[11px] text-ink-mute">Compatibilité avec ton profil</div>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="absolute bottom-10 left-0 sm:left-4">
            <Link href="/navilease" className="card flex animate-float items-center gap-2.5 px-4 py-3 transition hover:shadow-lift">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sun-100 text-[#a55a00]"><House size={20} /></div>
              <div><div className="text-[13px] font-extrabold">Studio à 900 m de l&apos;UCAD</div><div className="text-[11px] text-ink-mute">Navilease · vérifié ✓</div></div>
            </Link>
          </motion.div>
          <p className="absolute right-0 top-4 hidden w-48 -rotate-6 font-hand text-2xl leading-tight text-brand-700 lg:block">« S&apos;orienter aujourd&apos;hui pour construire l&apos;Afrique de demain. »</p>
        </div>
      </div>
    </section>
  );
}
