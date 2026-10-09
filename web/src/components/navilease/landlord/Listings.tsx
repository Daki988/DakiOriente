"use client";
import Link from "next/link";
import { House, Plus } from "lucide-react";
import { useState } from "react";
import { Alert, Button, Empty, Loading, PageHeader, Panel, Tabs } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import type { BookingRow, Housing } from "../shared";
import { ListingTable } from "./common";

type T = "all" | "publie" | "en_moderation" | "brouillon" | "refuse" | "archive";

export function ListingsManager() {
  const listings = useApi<Housing[]>("/bailleur/logements");
  const bookings = useApi<BookingRow[]>("/reservations");
  const [tab, setTab] = useState<T>("all");
  const L = listings.data ?? [];
  const n = (s: string) => L.filter((h) => h.status === s).length;
  const shown = tab === "all" ? L.filter((h) => h.status !== "archive") : L.filter((h) => h.status === tab);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mes annonces" sub="Créez, modifiez et soumettez vos logements à la modération Navilease." crumbs={[["Espace bailleur", "/bailleur"], ["Mes annonces"]]}
        actions={<Link href="/bailleur/annonces/nouvelle" className="btn-primary bg-[#0f8a46] hover:bg-[#0b6b37]"><Plus size={17} />Nouvelle annonce</Link>} />
      <Alert tone="info">Chaque annonce est vérifiée par l&apos;équipe Navilease avant publication : au moins 3 photos réelles, prix cohérent avec le quartier, description fidèle. Toute modification d&apos;une annonce publiée la repasse en modération.</Alert>
      <Panel title="Annonces" icon={House} action={<Tabs value={tab} onChange={setTab} items={[["all", `Actives (${L.length - n("archive")})`], ["publie", `Publiées (${n("publie")})`], ["en_moderation", `En modération (${n("en_moderation")})`], ["brouillon", `Brouillons (${n("brouillon")})`], ["refuse", `À corriger (${n("refuse")})`], ["archive", `Archivées (${n("archive")})`]]} />}>
        {listings.loading ? <Loading /> : listings.error ? <Alert tone="error" title="Chargement impossible" action={<Button size="sm" variant="ghost" onClick={listings.reload}>Réessayer</Button>}>{listings.error.message}</Alert>
          : !L.length ? <Empty icon={House} title="Aucune annonce" text="Créez votre première annonce : enregistrez-la en brouillon, ajoutez vos photos puis soumettez-la." action={<Link href="/bailleur/annonces/nouvelle" className="btn-primary">Créer une annonce</Link>} />
          : <ListingTable rows={shown} bookings={bookings.data ?? []} onChange={listings.reload} />}
      </Panel>
    </div>
  );
}
