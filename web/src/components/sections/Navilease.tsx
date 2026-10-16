"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Footprints, GraduationCap, HousePlus, KeyRound, MapPin, Search, ShieldCheck, Signature, UsersRound } from "lucide-react";
import { useState } from "react";
import { Counter } from "@/components/motion/Counter";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { useApi } from "@/hooks/useApi";
import { Prix } from "@/components/ui/Devise";
import { Cover, VERIF, nearText, type Housing } from "@/components/navilease/shared";
import { VILLES_ETUDES, etabById, etablissements, residences } from "@/lib/data";

const PINS = [{ x: 22, y: 28 }, { x: 52, y: 14 }, { x: 40, y: 64 }, { x: 70, y: 46 }, { x: 14, y: 76 }];

const TYPES_API: [string, string][] = [["", "Tous"], ["studio", "Studios"], ["colocation", "Colocations"], ["residence", "Résidences"], ["chambre", "Chambres"], ["appartement", "Appartements"], ["chez_habitant", "Chez l'habitant"]];

export function Navilease() {
  const [type, setType] = useState("");
  const [ville, setVille] = useState("");
  const [verif, setVerif] = useState(false);
  const qs = new URLSearchParams({ ...(ville ? { ville } : {}), ...(type ? { type } : {}), ...(verif ? { verifies: "1" } : {}) }).toString();
  const { data, error, loading } = useApi<Housing[]>(`/logements${qs ? `?${qs}` : ""}`);
  const cites = residences.filter((r) => !ville || r.ville.includes(ville));
  const list = data ?? [];

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(900px_500px_at_80%_30%,#fff1c2,transparent_60%),linear-gradient(180deg,#fffaf0,#f6f8fe)] pb-14 pt-12">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5"><span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-sun-400"><KeyRound size={24} /></span><span className="text-[28px] font-extrabold tracking-tight">Navi<span className="text-brand-600">lease</span></span><span className="chip bg-brand-50 text-brand-700">par Navigoal</span></motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-display lg:text-[60px]">Ton logement étudiant, <span className="text-brand-600">vérifié</span> et <span className="text-gradient">sécurisé.</span></motion.h1>
            <p className="text-lg leading-relaxed text-ink-soft">Studios, colocations, résidences et cités universitaires près de ton établissement au Maroc : Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir…</p>
            <form onSubmit={(e) => { e.preventDefault(); window.location.href = `/navilease/logements/?${new URLSearchParams({ ...(ville ? { ville } : {}), ...(type ? { type } : {}) })}`; }} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_-18px_rgba(11,21,51,.3)] sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2.5 px-3 py-1.5"><GraduationCap size={18} className="text-brand-600" /><div className="flex flex-col"><span className="text-[11px] font-bold text-ink-mute">Ville</span>
                <select value={ville} onChange={(e) => setVille(e.target.value)} className="bg-transparent text-sm font-bold outline-none"><option value="">Toutes les villes</option>{VILLES_ETUDES.map((v) => <option key={v} value={v}>{v}</option>)}</select></div></div>
              <div className="flex flex-1 flex-col px-3 py-1.5 sm:border-l sm:border-[#eef1f8]"><span className="text-[11px] font-bold text-ink-mute">Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className="bg-transparent text-sm font-bold outline-none">{TYPES_API.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
              <button className="btn-primary btn-shine"><Search size={16} /> Chercher</button>
            </form>
            <div className="flex gap-8">{[[etablissements.length, "", "établissements"], [VILLES_ETUDES.length, "", "villes d'études"], [100, " %", "paiements en séquestre"]].map(([n, s, l]) => <div key={l as string}><b className="text-[22px]"><Counter to={n as number} suffix={s as string} /></b><span className="block text-[13px] text-ink-mute">{l}</span></div>)}</div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="absolute inset-[4%_0_0_6%] overflow-hidden rounded-[32px] border-[6px] border-white bg-gradient-to-br from-brand-100 to-brand-50 shadow-[0_40px_80px_-30px_rgba(11,21,51,.35)]">
              <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
                <path d="M0 120 C120 100 200 180 320 150 S480 60 520 90" stroke="#fff" strokeWidth="14" fill="none" />
                <path d="M60 0 C90 160 40 300 150 520" stroke="#fff" strokeWidth="10" fill="none" />
                <path d="M0 330 C150 300 300 380 520 320" stroke="#fff" strokeWidth="12" fill="none" />
                <path d="M380 0 C360 200 420 300 400 520" stroke="#fff" strokeWidth="8" fill="none" />
              </svg>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 border-dashed border-brand-400 [animation-duration:3s]" />
                <span className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-400 bg-brand-600/5" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white shadow-glow"><GraduationCap size={24} /></span>
              </div>
              {PINS.map((p, k) => (
                <motion.span key={k} className={`chip absolute h-8 w-8 justify-center p-0 shadow-lg ${k === 0 ? "bg-brand-600 text-white" : "bg-white text-brand-600"}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 + k * 0.12, type: "spring", stiffness: 260, damping: 14 }} whileHover={{ scale: 1.15 }}>
                  <MapPin size={14} />
                </motion.span>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }} className="card absolute bottom-4 left-0 flex animate-float items-center gap-3 px-4 py-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f8ef] text-[#0f8a46]"><ShieldCheck size={22} /></span><span><b className="block text-sm">Paiement protégé</b><span className="text-xs text-ink-mute">versé au bailleur après ton entrée</span></span>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="logements" className="container mt-12 flex scroll-mt-24 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            {TYPES_API.map(([k, t]) => <button key={k} onClick={() => setType(k)} className={`chip min-h-[38px] shrink-0 px-3.5 transition ${type === k ? "bg-brand-600 text-white shadow-glow" : "border border-slate-200 bg-white text-ink-soft hover:border-brand-300"}`}>{t}</button>)}
            <button onClick={() => setType("cites")} className={`chip min-h-[38px] shrink-0 px-3.5 transition ${type === "cites" ? "bg-brand-600 text-white shadow-glow" : "border border-slate-200 bg-white text-ink-soft hover:border-brand-300"}`}>Cités universitaires</button>
            <button onClick={() => setVerif(!verif)} aria-pressed={verif} className={`chip min-h-[38px] shrink-0 px-3.5 ${verif ? "bg-[#0f8a46] text-white" : "border border-slate-200 bg-white text-ink-soft"}`}><ShieldCheck size={14} /> Vérifiés uniquement</button>
          </div>
          <span className="text-sm text-ink-mute">{type === "cites" ? `${cites.length} cité${cites.length > 1 ? "s" : ""} universitaire${cites.length > 1 ? "s" : ""}` : loading ? "Chargement…" : error ? "" : `${list.length} logement${list.length > 1 ? "s" : ""}${list.length >= 24 ? " (premiers résultats)" : ""}`}</span>
        </div>
        {type !== "cites" && error && <p className="card p-6 text-center text-ink-mute">Les annonces n&apos;ont pas pu être chargées. <Link href="/navilease/logements" className="font-bold text-brand-600">Ouvrir la recherche</Link></p>}
        {type !== "cites" && !loading && !error && !list.length && <p className="card p-6 text-center text-ink-mute">Aucune annonce publiée pour ces critères pour le moment.</p>}
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {type === "cites"
              ? cites.map((r) => (
                  <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card flex flex-col gap-3 p-5">
                    <span className="chip w-fit bg-brand-50 text-brand-700">Cité universitaire · {r.gestionnaire}</span>
                    <b className="text-lg">{r.nom}</b><span className="flex items-center gap-1.5 text-sm text-ink-mute"><MapPin size={14} />{r.ville}</span>
                    <div className="flex flex-wrap gap-1.5">{r.etablissements_desservis.filter((id) => etabById[id]).map((id) => <Link key={id} href={`/etablissements/${id}/`} className="chip border border-slate-200 bg-white text-ink-soft hover:border-brand-300">{etabById[id].sigle}</Link>)}</div>
                  </motion.div>))
              : list.slice(0, 6).map((h) => {
                  const v = VERIF[h.verification] ?? VERIF.non_verifie;
                  return (
                    <motion.div key={h.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="card group relative overflow-hidden rounded-[22px] hover:shadow-lift">
                      <div className="relative h-44"><Cover h={h} className="transition duration-500 group-hover:scale-105" /><span className={`chip absolute left-3 top-3 ${v.cls}`}>{v.label}</span></div>
                      <div className="flex flex-col gap-2 p-4">
                        <Link href={`/navilease/logements/${h.id}`} className="font-extrabold after:absolute after:inset-0">{h.title}</Link>
                        <span className="flex items-center gap-1.5 text-[13px] text-ink-mute"><MapPin size={14} />{[h.quartier, h.ville].filter(Boolean).join(", ")}</span>
                        {h.nearEstablishments[0] && <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0f8a46]"><Footprints size={14} />{nearText(h.nearEstablishments[0])}</span>}
                        <div className="mt-1 border-t border-[#eef1f8] pt-3"><b className="text-lg text-brand-600">{h.currency === "MAD" ? <Prix mad={h.rent} /> : `${h.rent} ${h.currency}`}</b><span className="text-xs text-ink-mute"> /mois</span></div>
                      </div>
                    </motion.div>
                  );
                })}
          </AnimatePresence>
        </motion.div>
        {type !== "cites" && list.length > 6 && <Link href={`/navilease/logements/?${qs}`} className="btn-ghost self-center">Voir les {list.length >= 24 ? "" : `${list.length} `}logements</Link>}
      </section>

      <Reveal className="container mt-20">
        <div className="flex flex-col gap-8 rounded-[28px] border border-[#f3e6bd] bg-[#fffaf0] p-6 sm:p-11">
          <div><span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-[#a55a00]">Comment ça marche</span><h2 className="h-section mt-2">Réserver sans arnaque, en 5 étapes</h2></div>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[[Search, "Je cherche", "Par établissement, budget, type de logement."], [CalendarCheck, "Je réserve", "Demande + pièces ; validation parent si mineur."], [ShieldCheck, "Je paie en séquestre", "Mobile money ou carte, fonds protégés jusqu'à l'entrée."], [Signature, "Je signe", "Contrat numérique et état des lieux photo."], [KeyRound, "J'emménage", "Quittances mensuelles, médiation en cas de litige."]].map(([I, t, s], k) => {
              const Icon = I as typeof Search;
              return (
                <StaggerItem key={t as string} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5"><span className={`flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#f3e6bd] ${k === 2 ? "bg-sun-400" : "bg-white"}`}><Icon size={22} /></span><span className="text-[28px] font-extrabold text-[#f3e6bd]">0{k + 1}</span></div>
                  <b>{t as string}</b><span className="text-[13px] text-ink-mute">{s as string}</span>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </Reveal>

      <div id="bailleurs" className="container mt-16 grid scroll-mt-24 gap-6 md:grid-cols-2">
        <Reveal className="flex h-full flex-col gap-4 rounded-[26px] bg-gradient-to-br from-brand-950 to-brand-700 p-8 text-white">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white/10 text-sun-400"><HousePlus size={26} /></span>
          <h3 className="text-[26px] font-extrabold">Vous êtes bailleur ?</h3><p className="leading-relaxed text-[#c9d6ff]">Louez à des étudiants vérifiés, encaissez en sécurité et générez contrats et quittances automatiquement.</p>
          <Link href="/inscription?profil=bailleur" className="btn-sun btn-shine mt-auto self-start">Publier mon logement</Link>
        </Reveal>
        <Reveal delay={0.1} className="card flex h-full flex-col gap-4 rounded-[26px] p-8">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[#e8f8ef] text-[#0f8a46]"><UsersRound size={26} /></span>
          <h3 className="text-[26px] font-extrabold">Parents, gardez la main</h3><p className="leading-relaxed text-ink-soft">Validez la réservation de votre enfant, devenez garant et suivez les paiements depuis votre espace parent.</p>
          <Link href="/inscription?profil=parent" className="btn-ghost mt-auto self-start">Créer un compte parent</Link>
        </Reveal>
      </div>
    </>
  );
}
