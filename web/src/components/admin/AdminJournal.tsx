"use client";
import { RefreshCw, ScrollText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Chip, Loading, Panel, Table, dateFr, type Tone } from "@/components/app/kit";
import { Input, Select } from "@/components/app/form";
import { useApi } from "@/hooks/useApi";
import { AdminHeader, LoadError, ROLE_LABEL } from "./shared";

type Log = { l: { id: string; actorId: string | null; action: string; entity: string; entityId: string | null; meta: Record<string, unknown>; ip: string | null; createdAt: string }; actor: { firstName: string; lastName: string; role: string } | null };

const ACTIONS: Record<string, [string, Tone]> = {
  connexion: ["Connexion", "grey"], inscription: ["Inscription", "blue"], reinitialisation_mdp: ["Mot de passe réinitialisé", "sun"],
  suspension: ["Suspension de compte", "rose"], activation: ["Activation de compte", "green"], creation_compte_interne: ["Compte interne créé", "violet"],
  maj_etablissement: ["Établissement modifié (admin)", "violet"], modification_fiche: ["Fiche établissement modifiée", "blue"], creation_formation: ["Formation créée", "blue"], modification_formation: ["Formation modifiée", "blue"],
  candidature_envoyee: ["Candidature envoyée", "blue"], statut_candidature: ["Statut de candidature", "violet"], paiement_reussi: ["Paiement réussi", "green"],
  creation_annonce: ["Annonce créée", "blue"], annonce_publiee: ["Annonce publiée", "green"], annonce_refusee: ["Annonce refusée", "rose"], kyc_valide: ["KYC validé", "green"], kyc_refuse: ["KYC refusé", "rose"],
  reservation_demande: ["Demande de réservation", "blue"], signature_contrat: ["Contrat signé", "violet"],
};
const ENTITY: Record<string, string> = { user: "Utilisateur", establishment: "Établissement", program: "Formation", application: "Candidature", payment: "Paiement", housing: "Logement", landlord: "Bailleur", booking: "Réservation" };

export function AdminJournal() {
  const { data, error, loading, reload } = useApi<Log[]>("/admin/journal");
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [hideLogins, setHideLogins] = useState(true);
  const rows = useMemo(() => (data ?? []).filter((r) => (!action || r.l.action === action) && (!hideLogins || action === "connexion" || r.l.action !== "connexion") && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))), [data, action, q, hideLogins]);
  const present = useMemo(() => [...new Set((data ?? []).map((r) => r.l.action))].map((a) => [a, ACTIONS[a]?.[0] ?? a] as [string, string]), [data]);

  return (
    <div className="min-w-0">
      <AdminHeader title="Journal d'audit" sub="Les 200 dernières actions sensibles (connexions, validations, paiements, modération)" actions={<Button variant="ghost" icon={RefreshCw} onClick={reload}>Actualiser</Button>} />
      <Panel title="Événements" icon={ScrollText} action={data && <Chip tone="grey">{rows.length}</Chip>}>
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <label className="relative md:w-72"><span className="sr-only">Rechercher</span><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Auteur, identifiant…" className="pl-10" /></label>
          <Select aria-label="Action" value={action} onChange={(e) => setAction(e.target.value)} options={present} placeholder="Toutes les actions" className="md:w-64" />
          <label className="flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" checked={hideLogins} onChange={(e) => setHideLogins(e.target.checked)} className="h-[18px] w-[18px] accent-brand-600" />Masquer les connexions</label>
        </div>
        {error ? <LoadError error={error} reload={reload} /> : loading && !data ? <Loading /> : (
          <Table rows={rows} rowKey={(r) => r.l.id} empty="Aucun événement pour ces filtres." cols={[
            { h: "Date", c: (r) => <span className="whitespace-nowrap text-ink-mute">{dateFr(r.l.createdAt, true)}</span> },
            { h: "Action", c: (r) => <Chip tone={ACTIONS[r.l.action]?.[1] ?? "grey"}>{ACTIONS[r.l.action]?.[0] ?? r.l.action}</Chip> },
            { h: "Auteur", c: (r) => r.actor ? <span className="flex flex-col"><b className="whitespace-nowrap">{r.actor.firstName} {r.actor.lastName}</b><span className="text-xs text-ink-mute">{ROLE_LABEL[r.actor.role] ?? r.actor.role}</span></span> : <span className="text-ink-mute">Système</span> },
            { h: "Objet", c: (r) => <span className="flex flex-col"><span>{ENTITY[r.l.entity] ?? r.l.entity}</span>{r.l.entityId && <code className="max-w-[200px] truncate text-[11px] text-ink-mute">{r.l.entityId}</code>}</span> },
            { h: "Détail", c: (r) => Object.keys(r.l.meta ?? {}).length ? <code className="block max-w-[280px] truncate rounded-lg bg-[#f6f8fc] px-2 py-1 text-[11px]" title={JSON.stringify(r.l.meta)}>{Object.entries(r.l.meta).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ")}</code> : <span className="text-ink-mute">—</span> },
            { h: "IP", c: (r) => <span className="text-xs text-ink-mute">{r.l.ip ?? "—"}</span> },
          ]} />
        )}
      </Panel>
    </div>
  );
}
