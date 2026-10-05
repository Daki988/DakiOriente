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
        } else {
            self::seedCertifications();
            self::seedLearning();
        }
    }

    /** Mise à jour d'une base existante : ajoute les colonnes apparues depuis l'installation. */
    public static function upgrade(): array
    {
        $added = [];
        // Tables apparues depuis l'installation
        $schema = require __DIR__ . '/schema.php';
        $driver = DB::driver();
        $tables = $driver === 'sqlite'
            ? DB::column("SELECT name FROM sqlite_master WHERE type = 'table'")
            : DB::column('SELECT table_name FROM information_schema.tables WHERE table_schema = ' . ($driver === 'pgsql' ? 'current_schema()' : 'DATABASE()'));
        $pk = match ($driver) {
            'sqlite' => 'INTEGER PRIMARY KEY AUTOINCREMENT',
            'pgsql'  => 'SERIAL PRIMARY KEY',
            default  => 'INT AUTO_INCREMENT PRIMARY KEY',
        };
        foreach ($schema as $table => $sql) {
            if ($table !== '_indexes' && !in_array($table, $tables, true)) {
                DB::pdo()->exec(str_replace(['{PK}', '{TS}'], [$pk, $driver === 'pgsql' ? 'TIMESTAMP NULL' : 'DATETIME NULL'], $sql)
                    . ($driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : ''));
                $added[] = $table;
            }
        }
        $columns = ['candidate_profiles' => ['cv_ai' => 'TEXT', 'gap_advice' => 'TEXT'],
            'trainings' => ['platform_id' => 'INTEGER', 'language' => "VARCHAR(5) DEFAULT 'fr'", 'skills' => 'VARCHAR(255)', 'certificate' => "VARCHAR(20) DEFAULT 'variable'",
                'external_id' => 'VARCHAR(120)', 'source' => "VARCHAR(20) DEFAULT 'catalogue'", 'active' => 'INTEGER NOT NULL DEFAULT 1', 'next_session' => 'VARCHAR(10)',
                'clicks' => 'INTEGER NOT NULL DEFAULT 0', 'updated_at' => ($driver === 'pgsql' ? 'TIMESTAMP NULL' : 'DATETIME NULL')]];
        foreach ($columns as $table => $cols) {
            $existing = $driver === 'sqlite'
                ? array_column(DB::all("PRAGMA table_info($table)"), 'name')
                : DB::column('SELECT column_name FROM information_schema.columns WHERE table_name = :t', ['t' => $table]);
            foreach ($cols as $col => $type) {
                if (!in_array($col, $existing, true)) {
                    DB::pdo()->exec("ALTER TABLE $table ADD COLUMN $col $type");
                    $added[] = "$table.$col";
                }
            }
        }
        if (!(int)DB::value('SELECT COUNT(*) FROM learning_platforms')) {
            // Les anciennes formations sans plateforme sont masquées au profit du catalogue des plateformes en ligne
            DB::run('UPDATE trainings SET active = 0 WHERE platform_id IS NULL');
            self::seedLearning();
            $added[] = 'plateformes de formation (catalogue)';
        }
        if (!(int)DB::value('SELECT COUNT(*) FROM certifications')) {
            self::seedCertifications();
            $added[] = 'certifications (catalogue)';
        }

        if (!DB::value("SELECT COUNT(*) FROM settings WHERE skey = 'launch_mode'")) {
            foreach (['launch_mode' => '1', 'ai_monthly_limit' => '30'] as $k => $v) {
                DB::insert('settings', ['skey' => $k, 'svalue' => $v]);
            }
            $added[] = 'settings.launch_mode';
        }
        return $added;
    }

    /** Catalogue de certifications reliées aux compétences du référentiel. */
    public static function seedCertifications(): void
    {
        foreach (require __DIR__ . '/certifications.php' as [$name, $issuer, $domain, $skills, $lang, $level, $format, $prep, $cost, $url, $desc, $note]) {
            DB::insert('certifications', [
                'name' => $name, 'issuer' => $issuer, 'domain' => $domain, 'skills' => $skills ?: null, 'language' => $lang ?: null,
                'level' => $level, 'format' => $format, 'prep_time' => $prep, 'cost' => $cost, 'url' => $url ?: null,
                'description' => $desc, 'value_note' => $note,
            ]);
        }
    }

    /** Plateformes de formation en ligne, sélection vérifiée et dernier instantané des catalogues synchronisés. */
    public static function seedLearning(): void
    {
        $data = require __DIR__ . '/learning.php';
        foreach ($data['platforms'] as $slug => $p) {
            DB::insert('learning_platforms', [
                'slug' => $slug, 'name' => $p['name'], 'url' => $p['url'], 'color' => $p['color'], 'languages' => $p['languages'],
                'pricing' => $p['pricing'], 'pricing_note' => $p['pricing_note'], 'certificate_note' => $p['certificate_note'],
                'tagline' => $p['tagline'], 'description' => $p['description'], 'strengths' => $p['strengths'], 'tips' => $p['tips'],
                'connector' => $p['connector'], 'active' => 1,
            ]);
        }
        foreach ($data['courses'] as $slug => $courses) {
            $base = rtrim(parse_url($data['platforms'][$slug]['url'], PHP_URL_SCHEME) . '://' . parse_url($data['platforms'][$slug]['url'], PHP_URL_HOST), '/');
            \App\Services\Training\TrainingSync::import($slug, array_map(fn($c) => [
                'title' => $c[0], 'url' => str_starts_with($c[1], 'http') ? $c[1] : $base . $c[1], 'external_id' => $c[1], 'language' => $c[2],
                'partner' => $c[3], 'duration' => $c[4], 'certificate' => $c[5], 'level' => $c[6], 'skills' => $c[7],
            ], $courses), 'catalogue');
        }
        foreach (glob(__DIR__ . '/catalog/*.json') ?: [] as $file) {
            $slug = basename($file, '.json');
            if (isset($data['platforms'][$slug])) {
                \App\Services\Training\TrainingSync::import($slug, json_decode((string)file_get_contents($file), true) ?: [], 'api');
            }
        }
    }
}
