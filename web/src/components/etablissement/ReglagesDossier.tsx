"use client";
// Réglages du dossier de candidature de l'école : pièces demandées, pièces propres à l'école, fiche de candidature PDF.
import { Check as CheckIcon, Download, Eye, FileText, FolderCog, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Loading, PageHeader, Panel, useToast } from "@/components/app/kit";
import { Check, FormError } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { useEcole } from "./EcoleContext";

type Piece = { cle?: string; libelle: string; obligatoire: boolean };
type Reglages = { types: string[]; pieces: Piece[]; fiche: { nom: string; taille: number | null; maj: string; source: string | null; url: string; ecole: boolean } | null; catalogue: [string, string][]; inscription: string[]; formations: number; listesDifferentes: boolean };

export function ReglagesDossier() {
  const { eid, etab } = useEcole();
  const toast = useToast();
  const r = useApi<Reglages>(`/ecole/${eid}/dossier`);
  const [types, setTypes] = useState<string[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [appliquer, setAppliquer] = useState(true);
  const save = useAction();
  const fiche = useAction();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (r.data) { setTypes(r.data.types); setPieces(r.data.pieces); } }, [r.data]);
  if (r.error) return <Alert tone="error" title="Erreur">{r.error.message}</Alert>;
  if (!r.data) return <Loading />;
  const d = r.data;
  const enregistrer = () => save.run(async () => { r.setData(await api<Reglages>(`/ecole/${eid}/dossier`, { method: "PUT", body: { types, pieces: pieces.filter((p) => p.libelle.trim().length >= 2), appliquer } })); toast("Dossier de candidature enregistré"); });
  const envoyerFiche = (f: File) => fiche.run(async () => { const fd = new FormData(); fd.append("fichier", f); r.setData(await api<Reglages>(`/ecole/${eid}/dossier/fiche`, { form: fd })); toast("Fiche de candidature mise en ligne"); if (input.current) input.current.value = ""; });
  const retirer = () => { if (confirm("Retirer la fiche de candidature ?")) fiche.run(async () => { r.setData(await api<Reglages>(`/ecole/${eid}/dossier/fiche`, { method: "DELETE" })); }); };
  const nb = types.length + pieces.filter((p) => p.obligatoire).length + (d.fiche ? 1 : 0);

  return (
    <>
      <PageHeader title="Dossier de candidature" sub={`${etab?.nom ?? ""} · les pièces que vous demandez aux candidats et votre fiche de candidature`} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Panel title="Pièces demandées" icon={FolderCog}>
            <p className="text-[13px] text-ink-mute">Format accepté pour les candidats : PDF, JPG ou PNG, 8 Mo maximum par pièce. Les pièces déjà déposées sur Navigoal sont réutilisées d&apos;une candidature à l&apos;autre.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {d.catalogue.map(([v, l]) => <Check key={v} checked={types.includes(v)} onChange={(c) => setTypes((t) => c ? [...t, v] : t.filter((x) => x !== v))}>{l}</Check>)}
            </div>
            <b className="mt-2 text-sm">Pièces propres à votre école</b>
            {pieces.map((p, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input className="input min-w-[200px] flex-1" value={p.libelle} maxLength={120} placeholder="Ex. Attestation de niveau d'anglais" onChange={(e) => setPieces((x) => x.map((y, k) => k === i ? { ...y, libelle: e.target.value } : y))} aria-label={`Pièce ${i + 1}`} />
                <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={p.obligatoire} onChange={(e) => setPieces((x) => x.map((y, k) => k === i ? { ...y, obligatoire: e.target.checked } : y))} />Obligatoire</label>
                <button type="button" onClick={() => setPieces((x) => x.filter((_, k) => k !== i))} className="rounded-lg p-2 text-ink-mute hover:bg-slate-100" aria-label="Retirer la pièce"><Trash2 size={16} /></button>
              </div>
            ))}
            {pieces.length < 10 && <button type="button" onClick={() => setPieces((x) => [...x, { libelle: "", obligatoire: true }])} className="flex items-center gap-1.5 self-start rounded-xl border border-dashed border-brand-300 px-3 py-2 text-[13px] font-bold text-brand-600"><Plus size={15} />Ajouter une pièce</button>}
            <b className="mt-2 text-sm">À l&apos;inscription définitive (après l&apos;admission)</b>
            <div className="flex flex-wrap gap-2">{d.inscription.map((t) => <span key={t} className="chip bg-brand-50 text-brand-700"><CheckIcon size={12} />{t}</span>)}</div>
            <label className="mt-2 flex items-start gap-2.5 rounded-2xl bg-[#f6f8fe] p-3 text-[13px]"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={appliquer} onChange={(e) => setAppliquer(e.target.checked)} /><span><b>Appliquer cette liste à mes {d.formations} formations.</b>{d.listesDifferentes && " Certaines formations ont aujourd'hui leur propre liste : elles seront alignées."} Décochez pour garder les listes par formation (onglet Formations).</span></label>
            <FormError error={save.error} />
            <Button onClick={enregistrer} loading={save.pending} className="self-start">Enregistrer</Button>
          </Panel>
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Votre fiche de candidature" icon={FileText}>
            {d.fiche ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fdecec] text-[11px] font-extrabold text-[#d42a50]">PDF</span>
                <span className="min-w-0 flex-1"><b className="block truncate text-sm">{d.fiche.nom}</b><span className="text-xs text-ink-mute">{d.fiche.ecole ? "mise en ligne" : "relevée sur votre site"} le {new Date(d.fiche.maj).toLocaleDateString("fr-FR")}</span></span>
                <a href={d.fiche.url} target="_blank" rel="noopener" className="rounded-lg p-2 text-ink-mute hover:bg-slate-100" aria-label="Voir la fiche"><Eye size={17} /></a>
              </div>
            ) : <p className="text-[13px] text-ink-mute">Si votre école utilise une fiche de candidature, mettez-la en ligne : les candidats la téléchargent, la remplissent, la signent et la joignent à leur dossier.</p>}
            <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) envoyerFiche(f); }} />
            <Button icon={Upload} loading={fiche.pending} onClick={() => input.current?.click()}>{d.fiche ? "Remplacer par une nouvelle version" : "Mettre en ligne ma fiche (PDF)"}</Button>
            {d.fiche?.ecole && <button type="button" onClick={retirer} className="self-start text-xs font-bold text-ink-mute underline">Retirer la fiche</button>}
            {d.fiche && !d.fiche.ecole && d.fiche.source && <a href={d.fiche.source} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs font-bold text-brand-600"><Download size={13} />Source : votre site officiel</a>}
            <span className="text-xs text-ink-mute">PDF uniquement, 8 Mo maximum.</span>
            <FormError error={fiche.error} />
          </Panel>
          <Panel title="Ce que voit le candidat" tone="sun">
            <span className="text-[13px]">{nb} pièce{nb > 1 ? "s" : ""} obligatoire{nb > 1 ? "s" : ""}{pieces.some((p) => !p.obligatoire) ? `, ${pieces.filter((p) => !p.obligatoire).length} facultative(s)` : ""}{d.fiche ? ", dont votre fiche à télécharger, remplir et renvoyer" : ""}. La candidature ne peut être envoyée que lorsque toutes les pièces obligatoires sont déposées.</span>
          </Panel>
        </div>
      </div>
    </>
  );
}
