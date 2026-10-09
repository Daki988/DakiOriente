"use client";
import Link from "next/link";
import { Archive, Eye, Pencil, Send } from "lucide-react";
import { useState } from "react";
import { Button, Chip, Dialog, StatusBadge, money, useToast } from "@/components/app/kit";
import { api } from "@/lib/api";
import { ACTIVE, Cover, VERIF, type BookingRow, type Housing } from "../shared";

export const KYC: Record<string, [string, "grey" | "sun" | "green" | "rose"]> = { non_soumis: ["Non soumise", "grey"], en_revue: ["En vérification", "sun"], valide: ["Identité vérifiée", "green"], refuse: ["Refusée", "rose"] };
/** Versements aux bailleurs au Maroc. */
export const PAYOUT_METHODS: [string, string][] = [["virement", "Virement bancaire (RIB marocain)"], ["orange_money", "Orange Money Maroc"], ["inwi_money", "inwi money"], ["agence", "Cash Plus / Wafacash"]];

/** Occupation : nombre de réservations actives par annonce. */
export const activeByHousing = (rows: BookingRow[]) => rows.reduce<Record<string, number>>((a, r) => (ACTIVE.includes(r.b.status) ? { ...a, [r.h.id]: (a[r.h.id] ?? 0) + 1 } : a), {});
export const requestsByHousing = (rows: BookingRow[]) => rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.h.id]: (a[r.h.id] ?? 0) + 1 }), {});

/** Tableau des annonces du bailleur avec actions (modifier, voir, soumettre, archiver). */
export function ListingTable({ rows, bookings, onChange, compact }: { rows: Housing[]; bookings: BookingRow[]; onChange: () => void; compact?: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Housing | null>(null);
  const occ = activeByHousing(bookings), req = requestsByHousing(bookings);
  const act = async (h: Housing, what: "moderation" | "archiver") => {
    setBusy(h.id + what);
    try {
      await api(`/bailleur/logements/${h.id}/${what}`, { body: {} });
      toast(what === "moderation" ? "Annonce soumise à la modération." : "Annonce archivée.");
      setConfirm(null); onChange();
    } catch (e) { toast(e instanceof Error ? e.message : "Action impossible.", "error"); } finally { setBusy(null); }
  };
  if (!rows.length) return <p className="py-8 text-center text-sm text-ink-mute">Aucune annonce dans cette catégorie.</p>;
  return (
    <>
      <ul className="flex flex-col divide-y divide-[#f1f4fb]">
        {rows.map((h) => (
          <li key={h.id} className="flex flex-col gap-3 py-3.5 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="h-12 w-16 shrink-0 overflow-hidden rounded-xl"><Cover h={h} iconSize={18} /></span>
              <div className="min-w-0">
                <Link href={`/bailleur/annonces/${h.id}`} className="block truncate font-bold hover:text-brand-600">{h.title}</Link>
                <span className="flex flex-wrap items-center gap-1.5 text-xs text-ink-mute">{money(h.rent, h.currency)} / mois · {h.ville}<span className={`chip py-0.5 ${VERIF[h.verification].cls}`}>{VERIF[h.verification].label}</span></span>
                {h.status === "refuse" && h.moderationNote && <span className="mt-1 block text-xs font-semibold text-[#d42a50]">À corriger : {h.moderationNote}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-5">
              <StatusBadge status={h.status} />
              {!compact && <span className="text-xs text-ink-mute">{h.photos.length} photo{h.photos.length > 1 ? "s" : ""}</span>}
              <span className="text-xs text-ink-mute" title="Réservations actives / capacité">Occupation <b className="text-ink">{h.status === "publie" ? `${occ[h.id] ?? 0}/${h.capacity}` : "—"}</b></span>
              <span className="text-xs text-ink-mute">Demandes <b className="text-ink">{req[h.id] ?? 0}</b></span>
              <div className="flex gap-1.5">
                <Link href={`/bailleur/annonces/${h.id}`} aria-label={`Modifier ${h.title}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50"><Pencil size={15} /></Link>
                {h.status === "publie" && <Link href={`/navilease/logements/${h.id}`} aria-label={`Voir l'annonce ${h.title}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50"><Eye size={15} /></Link>}
                {["brouillon", "refuse"].includes(h.status) && <Button size="sm" variant="ghost" icon={Send} loading={busy === h.id + "moderation"} onClick={() => act(h, "moderation")}>Soumettre</Button>}
                {h.status !== "archive" && !compact && <button type="button" aria-label={`Archiver ${h.title}`} onClick={() => setConfirm(h)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-ink-mute hover:border-[#ffd0d9] hover:text-[#d42a50]"><Archive size={15} /></button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title="Archiver l'annonce ?">
        <p className="mb-4 text-sm text-ink-mute">« {confirm?.title} » ne sera plus visible dans les recherches. Les réservations en cours ne sont pas affectées.</p>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirm(null)}>Annuler</Button><Button variant="danger" icon={Archive} loading={busy === confirm?.id + "archiver"} onClick={() => confirm && act(confirm, "archiver")}>Archiver</Button></div>
      </Dialog>
    </>
  );
}

export const KycChip = ({ status }: { status: string }) => <Chip tone={(KYC[status] ?? KYC.non_soumis)[1]}>{(KYC[status] ?? KYC.non_soumis)[0]}</Chip>;
