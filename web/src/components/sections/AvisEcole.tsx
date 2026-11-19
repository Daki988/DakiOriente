import Link from "@/components/ui/Link";
import { BadgeCheck, MessageSquareQuote, Star, ThumbsUp } from "lucide-react";
import { SignalerAvis } from "@/components/ui/SignalerAvis";
import type { publics } from "@/server/services/avis-ecoles";

type Donnees = Awaited<ReturnType<typeof publics>>;
const CRITERES: [string, string][] = [["enseignement", "Enseignement"], ["encadrement", "Encadrement"], ["accueil", "Accueil des étrangers"], ["campus", "Campus et locaux"], ["insertion", "Stages et insertion"], ["prix", "Rapport qualité-prix"]];
const Etoiles = ({ n, taille = 15 }: { n: number; taille?: number }) => (
  <span className="flex" aria-label={`${n.toLocaleString("fr-FR")} sur 5`}>{[1, 2, 3, 4, 5].map((k) => <Star key={k} size={taille} aria-hidden className={k <= Math.round(n) ? "fill-sun-400 text-sun-400" : "text-slate-300"} />)}</span>
);

/** Avis d'étudiants vérifiés sur la fiche d'une école (note dès 3 avis publiés). */
export function AvisEcole({ d, sigle }: { d: Donnees; sigle: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-extrabold">Avis d&apos;étudiants</h2><p className="text-sm text-ink-mute">Avis d&apos;étudiants dont l&apos;inscription est vérifiée, relus par l&apos;équipe Navigoal. {sigle} peut y répondre, jamais les retirer.</p></div>
        <Link href="/espace/avis/" className="btn-ghost min-h-[44px] px-4 text-[14px]"><MessageSquareQuote size={16} />Donner mon avis</Link>
      </div>
      {d.stats ? (
        <div className="card grid gap-5 rounded-[22px] p-5 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center justify-center gap-1 px-3 text-center">
            <b className="text-[40px] leading-none">{d.stats.note.toLocaleString("fr-FR")}</b><Etoiles n={d.stats.note} taille={18} />
            <span className="text-xs text-ink-mute">{d.nombre} avis</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-bold text-[#0b7a3d]"><ThumbsUp size={13} />{d.stats.recommandent} % recommandent</span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">{CRITERES.map(([k, l]) => {
            const v = d.stats!.criteres[k as keyof typeof d.stats.criteres];
            return <li key={k} className="flex flex-col gap-1 text-sm"><span className="flex justify-between"><span className="text-ink-soft">{l}</span><b>{v.toLocaleString("fr-FR")}</b></span><span className="h-1.5 overflow-hidden rounded-full bg-[#eef1f8]"><span className="block h-full rounded-full bg-sun-400" style={{ width: `${(v / 5) * 100}%` }} /></span></li>;
          })}</ul>
        </div>
      ) : (
        <p className="rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-soft">{d.nombre ? `${d.nombre} avis publié${d.nombre > 1 ? "s" : ""} : la note s'affichera à partir de 3 avis.` : "Avis en cours de collecte : les étudiants inscrits pourront bientôt partager leur expérience."}</p>
      )}
      {d.avis.slice(0, 8).map((a) => (
        <article key={a.id} className="card flex flex-col gap-3 rounded-[22px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Etoiles n={a.note} /><b className="text-sm">{a.nom}</b></span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#0b7a3d]"><BadgeCheck size={14} />{a.verification === "navigoal" ? "Inscrit via Navigoal" : "Inscription vérifiée"}</span>
          </div>
          <span className="text-xs text-ink-mute">{[a.formation, a.campus, a.annee].filter(Boolean).join(" · ")}{a.recommande ? " · recommande l'école" : " · ne recommande pas l'école"}</span>
          <div className="grid gap-3 text-[14.5px] leading-relaxed sm:grid-cols-2">
            <div><b className="text-[#0b7a3d]">Points forts</b><p className="mt-1 whitespace-pre-line text-ink-soft">{a.pointsForts}</p></div>
            <div><b className="text-[#a55a00]">Points à améliorer</b><p className="mt-1 whitespace-pre-line text-ink-soft">{a.pointsFaibles}</p></div>
          </div>
          {a.reponse && <div className="rounded-2xl border-l-4 border-brand-600 bg-brand-50/60 p-3.5 text-sm"><b>Réponse de {sigle}</b><p className="mt-1 whitespace-pre-line text-ink-soft">{a.reponse.texte}</p></div>}
          <SignalerAvis id={a.id} />
        </article>
      ))}
    </div>
  );
}
