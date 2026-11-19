"use client";
import Link from "@/components/ui/Link";
import { AlarmClock, Clock3 } from "lucide-react";
import { Alert, Chip, Loading, PageHeader, Panel, Table, dateFr } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";

type Ecole = { id: string; nom: string; sigle: string; n: number; repondues: number; medianeJours: number | null; sous7: number; enRetard: number; public: { jours: number; rapide: boolean } | null };
type Retard = { id: string; number: string; ecole: string; submitted_at: string; first_name: string; last_name: string };

/** Relais Navigoal : réactivité des écoles (90 jours) et candidatures restées sans réponse plus de 7 jours. */
export function AdminReactivite() {
  const d = useApi<{ ecoles: Ecole[]; retard: Retard[] }>("/admin/reactivite");
  return (
    <>
      <PageHeader title="Réactivité des écoles" sub="Délai de première réponse aux candidatures sur 90 jours. Relances automatiques à J+3 et J+6 ; à J+8, alerte ici et message à l'élève." />
      {d.loading ? <Loading /> : d.error ? <Alert tone="error">{d.error.message}</Alert> : (
        <div className="flex flex-col gap-5">
          <Panel title={`Candidatures sans réponse depuis plus de 7 jours (${d.data!.retard.length})`} icon={AlarmClock}>
            <Table rows={d.data!.retard} rowKey={(r) => r.id} empty="Aucune candidature en retard."
              cols={[
                { h: "Candidature", c: (r) => <Link href={`/admin/candidatures/?q=${encodeURIComponent(r.number)}`} className="font-bold text-brand-600 hover:underline">{r.number}</Link> },
                { h: "Élève", c: (r) => `${r.first_name} ${r.last_name}` },
                { h: "École", c: (r) => r.ecole },
                { h: "Envoyée le", c: (r) => dateFr(r.submitted_at) },
              ]} />
          </Panel>
          <Panel title="Écoles" icon={Clock3}>
            <Table rows={d.data!.ecoles} rowKey={(r) => r.id} empty="Aucune candidature sur 90 jours."
              cols={[
                { h: "École", c: (r) => <b>{r.sigle}</b> },
                { h: "Candidatures", c: (r) => r.n },
                { h: "Délai médian", c: (r) => (r.medianeJours == null ? "—" : `${Math.max(1, Math.ceil(r.medianeJours))} j`) },
                { h: "Sous 7 jours", c: (r) => `${r.n ? Math.round((r.sous7 / r.n) * 100) : 0} %` },
                { h: "En retard", c: (r) => (r.enRetard ? <Chip tone="rose">{r.enRetard}</Chip> : "0") },
                { h: "Affiché", c: (r) => (r.public ? <Chip tone={r.public.rapide ? "green" : "grey"}>{r.public.rapide ? "Réponse rapide" : `sous ${r.public.jours} j`}</Chip> : <span className="text-ink-mute">non</span>) },
              ]} />
          </Panel>
        </div>
      )}
    </>
  );
}
