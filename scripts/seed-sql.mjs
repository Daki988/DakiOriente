// Génère supabase/seed.sql à partir de content/catalogue.json.
// Usage : node scripts/seed-sql.mjs
import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(readFileSync(new URL("../content/catalogue.json", import.meta.url), "utf8"));
const s = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `${s(JSON.stringify(v))}::jsonb`;
const arr = (v) => (v ? `'{${v.join(",")}}'::int[]` : "null");

const rows = products.map((p) =>
  `  (${[s(p.slug), s(p.name), s(p.category), s(p.categorySlug), s(p.color), s(p.description), s(p.unit), s(p.pricing),
    j(p.tiers), j(p.options), arr(p.formatMm), p.customizable, p.visible, p.featured, p.sort].join(", ")})`
);

const sql = `-- Catalogue de base Neam Print (généré par scripts/seed-sql.mjs — ne pas modifier à la main)
-- Prix indicatifs repris de 24hprint.ma, convertis à 61 FCFA pour 1 MAD. À ajuster dans le back-office.
-- Ré-exécutable : les produits existants (même slug) ne sont pas écrasés.
insert into public.products
  (slug, name, category, category_slug, color, description, unit, pricing, tiers, options, format_mm, customizable, visible, featured, sort)
values
${rows.join(",\n")}
on conflict (slug) do nothing;
`;
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`seed.sql : ${products.length} produits`);
