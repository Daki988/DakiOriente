// Vérifie que le projet Supabase est bien branché et configuré.
// Usage : node --env-file=.env.local scripts/check-supabase.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let failed = 0;
const check = (ok, msg, fix) => { console.log(`${ok ? "✓" : "✗"} ${msg}${ok || !fix ? "" : `\n    → ${fix}`}`); if (!ok) failed++; };

if (!url || !anonKey || !serviceKey) {
  console.error("Variables manquantes : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (voir .env.example).");
  process.exit(1);
}
const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const { count: products, error: pErr } = await service.from("products").select("*", { count: "exact", head: true });
check(!pErr, "connexion à la base", pErr && `${pErr.message} — exécutez supabase/schema.sql dans le SQL Editor`);
check((products ?? 0) > 0, `catalogue chargé (${products ?? 0} produits)`, "exécutez supabase/seed.sql dans le SQL Editor");

const { data: admins } = await service.from("admins").select("email, role");
const sup = (admins ?? []).filter((a) => a.role === "super_admin");
check(sup.length > 0, `super administrateur : ${sup.map((a) => a.email).join(", ") || "aucun"}`, "relancez la fin de supabase/schema.sql");

const { data: users } = await service.auth.admin.listUsers();
for (const a of sup) {
  check((users?.users ?? []).some((u) => u.email?.toLowerCase() === a.email), `compte de connexion créé pour ${a.email}`,
    "Authentication › Users › Add user › Create new user (cochez « Auto Confirm User »)");
}

const { data: bucket } = await service.storage.getBucket("print-files");
check(Boolean(bucket) && bucket.public === false, "dossier privé des fichiers d’impression (print-files)", "relancez supabase/schema.sql");

const { data: leak } = await anon.from("orders").select("id").limit(1);
check((leak ?? []).length === 0, "commandes invisibles avec la clé publique (sécurité RLS)", "vérifiez que la RLS est activée sur public.orders");
const { data: pub } = await anon.from("products").select("slug").limit(1);
check((pub ?? []).length > 0, "catalogue lisible par les visiteurs");

console.log(failed ? `\n${failed} point(s) à corriger.` : "\nSupabase est prêt.");
process.exit(failed ? 1 : 0);
