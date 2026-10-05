<?php
declare(strict_types=1);

/*
 * Synchronisation des catalogues de formation en ligne.
 *   php bin/sync-trainings.php coursera            → met à jour Coursera (API publique, 2 à 3 min)
 *   php bin/sync-trainings.php fun-mooc            → met à jour FUN MOOC (API publique)
 *   php bin/sync-trainings.php all                 → toutes les plateformes dotées d'un connecteur
 *   php bin/sync-trainings.php coursera --snapshot → écrit database/catalog/coursera.json (catalogue initial, sans base)
 *   php bin/sync-trainings.php --check-links       → masque les formations dont la page n'existe plus (404/410)
 *   Options : --per-skill=6 (formations gardées par compétence et par plateforme)
 *
 * À planifier une fois par semaine (cron) : 0 3 * * 1 php /chemin/bin/sync-trainings.php all
 */

require dirname(__DIR__) . '/app/bootstrap.php';

use App\Core\DB;
use App\Services\Training\Http;
use App\Services\Training\TrainingSync;

$args = array_slice($argv ?? [], 1);
$perSkill = 6;
foreach ($args as $a) {
    if (preg_match('/^--per-skill=(\d+)$/', $a, $m)) {
        $perSkill = (int)$m[1];
    }
}
$progress = function (int $done, int $total) {
    fwrite(STDERR, "\r  " . $done . ($total ? ' / ' . $total : ''));
};

if (in_array('--check-links', $args, true)) {
    $rows = DB::all("SELECT t.id, t.url, p.slug FROM trainings t JOIN learning_platforms p ON p.id = t.platform_id WHERE t.active = 1");
    $off = 0;
    foreach ($rows as $i => $r) {
        if ($r['slug'] === 'udemy') {
            continue; // Udemy refuse les vérifications automatiques : contrôle manuel depuis l'administration
        }
        $code = Http::status($r['url']);
        if (in_array($code, [404, 410], true)) {
            DB::update('trainings', ['active' => 0, 'updated_at' => now()], 'id = :id', ['id' => $r['id']]);
            $off++;
        }
        $progress($i + 1, count($rows));
    }
    echo "\n✔ Liens vérifiés : $off formation(s) masquée(s)\n";
    exit;
}

$targets = array_values(array_filter($args, fn($a) => !str_starts_with($a, '--')));
$targets = !$targets || $targets === ['all'] ? array_keys(TrainingSync::CONNECTORS) : $targets;
foreach ($targets as $slug) {
    if (!isset(TrainingSync::CONNECTORS[$slug])) {
        fwrite(STDERR, "✘ Pas de connecteur automatique pour « $slug » (utilise l'import de fichier dans l'administration)\n");
        continue;
    }
    echo "→ $slug\n";
    $class = TrainingSync::CONNECTORS[$slug];
    if (in_array('--snapshot', $args, true)) {
        [$keep, $seen] = TrainingSync::select((new $class())->fetch($progress), $perSkill);
        $rows = array_values(array_map(fn($r) => array_intersect_key($r, array_flip(['external_id', 'title', 'url', 'language', 'partner', 'duration', 'certificate', 'description', 'next_session', 'skills'])), $keep));
        @mkdir(BASE_PATH . '/database/catalog', 0775, true);
        file_put_contents(BASE_PATH . "/database/catalog/$slug.json", json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        echo "\n✔ Instantané : " . count($rows) . " formations gardées sur $seen lues\n";
        continue;
    }
    $s = TrainingSync::sync($slug, $perSkill, $progress);
    echo "\n✔ {$s['seen']} lues · {$s['kept']} gardées · {$s['added']} ajoutées · {$s['updated']} mises à jour · {$s['deactivated']} masquées\n";
}
