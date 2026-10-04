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
}
