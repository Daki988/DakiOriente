"use client";
import Link from "@/components/ui/Link";
import { motion } from "framer-motion";
import { ChevronRight, Download, Heart, RotateCcw, Share2, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Radar } from "@/components/sections/Radar";
import { domStyle } from "@/components/ui/Cards";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { CODES, normalize, profileOf, rankDomaines, rankMetiers } from "@/lib/riasec";
import { etabById, niveauLabel, riasec } from "@/lib/data";
import { apiUrl } from "@/lib/api";
import type { Reco } from "../Dashboard";

/** Illustration du profil dominant (photos du test, licence Pexels). */
const PHOTO: Record<string, string> = { R: "16850260", I: "3938022", A: "3880749", S: "33055499", E: "6172586", C: "8296974" };
const TRAIT_TONES = ["bg-[#f1edff] text-[#6a3df0]", "bg-brand-50 text-brand-700", "bg-[#e8f8ef] text-[#0f8a46]", "bg-sun-100 text-[#a55a00]", "bg-[#ffecef] text-[#d42a50]"];

/** Page « Mon profil d'orientation » (planche) : profil dominant, traits, domaines et métiers recommandés, rapport. */
export function OrientationProfile({ scores, top, date, guest = false, onRestart, reco }: { scores: Record<string, number>; top: string[]; date: string | null; guest?: boolean; onRestart?: () => void; reco?: Reco }) {
  const values = useMemo(() => normalize(scores), [scores]);
  const ranked = useMemo(() => rankMetiers(scores), [scores]);
  const doms = useMemo(() => rankDomaines(ranked.slice(0, 40)).slice(0, 5), [ranked]);
  const prof = profileOf(top);
  if (!prof) return null;
  const share = () => navigator.share?.({ title: "Mon profil d'orientation Navigoal", text: `Mon profil : ${prof.titre}`, url: location.origin + "/orientation" }).catch(() => {});

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-3xl">Mon profil d&apos;orientation</h1>
          <p className="text-sm text-ink-mute">{date ? `Passé le ${new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : "Résultat de ton test"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRestart ? <button onClick={onRestart} className="btn-ghost min-h-[44px]"><RotateCcw size={16} /> Refaire le test</button> : <Link href="/orientation" className="btn-ghost min-h-[44px]"><RotateCcw size={16} /> Refaire le test</Link>}
          {!guest ? <a href={apiUrl("/orientation/rapport.pdf")} className="btn-primary min-h-[44px]"><Download size={16} /> Télécharger mon rapport</a>
            : <button onClick={() => window.print()} className="btn-primary min-h-[44px]"><Download size={16} /> Imprimer mon rapport</button>}
          <button onClick={share} className="btn-ghost min-h-[44px] sm:hidden" aria-label="Partager"><Share2 size={16} /></button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr] [&>*]:min-w-0">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col gap-5 rounded-3xl p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/orientation/${PHOTO[top[0]]}.webp`} alt="" className="aspect-[4/3] w-full shrink-0 rounded-2xl object-cover sm:w-[200px]" />
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold uppercase text-ink-mute">Profil dominant · {prof.codes} ({prof.noms.join(", ")})</span>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[30px]">{prof.titre}</h2>
              <p className="text-sm leading-relaxed text-ink-soft">{prof.description}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <b>Tes traits principaux</b>
            <div className="flex flex-wrap gap-2">{prof.traits.map((t, k) => <span key={t} className={`chip py-1.5 text-[13px] ${TRAIT_TONES[k % TRAIT_TONES.length]}`}><Sparkles size={13} />{t}</span>)}</div>
          </div>
          <div className="grid min-w-0 items-center gap-4 border-t border-[#eef1f8] pt-4 sm:grid-cols-[220px_1fr] [&>*]:min-w-0">
            <div className="mx-auto w-[220px] max-w-full"><Radar values={values} size={220} /></div>
            <ul className="flex flex-col gap-2">
              {CODES.map((c) => { const r = riasec.find((x) => x.code === c)!; return (
                <li key={c} className="flex items-center gap-3 text-sm">
                  <span className={`w-28 shrink-0 font-bold ${top.slice(0, 2).includes(c) ? "text-brand-600" : "text-ink-soft"}`}>{r.nom}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8edfa]"><motion.span className="block h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" initial={{ width: 0 }} animate={{ width: `${values[c]}%` }} transition={{ duration: 0.9 }} /></span>
                  <span className="w-10 text-right text-xs font-bold text-ink-mute">{values[c]} %</span>
                </li>); })}
            </ul>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card flex flex-col gap-2 rounded-3xl p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-extrabold">Domaines recommandés</h2>
          {doms.map((d) => { const s = domStyle(d.id); const I = s.icon; return (
            <Link key={d.id} href={`/metiers?domaine=${d.id}`} className="flex min-h-[52px] items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-[#f6f8fe]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.fg }}><I size={19} /></span>
              <span className="min-w-0 flex-1"><b className="block truncate text-sm">{d.libelle}</b><span className="text-xs text-ink-mute">{d.score} % compatible · {d.metiers} métier{d.metiers > 1 ? "s" : ""}</span></span>
              <ChevronRight size={18} className="text-ink-mute" />
            </Link>); })}
        </motion.section>
      </div>

      <section className="card flex flex-col gap-4 rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Métiers recommandés</h2><Link href="/metiers" className="text-[13px] font-bold text-brand-600">Voir tout</Link></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ranked.slice(0, 6).map(({ m, s }) => { const st = domStyle(m.domaine); const I = st.icon; return (
            <Link key={m.id} href={`/metiers/${m.id}/`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200 hover:shadow-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: st.solid }}><I size={22} /></span>
              <span className="min-w-0 flex-1"><b className="block truncate text-sm">{m.nom}</b><span className="text-xs text-ink-mute">{niveauLabel(m.niveau_min)} · {m.formations.length} formation{m.formations.length > 1 ? "s" : ""}</span></span>
              <span className="chip shrink-0 bg-[#e8f8ef] text-[#0f8a46]">{s} %</span>
              <Heart size={16} className="hidden shrink-0 text-[#d42a50] sm:block" aria-hidden />
            </Link>); })}
        </div>
      </section>

      {reco && reco.offres.length > 0 && (
        <section className="card flex flex-col gap-4 rounded-3xl p-4 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Formations recommandées au Maroc</h2><Link href="/formations" className="text-[13px] font-bold text-brand-600">Rechercher</Link></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {reco.offres.slice(0, 6).map((o) => (
              <Link key={o.programId} href={`/formations/${o.formationId}/?etab=${o.etablissement.id}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200 hover:shadow-card">
                <EtabLogo e={etabById[o.etablissement.id] ?? o.etablissement} size={46} />
                <span className="min-w-0 flex-1"><b className="block truncate text-sm">{o.title}</b><span className="block truncate text-xs text-ink-mute">{o.etablissement.sigle} · {o.etablissement.ville}</span></span>
                <span className="chip shrink-0 bg-[#e8f8ef] text-[#0f8a46]">{o.score} %</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {guest && (
        <div className="flex flex-col items-start gap-3 rounded-3xl bg-gradient-to-br from-brand-950 to-brand-700 p-5 text-white sm:flex-row sm:items-center sm:p-6">
          <span className="flex-1"><b className="block text-lg">Garde ton profil et reçois tes recommandations</b><span className="text-sm text-brand-100">Crée ton compte gratuit : formations compatibles dans les établissements au Maroc, candidatures et suivi.</span></span>
          <Link href="/inscription?profil=etudiant&suite=/orientation" className="btn-sun min-h-[44px]">Créer mon compte</Link>
        </div>
      )}
    </div>
  );
}
