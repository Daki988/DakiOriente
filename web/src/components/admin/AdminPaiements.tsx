"use client";
import { CheckCircle2, Download, FileDown, Lock, RotateCcw, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Chip, Kpi, Loading, Panel, StatusBadge, Table, dateFr, money } from "@/components/app/kit";
import { Select } from "@/components/app/form";
import { useApi } from "@/hooks/useApi";
import { AdminHeader, LoadError, Reveal, pct, qs } from "./shared";

type P = { id: string; reference: string; kind: string; amount: number; currency: string; provider: string; method: string; status: string; escrow: string; meta: { description?: string } & Record<string, unknown>; paidAt: string | null; createdAt: string };
type Row = { p: P; payer: { firstName: string; lastName: string } };

export const KIND: Record<string, string> = { frais_candidature: "Frais de dossier", reservation: "Réservation (1er loyer)", caution: "Dépôt de garantie", loyer: "Loyer", service: "Frais de service Navilease" };
const METHOD: Record<string, string> = { airtel_money: "Airtel Money", moov_money: "Moov Money", orange_money: "Orange Money", wave: "Wave", free_money: "Free Money", inwi_money: "inwi money", carte: "Carte bancaire", virement: "Virement", agence: "Cash Plus / Wafacash" };
const STATUTS: [string, string][] = [["reussi", "Payé"], ["en_attente", "En attente"], ["initie", "Initié"], ["echoue", "Échoué"], ["rembourse", "Remboursé"], ["annule", "Annulé"]];
const ESCROW: [string, string][] = [["bloque", "En séquestre"], ["libere", "Versé"], ["rembourse", "Remboursé"], ["litige", "Gelé (litige)"], ["aucun", "Sans séquestre"]];

const byCur = (rows: Row[], f: (r: Row) => boolean) => Object.entries(rows.filter(f).reduce<Record<string, number>>((a, r) => ((a[r.p.currency] = (a[r.p.currency] ?? 0) + r.p.amount), a), {}));
const Multi = ({ v }: { v: [string, number][] }) => v.length ? <span className="flex flex-col text-[22px]">{v.map(([c, n]) => <span key={c}>{money(n, c)}</span>)}</span> : <>0</>;

export function AdminPaiements() {
  const [statut, setStatut] = useState("");
  const [sequestre, setSequestre] = useState("");
  const [type, setType] = useState("");
  const all = useApi<Row[]>("/admin/paiements");
  const list = useApi<Row[]>(`/admin/paiements${qs({ statut, sequestre, type })}`);
  const rows = useMemo(() => all.data ?? [], [all.data]);

  const k = useMemo(() => {
    const done = rows.filter((r) => ["reussi", "echoue"].includes(r.p.status));
    const methods = Object.entries(rows.filter((r) => r.p.status === "reussi").reduce<Record<string, number>>((a, r) => ((a[r.p.method] = (a[r.p.method] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
    return {
      volume: byCur(rows, (r) => r.p.status === "reussi"), ok: rows.filter((r) => r.p.status === "reussi").length, rate: pct(rows.filter((r) => r.p.status === "reussi").length, done.length),
      escrow: byCur(rows, (r) => r.p.escrow === "bloque"), refunds: rows.filter((r) => r.p.status === "rembourse" || r.p.escrow === "rembourse").length, methods,
      nOk: methods.reduce((t, [, n]) => t + n, 0),
    };
  }, [rows]);

  const exportCsv = () => {
    const data = list.data ?? [];
    const head = ["reference", "date", "payeur", "objet", "type", "montant", "devise", "moyen", "statut", "sequestre"];
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [head.join(";"), ...data.map((r) => [r.p.reference, r.p.createdAt.slice(0, 19).replace("T", " "), `${r.payer.firstName} ${r.payer.lastName}`, r.p.meta?.description ?? KIND[r.p.kind], r.p.kind, r.p.amount, r.p.currency, METHOD[r.p.method] ?? r.p.method, r.p.status, r.p.escrow].map(cell).join(";"))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `navigoal-paiements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-w-0">
      <AdminHeader title="Paiements" sub="Transactions, séquestre Navilease et remboursements" actions={<Button variant="ghost" icon={Download} onClick={exportCsv} disabled={!list.data?.length}>Export comptable (CSV)</Button>} />
      {all.error ? <LoadError error={all.error} reload={all.reload} /> : all.loading && !all.data ? <Loading /> : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Reveal i={0}><Kpi icon={Wallet} label="Volume encaissé" value={<Multi v={k.volume} />} sub={`${k.ok} transaction${k.ok > 1 ? "s" : ""} réussie${k.ok > 1 ? "s" : ""}`} /></Reveal>
            <Reveal i={1}><Kpi icon={CheckCircle2} tone="green" label="Taux de succès" value={k.rate} sub="réussis / (réussis + échoués)" /></Reveal>
            <Reveal i={2}><Kpi icon={Lock} tone="violet" label="En séquestre" value={<Multi v={k.escrow} />} sub="fonds Navilease bloqués" /></Reveal>
            <Reveal i={3}><Kpi icon={RotateCcw} tone="rose" label="Remboursements" value={k.refunds} sub="paiements ou séquestres remboursés" /></Reveal>
          </div>

          <Panel title="Transactions" icon={Wallet} action={list.data && <Chip tone="grey">{list.data.length}{list.data.length >= 300 ? "+" : ""}</Chip>}>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Select aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value)} options={STATUTS} placeholder="Statut : tous" />
              <Select aria-label="Séquestre" value={sequestre} onChange={(e) => setSequestre(e.target.value)} options={ESCROW} placeholder="Séquestre : tous" />
              <Select aria-label="Type" value={type} onChange={(e) => setType(e.target.value)} options={Object.entries(KIND)} placeholder="Type : tous" />
            </div>
            {list.error ? <LoadError error={list.error} reload={list.reload} /> : list.loading && !list.data ? <Loading /> : (
              <Table rows={list.data ?? []} rowKey={(r) => r.p.id} empty="Aucune transaction pour ces filtres." cols={[
                { h: "Référence", c: (r) => <b className="whitespace-nowrap text-brand-700">{r.p.reference}</b> },
                { h: "Payeur", c: (r) => <span className="whitespace-nowrap font-semibold">{r.payer.firstName} {r.payer.lastName}</span> },
                { h: "Objet", c: (r) => <span className="block max-w-[240px] truncate">{r.p.meta?.description ?? KIND[r.p.kind] ?? r.p.kind}</span> },
                { h: "Montant", className: "text-right", c: (r) => <b className="whitespace-nowrap">{r.p.status === "rembourse" ? "− " : ""}{money(r.p.amount, r.p.currency)}</b> },
                { h: "Moyen", c: (r) => <span className="whitespace-nowrap">{METHOD[r.p.method] ?? r.p.method}</span> },
                { h: "Statut", c: (r) => <span className="flex flex-wrap gap-1"><StatusBadge status={r.p.status} />{r.p.escrow !== "aucun" && <StatusBadge status={r.p.escrow === "rembourse" ? "rembourse" : r.p.escrow} label={r.p.escrow === "litige" ? "Gelé" : undefined} />}</span> },
                { h: "Date", c: (r) => <span className="whitespace-nowrap text-ink-mute">{dateFr(r.p.paidAt ?? r.p.createdAt, true)}</span> },
                { h: <span className="sr-only">Reçu</span>, className: "text-right", c: (r) => r.p.status === "reussi" ? <a href={`/api/paiements/${encodeURIComponent(r.p.reference)}/recu.pdf/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-600" aria-label={`Reçu ${r.p.reference}`}><FileDown size={15} />Reçu</a> : null },
              ]} />
            )}
            {k.methods.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-[#eef1f8] pt-4" aria-label="Répartition des paiements réussis par moyen">
                {k.methods.map(([m, n]) => <span key={m} className="flex items-center gap-2 rounded-xl border border-slate-200/80 px-3 py-2 text-[13px] font-bold">{METHOD[m] ?? m}<span className="font-semibold text-ink-mute">{pct(n, k.nOk)}</span></span>)}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
