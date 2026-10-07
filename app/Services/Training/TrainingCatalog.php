<?php
declare(strict_types=1);

namespace App\Services\Training;

use App\Core\DB;

/**
 * Lecture du catalogue de formations, enrichie par la demande des employeurs :
 * une formation est « demandée » quand les compétences qu'elle développe figurent dans des offres publiées.
 */
final class TrainingCatalog
{
    private static ?array $jobsBySkill = null;
    private static ?array $skillIds = null;

    public const CERT = [
        'gratuit'  => ['Certificat gratuit', 'green'],
        'payant'   => ['Certificat payant', 'gray'],
        'badge'    => ['Badge numérique gratuit', 'green'],
        'variable' => ['Certificat selon l\'offre', 'sky'],
        'aucun'    => ['Sans certificat', 'gray'],
    ];
    public const PRICING = ['gratuit' => ['Gratuit', 'green'], 'freemium' => ['Gratuit + options payantes', 'sky'], 'payant' => ['Payant', 'gray']];
    public const LANG = ['fr' => 'Français', 'en' => 'Anglais'];

    /** Offres publiées par compétence : [skill_id => [job_id => true]]. Les langues sont indexées par leur nom. */
    public static function jobsBySkill(): array
    {
        if (self::$jobsBySkill !== null) {
            return self::$jobsBySkill;
        }
        $map = [];
        foreach (DB::all("SELECT js.skill_id, js.job_id FROM job_skills js JOIN jobs j ON j.id = js.job_id WHERE j.status = 'published'") as $r) {
            $map[(int)$r['skill_id']][(int)$r['job_id']] = true;
        }
        foreach (DB::all("SELECT id, languages FROM jobs WHERE status = 'published' AND languages IS NOT NULL AND languages != ''") as $j) {
            foreach (explode(',', (string)$j['languages']) as $l) {
                $name = trim(explode(':', $l)[0]);
                if ($name !== '' && normalize($name) !== 'francais') {
                    $map['lang:' . normalize($name)][(int)$j['id']] = true;
                }
            }
        }
        return self::$jobsBySkill = $map;
    }

    private static function skillIds(): array
    {
        if (self::$skillIds === null) {
            self::$skillIds = [];
            foreach (DB::all('SELECT id, name FROM skills') as $s) {
                self::$skillIds[$s['name']] = (int)$s['id'];
            }
        }
        return self::$skillIds;
    }

    /** Identifiants des offres publiées qui demandent au moins une compétence développée par la formation. */
    public static function jobIdsFor(array $t): array
    {
        $map = self::jobsBySkill();
        $ids = [];
        foreach (array_filter(array_map('trim', explode(',', (string)($t['skills'] ?? '')))) as $name) {
            $key = self::skillIds()[$name] ?? 'lang:' . normalize($name);
            $ids += $map[$key] ?? [];
        }
        return array_keys($ids);
    }

    public static function demand(array $t): int
    {
        return count(self::jobIdsFor($t));
    }

    /** Ajoute 'demand' à chaque formation et trie par demande (puis français d'abord). */
    public static function withDemand(array $rows, bool $sort = true): array
    {
        foreach ($rows as &$r) {
            $r['demand'] = self::demand($r);
        }
        unset($r);
        if ($sort) {
            usort($rows, fn($a, $b) => [$b['demand'], $a['language'] === 'fr' ? 0 : 1, $a['title']] <=> [$a['demand'], $b['language'] === 'fr' ? 0 : 1, $b['title']]);
        }
        return $rows;
    }

    public const BASE = 'SELECT t.*, p.slug AS platform_slug, p.name AS platform_name, p.color AS platform_color, p.url AS platform_url
        FROM trainings t LEFT JOIN learning_platforms p ON p.id = t.platform_id';

    /** Date limite de vérification : une formation non vérifiée depuis 6 mois est masquée (§6). */
    public static function freshSince(): string
    {
        $months = (int)(\App\Services\Referential\Ref::rules()['trainings']['freshness_months'] ?? 6);
        return date('Y-m-d H:i:s', strtotime("-$months months"));
    }

    public static function isFresh(array $t): bool
    {
        return !empty($t['verified_at']) && $t['verified_at'] >= self::freshSince();
    }

    public static function find(int $id): ?array
    {
        return DB::one(self::BASE . ' WHERE t.id = :id', ['id' => $id]);
    }

    /** Recherche multi-critères (texte, plateforme, langue, compétence, certificat gratuit). */
    public static function search(array $f): array
    {
        $where = ['t.active = 1', 't.platform_id IS NOT NULL', 't.verified_at >= :fresh'];
        $params = ['fresh' => self::freshSince()];
        if (!empty($f['platform'])) {
            $where[] = 'p.slug = :pl';
            $params['pl'] = $f['platform'];
        }
        if (!empty($f['lang']) && isset(self::LANG[$f['lang']])) {
            $where[] = 't.language = :lg';
            $params['lg'] = $f['lang'];
        }
        if (!empty($f['free'])) {
            $where[] = "(t.certificate = 'gratuit' OR p.pricing = 'gratuit')";
        }
        $rows = DB::all(self::BASE . ' WHERE ' . implode(' AND ', $where), $params);
        $q = normalize((string)($f['q'] ?? ''));
        if ($q !== '') {
            $words = array_filter(explode(' ', $q));
            $rows = array_values(array_filter($rows, function ($t) use ($words) {
                $hay = normalize($t['title'] . ' ' . $t['skills'] . ' ' . $t['provider'] . ' ' . $t['platform_name']);
                foreach ($words as $w) {
                    if (!str_contains($hay, $w)) {
                        return false;
                    }
                }
                return true;
            }));
        }
        if (!empty($f['skill'])) {
            $s = (string)$f['skill'];
            $rows = array_values(array_filter($rows, fn($t) => in_array($s, array_map('trim', explode(',', (string)$t['skills'])), true)));
        }
        return self::withDemand($rows);
    }

    /** Formations recommandées pour une compétence (ou une langue), le français et les options gratuites d'abord. */
    public static function forSkill(string $name, int $limit = 2): array
    {
        // Filtre exact en PHP (portable MySQL / PostgreSQL / SQLite)
        $rows = array_values(array_filter(
            DB::all(self::BASE . ' WHERE t.active = 1 AND t.platform_id IS NOT NULL AND t.verified_at >= :fresh AND t.skills LIKE :s', ['s' => '%' . $name . '%', 'fresh' => self::freshSince()]),
            fn($t) => in_array($name, array_map('trim', explode(',', (string)$t['skills'])), true)
        ));
        $rank = fn($t) => ($t['language'] === 'fr' ? 4 : 0) + ($t['certificate'] === 'gratuit' ? 2 : 0) + (str_starts_with((string)$t['skills'], $name) ? 2 : 0) + ($t['source'] === 'catalogue' ? 1 : 0);
        usort($rows, fn($a, $b) => $rank($b) <=> $rank($a));
        return array_slice($rows, 0, $limit);
    }

    public static function platforms(): array
    {
        $rows = DB::all("SELECT p.*, (SELECT COUNT(*) FROM trainings t WHERE t.platform_id = p.id AND t.active = 1 AND t.verified_at >= :f1) AS courses,
            (SELECT COUNT(*) FROM trainings t WHERE t.platform_id = p.id AND t.active = 1 AND t.verified_at >= :f2 AND t.language = 'fr') AS courses_fr
            FROM learning_platforms p WHERE p.active = 1 ORDER BY courses DESC, p.name", ['f1' => self::freshSince(), 'f2' => self::freshSince()]);
        return $rows;
    }

    /** URL de sortie vers la plateforme, avec le paramètre d'affiliation éventuel. */
    public static function outboundUrl(array $t, ?string $affiliate = null): string
    {
        $url = (string)$t['url'];
        if ($affiliate) {
            $url .= (str_contains($url, '?') ? '&' : '?') . ltrim($affiliate, '?&');
        }
        return $url;
    }
}
