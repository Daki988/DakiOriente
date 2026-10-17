import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { dateFr, fcfa } from "@/lib/format";
import { STEPS, STEP_STYLE } from "@/lib/status";
import { supabaseService } from "@/lib/supabase";

type Row = {
  code: string; created_at: string; customer_name: string; product_name: string; amount: number; status: number;
  cancelled: boolean; payment_method: string | null; paid_at: string | null; file_path: string | null; design_service: boolean;
  selection: { qty?: number; unit?: string; widthCm?: number; heightCm?: number };
};

const qtyLabel = (s: Row["selection"]) =>
  s.widthCm ? `${s.widthCm}×${s.heightCm} cm × ${s.qty}` : `${(s.qty ?? 0).toLocaleString("fr-FR")} ${s.unit ?? ""}`;

export default async function Commandes({ searchParams }: { searchParams: Promise<{ etape?: string; q?: string; annulees?: string }> }) {
  await requireAdmin();
  const { etape, q, annulees } = await searchParams;
  const { data } = await supabaseService()
    .from("orders")
    .select("code, created_at, customer_name, product_name, amount, status, cancelled, payment_method, paid_at, file_path, design_service, selection")
    .order("created_at", { ascending: false })
    .limit(500);
  const all = (data ?? []) as Row[];
  const active = all.filter((o) => !o.cancelled);

  const step = etape !== undefined && etape !== "" ? Number(etape) : null;
  const needle = (q ?? "").trim().toLowerCase();
  const list = (annulees ? all.filter((o) => o.cancelled) : active)
    .filter((o) => step === null || o.status === step)
    .filter((o) => !needle || `${o.code} ${o.customer_name} ${o.product_name}`.toLowerCase().includes(needle));

  const due = active.filter((o) => !o.paid_at);
  const kpis = [
    { label: "Nouvelles commandes", value: String(active.filter((o) => o.status === 0).length), sub: "à vérifier", alert: active.some((o) => o.status === 0) },
    { label: "En impression", value: String(active.filter((o) => o.status === 2).length), sub: "à l’atelier" },
    { label: "Prêtes à remettre", value: String(active.filter((o) => o.status === 3).length), sub: "client à prévenir" },
    { label: "À encaisser", value: fcfa(due.reduce((s, o) => s + o.amount, 0)), sub: `${due.length} commande${due.length > 1 ? "s" : ""}` },
  ];
  const href = (p: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(Object.entries({ q, ...p }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
    return `/admin${sp.size ? `?${sp}` : ""}`;
  };
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm ${on ? "bg-ink font-bold text-white" : "border border-line bg-white font-medium"}`;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-[28px] font-extrabold">Commandes</h1>
        <form className="w-full sm:w-72" action="/admin">
          {etape && <input type="hidden" name="etape" value={etape} />}
          <input name="q" defaultValue={q} placeholder="Rechercher un client, un n°…" aria-label="Rechercher une commande"
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 outline-none focus:border-brand" />
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={`grid gap-0.5 rounded-2xl border p-4 ${k.alert ? "border-[#f7c873] bg-[#fffbf0]" : "border-line bg-white"}`}>
            <span className="text-xs font-semibold text-muted">{k.label}</span>
            <b className="tabular font-display text-[26px] tracking-tight">{k.value}</b>
            <span className="text-xs text-muted">{k.sub}</span>
          </div>
        ))}
      </div>

      <nav aria-label="Filtrer par étape" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Link href={href({})} className={chip(step === null && !annulees)}>Toutes · {active.length}</Link>
        {STEPS.map((s, i) => (
          <Link key={s} href={href({ etape: String(i) })} className={`whitespace-nowrap ${chip(step === i && !annulees)}`}>{s} · {active.filter((o) => o.status === i).length}</Link>
        ))}
        <Link href={href({ annulees: "1" })} className={`whitespace-nowrap ${chip(Boolean(annulees))}`}>Annulées · {all.length - active.length}</Link>
      </nav>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">
          {all.length === 0 ? "Aucune commande pour l’instant. Elles apparaîtront ici dès qu’un client commande sur le site." : "Aucune commande ne correspond."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="tabular w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#fbfaf7] text-left text-[11px] uppercase tracking-[.06em] text-muted">
                {["N°", "Client", "Produit", "Montant", "Paiement", "Étape", "Fichier", "Reçue"].map((h) => (
                  <th key={h} className={`border-b border-line px-3 py-2.5 font-bold ${h === "Montant" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.code} className="border-b border-[#efece4] last:border-0 hover:bg-[#fbfaf7]">
                  <td className="whitespace-nowrap px-3 py-3"><Link href={`/admin/commandes/${o.code}`} className="font-bold text-brand hover:underline">{o.code}</Link></td>
                  <td className="px-3 py-3">{o.customer_name}</td>
                  <td className="px-3 py-3">{o.product_name}<span className="block text-xs text-muted">{qtyLabel(o.selection)}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-bold">{fcfa(o.amount)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{o.paid_at ? <span className="text-ok">Payé · {o.payment_method}</span> : <span className="text-danger">À encaisser</span>}</td>
                  <td className="px-3 py-3"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${STEP_STYLE[o.status]}`}>{STEPS[o.status]}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{o.file_path ? "Fichier client" : o.design_service ? "Graphiste" : "—"}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">{dateFr(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
