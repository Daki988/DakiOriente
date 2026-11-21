"use client";
// Parent : accords demandés par un enfant mineur pour que l'école d'un salon virtuel puisse le recontacter (fiche contact).
import { Check, Presentation, X } from "lucide-react";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, useToast } from "@/components/app/kit";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

type Accord = { salonId: string; enfantId: string; enfant: string; titre: string; debut: string; ecole: string; accordParent: string };
const ETAT: Record<string, [string, "sun" | "green" | "rose" | "grey"]> = { en_attente: ["Accord demandé", "sun"], accorde: ["Accepté", "green"], refuse: ["Refusé", "rose"], non_requis: ["Non requis", "grey"] };

export function AccordsSalons() {
  const { data, loading, error, reload } = useApi<Accord[]>("/parent/salons-accords");
  const toast = useToast();
  const a = useAction();
  if (loading) return <Loading />;
  if (error) return <Alert tone="error">{error.message}</Alert>;
  const repondre = async (x: Accord, accepte: boolean) => { if (await a.run(() => api("/parent/salons-accords", { body: { salonId: x.salonId, enfantId: x.enfantId, accepte } }))) { toast(accepte ? "Accord donné" : "Refus enregistré"); reload(); } };
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Salons virtuels : vos accords" sub="Quand votre enfant mineur s'inscrit à un salon et accepte que l'école le recontacte, votre accord est demandé. Sans lui, il participe normalement mais ses coordonnées ne sont pas transmises." />
      {!data?.length ? <Empty icon={Presentation} title="Aucune demande" text="Les demandes d'accord de vos enfants pour les salons virtuels s'afficheront ici." />
        : data.map((x) => { const [l, t] = ETAT[x.accordParent] ?? [x.accordParent, "grey"]; return (
          <Panel key={x.salonId + x.enfantId}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><b>{x.enfant} souhaite que {x.ecole} puisse la ou le recontacter</b><Chip tone={t}>{l}</Chip></div>
              <p className="text-sm text-ink-soft">Salon « {x.titre} » du {new Date(x.debut).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}. Si vous acceptez, l&apos;école recevra : prénom et nom, pays, niveau et série, domaines et métiers visés, e-mail et téléphone.</p>
              <div className="flex flex-wrap gap-2">
                {x.accordParent !== "accorde" && <Button size="sm" icon={Check} loading={a.pending} onClick={() => repondre(x, true)}>J&apos;accepte</Button>}
                {x.accordParent !== "refuse" && <Button size="sm" variant="ghost" icon={X} loading={a.pending} onClick={() => repondre(x, false)}>{x.accordParent === "accorde" ? "Retirer mon accord" : "Je refuse"}</Button>}
              </div>
            </div>
          </Panel>); })}
    </div>
  );
}
