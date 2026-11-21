"use client";
import { Landmark } from "lucide-react";
import { useState } from "react";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, dateFr, useToast } from "@/components/app/kit";
import { FormError, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

type Moyen = { id: string; etablissementId: string; ecole: string; type: string; libelle: string; details: string; devise: string; statut: string; updatedAt: string; verifieLe: string | null; motifRefus: string | null };
const MOTIFS = ["RIB au nom d'une personne et non de l'établissement", "Coordonnées non confirmées par le standard ou l'e-mail officiel de l'école", "RIB ou IBAN incomplet (clé, code SWIFT manquant)", "Lien de paiement hors du site officiel de l'école"];
const STATUT: Record<string, [string, "sun" | "green" | "rose"]> = { a_verifier: ["À vérifier", "sun"], verifie: ["Vérifié", "green"], refuse: ["Refusé", "rose"] };

/** Back-office : vérification des coordonnées de paiement déclarées par les écoles (contre les faux RIB). */
export function AdminScolarite() {
  const { data, loading, error, reload } = useApi<Moyen[]>("/admin/moyens-paiement");
  const a = useAction();
  const toast = useToast();
  const [refus, setRefus] = useState<{ id: string; motif: string } | null>(null);
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur."}</Alert>;
  const go = async (id: string, statut: string, motif?: string) => { if (await a.run(() => api(`/admin/moyens-paiement/${id}`, { method: "POST", body: { statut, motif } }))) { toast(statut === "verifie" ? "Vérifié : affiché aux familles" : "Refusé : le motif est envoyé à l'école"); setRefus(null); reload(); } };
  const blocRefus = (id: string) => refus?.id === id && (
    <div className="flex flex-col gap-2 rounded-xl border border-[#f3c2cc] bg-white p-3">
      <b className="text-sm">Motif du refus (envoyé à l&apos;école)</b>
      <div className="flex flex-wrap gap-1.5">{MOTIFS.map((x) => <button key={x} type="button" className="rounded-full border border-slate-200 px-2.5 py-1 text-xs hover:border-brand-400" onClick={() => setRefus({ id, motif: x })}>{x}</button>)}</div>
      <Textarea value={refus.motif} onChange={(e) => setRefus({ id, motif: e.target.value })} maxLength={500} placeholder="Expliquez ce que l'école doit corriger." aria-label="Motif du refus" />
      <div className="flex gap-2"><Button size="sm" variant="danger" loading={a.pending} disabled={refus.motif.trim().length < 10} onClick={() => go(id, "refuse", refus.motif)}>Refuser et prévenir l&apos;école</Button><Button size="sm" variant="ghost" onClick={() => setRefus(null)}>Annuler</Button></div>
    </div>
  );
  const aVerifier = data.filter((m) => m.statut === "a_verifier");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Moyens de paiement des écoles" sub="Avant de valider, contrôlez les coordonnées auprès de l'école par un canal connu (téléphone du standard, e-mail officiel du site) : un faux RIB ferait perdre de l'argent aux familles." crumbs={[["Back-office", "/admin"], ["Moyens de paiement des écoles"]]} />
      <FormError error={a.error} />
      <Panel title={`À vérifier (${aVerifier.length})`} icon={Landmark}>
        {aVerifier.length ? <div className="flex flex-col gap-3">{aVerifier.map((m) => (
          <div key={m.id} className="flex flex-col gap-2 rounded-2xl bg-[#f6f8fe] p-3.5 text-sm">
            <span className="flex flex-wrap items-center justify-between gap-2"><b>{m.ecole} · {m.libelle} ({m.devise})</b><span className="text-xs text-ink-mute">{dateFr(m.updatedAt, true)}</span></span>
            <p className="whitespace-pre-line break-words font-mono text-[13px]">{m.details}</p>
            <div className="flex gap-2"><Button size="sm" onClick={() => go(m.id, "verifie")}>Coordonnées vérifiées auprès de l&apos;école</Button><Button size="sm" variant="ghost" onClick={() => setRefus({ id: m.id, motif: "" })}>Refuser</Button></div>
            {blocRefus(m.id)}
          </div>
        ))}</div> : <Empty title="Rien à vérifier" />}
      </Panel>
      <Panel title="Déjà traités">
        <div className="flex flex-col divide-y divide-slate-100">{data.filter((m) => m.statut !== "a_verifier").map((m) => (
          <div key={m.id} className="flex flex-col gap-2 py-2.5 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span><b>{m.ecole}</b> · {m.libelle}{m.statut === "refuse" && m.motifRefus && <span className="block text-xs text-ink-mute">Motif : {m.motifRefus}</span>}</span><span className="flex items-center gap-2"><Chip tone={STATUT[m.statut]?.[1]}>{STATUT[m.statut]?.[0]}</Chip><span className="text-xs text-ink-mute">{dateFr(m.verifieLe)}</span>{m.statut === "verifie" && <Button size="sm" variant="ghost" onClick={() => setRefus({ id: m.id, motif: "" })}>Retirer la validation</Button>}</span></div>{blocRefus(m.id)}</div>
        ))}</div>
      </Panel>
    </div>
  );
}
