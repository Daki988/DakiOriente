"use client";
import { FileText, FolderLock, Trash2 } from "lucide-react";
import { Alert, Empty, Loading, PageHeader, Panel, StatusBadge, dateFr, useToast } from "@/components/app/kit";
import { DOC_TYPES, FileDrop, docLabel, type Doc } from "@/components/app/form";
import { api, apiUrl } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

const ESSENTIELS = ["identite", "releve_notes", "diplome", "photo", "acte_naissance"];

export function Documents() {
  const toast = useToast();
  const { data, loading, setData, reload } = useApi<Doc[]>("/documents");
  const have = new Set((data ?? []).map((d) => d.type));
  const remove = async (d: Doc) => {
    if (!confirm(`Supprimer « ${d.fileName} » ?`)) return;
    try { await api(`/documents/${d.id}`, { method: "DELETE" }); toast("Document supprimé"); reload(); } catch (e) { toast(e instanceof Error ? e.message : "Suppression impossible", "error"); }
  };
  return (
    <>
      <PageHeader title="Mes documents" sub="Ton coffre-fort : un document déposé une fois sert pour toutes tes candidatures et pour Navilease." />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="Documents déposés" icon={FolderLock}>
          {loading ? <Loading /> : !data?.length ? <Empty icon={FileText} title="Aucun document" text="Commence par ta pièce d'identité, tes relevés de notes et ton diplôme." /> : (
            <div className="flex flex-col gap-2.5">
              {data.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FileText size={18} /></span>
                  <a href={apiUrl(`/documents/${d.id}/fichier`)} target="_blank" className="min-w-0 flex-1"><b className="block text-sm">{docLabel(d.type)}</b><span className="block truncate text-xs text-ink-mute">{d.fileName} · {(d.size / 1024).toFixed(0)} Ko · {dateFr(d.createdAt)}</span></a>
                  <StatusBadge status={d.status} />
                  <button onClick={() => remove(d)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-mute hover:bg-[#fff1f3] hover:text-[#d42a50]" aria-label={`Supprimer ${d.fileName}`}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Ajouter un document">
            <FileDrop types={DOC_TYPES} onUploaded={(d) => { setData([d, ...(data ?? [])]); toast("Document déposé"); }} />
          </Panel>
          <Panel title="Pièces essentielles">
            {ESSENTIELS.map((t) => <div key={t} className="flex items-center justify-between text-sm"><span>{docLabel(t)}</span>{have.has(t) ? <span className="chip bg-[#e8f8ef] text-[#0f8a46]">Déposé</span> : <span className="chip bg-[#eef1f8] text-ink-mute">À déposer</span>}</div>)}
            <Alert tone="info">Fichiers chiffrés en transit, visibles uniquement par toi, tes parents liés et les établissements auxquels tu candidates.</Alert>
          </Panel>
        </div>
      </div>
    </>
  );
}
