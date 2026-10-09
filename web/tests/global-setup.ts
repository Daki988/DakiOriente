// Base de test : recréée à chaque exécution, migrée puis alimentée par le seed.
import { execSync } from "node:child_process";
import { Pool } from "pg";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL || "postgres://postgres@localhost:5433/navigoal_test";
  process.env.DATABASE_URL = url;
  const pool = new Pool({ connectionString: url });
  await pool.query("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  await pool.end();
  const env = { ...process.env, DATABASE_URL: url, ADMIN_EMAIL: "admin@test.local", ADMIN_PASSWORD: "Admin1234", SEED_DEMO: "0" };
  execSync("npx tsx scripts/migrate.mts && npx tsx scripts/seed.mts", { env, stdio: "pipe" });
}
