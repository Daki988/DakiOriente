<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/** Recherche d'offres multicritère (web et API). */
final class JobSearch
{
    public const BASE_SELECT = 'SELECT j.*, c.name AS city_name, co.name AS company_name, co.color AS company_color, co.slug AS company_slug,
        co.status AS company_status, s.name AS sector_name
        FROM jobs j JOIN companies co ON co.id = j.company_id
        LEFT JOIN cities c ON c.id = j.city_id LEFT JOIN sectors s ON s.id = j.sector_id';

    /** @return array{items: array, total: int} */
    public static function search(array $f, int $limit = 12, int $offset = 0): array
    {
        $where = ["j.status = 'published'", '(j.deadline IS NULL OR j.deadline >= :today)'];
        $params = ['today' => date('Y-m-d')];

        if (!empty($f['q'])) {
            $words = array_slice(array_filter(preg_split('/\s+/', trim((string)$f['q']))), 0, 5);
            foreach ($words as $i => $w) {
                // Paramètres distincts par occurrence (requêtes préparées natives MySQL)
                $where[] = "(j.title LIKE :q{$i}a OR j.summary LIKE :q{$i}b OR j.description LIKE :q{$i}c OR co.name LIKE :q{$i}d
                    OR EXISTS (SELECT 1 FROM job_skills js JOIN skills sk ON sk.id = js.skill_id WHERE js.job_id = j.id AND (sk.name LIKE :q{$i}e OR sk.aliases LIKE :q{$i}f)))";
                foreach (['a', 'b', 'c', 'd', 'e', 'f'] as $suffix) {
                    $params["q{$i}{$suffix}"] = '%' . $w . '%';
                }
            }
        }
        if (!empty($f['city'])) {
            $where[] = 'j.city_id = :city';
            $params['city'] = (int)$f['city'];
        }
        if (!empty($f['country'])) {
            $where[] = 'c.country_id = (SELECT id FROM countries WHERE code = :country)';
            $params['country'] = (string)$f['country'];
        }
        if (!empty($f['sector'])) {
            $where[] = 'j.sector_id = :sector';
            $params['sector'] = (int)$f['sector'];
        }
        if (!empty($f['company'])) {
            $where[] = 'j.company_id = :company';
            $params['company'] = (int)$f['company'];
        }
        $types = array_values(array_intersect((array)($f['type'] ?? []), array_keys(job_types())));
        if ($types) {
            [$in, $p] = DB::in('t', $types);
            $where[] = "j.type IN ($in)";
            $params += $p;
        }
        if (isset($f['education']) && $f['education'] !== '') {
            $where[] = 'j.education_min <= :edu';
            $params['edu'] = (int)$f['education'];
        }
        if (!empty($f['remote'])) {
            $where[] = 'j.remote > 0';
        }
        if (!empty($f['beginner'])) {
            $where[] = 'j.experience_min = 0';
        }
        if (!empty($f['skill'])) {
            $where[] = 'EXISTS (SELECT 1 FROM job_skills js WHERE js.job_id = j.id AND js.skill_id = :skill)';
            $params['skill'] = (int)$f['skill'];
        }

        $sql = ' WHERE ' . implode(' AND ', $where);
        $order = match ($f['sort'] ?? 'recent') {
            'salary' => 'j.salary_max DESC',
            'deadline' => 'j.deadline ASC',
            default => 'j.featured DESC, j.published_at DESC',
        };
        $total = (int)DB::value('SELECT COUNT(*) FROM jobs j JOIN companies co ON co.id = j.company_id LEFT JOIN cities c ON c.id = j.city_id' . $sql, $params);
        $items = DB::all(self::BASE_SELECT . $sql . " ORDER BY $order LIMIT :lim OFFSET :off", $params + ['lim' => $limit, 'off' => $offset]);
        return ['items' => $items, 'total' => $total];
    }

    public static function find(int $id): ?array
    {
        return DB::one(self::BASE_SELECT . ' WHERE j.id = :id', ['id' => $id]);
    }
}
