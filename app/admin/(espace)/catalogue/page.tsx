import Link from "next/link";
import { toggleVisible } from "@/app/admin/actions";
import { CATALOG_ROLES, requireAdmin } from "@/lib/admin";
import { categories, getProducts } from "@/lib/catalog";
import { fcfa } from "@/lib/format";

export default async function Catalogue() {
  const me = await requireAdmin();
  const canEdit = CATALOG_ROLES.includes(me.role);
  const products = await getProducts({ includeHidden: true });
  const cats = categories(products);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-[28px] font-extrabold">Catalogue & prix</h1>
        {canEdit && <Link href="/admin/catalogue/nouveau" className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white">Ajouter un produit</Link>}
      </div>
      {!canEdit && <p className="rounded-xl bg-info-soft p-3 text-sm text-info">Lecture seule : seuls les administrateurs modifient les prix.</p>}
      {cats.map((c) => (
        <section key={c.slug} className="grid gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[.08em] text-muted">{c.name}</h2>
          <ul className="divide-y divide-[#efece4] overflow-hidden rounded-2xl border border-line bg-white">
            {products.filter((p) => p.categorySlug === c.slug).map((p) => (
              <li key={p.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Link href={`/admin/catalogue/${p.slug}`} className="min-w-0 flex-1 font-semibold hover:text-brand">
                  {p.name}
                  <span className="tabular block text-xs font-normal text-muted">
                    {p.tiers.map((t) => `${t.qty.toLocaleString("fr-FR")} ${p.unit} : ${fcfa(t.price)}`).join(" · ")}
                  </span>
                </Link>
                {canEdit ? (
                  <form action={toggleVisible.bind(null, p.slug)}>
                    <button className={`rounded-full px-3 py-1.5 text-xs font-bold ${p.visible ? "bg-ok-soft text-ok" : "bg-line text-muted"}`} aria-label={`${p.visible ? "Masquer" : "Afficher"} ${p.name}`}>
                      {p.visible ? "Visible" : "Masqué"}
                    </button>
                  </form>
                ) : <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${p.visible ? "bg-ok-soft text-ok" : "bg-line text-muted"}`}>{p.visible ? "Visible" : "Masqué"}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
