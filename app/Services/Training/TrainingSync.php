<?php
declare(strict_types=1);

namespace App\Services\Training;

use App\Core\DB;

/**
 * Intègre des formations venant d'une plateforme (connecteur, import de fichier ou catalogue initial).
 * Seules les formations en français ou en anglais, reliées à au moins une compétence du référentiel, sont gardées :
 * le catalogue reste centré sur ce que demandent les employeurs.
 */
final class TrainingSync
{
    public const CONNECTORS = ['coursera' => CourseraConnector::class, 'fun-mooc' => FunMoocConnector::class];

    /** Synchronise une plateforme dotée d'un connecteur automatique. */
    public static function sync(string $slug, int $perSkill = 6, ?callable $progress = null): array
    {
        $class = self::CONNECTORS[$slug] ?? null;
        if (!$class) {
            throw new \InvalidArgumentException("Aucun connecteur automatique pour « $slug ».");
        }
        return self::import($slug, (new $class())->fetch($progress), 'api', $perSkill);
    }

    /**
     * @param iterable<array> $rows  voir Connector ; 'skills' (liste de noms) peut être fourni, sinon il est détecté
     * @param int $perSkill nombre maximum de formations gardées par compétence principale (0 = sans limite)
     */
    private static function hasTable(): bool
    {
        static $ok = null;
        if ($ok === null) {
            try {
                DB::value('SELECT COUNT(*) FROM training_skills');
                $ok = true;
            } catch (\Throwable) {
                $ok = false;
            }
        }
        return $ok;
    }

    public static function import(string $platformSlug, iterable $rows, string $source = 'import', int $perSkill = 0): array
    {
        $catalogDate = null;
        $platform = DB::one('SELECT * FROM learning_platforms WHERE slug = :s', ['s' => $platformSlug]);
        if (!$platform) {
            throw new \InvalidArgumentException("Plateforme inconnue : $platformSlug");
        }
        $skillIds = [];
        foreach (DB::all('SELECT id, name FROM skills') as $s) {
            $skillIds[$s['name']] = (int)$s['id'];
        }
        [$keep, $seen] = self::select($rows, $perSkill);
        $added = $updated = 0;
        $ids = [];
        foreach ($keep as $ext => $r) {
            $data = [
                'title' => mb_substr((string)$r['title'], 0, 190), 'provider' => mb_substr((string)(($r['partner'] ?? '') ?: (($r['provider'] ?? '') ?: $platform['name'])), 0, 160),
                'skill_id' => $skillIds[$r['skills'][0]] ?? null, 'skills' => mb_substr(implode(', ', $r['skills']), 0, 255),
                'format' => 'en ligne', 'duration' => mb_substr((string)(($r['duration'] ?? '') ?: 'À ton rythme'), 0, 80),
                'price' => 0, 'level' => in_array($r['level'] ?? '', ['debutant', 'intermediaire', 'avance'], true) ? $r['level'] : 'debutant',
                'url' => mb_substr((string)$r['url'], 0, 255), 'description' => $r['description'] ?? null, 'platform_id' => (int)$platform['id'],
                'language' => $r['language'], 'certificate' => in_array($r['certificate'] ?? '', ['gratuit', 'payant', 'badge', 'aucun', 'variable'], true) ? $r['certificate'] : 'variable',
                'external_id' => mb_substr((string)$ext, 0, 120), 'source' => $source, 'active' => 1, 'next_session' => $r['next_session'] ?? null, 'updated_at' => now(),
                // Vérification : la synchronisation ou l'import confirme le lien ; la sélection initiale garde sa date de constitution
                'verified_at' => $source === 'catalogue' ? (($catalogDate ??= ((require BASE_PATH . '/database/learning.php')['verified_at'] ?? date('Y-m-d'))) . ' 00:00:00') : now(),
                'link_status' => 'ok',
            ];
            $existing = DB::value('SELECT id FROM trainings WHERE platform_id = :p AND (external_id = :e OR url = :u)', ['p' => $platform['id'], 'e' => $data['external_id'], 'u' => $data['url']]);
            if ($existing) {
                DB::update('trainings', $data, 'id = :id', ['id' => $existing]);
                $tid = (int)$existing;
                $updated++;
            } else {
                $tid = DB::insert('trainings', $data);
                $added++;
            }
            $ids[] = $tid;
            // Référentiel Formations : compétences développées et niveau atteint
            if (self::hasTable()) {
                DB::delete('training_skills', 'training_id = :t', ['t' => $tid]);
                $reached = \App\Services\Referential\Loader::levelReached($data['level'], $data['certificate']);
                foreach (array_unique(array_filter(array_map(fn($n) => $skillIds[$n] ?? null, $r['skills']))) as $sid) {
                    DB::insert('training_skills', ['training_id' => $tid, 'skill_id' => $sid, 'level_reached' => $reached]);
                }
            }
        }
        // Les formations d'une synchronisation précédente qui n'existent plus sont masquées (jamais supprimées : historique des candidats)
        $deactivated = 0;
        if ($source === 'api' && $ids) {
            [$in, $params] = DB::in('k', $ids);
            $deactivated = DB::run("UPDATE trainings SET active = 0 WHERE platform_id = :p AND source = 'api' AND active = 1 AND id NOT IN ($in)", ['p' => $platform['id']] + $params)->rowCount();
        }
        DB::update('learning_platforms', ['last_sync_at' => now(), 'last_sync_count' => count($ids)], 'id = :id', ['id' => $platform['id']]);
        return ['seen' => $seen, 'kept' => count($ids), 'added' => $added, 'updated' => $updated, 'deactivated' => $deactivated];
    }

    /**
     * Filtre (français / anglais, compétence reconnue) et classe les formations, sans toucher à la base.
     * @return array{0: array<string, array>, 1: int} formations gardées (indexées par identifiant externe) et nombre lu
     */
    public static function select(iterable $rows, int $perSkill = 0): array
    {
        $seen = 0;
        $bySkill = [];
        $titles = [];
        foreach ($rows as $r) {
            $seen++;
            $lang = strtolower(substr((string)($r['language'] ?? 'fr'), 0, 2));
            if (!in_array($lang, ['fr', 'en'], true) || empty($r['title']) || empty($r['url']) || !preg_match('#^https?://#', (string)$r['url'])) {
                continue;
            }
            $skills = !empty($r['skills']) ? array_values(array_filter(array_map('trim', is_array($r['skills']) ? $r['skills'] : explode(',', (string)$r['skills'])))) : SkillMatcher::match((string)$r['title']);
            if (!$skills) {
                continue;
            }
            $key = $lang . '|' . normalize((string)$r['title']);
            if (isset($titles[$key])) {
                continue; // même cours publié deux fois (anciennes versions)
            }
            $titles[$key] = true;
            $r['language'] = $lang;
            $r['skills'] = $skills;
            $r['rank'] = self::rank($r);
            $bySkill[$skills[0]][] = $r;
        }
        $keep = [];
        foreach ($bySkill as $list) {
            usort($list, fn($a, $b) => $b['rank'] <=> $a['rank']);
            foreach ($perSkill ? array_slice($list, 0, $perSkill) : $list as $r) {
                $keep[(string)($r['external_id'] ?? $r['url'])] = $r;
            }
        }
        return [$keep, $seen];
    }

    /** Lecture d'un fichier CSV (séparateur , ou ;) ou JSON fourni par une plateforme ou un programme d'affiliation. */
    public static function readFile(string $path, string $name): array
    {
        $content = (string)file_get_contents($path);
        if (str_ends_with(strtolower($name), '.json')) {
            $data = json_decode($content, true);
            return is_array($data) ? array_values(array_filter($data, 'is_array')) : [];
        }
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
        $lines = preg_split('/\r\n|\n|\r/', trim($content));
        if (!$lines) {
            return [];
        }
        $sep = substr_count($lines[0], ';') > substr_count($lines[0], ',') ? ';' : ',';
        $head = array_map(fn($h) => strtolower(trim($h)), str_getcsv(array_shift($lines), $sep, '"', '\\'));
        $rows = [];
        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }
            $vals = str_getcsv($line, $sep, '"', '\\');
            $row = array_combine($head, array_pad(array_slice($vals, 0, count($head)), count($head), ''));
            $row['external_id'] = $row['external_id'] ?? $row['url'] ?? null;
            $rows[] = $row;
        }
        return $rows;
    }

    /** Priorité d'une formation pour un public de jeunes diplômés francophones. */
    private static function rank(array $r): int
    {
        $score = $r['language'] === 'fr' ? 4 : 0;
        $t = normalize((string)$r['title']);
        if (in_array($r['certificate'] ?? '', ['gratuit', 'payant'], true)) {
            $score += 1;
        }
        if (preg_match('/\b(introduction|intro|initiez|initiation|bases|fondamentaux|fundamentals|essentials|beginner|debutant|getting started|decouvrez|apprenez)\b/', $t)) {
            $score += 2;
        }
        if (preg_match('/^(project|projet)\b|guided project|lab\b/', $t)) {
            $score -= 4;
        }
        if (preg_match('/^(\d+) (h|min)\b/', (string)($r['duration'] ?? ''), $m) && ($m[2] === 'min' || (int)$m[1] < 3)) {
            $score -= 2;
        }
        // Préparations à des certifications cloud très spécialisées : peu adaptées à un premier emploi
        if (preg_match('/google cloud|professional cloud|se preparer au|preparing for the|\bgc\b/', $t . ' ' . normalize((string)($r['partner'] ?? '')))) {
            $score -= 3;
        }
        return $score;
    }
}
