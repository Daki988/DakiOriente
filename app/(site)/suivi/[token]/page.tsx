import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chat } from "@/components/Icons";
import { dateFr, fcfa } from "@/lib/format";
import { getOrderByToken } from "@/lib/orders";
import { STEPS } from "@/lib/status";
import { waNeam } from "@/lib/site";
import { hasSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false, follow: false } };

export default async function Suivi({ params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabase) notFound();
  const o = await getOrderByToken((await params).token);
  if (!o) notFound();
  const first = o.customer_name.split(" ")[0];

  return (
    <div className="mx-auto grid max-w-xl gap-5 px-4 py-8">
      <header className="grid gap-1">
        <p className="text-xs font-bold tracking-[.08em] text-brand">SUIVI DE COMMANDE</p>
        <h1 className="text-4xl font-extrabold">{o.code}</h1>
        <p className="text-muted">Bonjour {first}, passée le {dateFr(o.created_at)}.</p>
      </header>

      {o.cancelled ? (
        <p className="rounded-2xl bg-danger-soft p-4 font-semibold text-danger">Cette commande a été annulée. Contactez-nous sur WhatsApp pour toute question.</p>
      ) : (
        <ol className="grid gap-0 rounded-3xl border border-line bg-white p-5">
          {STEPS.map((s, i) => {
            const state = i < o.status ? "done" : i === o.status ? "now" : "todo";
            return (
              <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
                {i < STEPS.length - 1 && <span className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 ${i < o.status ? "bg-brand" : "bg-line"}`} />}
                <span className={`relative z-10 grid size-6 flex-none place-items-center rounded-full text-xs font-bold ${state === "todo" ? "border-2 border-line bg-white text-muted" : "bg-brand text-white"} ${state === "now" ? "ring-4 ring-brand-soft" : ""}`}>
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span className={state === "todo" ? "text-muted" : "font-bold"}>{s}{state === "now" && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">En cours</span>}</span>
              </li>
            );
          })}
        </ol>
      )}

      <dl className="tabular grid grid-cols-[1fr_auto] gap-y-2 rounded-3xl border border-line bg-white p-5 text-sm">
        <dt className="text-muted">Produit</dt><dd className="text-right font-semibold">{o.product_name}</dd>
        <dt className="text-muted">Montant</dt><dd className="text-right font-semibold">{fcfa(o.amount)}</dd>
        <dt className="text-muted">Paiement</dt><dd className={`text-right font-semibold ${o.paid_at ? "text-ok" : "text-warn"}`}>{o.paid_at ? "Reçu" : "En attente"}</dd>
        <dt className="text-muted">Récupération</dt><dd className="text-right font-semibold">{o.delivery === "libreville" ? "Livraison à Libreville" : "Retrait à l’atelier"}</dd>
      </dl>

      <a href={waNeam(`Bonjour Neam Print, j’ai une question sur ma commande ${o.code}.`)} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold text-white">
        <Chat /> Une question ? WhatsApp
      </a>
    </div>
  );
}
