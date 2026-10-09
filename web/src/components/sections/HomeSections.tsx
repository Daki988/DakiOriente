"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, Brain, Briefcase, Building, Building2, Check, Compass, FileCheck2, GraduationCap, House, KeyRound, MapPin, ShieldCheck, Target, UserRound } from "lucide-react";
import { useRef } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { MetierCard } from "@/components/ui/Cards";
import { Marquee } from "@/components/motion/Marquee";
import { Stagger, StaggerItem, Reveal } from "@/components/motion/Reveal";
import { etabById, metierById } from "@/lib/data";

export function QuickLinks() {
  const q = [
    { href: "/orientation", Icon: Compass, bg: "#e8f8ef", fg: "#0f8a46", t: "Orientation", s: "Test & profil RIASEC" },
    { href: "/metiers", Icon: Briefcase, bg: "#eef4ff", fg: "#1a47f5", t: "Métiers", s: "96 fiches détaillées" },
    { href: "/formations", Icon: GraduationCap, bg: "#fff3c4", fg: "#a55a00", t: "Formations", s: "Licence, BTS, ingénieur…" },
    { href: "/etablissements", Icon: Building2, bg: "#f1edff", fg: "#6a3df0", t: "Établissements", s: "Compare et choisis" },
    { href: "/navilease", Icon: House, bg: "#ffecef", fg: "#d42a50", t: "Navilease", s: "Logement étudiant" },
  ];
  return (
    <Stagger className="container grid grid-cols-2 gap-4 pb-10 md:grid-cols-3 lg:grid-cols-5">
      {q.map(({ href, Icon, bg, fg, t, s }) => (
        <StaggerItem key={t}>
          <Link href={href} className="card group flex items-center gap-3 rounded-[18px] p-3 transition sm:p-4 hover:-translate-y-1 hover:shadow-lift">
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] transition group-hover:scale-110" style={{ background: bg, color: fg }}><Icon size={22} /></span>
            <span className="min-w-0"><span className="block truncate text-sm font-extrabold sm:text-[15px]">{t}</span><span className="hidden truncate text-xs text-ink-mute sm:block">{s}</span></span>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

const MARQUEE = ["ma-um6p", "sn-esmt", "ga-ista", "ma-uir", "sn-ism", "ma-hem", "sn-cesag", "ma-emsi", "ga-ufgse", "sn-supdeco", "ma-uic", "sn-daust", "ma-esa-casa", "sn-iam", "ma-iihem", "ga-esgis", "sn-ucao", "ma-tbs-casa"];
export function LogosMarquee() {
  return (
    <section className="border-y border-[#eef1f8] bg-white py-7">
      <div className="container mb-4 flex items-center gap-4"><span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-ink-mute">Ils sont sur Navigoal</span><span className="h-px flex-1 bg-[#eef1f8]" /></div>
      <Marquee>
        {MARQUEE.map((id) => {
          const e = etabById[id];
          return (
            <Link key={id} href={`/etablissements/${id}/`} className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-2.5 pr-4 transition hover:border-brand-300 hover:shadow-card">
              <EtabLogo e={e} size={44} />
              <span><span className="block text-sm font-extrabold">{e.sigle}</span><span className="block text-[11px] text-ink-mute">{e.ville.split("(")[0].split("/")[0]}</span></span>
            </Link>
          );
        })}
      </Marquee>
    </section>
  );
}

const STEPS = [
  { Icon: UserRound, t: "Je crée mon profil", s: "Niveau, série, pays, centres d'intérêt." },
  { Icon: Brain, t: "Je passe le test", s: "20 questions, profil RIASEC visuel." },
  { Icon: Target, t: "Je découvre mes voies", s: "Métiers, formations et écoles compatibles." },
  { Icon: FileCheck2, t: "Je candidate", s: "Dossier, paiement mobile, suivi en direct." },
  { Icon: KeyRound, t: "Je m'installe", s: "Logement vérifié avec Navilease." },
];
export function Parcours() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} className="relative mt-12">
      <div className="absolute left-[10%] right-[10%] top-9 hidden h-1 rounded bg-[#e8edfa] md:block" />
      <motion.div style={{ scaleX }} className="absolute left-[10%] right-[10%] top-9 hidden h-1 origin-left rounded bg-gradient-to-r from-brand-600 to-sun-400 md:block" />
      <Stagger className="relative grid gap-6 md:grid-cols-5 md:gap-8">
        {STEPS.map(({ Icon, t, s }, k) => (
          <StaggerItem key={t} className="grid grid-cols-[56px_1fr] items-center gap-x-4 text-left md:flex md:flex-col md:items-center md:gap-3 md:text-center">
            <motion.div whileHover={{ scale: 1.1, rotate: -6 }} className="row-span-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow md:h-[72px] md:w-[72px]"><Icon size={26} /></motion.div>
            <div className="text-xs font-extrabold text-sun-500">ÉTAPE {k + 1}</div>
            <div className="font-extrabold">{t}</div>
            <div className="text-[13px] text-ink-mute md:max-w-[190px]">{s}</div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

const METIERS_HOME = ["met-data-analyst", "met-medecin-generaliste", "met-ingenieur-genie-civil", "met-developpeur-web-mobile", "met-ingenieur-mines", "met-avocat", "met-ingenieur-agronome", "met-expert-cybersecurite", "met-sage-femme"];
export function MetiersCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 330, behavior: "smooth" });
  return (
    <>
      <div className="container -mt-14 mb-6 flex justify-end gap-2.5">
        <button onClick={() => scroll(-1)} aria-label="Précédent" className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-brand-300"><ArrowLeft size={20} /></button>
        <button onClick={() => scroll(1)} aria-label="Suivant" className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-brand-600 text-white shadow-glow transition hover:bg-brand-700"><ArrowRight size={20} /></button>
      </div>
      <div ref={ref} className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-6 pt-2 lg:px-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))]">
        {METIERS_HOME.map((id, i) => (
          <motion.div key={id} className="w-[300px] shrink-0 snap-start" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <MetierCard m={metierById[id]} />
          </motion.div>
        ))}
      </div>
    </>
  );
}

export function NavileaseTeaser() {
  const card = { hidden: { opacity: 0, y: 40, rotate: -3 }, show: (i: number) => ({ opacity: 1, y: 0, rotate: 0, transition: { delay: 0.15 * i, type: "spring", stiffness: 110, damping: 16 } }) };
  return (
    <Reveal className="container mt-24">
      <div className="relative overflow-hidden rounded-[32px] border border-[#ffe9a8] bg-gradient-to-br from-[#fff7dd] to-white p-6 sm:p-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sun-400"><KeyRound size={22} /></span><span className="text-2xl font-extrabold">Navi<span className="text-brand-600">lease</span></span><span className="chip bg-sun-100 text-[#a55a00]">Nouveau</span></div>
            <h2 className="h-section">Admis ? Trouve ton logement <span className="text-brand-600">en toute sécurité.</span></h2>
            <p className="leading-relaxed text-ink-soft">Studios, colocations, résidences et cités universitaires près de ton établissement. Bailleurs vérifiés, paiement en séquestre, contrat numérique et quittances.</p>
            <div className="flex flex-wrap gap-4 text-sm font-bold">{["Bailleurs vérifiés", "Paiement protégé", "Garant parent"].map((t) => <span key={t} className="flex items-center gap-1.5"><BadgeCheck size={18} className="text-[#0f8a46]" />{t}</span>)}</div>
            <div className="flex flex-wrap gap-3"><Link href="/navilease" className="btn-primary btn-shine">Chercher un logement <ArrowRight size={18} /></Link><Link href="/navilease#bailleurs" className="btn-ghost">Je suis bailleur</Link></div>
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="relative h-[400px]">
            <motion.div custom={0} variants={card} className="card absolute left-0 top-5 w-[min(340px,90%)] overflow-hidden rounded-3xl">
              <div className="relative flex h-[170px] items-center justify-center bg-gradient-to-br from-brand-300 to-brand-600"><Building size={80} className="text-white/55" strokeWidth={1.5} /><span className="chip absolute left-3.5 top-3.5 bg-[#e8f8ef] text-[#0f8a46]">✓ Visité par Navilease</span></div>
              <div className="flex flex-col gap-2 p-4">
                <div className="flex justify-between font-extrabold"><span>Studio meublé · Agdal</span><span className="text-brand-600">2 800 MAD</span></div>
                <div className="flex items-center gap-1.5 text-xs text-ink-mute"><MapPin size={14} /> 8 min à pied de l&apos;UIR</div>
                <div className="flex gap-1.5">{["Wifi", "Meublé", "Gardien 24h"].map((t) => <span key={t} className="chip bg-brand-50 text-brand-700">{t}</span>)}</div>
              </div>
            </motion.div>
            <motion.div custom={1} variants={card} className="card absolute right-0 top-0 hidden w-[250px] flex-col gap-2.5 p-4 sm:flex">
              <div className="text-xs font-extrabold text-ink-mute">RÉSERVATION NL-2026-00342</div>
              {[["Demande acceptée", 1], ["Paiement en séquestre", 1], ["Contrat signé", 1], ["Entrée dans les lieux", 0]].map(([t, d], i) => (
                <motion.div key={t as string} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.15 }} className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full ${d ? "bg-brand-600 text-white" : "bg-[#e8edfa] text-[#b0b8d4]"}`}><Check size={13} strokeWidth={3} /></span>{t}
                </motion.div>
              ))}
            </motion.div>
            <motion.div custom={2} variants={card} className="card absolute bottom-5 right-4 flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f8ef] text-[#0f8a46]"><ShieldCheck size={22} /></span>
              <span><span className="block text-sm font-extrabold">Paiement protégé</span><span className="block text-xs text-ink-mute">Airtel Money · Wave · Orange Money</span></span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
}
