"use client";
import Link from "next/link";
import { Download, Wallet } from "lucide-react";
import { Empty, Kpi, Loading, PageHeader, Panel, StatusBadge, Table, dateFr, money } from "@/components/app/kit";
import { apiUrl } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import type { Payment } from "./types";

const KIND: Record<string, string> = { frais_candidature: "Frais de dossier", reservation: "Réservation logement", caution: "Caution", loyer: "Loyer", service: "Service" };

/** Historique des paiements (étudiant ou parent : inclut ceux des enfants). */
export function Payments({ title = "Paiements", sub = "Frais de dossier, réservations et loyers, avec leurs reçus." }: { title?: string; sub?: string }) {
  const { data, loading } = useApi<Payment[]>("/paiements");
  const ok = (data ?? []).filter((p) => p.status === "reussi");
  const totals = ok.reduce<Record<string, number>>((acc, p) => ((acc[p.currency] = (acc[p.currency] ?? 0) + p.amount), acc), {});
  const escrow = ok.filter((p) => p.escrow === "bloque");
  return (
    <>
      <PageHeader title={title} sub={sub} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi icon={Wallet} label="Total payé" value={Object.entries(totals).map(([c, v]) => money(v, c)).join(" · ") || "0"} sub={`${ok.length} paiement${ok.length > 1 ? "s" : ""}`} />
        <Kpi icon={Wallet} tone="violet" label="En séquestre" value={escrow.length ? escrow.map((p) => money(p.amount, p.currency)).join(" · ") : "—"} sub="versé au bailleur après l'entrée" />
        <Kpi icon={Wallet} tone="sun" label="En attente" value={(data ?? []).filter((p) => p.status === "en_attente").length} sub="paiements à finaliser" />
      </div>
      <Panel>
        {loading ? <Loading /> : !data?.length ? <Empty icon={Wallet} title="Aucun paiement" text="Tes frais de dossier et paiements Navilease apparaîtront ici." /> : (
          <Table rows={data} rowKey={(p) => p.id} cols={[
            { h: "Référence", c: (p) => <span className="font-mono text-xs">{p.reference}</span> },
            { h: "Objet", c: (p) => <span><b className="block text-[13px]">{KIND[p.kind] ?? p.kind}</b><span className="text-xs text-ink-mute">{p.meta.description}</span></span> },
            { h: "Montant", c: (p) => <b>{money(p.amount, p.currency)}</b> },
            { h: "Date", c: (p) => dateFr(p.paidAt ?? p.createdAt) },
            { h: "Statut", c: (p) => <span className="flex gap-1.5"><StatusBadge status={p.status} />{p.escrow !== "aucun" && <StatusBadge status={p.escrow} />}</span> },
            { h: "", c: (p) => p.status === "reussi" ? <a href={apiUrl(p.kind === "loyer" ? `/quittances/${p.reference}.pdf` : `/paiements/${p.reference}/recu.pdf`)} target="_blank" className="flex items-center gap-1 text-[13px] font-bold text-brand-600"><Download size={14} />{p.kind === "loyer" ? "Quittance" : "Reçu"}</a> : p.status === "en_attente" ? <Link href={`/paiement/${p.reference}`} className="text-[13px] font-bold text-brand-600">Payer</Link> : null },
          ]} />
        )}
      </Panel>
    </>
  );
}
