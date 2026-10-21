"use client";
import { Download, Megaphone, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button, Loading, Panel } from "@/components/app/kit";
import { Input } from "@/components/app/form";
import { useApi } from "@/hooks/useApi";
import { apiUrl } from "@/lib/api";
import { fmt } from "@/lib/data";
import { dateLongue } from "@/lib/campagne";
import { AdminHeader, LoadError } from "./shared";

type Stats = {
  campagne: { nom: string; debut: string; objectifComptes: number; objectifDate: string };
  depuis: string;
  totaux: { comptes: number; parents: number; tests: number; parraines: number };
  sources: { source: string; libelle: string; n: number }[];
  details: { source: string; libelle: string; detail: string; n: number }[];
  semaines: { semaine: string; n: number }[];
};

const dateFr = (iso: string) => dateLongue(iso);

function Barres({ rows, large = false }: { rows: { cle: string; libelle: string; n: number }[]; large?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-mute">Aucune inscription sur la période.</p>;
  return (
    <div>
      {rows.map((r) => (
        <div key={r.cle} className="flex items-center gap-3 border-b border-[#eef1f7] py-2.5 last:border-0 sm:gap-4">
          <p className={`shrink-0 truncate text-sm font-semibold ${large ? "w-40 sm:w-72" : "w-32 sm:w-44"}`} title={r.libelle}>{r.libelle}</p>
          <div className="h-3.5 flex-1 rounded-full bg-[#eef1f7]"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(r.n / max) * 100}%` }} /></div>
          <b className="w-10 text-right tabular-nums">{fmt(r.n)}</b>
        </div>
      ))}
    </div>
  );
}

export function AdminCampagne() {
  const [depuis, setDepuis] = useState("");
  const q = depuis ? `?depuis=${depuis}` : "";
  const { data, error, loading, reload } = useApi<Stats>(`/admin/campagne${q}`);
  const tuile = (titre: string, v: number | undefined, note?: string) => (
    <div className="flex-1 rounded-2xl bg-[#f3f7ff] p-4">
      <p className="text-[13px] font-bold text-ink-mute">{titre}</p>
      <p className="mt-1 font-display text-4xl tabular-nums">{v === undefined ? "…" : fmt(v)}</p>
      {note && <p className="text-xs text-ink-soft">{note}</p>}
    </div>
  );
  return (
    <div className="min-w-0">
      <AdminHeader title={`Campagne « ${data?.campagne.nom ?? "Trouve ta voie"} »`} sub={data ? `Inscriptions depuis le ${dateFr(data.depuis)} · objectif ${data.campagne.objectifComptes} comptes élèves et étudiants au ${dateFr(data.campagne.objectifDate)}` : "Inscriptions par source, tests et parrainage"}
        actions={<div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">Depuis<Input type="date" value={depuis} onChange={(e) => setDepuis(e.target.value)} className="w-40 py-2" /></label>
          <Button variant="ghost" icon={RefreshCw} onClick={reload}>Actualiser</Button>
          <a href={apiUrl(`/admin/campagne/export.csv${q}`)} className="btn-ghost py-2.5"><Download size={16} />Export CSV</a>
        </div>} />
      {error ? <LoadError error={error} reload={reload} /> : loading && !data ? <Loading /> : data && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            {tuile("Comptes élèves et étudiants", data.totaux.comptes, `objectif ${data.campagne.objectifComptes}`)}
            {tuile("Tests terminés", data.totaux.tests)}
            {tuile("Comptes parents", data.totaux.parents)}
            {tuile("Inscrits par parrainage", data.totaux.parraines)}
          </div>
          <Panel title="Inscriptions par source" icon={Megaphone}>
            <Barres rows={data.sources.map((s) => ({ cle: s.source, libelle: s.libelle, n: s.n }))} />
            <p className="mt-3 text-xs text-ink-mute">Source : utm_source du premier lien suivi, ou « Parrainage » si un code a été utilisé. Élèves, étudiants et parents.</p>
          </Panel>
          {data.details.length > 0 && (
            <Panel title="Détail (lycée, publication…)" icon={Megaphone}>
              <Barres large rows={data.details.map((d) => ({ cle: `${d.source}-${d.detail}`, libelle: `${d.libelle} · ${d.detail}`, n: d.n }))} />
              <p className="mt-3 text-xs text-ink-mute">Valeur utm_content des liens (par exemple un QR code par lycée).</p>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
