"use client";
import { useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { Button, Dialog, Empty, Loading, Panel, Table, useToast } from "@/components/app/kit";
import { Field, FormError, Input } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { labelById, type Label } from "@/lib/data";
import { AdminHeader, LoadError } from "./shared";

type Row = {
  p: { id: string; title: string; faculty: string; diploma: string | null; updatedAt: string; homologation: { statut: string; texte?: string } | null };
  e: { id: string; nom: string; ville: string; label: Label | null };
};

/** Filières créées ou renommées par les établissements : vérification de l'arrêté d'accréditation avant publication. */
export function AdminHomologations() {
  const toast = useToast();
  const list = useApi<Row[]>("/admin/homologations");
  const [sel, setSel] = useState<{ r: Row; ok: boolean } | null>(null);
  const [fin, setFin] = useState("");
  const [texte, setTexte] = useState("");
  const act = useAction();
  const open = (r: Row, ok: boolean) => { setSel({ r, ok }); setFin(""); setTexte(ok ? r.p.homologation?.texte ?? "" : ""); act.setError(null); };
  const decide = async () => {
    if (!sel) return;
    const res = await act.run(() => api(`/admin/formations/${sel.r.p.id}/homologation`, { method: "PATCH", body: { homologated: sel.ok, fin: fin.trim() || undefined, texte: texte.trim() || undefined } }));
    if (res) { toast(sel.ok ? "Filière homologuée : elle est publiée." : "Homologation refusée : l'établissement est notifié dans son espace."); list.setData((l) => l?.filter((x) => x.p.id !== sel.r.p.id)); setSel(null); }
  };
  return (
    <div className="min-w-0">
      <AdminHeader title="Homologations" sub="Seules les filières accréditées par l'État sont publiées. Vérifiez l'arrêté au Bulletin officiel ou sur enssup.gov.ma." />
      <Panel title="Filières à vérifier" icon={ShieldCheck}>
        {list.loading ? <Loading /> : list.error ? <LoadError error={list.error} reload={list.reload} /> : !list.data?.length ? <Empty icon={ShieldCheck} title="Aucune filière en attente" text="Les filières créées ou renommées par les établissements apparaîtront ici." /> : (
          <Table rows={list.data} rowKey={(r) => r.p.id} cols={[
            { h: "Filière", c: (r) => <span className="flex flex-col"><b>{r.p.title}</b><span className="text-xs text-ink-mute">{[r.p.faculty, r.p.diploma].filter(Boolean).join(" · ") || "—"}</span></span> },
            { h: "Établissement", c: (r) => <span className="flex flex-col"><span>{r.e.nom}</span><span className="text-xs text-ink-mute">{r.e.ville} · {r.e.label ? labelById[r.e.label].court : "non publié"}</span></span> },
            { h: "Référence fournie", c: (r) => <span className="text-[13px]">{r.p.homologation?.texte ?? <span className="text-ink-mute">Aucune</span>}</span> },
            { h: <span className="sr-only">Actions</span>, className: "text-right", c: (r) => <span className="flex justify-end gap-2"><Button size="sm" icon={ShieldCheck} onClick={() => open(r, true)}>Valider</Button><Button size="sm" variant="ghost" icon={ShieldX} onClick={() => open(r, false)}>Refuser</Button></span> },
          ]} />
        )}
      </Panel>
      <Dialog open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.ok ? "Valider" : "Refuser"} · ${sel.r.p.title}` : ""}>
        {sel && (
          <form className="flex flex-col gap-4" onSubmit={(ev) => { ev.preventDefault(); decide(); }}>
            {sel.ok && <Field label="Fin de l'accréditation" hint="Année universitaire, ex. : 2028-2029">{(id) => <Input id={id} value={fin} onChange={(ev) => setFin(ev.target.value)} pattern="\d{4}-\d{4}" placeholder="2028-2029" />}</Field>}
            <Field label={sel.ok ? "Arrêté d'accréditation (n° et Bulletin officiel)" : "Motif du refus"} required>{(id) => <Input id={id} value={texte} onChange={(ev) => setTexte(ev.target.value)} required maxLength={300} />}</Field>
            <FormError error={act.error} />
            <div className="flex justify-end gap-2"><Button type="button" variant="quiet" onClick={() => setSel(null)}>Annuler</Button><Button type="submit" loading={act.pending} icon={sel.ok ? ShieldCheck : ShieldX}>{sel.ok ? "Homologuer et publier" : "Refuser"}</Button></div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
