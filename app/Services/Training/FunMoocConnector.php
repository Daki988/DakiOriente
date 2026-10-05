<?php
declare(strict_types=1);

namespace App\Services\Training;

/**
 * FUN MOOC (France Université Numérique) via son API publique de recherche.
 * Interroge le catalogue avec les mots-clés de chaque compétence du référentiel.
 */
final class FunMoocConnector implements Connector
{
    private const BASE = 'https://www.fun-mooc.fr';

    public function platform(): string
    {
        return 'fun-mooc';
    }

    public function fetch(?callable $progress = null): iterable
    {
        $seen = [];
        $queries = [];
        foreach (SkillMatcher::KEYWORDS + SkillMatcher::LANGUAGES as $kws) {
            foreach (array_slice($kws, 0, 2) as $kw) {
                $queries[normalize($kw)] = true;
            }
        }
        $i = 0;
        foreach (array_keys($queries) as $q) {
            $i++;
            $data = Http::json(self::BASE . '/api/v1.0/courses/?limit=20&query=' . rawurlencode($q), 30);
            foreach ($data['objects'] ?? [] as $o) {
                if (isset($seen[$o['id']])) {
                    continue;
                }
                $seen[$o['id']] = true;
                $runs = $o['course_runs'] ?? [];
                $lang = array_values(array_intersect($runs[0]['languages'] ?? ['fr'], ['fr', 'en']))[0] ?? null;
                if (!$lang) {
                    continue;
                }
                // Prochaine session : date de début à venir, ou « ouvert » si une session en cours accepte encore des inscriptions
                $next = null;
                foreach ($runs as $r) {
                    if (empty($r['enrollment_end']) || strtotime($r['enrollment_end']) <= time()) {
                        continue;
                    }
                    $start = substr((string)$r['start'], 0, 10);
                    if ($start > date('Y-m-d')) {
                        $next = $next === null || $next === 'ouvert' || $start < $next ? $start : $next;
                    } elseif ($next === null) {
                        $next = 'ouvert';
                    }
                }
                if ($next === null) {
                    continue; // aucune session ouverte : le cours ne peut pas être suivi actuellement
                }
                yield [
                    'external_id' => (string)$o['id'], 'title' => trim((string)$o['title']),
                    'url' => self::BASE . $o['absolute_url'], 'language' => $lang,
                    'partner' => (string)($o['organization_highlighted'] ?? 'FUN MOOC'),
                    'duration' => trim(($o['duration'] ?? '') . (($o['effort'] ?? '') ? ' · ' . $o['effort'] : ''), ' ·') ?: 'À ton rythme',
                    'certificate' => match ($o['certificate_offer'] ?? null) { 'paid' => 'payant', 'free' => 'gratuit', default => 'variable' },
                    'description' => mb_substr(trim(strip_tags((string)($o['introduction'] ?? ''))), 0, 600),
                    'next_session' => $next,
                ];
            }
            if ($progress) {
                $progress($i, count($queries));
            }
            usleep(150000);
        }
    }
}
