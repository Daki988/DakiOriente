"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ChevronRight, FileText, Inbox, KeyRound, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Alert, Avatar, Button, Dialog, Empty, Kpi, Loading, PageHeader, Panel, StatusBadge, Table, Tabs, dateFr, money, useToast } from "@/components/app/kit";
import { Field, FormError, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { ACTIVE, BOOKING_STATUS, addMonths, type Booking, type BookingRow } from "../shared";

type T = "demandes" | "actives" | "terminees" | "refusees" | "toutes";
type Detail = { booking: Booking; tenant: { firstName: string; lastName: string } | null; guarantor: { firstName: string; lastName: string } | null };
type Conv = { id: string; contextKind: string | null; contextId: string | null };
const GROUP: Record<Exclude<T, "toutes">, string[]> = { demandes: ["demande", "attente_garant"], actives: ACTIVE, terminees: ["sortie", "caution_restituee"], refusees: ["refusee", "annulee", "litige"] };

export function LandlordBookings() {
  const router = useRouter();
  const { data, error, loading, reload } = useApi<BookingRow[]>("/reservations");
  const [tab, setTab] = useState<T>("demandes");
  const [sel, setSel] = useState<string | null>(null);
  const rows = data ?? [];
  const count = (t: Exclude<T, "toutes">) => rows.filter((r) => GROUP[t].includes(r.b.status)).length;
  const shown = tab === "toutes" ? rows : rows.filter((r) => GROUP[tab].includes(r.b.status));
  const current = shown.find((r) => r.b.id === sel) ?? (tab === "demandes" ? shown[0] : undefined);
  const cur = rows[0]?.b.currency ?? "MAD";
  const escrow = rows.filter((r) => ["paiement_sequestre", "contrat_signe"].includes(r.b.status)).reduce((a, r) => a + r.b.rent + r.b.charges + r.b.deposit, 0);
  const deposits = rows.filter((r) => ["entree", "fonds_verses", "en_cours", "preavis"].includes(r.b.status)).reduce((a, r) => a + r.b.deposit, 0);
  const monthly = rows.filter((r) => ["en_cours", "preavis", "fonds_verses", "entree"].includes(r.b.status)).reduce((a, r) => a + r.b.rent + r.b.charges, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Demandes & réservations" sub={loading ? "Chargement…" : `${count("demandes")} demande${count("demandes") > 1 ? "s" : ""} en attente · ${count("actives")} réservation${count("actives") > 1 ? "s" : ""} en cours`} crumbs={[["Espace bailleur", "/bailleur"], ["Demandes & réservations"]]} />
      {error && <Alert tone="error" title="Chargement impossible" action={<Button size="sm" variant="ghost" onClick={reload}>Réessayer</Button>}>{error.message}</Alert>}
      <Tabs value={tab} onChange={(t) => { setTab(t); setSel(null); }} items={[["demandes", `Demandes (${count("demandes")})`], ["actives", `En cours (${count("actives")})`], ["terminees", `Terminées (${count("terminees")})`], ["refusees", `Refusées · annulées (${count("refusees")})`], ["toutes", `Toutes (${rows.length})`]]} />
      {loading ? <Loading /> : tab === "demandes" ? (
        !shown.length ? <Empty icon={Inbox} title="Aucune demande en attente" text="Les nouvelles demandes de réservation apparaissent ici. Vous êtes aussi prévenu par SMS et e-mail." /> : (
          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] [&>*]:min-w-0">
            <ul className="flex flex-col gap-2.5" aria-label="Demandes">
              {shown.map((r) => {
                const on = current?.b.id === r.b.id;
                return (
                  <li key={r.b.id}><button type="button" onClick={() => setSel(r.b.id)} aria-pressed={on} className={`card flex w-full items-start gap-3 rounded-[20px] p-4 text-left transition ${on ? "border-2 border-[#0f8a46] bg-[#f6fdf8]" : "hover:border-[#bfe9cf]"}`}>
                    <Avatar name={r.h.title} size={40} />
                    <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="truncate text-sm">{r.b.number}</b><StatusBadge status={r.b.status} /></span>
                      <span className="block truncate text-xs text-ink-mute">{r.h.title}</span>
                      <span className="block text-xs font-bold">{dateFr(r.b.startDate)} · {r.b.months} mois</span></span>
                  </button></li>
                );
              })}
            </ul>
            {current && <RequestPanel key={current.b.id} row={current} onDone={() => { setSel(null); reload(); }} />}
          </div>
        )
      ) : (
        <Panel>
          <Table rows={shown} rowKey={(r) => r.b.id} onRow={(r) => router.push(`/navilease/reservations/${r.b.id}`)} empty="Aucune réservation dans cette catégorie."
            cols={[
              { h: "Réservation", c: (r) => <b>{r.b.number}</b> },
              { h: "Logement", c: (r) => <span className="block max-w-[220px] truncate">{r.h.title}</span> },
              { h: "Période", c: (r) => <span className="whitespace-nowrap text-ink-mute">{dateFr(r.b.startDate)} → {dateFr(addMonths(r.b.startDate, r.b.months))}</span> },
              { h: "Loyer", c: (r) => <span className="whitespace-nowrap">{money(r.b.rent, r.b.currency)}</span> },
              { h: "Statut", c: (r) => <StatusBadge status={r.b.status} label={BOOKING_STATUS[r.b.status]} /> },
              { h: "", c: () => <ChevronRight size={16} className="text-ink-mute" />, className: "w-8" },
            ]} />
        </Panel>
      )}
      <Panel title="Encaissements" icon={KeyRound}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi label="En séquestre" value={money(escrow, cur)} sub="versé après l'entrée du locataire" />
          <Kpi label="Loyers mensuels" value={money(monthly, cur)} sub="loyers + charges des locations en cours" />
          <Kpi label="Cautions bloquées" value={money(deposits, cur)} sub="restituées à la sortie" />
        </div>
      </Panel>
    </div>
  );
}

function RequestPanel({ row, onDone }: { row: BookingRow; onDone: () => void }) {
  const b = row.b;
  const toast = useToast();
  const d = useApi<Detail>(`/reservations/${b.id}`);
  const convs = useApi<Conv[]>("/conversations");
  const conv = convs.data?.find((c) => c.contextKind === "booking" && c.contextId === b.id);
  const act = useAction();
  const [refuse, setRefuse] = useState(false);
  const [note, setNote] = useState("");
  const tenant = d.data?.tenant ? `${d.data.tenant.firstName} ${d.data.tenant.lastName}` : "Locataire";
  const respond = async (accepter: boolean) => {
    const r = await act.run(() => api(`/reservations/${b.id}/reponse`, { body: { accepter, note: note.trim() || undefined } }));
    if (r !== undefined) { toast(accepter ? "Demande acceptée : le locataire est invité à payer en séquestre." : "Demande refusée."); setRefuse(false); onDone(); }
  };
  const total = b.rent + b.charges + b.deposit + b.serviceFee;
  return (
    <motion.section initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="card flex flex-col gap-4 rounded-[24px] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={tenant} size={52} />
        <div className="min-w-0 flex-1"><b className="text-xl">{tenant}</b><p className="text-sm text-ink-mute">{b.number} · reçue {dateFr(b.createdAt, true)}</p></div>
        {d.data?.guarantor && <span className="chip bg-[#e8f8ef] text-[#0f8a46]">Garant : {d.data.guarantor.firstName}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[["Logement", row.h.title], ["Entrée", dateFr(b.startDate)], ["Durée", `${b.months} mois`], ["Montant séquestre", money(total, b.currency)]].map(([l, v]) => <div key={l} className="rounded-2xl border border-slate-200/70 p-3"><span className="block text-[11px] font-bold uppercase text-ink-mute">{l}</span><b className="block truncate text-sm">{v}</b></div>)}
      </div>
      <div>
        <b className="text-[13px]">Dossier locataire</b>
        {b.documentIds.length ? <ul className="mt-2 flex flex-wrap gap-2">{b.documentIds.map((id, i) => <li key={id}><a href={`/api/documents/${id}/fichier/`} target="_blank" rel="noreferrer" className="chip border border-slate-200 bg-white py-1.5 text-ink-soft hover:border-brand-300"><FileText size={13} />Pièce {i + 1}</a></li>)}</ul> : <p className="mt-1 text-sm text-ink-mute">Aucune pièce jointe.</p>}
      </div>
      {b.message && <div><b className="text-[13px]">Message</b><blockquote className="mt-2 rounded-2xl bg-[#f6f8fe] p-4 text-sm italic text-ink-soft">« {b.message} »</blockquote></div>}
      {b.status === "attente_garant" && <Alert tone="warn">Locataire mineur : en attente de la validation du garant avant le paiement.</Alert>}
      <FormError error={act.error} />
      {b.status === "demande" ? (
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button icon={Check} loading={act.pending && !refuse} onClick={() => respond(true)} className="bg-[#0f8a46] hover:bg-[#0b6b37] sm:flex-1">Accepter la demande</Button>
          <Button variant="ghost" icon={X} className="border-[#ffd0d9] text-[#d42a50] hover:bg-[#fff1f3]" onClick={() => setRefuse(true)}>Refuser</Button>
          {conv && <Link href={`/messages/${conv.id}`} className="btn-ghost"><MessageCircle size={17} />Message</Link>}
        </div>
      ) : null}
      <Link href={`/navilease/reservations/${b.id}`} className="text-sm font-bold text-brand-700 hover:underline">Voir la réservation complète</Link>
      <Dialog open={refuse} onClose={() => setRefuse(false)} title="Refuser la demande">
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); respond(false); }}>
          <Field label="Motif (transmis au locataire)">{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Logement déjà réservé à ces dates…" />}</Field>
          <FormError error={act.error} />
          <Button type="submit" variant="danger" loading={act.pending}>Refuser la demande</Button>
        </form>
      </Dialog>
    </motion.section>
  );
}
