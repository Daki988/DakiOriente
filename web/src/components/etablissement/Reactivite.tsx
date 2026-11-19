"use client";
import Link from "@/components/ui/Link";
import { CheckCircle2, CircleDashed, Clock3, Gauge, Zap } from "lucide-react";
import { Panel, dateFr } from "@/components/app/kit";

export type ReactiviteDash = {
  n: number; repondues: number; medianeJours: number | null; sous7: number; enRetard: number; objectifJours: number; seuil: number;
  public: { jours: number; rapide: boolean } | null;
  retard: { id: string; number: string; nom: string; envoyee: string }[];
};
export type CompletudeDash = { score: number; criteres: { cle: string; libelle: string; ok: boolean; lien: string }[] };

/** Réactivité de l'école sur 90 jours : délai médian de première réponse, part sous 7 jours, dossiers en retard. */
export function BlocReactivite({ r, link }: { r: ReactiviteDash; link: (p: string) => string }) {
  const part = r.n ? Math.round((r.sous7 / r.n) * 100) : 0;
  return (
    <Panel title="Réactivité" icon={Clock3} action={<span className="text-xs font-bold text-ink-mute">90 derniers jours</span>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f6f8fe] p-4"><span className="text-xs font-bold text-ink-mute">Délai médian de première réponse</span>
          <b className="mt-1 block text-[24px]">{r.medianeJours == null ? "—" : `${Math.max(1, Math.ceil(r.medianeJours))} j`}</b>
          <span className="text-xs text-ink-mute">objectif : {r.objectifJours} jours</span></div>
        <div className="rounded-2xl bg-[#f6f8fe] p-4"><span className="text-xs font-bold text-ink-mute">Réponses sous {r.objectifJours} jours</span>
          <b className={`mt-1 block text-[24px] ${part >= 80 ? "text-[#0b7a3d]" : part >= 50 ? "text-[#a55a00]" : "text-[#b8213f]"}`}>{r.n ? `${part} %` : "—"}</b>
          <span className="text-xs text-ink-mute">{r.sous7} sur {r.n} candidature{r.n > 1 ? "s" : ""}</span></div>
        <div className="rounded-2xl bg-[#f6f8fe] p-4"><span className="text-xs font-bold text-ink-mute">Affiché sur votre fiche</span>
          <b className="mt-1 flex items-center gap-1.5 text-[17px] leading-snug">{r.public ? <>{r.public.rapide && <Zap size={16} className="text-[#a55a00]" />}Répond sous {r.public.jours} j{r.public.rapide ? " · Réponse rapide" : ""}</> : "Pas encore"}</b>
          <span className="text-xs text-ink-mute">{r.public ? "visible par les familles" : `dès ${r.seuil} candidatures sur 90 jours`}</span></div>
      </div>
      <p className="mt-3 text-xs text-ink-mute">Une réponse = un changement de statut (vérification, pièce demandée, décision) ou un message au candidat. Sans réponse, vous êtes relancé à J+3 et J+6 ; à J+8, l&apos;équipe Navigoal prend le relais auprès de l&apos;élève.</p>
      {r.retard.length > 0 && (
        <div className="mt-3 rounded-2xl border border-[#f5c2cc] bg-[#fff5f7] p-3">
          <b className="text-sm text-[#b8213f]">{r.enRetard} candidature{r.enRetard > 1 ? "s" : ""} sans réponse depuis plus de {r.objectifJours} jours</b>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">{r.retard.map((x) => (
            <li key={x.id}><Link href={link(`/etablissement/candidatures/${x.id}`)} className="font-bold text-brand-600 hover:underline">{x.number}</Link> · {x.nom} · envoyée le {dateFr(x.envoyee)}</li>
          ))}</ul>
        </div>
      )}
    </Panel>
  );
}

/** Score de complétude de la fiche et ce qui manque. */
export function BlocCompletude({ c, link }: { c: CompletudeDash; link: (p: string) => string }) {
  return (
    <Panel title="Fiche complète" icon={Gauge} action={<b className={`text-sm ${c.score >= 80 ? "text-[#0b7a3d]" : c.score >= 50 ? "text-[#a55a00]" : "text-[#b8213f]"}`}>{c.score} %</b>}>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#eef1f8]"><div className="h-full rounded-full bg-[#0b7a3d]" style={{ width: `${c.score}%` }} /></div>
      <ul className="flex flex-col gap-2 text-sm">{c.criteres.map((x) => (
        <li key={x.cle} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">{x.ok ? <CheckCircle2 size={16} className="shrink-0 text-[#0b7a3d]" /> : <CircleDashed size={16} className="shrink-0 text-ink-mute" />}<span className={x.ok ? "text-ink-soft" : "font-semibold"}>{x.libelle}</span></span>
          {!x.ok && <Link href={link(x.lien)} className="shrink-0 text-xs font-bold text-brand-600 hover:underline">Compléter</Link>}
        </li>
      ))}</ul>
      <p className="mt-3 text-xs text-ink-mute">Une fiche complète (frais, photos, campagne ouverte, pièces du dossier) reçoit davantage de candidatures.</p>
    </Panel>
  );
}
