// Restaure une sauvegarde produite par sauvegarde.mts, dans une seule transaction : en cas d'erreur, rien n'est modifié.
// La base doit être au même niveau de migrations que la sauvegarde (appliquer d'abord outils/migrate.mjs).
// Usage : node outils/env.cjs outils/restauration.mjs sauvegardes/navigoal-AAAA-MM-JJ-HHMM.sql.gz --confirmer
import fs from "node:fs";
import zlib from "node:zlib";
import { Pool } from "pg";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
const fichier = process.argv[2];
if (!url || !fichier || !fs.existsSync(fichier)) throw new Error("Usage : restauration.mjs <fichier.sql.gz> --confirmer (DATABASE_URL requis).");
if (!process.argv.includes("--confirmer")) {
  console.log("Toutes les données actuelles seront remplacées par la sauvegarde. Relancez avec --confirmer pour continuer.");
  process.exit(1);
}
const sql = zlib.gunzipSync(fs.readFileSync(fichier)).toString("utf8").split("\n");
const tables = sql.find((l) => l.startsWith("-- TABLES "))?.slice(10).split(",");
if (!tables?.length) throw new Error("Fichier de sauvegarde invalide.");
const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;

const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
const c = await pool.connect();
try {
  await c.query("begin");
  await c.query(`truncate ${tables.map(ident).join(", ")} cascade`);
  let n = 0;
  for (const l of sql) if (l.startsWith("insert into ")) { await c.query(l); n++; }
  await c.query("commit");
  console.log(`Restauration terminée : ${tables.length} tables, ${n} lots insérés.`);
} catch (e) {
  await c.query("rollback");
  console.error("Restauration annulée, aucune donnée modifiée :", (e as Error).message);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
