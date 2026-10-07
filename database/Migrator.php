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

        // Référentiels toujours chargés ; données fictives seulement en démonstration
        (require __DIR__ . '/seed.php')($seed);
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
        $ts = $driver === 'pgsql' ? 'TIMESTAMP NULL' : 'DATETIME NULL';
        $columns = ['candidate_profiles' => ['cv_ai' => 'TEXT', 'gap_advice' => 'TEXT', 'interests' => 'VARCHAR(255)', 'photo_document_id' => 'INTEGER', 'cv_settings' => 'TEXT',
                'cv_proof' => 'TEXT', 'cv_share_token' => 'VARCHAR(40)', 'cv_public' => 'INTEGER NOT NULL DEFAULT 0', 'cv_views' => 'INTEGER NOT NULL DEFAULT 0', 'cv_downloads' => 'INTEGER NOT NULL DEFAULT 0',
                'target_occupations' => 'VARCHAR(60)', 'extraction' => "VARCHAR(20) NOT NULL DEFAULT 'formulaire'"],
            'trainings' => ['platform_id' => 'INTEGER', 'language' => "VARCHAR(5) DEFAULT 'fr'", 'skills' => 'VARCHAR(255)', 'certificate' => "VARCHAR(20) DEFAULT 'variable'",
                'external_id' => 'VARCHAR(120)', 'source' => "VARCHAR(20) DEFAULT 'catalogue'", 'active' => 'INTEGER NOT NULL DEFAULT 1', 'next_session' => 'VARCHAR(10)',
                'clicks' => 'INTEGER NOT NULL DEFAULT 0', 'updated_at' => $ts,
                'verified_at' => $ts, 'quality' => 'INTEGER', 'partner' => 'INTEGER NOT NULL DEFAULT 0', 'recognition' => 'VARCHAR(20)', 'prerequisites' => 'VARCHAR(255)', 'link_status' => 'VARCHAR(20)'],
            // Référentiels et matching explicable (v1.1)
            'skills' => ['code' => 'VARCHAR(20)', 'definition' => 'VARCHAR(255)', 'level_criteria' => 'TEXT', 'proofs' => 'VARCHAR(120)', 'esco_uri' => 'VARCHAR(190)', 'esco_label' => 'VARCHAR(190)',
                'framework' => 'VARCHAR(160)', 'credential' => 'INTEGER NOT NULL DEFAULT 0', 'status' => "VARCHAR(20) NOT NULL DEFAULT 'brouillon'", 'revision' => 'INTEGER NOT NULL DEFAULT 1', 'updated_at' => $ts],
            'candidate_skills' => ['proof' => "VARCHAR(20) NOT NULL DEFAULT 'aucune'", 'source' => "VARCHAR(20) NOT NULL DEFAULT 'declare'", 'confidence' => 'INTEGER NOT NULL DEFAULT 100',
                'confirmed' => 'INTEGER NOT NULL DEFAULT 1', 'updated_at' => $ts],
            'candidate_educations' => ['degree_id' => 'INTEGER', 'level' => 'INTEGER', 'in_progress' => 'INTEGER NOT NULL DEFAULT 0', 'study_year' => 'VARCHAR(40)', 'to_verify' => 'INTEGER NOT NULL DEFAULT 0'],
            'jobs' => ['occupation_id' => 'INTEGER', 'occupation_confirmed' => 'INTEGER NOT NULL DEFAULT 0', 'occupation_confidence' => 'INTEGER', 'languages_blocking' => 'VARCHAR(160)'],
            'job_skills' => ['level' => 'INTEGER NOT NULL DEFAULT 3', 'blocking' => 'INTEGER NOT NULL DEFAULT 0'],
            'users' => ['ref_role' => 'VARCHAR(20)'],
            'match_scores' => ['verdict' => 'VARCHAR(20)', 'ref_version' => 'INTEGER', 'extraction' => 'VARCHAR(20)', 'explanation' => 'TEXT']];
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

        // Index des tables apparues (ignorés s'ils existent déjà)
        if ($added) {
            foreach ($schema['_indexes'] as $idx) {
                try {
                    DB::pdo()->exec($idx);
                } catch (\Throwable) {
                }
            }
        }
        // Référentiels v1.1 : chargement, rattachement des offres (à confirmer par les recruteurs), première version publiée
        if (!(int)DB::value('SELECT COUNT(*) FROM occupations')) {
            \App\Services\Referential\Loader::run(true);
            $added[] = 'référentiels v1.1 (métiers, compétences, diplômes, formations)';
        }
        if (!(int)DB::value('SELECT COUNT(*) FROM ref_versions')) {
            \App\Services\Referential\Versions::publish(null, 'Version initiale', false, true);
            $added[] = 'version initiale des référentiels';
        }

        if (!(int)DB::value('SELECT COUNT(*) FROM offer_sources')) {
            self::seedOfferSources();
            $added[] = 'sources vérifiées de la préparation aux stages';
        }

        if (!DB::value("SELECT COUNT(*) FROM settings WHERE skey = 'launch_mode'")) {
            foreach (['launch_mode' => '1', 'ai_monthly_limit' => '30'] as $k => $v) {
                DB::insert('settings', ['skey' => $k, 'svalue' => $v]);
            }
            $added[] = 'settings.launch_mode';
        }
        return $added;
    }

    /** Sources d'offres de stage vérifiées par NEAM (préparation aux stages). */
    public static function seedOfferSources(): void
    {
        foreach (require __DIR__ . '/sources-offres.php' as [$name, $domain, $url, $kind, $countries, $note]) {
            DB::insert('offer_sources', ['name' => $name, 'domain' => $domain, 'url' => $url, 'kind' => $kind, 'countries' => $countries, 'note' => $note,
                'active' => 1, 'verified_at' => '2026-10-07 12:00:00', 'created_at' => now()]);
        }
    }

    /**
     * Démonstration : deux annonces réelles relevées le 7 octobre 2026 sur QG Jeune Gabon (source vérifiée),
     * recopiées telles qu'elles sont publiées. Aucune offre externe n'est inventée.
     */
    public static function seedDemoInternshipOffers(): void
    {
        $offers = [
            ['query' => 'géomatique', 'it' => [
                'url' => 'https://www.qgjeunegabon.org/appel-a-candidature-pour-stage-a-lageos/', 'title' => 'Appel à candidature pour stage à l\'AGEOS',
                'organization' => 'Agence Gabonaise d\'Études et d\'Observations Spatiales (AGEOS)', 'city' => 'Ntoum', 'country' => 'GA',
                'published' => '2026-06-24', 'deadline' => '2026-06-29', 'status' => 'cloturee', 'is_internship' => true,
                'education' => 'Licence (Bac+3) ou Master, en cours ou complété, en géomatique, télédétection, sciences de l\'environnement, géographie numérique ou discipline connexe',
                'duration' => '3 mois non renouvelables', 'skills' => ['QGIS', 'ArcGIS', 'Traitement d\'images satellitaires', 'Google Earth Engine', 'Données vectorielles', 'Python', 'R'],
                'languages' => [], 'summary' => 'Six stagiaires recherchés au centre de compétence de l\'AGEOS (ZIS de Nkok) pour appuyer la production et la validation de données géospatiales d\'un atlas interactif.',
            ]],
            ['query' => 'juriste', 'it' => [
                'url' => 'https://www.qgjeunegabon.org/offre-de-stage-juriste-stagiaire/', 'title' => 'Offre de stage – Juriste stagiaire',
                'organization' => 'Cabinet juridique', 'city' => 'Libreville', 'country' => 'GA', 'published' => '2026-06-09', 'status' => 'inconnu', 'is_internship' => true,
                'education' => 'Licence ou Master en droit', 'duration' => null, 'skills' => ['Rédaction juridique', 'Capacités d\'analyse', 'Bureautique'],
                'languages' => [], 'summary' => 'Un cabinet de Libreville recrute un juriste stagiaire pour la recherche juridique, la rédaction, le suivi des dossiers clients, le conseil et le contentieux.',
            ]],
        ];
        $sources = \App\Services\Internship\OfferWatch::sources('GA');
        foreach ($offers as $o) {
            $check = \App\Services\Internship\OfferWatch::validate($o['it'], 'GA', $sources, null, false);
            if ($check['ok']) {
                $occ = \App\Services\Referential\Normalizer::occupation($o['query']);
                \App\Services\Internship\OfferWatch::store($check['offer'] + ['link_status' => 'non_controle'], 'GA', \App\Services\Internship\OfferWatch::queryNorm($o['query']),
                    $occ && $occ['confidence'] >= 60 ? (int)$occ['id'] : null, 'manuel', null);
            }
        }
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
