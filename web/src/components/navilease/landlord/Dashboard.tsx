"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, BedDouble, CheckCircle2, Clock, House, Inbox, Lock, Plus, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Avatar, Button, Empty, Kpi, Loading, PageHeader, Panel, Tabs, dateFr, money } from "@/components/app/kit";
import { useUser } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import type { LandlordInfo } from "@/app/(app)/bailleur/landlord";
import { addMonths, period, type BookingRow, type Housing } from "../shared";
import { KycChip, ListingTable, activeByHousing } from "./common";

const EARNING = ["entree", "fonds_verses", "en_cours", "preavis", "sortie", "caution_restituee"];

export function LandlordDashboard({ info }: { info: LandlordInfo | null }) {
  const me = useUser();
  const listings = useApi<Housing[]>("/bailleur/logements");
  const bookings = useApi<BookingRow[]>("/reservations");
  const [tab, setTab] = useState<"all" | "publie" | "en_moderation" | "brouillon">("all");
  const L = useMemo(() => listings.data ?? [], [listings.data]), B = useMemo(() => bookings.data ?? [], [bookings.data]);
  const cur = B[0]?.b.currency ?? L.find((h) => h.status === "publie")?.currency ?? L[0]?.currency ?? "MAD";

  const k = useMemo(() => {
    const published = L.filter((h) => h.status === "publie");
    const occ = activeByHousing(B);
    const occupied = published.filter((h) => occ[h.id]).length;
    const monthly = B.filter((r) => ["en_cours", "preavis", "fonds_verses", "entree"].includes(r.b.status)).reduce((a, r) => a + r.b.rent + r.b.charges, 0);
    const pending = B.filter((r) => r.b.status === "demande");
    const escrow = B.reduce((a, r) => a + (["paiement_sequestre", "contrat_signe"].includes(r.b.status) ? r.b.rent + r.b.charges + r.b.deposit : ["entree", "fonds_verses", "en_cours", "preavis"].includes(r.b.status) ? r.b.deposit : 0), 0);
    return { published: published.length, occupied, rate: published.length ? Math.round((occupied / published.length) * 100) : 0, monthly, pending, escrow };
  }, [L, B]);

  // Revenus estimés (loyer + charges) des 12 derniers mois, d'après les périodes de location.
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const p = period(d);
      const v = B.filter((r) => EARNING.includes(r.b.status)).reduce((a, r) => {
        const s = period(new Date(r.b.startDate + "T12:00:00")), e = period(addMonths(r.b.startDate, r.b.months - 1));
        return p >= s && p <= e ? a + r.b.rent + r.b.charges : a;
      }, 0);
      return { p, label: d.toLocaleDateString("fr-FR", { month: "short" }), v };
    });
  }, [B]);
  const max = Math.max(...months.map((m) => m.v), 1);
  const [hover, setHover] = useState<number | null>(null);

  const shown = tab === "all" ? L : L.filter((h) => h.status === tab);
  const loading = listings.loading || bookings.loading;
  const err = listings.error ?? bookings.error;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={`Bonjour ${me.firstName}`} sub="Voici l'activité de vos logements Navilease" actions={<Link href="/bailleur/annonces/nouvelle" className="btn-primary bg-[#0f8a46] hover:bg-[#0b6b37]"><Plus size={17} />Publier une annonce</Link>} />
      {err && <Alert tone="error" title="Chargement incomplet" action={<Button size="sm" variant="ghost" onClick={() => { listings.reload(); bookings.reload(); }}>Réessayer</Button>}>{err.message}</Alert>}
      {info && info.kycStatus !== "valide" && (
        <Alert tone={info.kycStatus === "refuse" ? "error" : "warn"} title={info.kycStatus === "en_revue" ? "Vérification d'identité en cours" : "Vérifiez votre identité"} action={info.kycStatus !== "en_revue" ? <Link href="/bailleur/profil" className="btn-ghost py-2 text-[13px]">Lancer la vérification</Link> : undefined}>
          {info.kycStatus === "en_revue" ? "Notre équipe conformité examine vos pièces (48 h ouvrées). Le badge « Identité vérifiée » sera ajouté à vos annonces." : "La vérification est obligatoire pour recevoir des versements et rassure les familles : les mineurs ne voient que les bailleurs vérifiés."}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={BedDouble} tone="green" label="Taux d'occupation" value={loading ? "…" : `${k.rate} %`} sub={`${k.occupied} annonce${k.occupied > 1 ? "s" : ""} occupée${k.occupied > 1 ? "s" : ""} sur ${k.published} publiée${k.published > 1 ? "s" : ""}`} />
        <Kpi icon={Wallet} tone="blue" label="Revenus mensuels" value={loading ? "…" : money(k.monthly, cur)} sub="estimés : loyers + charges en cours" />
        <Kpi icon={Inbox} tone="sun" label="Demandes en attente" value={loading ? "…" : k.pending.length} sub="réponse attendue sous 48 h" />
        <Kpi icon={Lock} tone="violet" label="En séquestre" value={loading ? "…" : money(k.escrow, cur)} sub="versé après entrée · cautions à la sortie" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
        <Panel title={`Revenus mensuels estimés (${cur === "MAD" ? "MAD" : "F CFA"})`} icon={BarChart3}>
          {loading ? <Loading /> : (
            <div className="relative">
              <div className="flex h-56 items-end gap-1.5 border-b border-[#e4e9f5] sm:gap-3" role="img" aria-label={`Revenus des 12 derniers mois : ${months.map((m) => `${m.label} ${money(m.v, cur)}`).join(", ")}`}>
                {months.map((m, i) => (
                  <div key={m.p} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                    {hover === i && <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] font-bold text-white">{m.label} · {money(m.v, cur)}</span>}
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((m.v / max) * 100, m.v ? 3 : 1)}%` }} transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                      className={`w-full rounded-t-[4px] ${i === 11 ? "bg-[#0f8a46]" : hover === i ? "bg-brand-500" : "bg-brand-200"}`} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5 sm:gap-3">{months.map((m) => <span key={m.p} className="flex-1 text-center text-[11px] capitalize text-ink-mute">{m.label.replace(".", "")}</span>)}</div>
              {!months.some((m) => m.v) && <p className="mt-3 text-sm text-ink-mute">Les revenus apparaîtront dès la première entrée d&apos;un locataire.</p>}
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Demandes à traiter" icon={Inbox} action={<Link href="/bailleur/reservations" className="text-sm font-bold text-[#0f8a46] hover:underline">Tout voir</Link>}>
            {loading ? <Loading /> : k.pending.length ? (
              <ul className="flex flex-col gap-2.5">
                {k.pending.slice(0, 4).map(({ b, h }) => (
                  <li key={b.id}><Link href={`/navilease/reservations/${b.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 p-3 hover:border-[#bfe9cf] hover:bg-[#effbf3]">
                    <Avatar name={h.title} size={38} />
                    <span className="min-w-0 flex-1"><b className="block truncate text-sm">{h.title}</b><span className="block truncate text-xs text-ink-mute">{b.number} · {dateFr(b.startDate)} · {b.months} mois</span></span>
                    <span className="chip shrink-0 bg-sun-100 text-[#a55a00]"><Clock size={12} />{expires(b.createdAt)}</span>
                  </Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-mute">Aucune demande en attente.</p>}
          </Panel>
          <Panel title="Vérification KYC" icon={ShieldCheck} action={info && <KycChip status={info.kycStatus} />}>
            <ul className="flex flex-col gap-2 text-sm">
              {[["Pièce d'identité", info && info.kycStatus !== "non_soumis"], ["Titre de propriété ou mandat", info && info.kycStatus !== "non_soumis"], ["Moyen de versement", !!info?.payoutMethod], ["Validation par l'équipe Navilease", info?.kycStatus === "valide"]].map(([l, ok]) => (
                <li key={l as string} className="flex items-center gap-2.5">{ok ? <CheckCircle2 size={17} className="text-[#0f8a46]" /> : <Clock size={17} className="text-ink-mute" />}<span className={ok ? "" : "text-ink-mute"}>{l}</span></li>
              ))}
            </ul>
            {info?.kycStatus !== "valide" && <Link href="/bailleur/profil" className="btn-ghost py-2.5 text-[13px]">Compléter ma vérification</Link>}
          </Panel>
        </div>
      </div>

      <Panel title="Mes annonces" icon={House} action={<Tabs value={tab} onChange={setTab} items={[["all", `Toutes (${L.length})`], ["publie", "Publiées"], ["en_moderation", "En modération"], ["brouillon", "Brouillons"]]} />}>
        {listings.loading ? <Loading /> : !L.length ? <Empty icon={House} title="Aucune annonce" text="Publiez votre premier logement : il sera visible des étudiants admis dans les écoles proches après modération." action={<Link href="/bailleur/annonces/nouvelle" className="btn-primary">Créer une annonce</Link>} />
          : <ListingTable rows={shown} bookings={B} onChange={listings.reload} compact />}
      </Panel>
    </div>
  );
}

function expires(created: string) {
  const h = Math.round(48 - (Date.now() - new Date(created).getTime()) / 3.6e6);
  return h > 0 ? `Expire dans ${h} h` : "À traiter";
}

