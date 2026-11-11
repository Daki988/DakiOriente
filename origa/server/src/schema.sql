-- Schéma du serveur national Origa (PostgreSQL 16). Idempotent.

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       TEXT NOT NULL UNIQUE,          -- format E.164, ex. +24107xxxxxx
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('eleveur','agent','dge','veterinaire','bceg','admin','operateur')),
  farm_id     TEXT,                          -- profil éleveur
  farm_ids    TEXT[] NOT NULL DEFAULT '{}',  -- profil agent technique
  operator_id TEXT,                          -- abattoir / distributeur sous convention
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id          BIGSERIAL PRIMARY KEY,
  phone       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_phone_idx ON otp_codes (phone, created_at DESC);

-- Enregistrements synchronisés : une ligne par objet métier (ferme, bande, fiche, lot…).
CREATE TABLE IF NOT EXISTS records (
  tbl        TEXT NOT NULL,
  key        TEXT NOT NULL,
  farm_id    TEXT,
  payload    JSONB NOT NULL,
  client_at  TIMESTAMPTZ NOT NULL,           -- horodatage de la saisie sur le terrain
  server_at  TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  seq        BIGSERIAL,                      -- curseur de synchronisation
  updated_by INT REFERENCES users(id),
  PRIMARY KEY (tbl, key)
);
CREATE INDEX IF NOT EXISTS records_seq_idx ON records (seq);
CREATE INDEX IF NOT EXISTS records_farm_idx ON records (farm_id);

-- Conflits de synchronisation : jamais perdus en silence, consultables par la DGE.
CREATE TABLE IF NOT EXISTS conflicts (
  id        BIGSERIAL PRIMARY KEY,
  tbl       TEXT NOT NULL,
  key       TEXT NOT NULL,
  incoming  JSONB NOT NULL,
  current   JSONB NOT NULL,
  user_id   INT REFERENCES users(id),
  at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Journal d'audit en ajout seul, chaîné par SHA-256 (audits ANINF).
CREATE TABLE IF NOT EXISTS audit (
  id        BIGSERIAL PRIMARY KEY,
  at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id   INT,
  action    TEXT NOT NULL,
  tbl       TEXT,
  key       TEXT,
  prev_hash TEXT NOT NULL,
  hash      TEXT NOT NULL
);

CREATE OR REPLACE FUNCTION audit_no_change() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Le journal d''audit est en ajout seul'; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_immutable ON audit;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit FOR EACH ROW EXECUTE FUNCTION audit_no_change();

CREATE TABLE IF NOT EXISTS scans (
  id      BIGSERIAL PRIMARY KEY,
  lot_id  TEXT NOT NULL,
  valid   BOOLEAN NOT NULL,
  at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- v1.0 : demandes d'accès (pas d'inscription libre) et dernière connexion.
CREATE TABLE IF NOT EXISTS access_requests (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  profile       TEXT NOT NULL CHECK (profile IN ('eleveur','agent','operateur','veterinaire','bceg','autre')),
  organisation  TEXT NOT NULL,
  province      TEXT,
  reference     TEXT,
  message       TEXT,
  consent       BOOLEAN NOT NULL,
  status        TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente','approuvee','refusee')),
  decided_at    TIMESTAMPTZ,
  decided_by    TEXT,
  decision_note TEXT,
  user_id       INT REFERENCES users(id)
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- v1.1 : profils MAEDR (données agrégées) et ANINF (audit).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('eleveur','agent','dge','veterinaire','bceg','admin','operateur','maedr','aninf'));

-- v1.2 : journal des rapports envoyés par e-mail (un seul envoi par type et par période).
CREATE TABLE IF NOT EXISTS report_runs (
  id         BIGSERIAL PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('hebdomadaire','mensuel','finBande')),
  period     TEXT NOT NULL,
  label      TEXT NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipients TEXT[] NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('envoye','echec')),
  error      TEXT,
  attempts   INT NOT NULL DEFAULT 1,
  UNIQUE (kind, period)
);
