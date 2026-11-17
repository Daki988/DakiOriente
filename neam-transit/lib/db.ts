import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedDemo } from "./demo";

/**
 * Base SQLite embarquée (module natif node:sqlite, Node ≥ 22.13).
 * Un seul fichier : facile à sauvegarder. Pour monter en charge, migrer vers PostgreSQL
 * en gardant les mêmes requêtes (lib/queries.ts est le seul point d'accès).
 */

export const DATA_DIR = process.env.NEAM_DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS transitaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  ville TEXT NOT NULL,
  adresse TEXT NOT NULL,
  telephone TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  email TEXT,
  gerant TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rccm TEXT,
  nif TEXT,
  agrement_douane TEXT,
  entrepots TEXT NOT NULL DEFAULT '[]',
  marchandises_refusees TEXT NOT NULL DEFAULT '[]',
  modes_paiement TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','verifie','refuse','suspendu')),
  badges TEXT NOT NULL DEFAULT '[]',
  note_admin TEXT,
  modif_en_attente TEXT,
  demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transitaire_id INTEGER NOT NULL REFERENCES transitaires(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  fichier TEXT NOT NULL,
  nom_original TEXT NOT NULL,
  mime TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS offres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transitaire_id INTEGER NOT NULL REFERENCES transitaires(id) ON DELETE CASCADE,
  origine_pays TEXT NOT NULL,
  origine_ville TEXT NOT NULL,
  mode TEXT NOT NULL,
  prix_xaf INTEGER NOT NULL,
  minimum REAL NOT NULL DEFAULT 0,
  frais_fixes_xaf INTEGER NOT NULL DEFAULT 0,
  diviseur_vol INTEGER NOT NULL DEFAULT 6000,
  dedouanement_inclus INTEGER NOT NULL DEFAULT 0,
  livraison TEXT NOT NULL DEFAULT 'retrait' CHECK (livraison IN ('retrait','grand_libreville','tout_gabon')),
  villes_desservies TEXT NOT NULL DEFAULT '[]',
  inclus TEXT NOT NULL DEFAULT '',
  non_inclus TEXT NOT NULL DEFAULT '',
  delai_min INTEGER NOT NULL,
  delai_max INTEGER NOT NULL,
  marchandises TEXT NOT NULL DEFAULT '["generale"]',
  prochain_depart TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','valide','rejete','archive')),
  remplace_id INTEGER,
  motif_rejet TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  validated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_offres_recherche ON offres(statut, origine_pays, mode);

CREATE TABLE IF NOT EXISTS demandes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  origine_pays TEXT NOT NULL,
  origine_ville TEXT,
  ville_destination TEXT NOT NULL,
  mode TEXT,
  poids REAL,
  volume REAL,
  quantite INTEGER,
  marchandise TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS demande_transitaires (
  demande_id INTEGER NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  transitaire_id INTEGER NOT NULL REFERENCES transitaires(id) ON DELETE CASCADE,
  token_avis TEXT NOT NULL UNIQUE,
  PRIMARY KEY (demande_id, transitaire_id)
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transitaire_id INTEGER NOT NULL REFERENCES transitaires(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp','appel','devis')),
  demande_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS avis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transitaire_id INTEGER NOT NULL REFERENCES transitaires(id) ON DELETE CASCADE,
  demande_id INTEGER NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  famille TEXT NOT NULL CHECK (famille IN ('aerien','maritime')),
  note_prix INTEGER NOT NULL,
  note_delai INTEGER NOT NULL,
  note_etat INTEGER NOT NULL,
  note_service INTEGER NOT NULL,
  commentaire TEXT NOT NULL DEFAULT '',
  date_remise TEXT NOT NULL,
  date_reception TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','publie','rejete')),
  reponse TEXT,
  reponse_statut TEXT CHECK (reponse_statut IN ('en_attente','publie','rejete')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  UNIQUE (transitaire_id, demande_id)
);

CREATE TABLE IF NOT EXISTS otp (
  telephone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  tentatives INTEGER NOT NULL DEFAULT 0,
  envoye_at INTEGER NOT NULL
);
`;

const globalForDb = globalThis as unknown as { __neamDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (globalForDb.__neamDb) return globalForDb.__neamDb;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "neam-transit.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  if (process.env.NEAM_DEMO === "1") {
    const n = db.prepare("SELECT COUNT(*) AS n FROM transitaires").get() as { n: number };
    if (n.n === 0) seedDemo(db);
  }
  globalForDb.__neamDb = db;
  return db;
}

/** Exécute une fonction dans une transaction. */
export function tx<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const r = fn(db);
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
