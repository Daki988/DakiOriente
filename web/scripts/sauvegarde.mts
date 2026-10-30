// Sauvegarde de la base PostgreSQL, sans dépendre de pg_dump (souvent absent des hébergements mutualisés).
// Produit sauvegardes/navigoal-AAAA-MM-JJ-HHMM.sql.gz (et -fichiers.tar.gz pour les fichiers déposés) : une instruction INSERT … json_populate_recordset par lot de lignes,
// tables dans l'ordre des clés étrangères. Garde les SAUVEGARDE_GARDER dernières (14 par défaut).
// Si SAUVEGARDE_EMAIL est défini (et SMTP configuré), envoie aussi le fichier par e-mail : copie hors du serveur.
// Usage : node outils/env.cjs outils/sauvegarde.mjs (cPanel, tâche cron quotidienne) ; restauration : outils/restauration.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { creerPool } from "../src/server/db/pool";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
if (!url) throw new Error("DATABASE_URL non défini.");
const dossier = path.resolve(process.env.SAUVEGARDE_DOSSIER || "sauvegardes");
const garder = Number(process.env.SAUVEGARDE_GARDER || 14);
const LOT = 500;

const pool = creerPool(url);
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await pool.query(sql, p)).rows as T[];
const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;

// Tables du schéma public, triées pour que chaque table vienne après celles qu'elle référence.
const tables = (await q<{ t: string }>("select table_name as t from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1")).map((r) => r.t);
const fks = await q<{ t: string; ref: string }>(`select tc.table_name as t, ccu.table_name as ref from information_schema.table_constraints tc
  join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
  where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`);
const ordre: string[] = [];
const vus = new Set<string>();
const visiter = (t: string, pile = new Set<string>()) => {
  if (vus.has(t) || pile.has(t)) return;
  pile.add(t);
  for (const f of fks) if (f.t === t && f.ref !== t) visiter(f.ref, pile);
  vus.add(t);
  ordre.push(t);
};
tables.forEach((t) => visiter(t));

const date = new Date();
const nom = `navigoal-${date.toISOString().slice(0, 16).replace("T", "-").replace(":", "")}.sql.gz`;
fs.mkdirSync(dossier, { recursive: true });
if (!fs.existsSync(path.join(dossier, ".htaccess"))) fs.writeFileSync(path.join(dossier, ".htaccess"), "Require all denied\n");
const fichier = path.join(dossier, nom);
const gz = zlib.createGzip();
const sortie = fs.createWriteStream(fichier);
gz.pipe(sortie);
const ecrire = (s: string) => new Promise<void>((ok) => (gz.write(s + "\n") ? ok() : gz.once("drain", ok)));

const migration = await q<{ hash: string }>("select hash from drizzle.__drizzle_migrations order by created_at desc limit 1").catch(() => []);
await ecrire(`-- Sauvegarde Navigoal du ${date.toISOString()} · ${ordre.length} tables · migration ${migration[0]?.hash?.slice(0, 12) ?? "inconnue"}`);
await ecrire(`-- TABLES ${ordre.join(",")}`);
let lignes = 0;
for (const t of ordre) {
  const [{ n }] = await q<{ n: number }>(`select count(*)::int as n from ${ident(t)}`);
  for (let off = 0; off < n; off += LOT) {
    const [{ j }] = await q<{ j: unknown }>(`select json_agg(x) as j from (select * from ${ident(t)} order by ctid limit ${LOT} offset ${off}) x`);
    if (!j) continue;
    const json = JSON.stringify(j).replace(/'/g, "''");
    await ecrire(`insert into ${ident(t)} select * from json_populate_recordset(null::${ident(t)}, '${json}');`);
  }
  lignes += n;
}
gz.end();
await new Promise((ok) => sortie.on("finish", ok));
await pool.end();
const taille = fs.statSync(fichier).size;
console.log(`Sauvegarde : ${fichier} (${ordre.length} tables, ${lignes} lignes, ${(taille / 1e6).toFixed(2)} Mo)`);

// Fichiers déposés (pièces justificatives, photos d'annonces) : archive à part, si le dossier existe.
const stockage = path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), ".data", "uploads"));
if (fs.existsSync(stockage)) {
  const archive = path.join(dossier, nom.replace(".sql.gz", "-fichiers.tar.gz"));
  try {
    execFileSync("tar", ["-czf", archive, "-C", path.dirname(stockage), path.basename(stockage)]);
    console.log(`Fichiers : ${archive} (${(fs.statSync(archive).size / 1e6).toFixed(2)} Mo)`);
  } catch (e) {
    console.error("Archive des fichiers impossible (commande tar) :", (e as Error).message);
  }
}

// Rotation : on garde les N plus récentes.
for (const re of [/^navigoal-.*\d\.sql\.gz$/, /^navigoal-.*-fichiers\.tar\.gz$/])
  for (const f of fs.readdirSync(dossier).filter((x) => re.test(x)).sort().reverse().slice(garder)) fs.rmSync(path.join(dossier, f));

// Copie hors du serveur par e-mail (pièce jointe limitée à 15 Mo).
if (process.env.SAUVEGARDE_EMAIL && process.env.SMTP_HOST) {
  if (taille > 15e6) console.log("Sauvegarde trop lourde pour l'e-mail : téléchargez-la depuis le gestionnaire de fichiers cPanel.");
  else {
    const nodemailer = await import("nodemailer");
    const port = Number(process.env.SMTP_PORT || 465);
    await nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465, auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined })
      .sendMail({ from: process.env.MAIL_FROM || "Navigoal <contact@navigoal.net>", to: process.env.SAUVEGARDE_EMAIL, subject: `Sauvegarde Navigoal ${date.toISOString().slice(0, 10)}`, text: `${ordre.length} tables, ${lignes} lignes. Fichier confidentiel : à conserver en lieu sûr.`, attachments: [{ filename: nom, path: fichier }] });
    console.log(`Copie envoyée à ${process.env.SAUVEGARDE_EMAIL}.`);
  }
}
