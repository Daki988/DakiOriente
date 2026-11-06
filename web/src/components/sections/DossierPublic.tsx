"use client";
// Dossier de candidature d'un établissement (fiche formation, fiche établissement) : pièces à joindre et fiche de l'école.
import { Clock, Download, FileCheck2, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";

type Dossier = { pieces: { code: string; libelle: string; obligatoire: boolean; ecole: boolean }[]; inscription: string[]; fiche: { nom: string; maj: string; source: string | null; url: string } | null };

export function DossierPublic({ eid, sigle, compact = false }: { eid: string; sigle: string; compact?: boolean }) {
  const [d, setD] = useState<Dossier | null>(null);
  useEffect(() => { fetch(`/api/etablissements/${encodeURIComponent(eid)}/dossier/`).then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => setD(null)); }, [eid]);
  if (!d) return null;
  return (
    <div className={`flex flex-col gap-3 ${compact ? "" : "card rounded-[22px] p-6"}`}>
      <h3 className="flex items-center gap-2 text-lg font-extrabold"><FolderOpen size={20} className="text-brand-600" />Dossier de candidature</h3>
      <p className="text-[13px] text-ink-mute">Pièces à joindre (PDF, JPG ou PNG, 8 Mo maximum chacune). Tu les déposes une fois dans ton espace : elles servent pour toutes tes candidatures.</p>
      {d.fiche && (
        <div className="flex flex-col gap-2.5 rounded-2xl border-2 border-brand-600 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fdecec] text-[11px] font-extrabold text-[#d42a50]">PDF</span>
            <span className="min-w-0 flex-1"><b className="block text-sm">Fiche de candidature {sigle}</b><span className="text-xs text-ink-mute">{d.fiche.nom} · mise à jour le {new Date(d.fiche.maj).toLocaleDateString("fr-FR")}</span></span>
            <a href={d.fiche.url} target="_blank" rel="noopener" className="btn-primary shrink-0 px-3 py-2 text-[13px]"><Download size={15} />Télécharger</a>
          </div>
          <span className="text-[13px] text-ink-soft">Remplis-la, signe-la, puis joins-la (scan ou photos de chaque page) à ta candidature sur Navigoal.</span>
        </div>
      )}
      <ul className="flex flex-col">
        {d.pieces.filter((p) => !p.code.startsWith("fiche:")).map((p) => (
          <li key={p.code} className="flex items-start gap-2.5 border-b border-[#eef1f8] py-2 text-sm last:border-0">
            <FileCheck2 size={16} className="mt-0.5 shrink-0 text-brand-600" />
            <span className="flex-1">{p.libelle}{!p.obligatoire && <span className="text-ink-mute"> (facultatif)</span>}</span>
            {p.ecole && <span className="chip bg-sun-100 px-2 py-0.5 text-[11px] text-[#a55a00]">propre à {sigle}</span>}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5 rounded-2xl bg-[#f6f8fe] p-3.5 text-[13px]">
        <b>À fournir après l&apos;admission, à l&apos;inscription définitive</b>
        {d.inscription.map((t) => <span key={t} className="flex items-center gap-2 text-ink-soft"><Clock size={14} className="shrink-0 text-ink-mute" />{t}</span>)}
      </div>
    </div>
  );
}
