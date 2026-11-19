"use client";
import { Landmark } from "lucide-react";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, dateFr, useToast } from "@/components/app/kit";
import { FormError } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

type Moyen = { id: string; etablissementId: string; ecole: string; type: string; libelle: string; details: string; devise: string; statut: string; updatedAt: string; verifieLe: string | null };
const STATUT: Record<string, [string, "sun" | "green" | "rose"]> = { a_verifier: ["À vérifier", "sun"], verifie: ["Vérifié", "green"], refuse: ["Refusé", "rose"] };

/** Back-office : vérification des coordonnées de paiement déclarées par les écoles (contre les faux RIB). */
export function AdminScolarite() {
  const { data, loading, error, reload } = useApi<Moyen[]>("/admin/moyens-paiement");
  const a = useAction();
  const toast = useToast();
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur."}</Alert>;
  const go = async (id: string, statut: string) => { if (await a.run(() => api(`/admin/moyens-paiement/${id}`, { method: "POST", body: { statut } }))) { toast(statut === "verifie" ? "Vérifié : affiché aux familles" : "Refusé"); reload(); } };
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
            <div className="flex gap-2"><Button size="sm" onClick={() => go(m.id, "verifie")}>Coordonnées vérifiées auprès de l&apos;école</Button><Button size="sm" variant="ghost" onClick={() => go(m.id, "refuse")}>Refuser</Button></div>
          </div>
        ))}</div> : <Empty title="Rien à vérifier" />}
      </Panel>
      <Panel title="Déjà traités">
        <div className="flex flex-col divide-y divide-slate-100">{data.filter((m) => m.statut !== "a_verifier").map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><span><b>{m.ecole}</b> · {m.libelle}</span><span className="flex items-center gap-2"><Chip tone={STATUT[m.statut]?.[1]}>{STATUT[m.statut]?.[0]}</Chip><span className="text-xs text-ink-mute">{dateFr(m.verifieLe)}</span>{m.statut === "verifie" && <Button size="sm" variant="ghost" onClick={() => go(m.id, "refuse")}>Retirer la validation</Button>}</span></div>
        ))}</div>
      </Panel>
    </div>
  );
}
