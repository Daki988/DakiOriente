import { drizzle } from "drizzle-orm/node-postgres";
import { creerPool } from "./pool";
import * as schema from "./schema";

/** URL de connexion : DATABASE_URL (local, CI) ou base Netlify (NETLIFY_DB_URL, injectée par Netlify DB). */
export function databaseUrl() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
  if (!url) throw new Error("Base de données non configurée : définir DATABASE_URL (ou activer Netlify DB).");
  return url;
}

type DB = ReturnType<typeof make>;
function make() {
  const url = databaseUrl();
  const pool = creerPool(url, process.env.NETLIFY ? 3 : 10);
  return drizzle({ client: pool, schema });
}

// Connexion paresseuse et partagée (évite d'ouvrir un pool à l'import et entre rechargements à chaud).
const g = globalThis as unknown as { __navigoalDb?: DB };
export const db = new Proxy({} as DB, {
  get(_, k) {
    g.__navigoalDb ??= make();
    const v = Reflect.get(g.__navigoalDb, k);
    return typeof v === "function" ? v.bind(g.__navigoalDb) : v;
  },
});
export type { DB };
export { schema };
