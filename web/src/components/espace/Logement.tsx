"use client";
import Link from "next/link";
import { Bell, KeyRound, Search, Trash2 } from "lucide-react";
import { Empty, Loading, PageHeader, Panel, StatusBadge, dateFr, useToast } from "@/components/app/kit";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { etabById } from "@/lib/data";

type Booking = { b: { id: string; number: string; status: string; startDate: string; months: number; rent: number; currency: string }; h: { id: string; title: string; ville: string; quartier: string | null } };
type Alert = { id: string; criteria: { pays?: string; ville?: string; etablissement?: string; budgetMax?: number; type?: string }; active: boolean };

/** Mes réservations Navilease et mes alertes (élève, étudiant, parent). */
export function Logement({ title = "Mon logement" }: { title?: string }) {
  const toast = useToast();
  const b = useApi<Booking[]>("/reservations");
  const al = useApi<Alert[]>("/logements/alertes");
  const del = async (id: string) => { await api(`/logements/alertes/${id}`, { method: "DELETE" }); toast("Alerte supprimée"); al.reload(); };
  return (
    <>
      <PageHeader title={title} sub="Réservations, contrats, loyers et quittances Navilease." actions={<Link href="/navilease/logements" className="btn-primary"><Search size={16} />Chercher un logement</Link>} />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <Panel title="Réservations" icon={KeyRound}>
          {b.loading ? <Loading /> : !b.data?.length ? <Empty icon={KeyRound} title="Aucune réservation" text="Trouve un studio ou une colocation vérifiés près de ton école ; le paiement reste en séquestre jusqu'à ton entrée." action={<Link href="/navilease/logements" className="btn-primary">Voir les logements</Link>} /> : (
            <div className="flex flex-col gap-3">
              {b.data.map(({ b: x, h }) => (
                <Link key={x.id} href={`/navilease/reservations/${x.id}`} className="flex flex-col gap-2 rounded-2xl border border-[#eef1f8] p-4 hover:border-brand-200 sm:flex-row sm:items-center sm:justify-between">
                  <span><b className="block">{h.title}</b><span className="text-[13px] text-ink-mute">{[h.quartier, h.ville].filter(Boolean).join(", ")} · {x.number} · entrée le {dateFr(x.startDate)} · {x.months} mois</span></span>
                  <StatusBadge status={x.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Mes alertes" icon={Bell} tone="sun">
          {!al.data?.length ? <p className="text-[13px] text-ink-mute">Crée une alerte depuis la recherche pour être prévenu·e des nouveaux logements.</p> : al.data.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 text-[13px]">
              <span>{[a.criteria.etablissement ? `près de ${etabById[a.criteria.etablissement]?.sigle ?? a.criteria.etablissement}` : null, a.criteria.ville, a.criteria.type, a.criteria.budgetMax ? `≤ ${a.criteria.budgetMax}` : null].filter(Boolean).join(" · ") || "Tous logements"}</span>
              <button onClick={() => del(a.id)} aria-label="Supprimer l'alerte" className="text-ink-mute hover:text-[#d42a50]"><Trash2 size={15} /></button>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
