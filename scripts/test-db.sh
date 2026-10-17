#!/usr/bin/env bash
# Teste supabase/schema.sql + seed.sql sur une base PostgreSQL locale vide (imitation de Supabase).
# Usage : DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${DATABASE_URL:?Définissez DATABASE_URL vers une base PostgreSQL de test (elle sera remise à zéro)}"
TEST_DB="neam_print_test"

psql "$DB" -qAt -c "drop database if exists $TEST_DB" -c "create database $TEST_DB"
# \connect réutilise l’hôte et le port de DATABASE_URL
run() { psql "$DB" -q -v ON_ERROR_STOP=1 -c "\\connect $TEST_DB" -f "$1"; }

run supabase/tests/supabase-stubs.sql
run supabase/schema.sql
run supabase/schema.sql   # le schéma doit pouvoir être relancé sans erreur
run supabase/seed.sql
run supabase/seed.sql     # idem pour le catalogue
run supabase/tests/rls.test.sql
psql "$DB" -qAt -c "drop database $TEST_DB"
