"use client";

import { useActionState, useState } from "react";
import { saveProduct, type SaveState } from "@/app/admin/actions";
import type { Product } from "@/lib/catalog";
import { fcfa } from "@/lib/format";

const input = "w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-brand";
const label = "text-[13px] font-semibold text-muted";
const COLORS = [["yellow", "Jaune"], ["magenta", "Magenta"], ["cyan", "Cyan"], ["blue", "Bleu"], ["brand", "Violet"], ["ink", "Noir"]];

export function ProductForm({ product, isNew, optionsText, categories }: { product: Product; isNew: boolean; optionsText: string; categories: string[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProduct.bind(null, isNew ? null : product.slug), {});
  const [rows, setRows] = useState(() => [...product.tiers.map((t) => ({ qty: String(t.qty), price: String(t.price) })), { qty: "", price: "" }]);
  const [unit, setUnit] = useState(product.unit);

  const unitPrice = (q: string, p: string) => {
    const nq = Number(q.replace(",", ".")), np = Number(p.replace(/\s/g, ""));
    return nq > 0 && np > 0 ? `${fcfa(np / nq)} / ${unit === "m²" ? "m²" : unit}` : "";
  };

  return (
    <form action={action} className="grid gap-5">
      <section className="grid gap-3 rounded-2xl border border-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5"><span className={label}>Nom du produit</span><input name="name" required defaultValue={product.name} className={input} /></label>
          <label className="grid gap-1.5"><span className={label}>Catégorie</span>
            <input name="category" required list="cats" defaultValue={product.category} className={input} />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
        </div>
        {isNew && (
          <label className="grid gap-1.5"><span className={label}>Adresse de la page (facultatif, générée depuis le nom)</span>
            <input name="slug" placeholder="ex. carte-de-visite-kraft" className={input} /></label>
        )}
        <label className="grid gap-1.5"><span className={label}>Description</span>
          <textarea name="description" rows={3} maxLength={600} defaultValue={product.description} className={input} /></label>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="text-lg font-extrabold">Prix</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5"><span className={label}>Mode de prix</span>
            <select name="pricing" defaultValue={product.pricing} className={input}>
              <option value="pack">Par lots (quantités fixes : 100, 250…)</option>
              <option value="unit">À l’unité (quantité libre)</option>
              <option value="area">Au m² (dimensions saisies par le client)</option>
            </select></label>
          <label className="grid gap-1.5"><span className={label}>Unité</span>
            <select name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className={input}>
              {["ex.", "unité", "m²", "planche"].map((u) => <option key={u}>{u}</option>)}
            </select></label>
        </div>
        <table className="tabular w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-[.06em] text-muted">
            <th className="pb-1 font-bold">{unit === "m²" ? "À partir de (m²)" : "Quantité"}</th><th className="pb-1 font-bold">Prix (FCFA){unit === "m²" ? " / m²" : ""}</th><th className="pb-1 text-right font-bold">Prix unitaire</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="py-1 pr-2"><input name="tier_qty" inputMode="decimal" aria-label={`Quantité palier ${i + 1}`} value={r.qty} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} className={input} /></td>
                <td className="py-1 pr-2"><input name="tier_price" inputMode="numeric" aria-label={`Prix palier ${i + 1}`} value={r.price} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className={`${input} text-right`} /></td>
                <td className="py-1 text-right text-xs text-muted">{unit === "m²" ? "" : unitPrice(r.qty, r.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={() => setRows([...rows, { qty: "", price: "" }])} className="w-fit rounded-full border border-line px-3.5 py-2 text-sm font-semibold">Ajouter un palier</button>
        <p className="text-xs text-muted">Laissez une ligne vide pour la supprimer. En mode « au m² », le palier s’applique selon la surface totale commandée.</p>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="text-lg font-extrabold">Options</h2>
        <textarea name="options" rows={4} defaultValue={optionsText} className={`${input} font-mono text-sm`}
          placeholder={"Pelliculage : Mat | Brillant | Soft touch +20\nImpression : Recto-verso | Recto seul -10"} />
        <p className="text-xs text-muted">Une option par ligne : « Nom : choix 1 | choix 2 ». Un nombre en fin de choix ajoute ou retire un pourcentage du prix (ex. « Soft touch +20 »).</p>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="text-lg font-extrabold">Affichage</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="grid gap-1.5"><span className={label}>Largeur (mm)</span><input name="format_w" inputMode="numeric" defaultValue={product.formatMm?.[0] ?? ""} className={input} /></label>
          <label className="grid gap-1.5"><span className={label}>Hauteur (mm)</span><input name="format_h" inputMode="numeric" defaultValue={product.formatMm?.[1] ?? ""} className={input} /></label>
          <label className="grid gap-1.5"><span className={label}>Couleur du visuel</span>
            <select name="color" defaultValue={product.color} className={input}>{COLORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="grid gap-1.5"><span className={label}>Ordre</span><input name="sort" inputMode="numeric" defaultValue={product.sort} className={input} /></label>
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-semibold">
          <label className="flex items-center gap-2"><input type="checkbox" name="visible" defaultChecked={product.visible} className="size-5 accent-[#6b12ff]" /> Visible sur le site</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product.featured} className="size-5 accent-[#6b12ff]" /> Mis en avant sur l’accueil</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="customizable" defaultChecked={product.customizable} className="size-5 accent-[#6b12ff]" /> Personnalisable en ligne</label>
        </div>
      </section>

      {state.error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm text-ok">{state.ok}</p>}
      <button disabled={pending} className="w-fit rounded-full bg-brand px-6 py-3.5 font-bold text-white disabled:opacity-60">{pending ? "Enregistrement…" : isNew ? "Créer le produit" : "Enregistrer"}</button>
    </form>
  );
}
