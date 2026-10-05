<?php
declare(strict_types=1);

namespace Database;

use App\Core\DB;

/** Création du schéma (portable) et chargement des données de démonstration. */
final class Migrator
{
    public static function install(bool $seed = true, bool $fresh = false): void
    {
        $schema = require __DIR__ . '/schema.php';
        $driver = DB::driver();
        $pk = match ($driver) {
            'sqlite' => 'INTEGER PRIMARY KEY AUTOINCREMENT',
            'pgsql'  => 'SERIAL PRIMARY KEY',
            default  => 'INT AUTO_INCREMENT PRIMARY KEY',
        };
        $ts = $driver === 'pgsql' ? 'TIMESTAMP NULL' : 'DATETIME NULL';
        $pdo = DB::pdo();

        if ($fresh) {
            if ($driver === 'mysql') {
                $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
            }
            foreach (array_reverse(array_keys($schema)) as $table) {
                if ($table !== '_indexes') {
                    $pdo->exec("DROP TABLE IF EXISTS $table" . ($driver === 'pgsql' ? ' CASCADE' : ''));
                }
            }
            if ($driver === 'mysql') {
                $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
            }
        }

        foreach ($schema as $table => $sql) {
            if ($table === '_indexes') {
                continue;
            }
            $sql = str_replace(['{PK}', '{TS}'], [$pk, $ts], $sql);
            if ($driver === 'mysql') {
                $sql .= ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
            }
            $pdo->exec($sql);
        }
        foreach ($schema['_indexes'] as $idx) {
            $pdo->exec($idx);
        }

        if ($seed) {
            (require __DIR__ . '/seed.php')();
        }
    }

    /** Mise à jour d'une base existante : ajoute les colonnes apparues depuis l'installation. */
    public static function upgrade(): array
    {
        $added = [];
        $columns = ['candidate_profiles' => ['cv_ai' => 'TEXT']];
        foreach ($columns as $table => $cols) {
            $existing = DB::driver() === 'sqlite'
                ? array_column(DB::all("PRAGMA table_info($table)"), 'name')
                : DB::column('SELECT column_name FROM information_schema.columns WHERE table_name = :t', ['t' => $table]);
            foreach ($cols as $col => $type) {
                if (!in_array($col, $existing, true)) {
                    DB::pdo()->exec("ALTER TABLE $table ADD COLUMN $col $type");
                    $added[] = "$table.$col";
                }
            }
        }
        if (!DB::value("SELECT COUNT(*) FROM settings WHERE skey = 'launch_mode'")) {
            foreach (['launch_mode' => '1', 'ai_monthly_limit' => '30'] as $k => $v) {
                DB::insert('settings', ['skey' => $k, 'svalue' => $v]);
            }
            $added[] = 'settings.launch_mode';
        }
        return $added;
    }
}
