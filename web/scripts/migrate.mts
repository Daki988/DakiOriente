// Applique les migrations SQL (drizzle/) sur la base configurée. Exécuté au build Netlify et en local.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { creerPool } from "../src/server/db/pool";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
if (!url) {
  console.log("Migrations ignorées : aucune base configurée.");
  process.exit(0);
}
const pool = creerPool(url);
await migrate(drizzle({ client: pool }), { migrationsFolder: "drizzle" });
await pool.end();
console.log("Migrations appliquées.");
