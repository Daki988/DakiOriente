"use client";
import Link from "@/components/ui/Link";
import { BadgeCheck, Globe, MapPinned, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/app/kit";
import { LABEL_STYLE } from "@/components/ui/Cards";
import { LABELS, VILLES_ETUDES, etablissements } from "@/lib/data";
import { paysOrigine } from "@/lib/pays-origine";

/** Synthèse du référentiel des établissements au Maroc (labels, homologations, réseaux multi-campus, sites officiels). */
export function RefSummary() {
  const byLabel = LABELS.map((l) => ({ ...l, n: etablissements.filter((e) => e.label === l.id).length }));
  const filieres = etablissements.flatMap((e) => e.filieres);
  const accredite = filieres.filter((f) => f.homologation?.statut === "recente").length;
  const homologuees = filieres.length - accredite;
  const echues = etablissements.reduce((n, e) => n + e.filieres_echues.length, 0);
  const reseaux = etablissements.filter((e) => (e.campus?.length ?? 0) > 1);
  const campus = reseaux.reduce((n, e) => n + (e.campus?.length ?? 0), 0);
  const sites = etablissements.filter((e) => e.site).length;
  const afrique = paysOrigine.filter((p) => p.continent === "afrique").length;
  return (
    <Panel title="Référentiel des établissements · Maroc" icon={ShieldCheck} action={<Link href="/admin/homologations" className="text-[13px] font-bold text-brand-600">Homologations</Link>}>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase text-ink-mute">{etablissements.length} établissements privés publiés, par label</span>
          {byLabel.map((l) => (
            <Link key={l.id} href={`/admin/etablissements?label=${l.id}`} className="flex items-center gap-3 rounded-xl px-1 py-1.5 hover:bg-[#f6f8fe]">
              <span className={`chip w-[170px] shrink-0 justify-center ${LABEL_STYLE[l.id]}`}><BadgeCheck size={12} />{l.court}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef1f8]"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${(l.n / Math.max(1, etablissements.length)) * 100}%` }} /></span>
              <b className="w-8 text-right text-sm">{l.n}</b>
            </Link>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["Filières homologuées", homologuees, "accréditation en cours"],
            ["Filières « Accrédité »", accredite, "échéance de moins de 2 ans"],
            ["Filières échues", echues, "diplômes d'établissement"],
            ["Réseaux multi-campus", reseaux.length, `${campus} campus, ${VILLES_ETUDES.length} villes`],
            ["Sites officiels relevés", sites, "programmes, frais, admission"],
            ["Pays d'origine", paysOrigine.length, `dont ${afrique} en Afrique`],
          ].map(([l, v, s]) => (
            <div key={l as string} className="rounded-2xl border border-slate-200/80 p-3"><dt className="text-[11px] font-bold uppercase text-ink-mute">{l}</dt><dd><b className="text-xl">{v}</b><span className="block text-xs text-ink-mute">{s}</span></dd></div>
          ))}
        </dl>
      </div>
      <p className="flex items-center gap-2 text-xs text-ink-mute"><Globe size={13} />Destination unique : le Maroc. <MapPinned size={13} />Les campus d&apos;un réseau sont regroupés sous un seul établissement ; le campus est choisi à la candidature.</p>
    </Panel>
  );
}
