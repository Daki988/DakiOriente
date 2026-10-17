import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { addNote, advanceOrder, backOrder, markPaid, toggleCancel, unmarkPaid } from "@/app/admin/actions";
import { ChevronLeft, Chat } from "@/components/Icons";
import { requireAdmin } from "@/lib/admin";
import { dateFr, fcfa } from "@/lib/format";
import { NEXT_ACTION, PAYMENT_METHODS, STEPS, STEP_STYLE } from "@/lib/status";
import { SITE_URL, waLink } from "@/lib/site";
import { FILES_BUCKET, supabaseService } from "@/lib/supabase";

type Order = {
  id: string; code: string; token: string; created_at: string; customer_name: string; customer_phone: string; customer_email: string | null;
  product_name: string; product_slug: string; amount: number; status: number; cancelled: boolean; payment_method: string | null; paid_at: string | null;
  delivery: string; delivery_address: string | null; notes: string | null; design_service: boolean; file_path: string | null; file_name: string | null;
  selection: { qty: number; unit?: string; widthCm?: number; heightCm?: number; area?: number; choices?: Record<string, string>; breakdown?: Record<string, number> };
};
type Event = { created_at: string; kind: string; detail: string | null; actor: string | null };

/** Message WhatsApp pré-rempli, envoyé à la main par l'atelier. */
function statusMessage(o: Order) {
  const first = o.customer_name.split(" ")[0];
  const track = `${SITE_URL}/suivi/${o.token}`;
  if (o.cancelled) return `Bonjour ${first}, votre commande ${o.code} a été annulée. N’hésitez pas à nous écrire pour toute question. Neam Print`;
  const pay = o.paid_at ? "" : ` Montant à régler : ${fcfa(o.amount)} (Airtel Money, Moov Money ou espèces).`;
  const byStep = [
    `Bonjour ${first}, nous avons bien reçu votre commande ${o.code} (${o.product_name}). Nous vérifions votre fichier et revenons vers vous très vite.${pay}`,
    `Bonjour ${first}, le bon à tirer de votre commande ${o.code} est validé.${pay}`,
    `Bonjour ${first}, votre commande ${o.code} est en impression.`,
    `Bonjour ${first}, votre commande ${o.code} est prête ! ${o.delivery === "libreville" ? "Nous vous contactons pour la livraison." : "Vous pouvez passer la récupérer à l’atelier."}${pay}`,
    `Bonjour ${first}, votre commande ${o.code} a été livrée. Merci pour votre confiance !`,
  ];
  return `${byStep[o.status]}\nSuivi : ${track}\nNeam Print`;
}

export default async function CommandeDetail({ params }: { params: Promise<{ code: string }> }) {
  await requireAdmin();
  const { code } = await params;
  const db = supabaseService();
  const { data } = await db.from("orders").select("*").eq("code", code).maybeSingle();
  if (!data) notFound();
  const o = data as Order;
  const [{ data: events }, signed] = await Promise.all([
    db.from("order_events").select("created_at, kind, detail, actor").eq("order_id", o.id).order("created_at", { ascending: false }),
    o.file_path ? db.storage.from(FILES_BUCKET).createSignedUrl(o.file_path, 3600, { download: o.file_name ?? true }) : Promise.resolve(null),
  ]);
  const fileUrl = signed && !signed.error ? signed.data.signedUrl : null;
  const s = o.selection;
  const b = s.breakdown ?? {};

  const box = "grid gap-3 rounded-2xl border border-line bg-white p-4";
  const btn = "rounded-full px-4 py-2.5 text-sm font-bold";

  return (
    <div className="grid gap-5">
      <Link href="/admin" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ChevronLeft className="size-4" /> Commandes</Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-extrabold">{o.code}</h1>
        {o.cancelled ? <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger">Annulée</span>
          : <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STEP_STYLE[o.status]}`}>{STEPS[o.status]}</span>}
        <span className="text-sm text-muted">Reçue le {dateFr(o.created_at)}</span>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {/* Étapes */}
          <section className={box} aria-label="Avancement">
            <ol className="grid grid-cols-5 gap-1.5">
              {STEPS.map((st, i) => (
                <li key={st} className={`grid gap-1.5 text-center text-[11px] font-semibold ${i <= o.status ? "text-ink" : "text-muted"}`}>
                  <span className={`h-1.5 rounded ${i < o.status ? "bg-brand" : i === o.status ? "bg-brand/60" : "bg-line"}`} />{st}
                </li>
              ))}
            </ol>
            {!o.cancelled && (
              <div className="flex flex-wrap gap-2">
                {o.status < STEPS.length - 1 && (
                  <form action={advanceOrder.bind(null, o.code)}><button className={`${btn} bg-brand text-white`}>{NEXT_ACTION[o.status]}</button></form>
                )}
                {o.status > 0 && <form action={backOrder.bind(null, o.code)}><button className={`${btn} border border-line bg-white`}>Revenir à l’étape précédente</button></form>}
              </div>
            )}
            <a href={waLink(o.customer_phone, statusMessage(o))} target="_blank" rel="noopener" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-ok">
              <Chat className="size-4" /> Prévenir le client sur WhatsApp (message prêt)
            </a>
          </section>

          {/* Produit */}
          <section className={box}>
            <h2 className="text-lg font-extrabold">{o.product_name}</h2>
            <dl className="tabular grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">Quantité</dt>
              <dd className="text-right font-semibold">{s.widthCm ? `${s.widthCm} × ${s.heightCm} cm × ${s.qty} (${s.area} m²)` : `${s.qty.toLocaleString("fr-FR")} ${s.unit ?? ""}`}</dd>
              {Object.entries(s.choices ?? {}).map(([k, v]) => (<Fragment key={k}><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v}</dd></Fragment>))}
              <dt className="text-muted">Prix produit</dt><dd className="text-right font-semibold">{fcfa(b.base ?? 0)}</dd>
              {!!b.options && <><dt className="text-muted">Options</dt><dd className="text-right font-semibold">{fcfa(b.options)}</dd></>}
              {!!b.design && <><dt className="text-muted">Graphiste</dt><dd className="text-right font-semibold">{fcfa(b.design)}</dd></>}
              {!!b.delivery && <><dt className="text-muted">Livraison</dt><dd className="text-right font-semibold">{fcfa(b.delivery)}</dd></>}
              <dt className="border-t border-line pt-2 font-bold">Total</dt><dd className="border-t border-line pt-2 text-right font-display text-xl font-extrabold">{fcfa(o.amount)}</dd>
            </dl>
          </section>

          {/* Fichier */}
          <section className={box}>
            <h2 className="text-lg font-extrabold">Fichier d’impression</h2>
            {o.file_path ? (
              fileUrl ? (
                <a href={fileUrl} className="flex items-center justify-between gap-3 rounded-xl bg-paper p-3">
                  <span className="min-w-0 truncate font-semibold">{o.file_name}</span><span className="whitespace-nowrap text-sm font-bold text-brand">Télécharger</span>
                </a>
              ) : <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">Fichier annoncé mais non reçu (envoi interrompu). Demandez-le au client sur WhatsApp.</p>
            ) : o.design_service ? (
              <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand">Création par un graphiste demandée.</p>
            ) : <p className="text-sm text-muted">Aucun fichier.</p>}
            {o.notes && <p className="whitespace-pre-line rounded-xl bg-paper p-3 text-sm">{o.notes}</p>}
          </section>

          {/* Historique */}
          <section className={box}>
            <h2 className="text-lg font-extrabold">Historique</h2>
            <form action={addNote.bind(null, o.code)} className="flex gap-2">
              <input name="note" placeholder="Ajouter une note interne…" aria-label="Note interne" className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-brand" />
              <button className={`${btn} bg-ink text-white`}>Ajouter</button>
            </form>
            <ol className="grid gap-2 text-sm">
              {((events ?? []) as Event[]).map((e, i) => (
                <li key={i} className="grid gap-0.5 border-l-2 border-line pl-3">
                  <span className="font-semibold">{e.detail}</span>
                  <span className="text-xs text-muted">{dateFr(e.created_at)}{e.actor ? ` · ${e.actor}` : ""}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="grid gap-4 lg:sticky lg:top-6">
          <section className={box}>
            <h2 className="text-lg font-extrabold">Client</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">Nom</dt><dd className="text-right font-semibold">{o.customer_name}</dd>
              <dt className="text-muted">WhatsApp</dt><dd className="select-all text-right font-semibold">{o.customer_phone}</dd>
              {o.customer_email && <><dt className="text-muted">E-mail</dt><dd className="select-all text-right font-semibold">{o.customer_email}</dd></>}
              <dt className="text-muted">Récupération</dt><dd className="text-right font-semibold">{o.delivery === "libreville" ? "Livraison" : "Retrait atelier"}</dd>
              {o.delivery_address && <><dt className="text-muted">Adresse</dt><dd className="text-right font-semibold">{o.delivery_address}</dd></>}
            </dl>
          </section>

          <section className={box}>
            <h2 className="text-lg font-extrabold">Paiement</h2>
            {o.paid_at ? (
              <>
                <p className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-ok">Payé · {o.payment_method} · {dateFr(o.paid_at)}</p>
                <form action={unmarkPaid.bind(null, o.code)}><button className="text-sm font-semibold text-muted underline">Annuler le paiement</button></form>
              </>
            ) : (
              <form action={markPaid.bind(null, o.code)} className="flex gap-2">
                <select name="method" aria-label="Moyen de paiement" className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5">
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <button className={`${btn} bg-ink text-white`}>Marquer payé</button>
              </form>
            )}
            <p className="tabular text-sm text-muted">Montant : <b className="text-ink">{fcfa(o.amount)}</b></p>
          </section>

          <form action={toggleCancel.bind(null, o.code)}>
            <button className={`${btn} w-full border ${o.cancelled ? "border-line bg-white" : "border-danger/30 bg-white text-danger"}`}>
              {o.cancelled ? "Réactiver la commande" : "Annuler la commande"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
