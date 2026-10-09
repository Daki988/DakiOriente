"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, KeyRound, Search } from "lucide-react";
import { Alert, Button, Empty, Loading, PageHeader, StatusBadge, dateFr, money } from "@/components/app/kit";
import { useUser } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import { BOOKING_STATUS, Cover, addMonths, type BookingRow } from "./shared";

/** Liste des réservations du locataire ou du parent (garant). */
export function MyBookings() {
  const me = useUser();
  const { data, error, loading, reload } = useApi<BookingRow[]>("/reservations");
  const parent = me.role === "parent";
  return (
    <div>
      <PageHeader title={me.role === "bailleur" ? "Réservations" : parent ? "Logement de vos enfants" : "Mes réservations"} sub={parent ? "Réservations Navilease de vos enfants et de celles dont vous êtes garant." : "Suis tes demandes, paiements, contrat et loyers."}
        actions={!parent && me.role !== "bailleur" ? <Link href="/navilease/logements" className="btn-primary"><Search size={17} />Chercher un logement</Link> : undefined} />
      {loading ? <Loading /> : error ? <Alert tone="error" title="Chargement impossible" action={<Button size="sm" variant="ghost" onClick={reload}>Réessayer</Button>}>{error.message}</Alert>
        : !data?.length ? <Empty icon={KeyRound} title="Aucune réservation pour l'instant" text={parent ? "Quand votre enfant demande un logement, la réservation apparaît ici pour que vous puissiez vous porter garant et payer." : "Trouve un logement vérifié près de ton école et envoie ta demande : rien n'est débité avant l'acceptation."} action={!parent ? <Link href="/navilease/logements" className="btn-primary">Voir les logements</Link> : undefined} />
        : <div className="grid gap-3 [&>*]:min-w-0">{data.map(({ b, h }, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link href={`/navilease/reservations/${b.id}`} className="card flex items-center gap-4 rounded-[20px] p-3 pr-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-28"><Cover h={{ ...h, type: "studio" }} iconSize={26} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b className="truncate">{h.title}</b><StatusBadge status={b.status} label={BOOKING_STATUS[b.status]} /></div>
                <p className="truncate text-sm text-ink-mute">{b.number} · {[h.quartier, h.ville].filter(Boolean).join(", ")} · {dateFr(b.startDate)} → {dateFr(addMonths(b.startDate, b.months))}</p>
                <p className="text-sm font-bold text-brand-600">{money(b.rent, b.currency)} <span className="font-normal text-ink-mute">/ mois</span></p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-ink-mute" />
            </Link>
          </motion.div>
        ))}</div>}
    </div>
  );
}
