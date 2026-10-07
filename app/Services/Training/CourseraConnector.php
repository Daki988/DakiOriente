<?php
declare(strict_types=1);

namespace App\Services\Training;

/**
 * Catalogue public Coursera (api.coursera.org/api/courses.v1, lecture seule).
 * Parcourt l'ensemble du catalogue (environ 25 000 cours, 2 à 3 minutes) et ne garde que le français et l'anglais.
 */
final class CourseraConnector implements Connector
{
    private const API = 'https://api.coursera.org/api';

    public function platform(): string
    {
        return 'coursera';
    }

    public function fetch(?callable $progress = null): iterable
    {
        $fields = 'name,slug,primaryLanguages,workload,partnerIds,certificates,description';
        $start = 0;
        $partners = [];
        while (true) {
            $page = Http::json(self::API . "/courses.v1?fields=$fields&limit=100&start=$start", 40);
            if (!$page || empty($page['elements'])) {
                break;
            }
            $ids = [];
            foreach ($page['elements'] as $c) {
                foreach ($c['partnerIds'] ?? [] as $pid) {
                    if (!isset($partners[$pid])) {
                        $ids[$pid] = true;
                    }
                }
            }
            if ($ids) {
                $p = Http::json(self::API . '/partners.v1?ids=' . implode(',', array_keys($ids)) . '&fields=name', 30);
                foreach ($p['elements'] ?? [] as $e) {
                    $partners[$e['id']] = $e['name'];
                }
            }
            foreach ($page['elements'] as $c) {
                $lang = array_values(array_intersect($c['primaryLanguages'] ?? [], ['fr', 'en']))[0] ?? null;
                if (!$lang || empty($c['slug'])) {
                    continue;
                }
                yield [
                    'external_id' => (string)$c['id'], 'title' => trim((string)$c['name']),
                    'url' => 'https://www.coursera.org/learn/' . $c['slug'], 'language' => $lang,
                    'partner' => $partners[$c['partnerIds'][0] ?? ''] ?? 'Coursera',
                    'duration' => self::duration((string)($c['workload'] ?? '')),
                    'certificate' => !empty($c['certificates']) ? 'payant' : 'aucun',
                    'description' => mb_substr(trim(strip_tags((string)($c['description'] ?? ''))), 0, 600),
                    'next_session' => null,
                ];
            }
            if ($progress) {
                $progress($start + count($page['elements']), (int)($page['paging']['total'] ?? 0));
            }
            $next = $page['paging']['next'] ?? null;
            if ($next === null) {
                break;
            }
            $start = (int)$next;
        }
    }

    /** « 4 weeks of study, 2 hours/week » → « 4 semaines » ; « 3 Hours and 55 Minutes » → « 4 h ». */
    private static function duration(string $w): string
    {
        $n = normalize($w);
        if (preg_match('/(\d+(?:[.,]\d+)?)\s*(?:-|a|to)?\s*(?:\d+\s*)?(weeks?|semaines?|months?|mois|hours?|heures?|hrs?|h|minutes?|min)\b/', $n, $m)) {
            $v = (float)str_replace(',', '.', $m[1]);
            return match (true) {
                str_starts_with($m[2], 'week'), str_starts_with($m[2], 'semaine') => (int)$v . ' semaine' . ($v > 1 ? 's' : ''),
                str_starts_with($m[2], 'month'), $m[2] === 'mois' => (int)$v . ' mois',
                str_starts_with($m[2], 'min') => (int)$v . ' min',
                default => max(1, (int)round($v)) . ' h',
            };
        }
        return 'À ton rythme';
    }
}
