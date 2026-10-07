<?php
declare(strict_types=1);

namespace App\Services\Internship;

use App\Core\DB;
use App\Services\GapAnalysisService;
use App\Services\MatchingEngine;
use App\Services\ProfileService;
use App\Services\Referential\Ref;

/**
 * Préparation aux stages : le CV du candidat est évalué, avec le moteur de matching et les référentiels,
 * sur des offres de stage réelles publiées hors de Tremplin dans son pays. But : être prêt quand des offres
 * du même type paraîtront sur Tremplin (aucune candidature n'est envoyée).
 *
 * Pour chaque offre, l'offre « type » est construite ainsi :
 *  - fiche métier reconnue dans l'intitulé : ses compétences, avec un niveau attendu plafonné au niveau stagiaire (2 par défaut) ;
 *  - compétences citées dans l'annonce et reconnues par le référentiel : ajoutées au même niveau ;
 *  - niveau d'études lu dans l'annonce, sinon celui de la fiche ; langues de l'annonce, sinon celles de la fiche.
 * Le score est celui du moteur (mêmes poids, mêmes seuils) ; une offre sans fiche ni compétence reconnue n'est pas notée.
 */
final class Readiness
{
    /** Part minimale du critère compétences pour être jugé prêt. */
    public const SKILLS_READY = 0.6;

    /** Offre « type » pour le moteur, ou null si l'annonce ne contient rien d'évaluable. */
    public static function jobFor(array $offer, array $p): ?array
    {
        $cap = OfferWatch::config()['level_cap'];
        $job = null;
        $occId = $offer['occupation_id'] ? (int)$offer['occupation_id'] : null;
        if ($occId) {
            $job = MatchingEngine::occupationJob($occId);
        }
        $skills = [];
        foreach ($job['skills'] ?? [] as $s) {
            $s['level'] = min($cap, (int)$s['level']);
            $skills[(int)$s['id']] = $s;
        }
        $weights = array_column($skills, 'weight');
        $extraWeight = $weights ? max(5, (int)round(array_sum($weights) / count($weights))) : 10;
        foreach (json_decode((string)$offer['skills'], true) ?: [] as $s) {
            if (!empty($s['id']) && !isset($skills[(int)$s['id']]) && ($meta = Ref::skill((int)$s['id']))) {
                $skills[(int)$s['id']] = ['id' => (int)$s['id'], 'name' => $meta['name'], 'category' => $meta['category'], 'credential' => $meta['credential'],
                    'required' => 1, 'weight' => $extraWeight, 'level' => $cap, 'blocking' => 0, 'from_offer' => true];
            }
        }
        if (!$skills) {
            return null;
        }
        $langs = [];
        foreach (array_filter(array_map('trim', explode(',', (string)$offer['languages']))) as $l) {
            $name = mb_convert_case(mb_strtolower($l), MB_CASE_TITLE);
            if (preg_match('/^(Français|Anglais|Espagnol|Portugais|Arabe|Chinois|Allemand)/u', $name, $m)) {
                $langs[] = $m[1] . ':B1';
            }
        }
        $city = $offer['city'] ? DB::one('SELECT c.id, c.name, c.country_id FROM cities c JOIN countries k ON k.id = c.country_id WHERE k.code = :k AND LOWER(c.name) = LOWER(:n)',
            ['k' => $offer['country_code'], 'n' => trim((string)$offer['city'])]) : null;
        $countryId = DB::value('SELECT id FROM countries WHERE code = :c', ['c' => $offer['country_code']]);
        return [
            'id' => 0, 'title' => $offer['title'], 'type' => 'stage', 'occupation_id' => $occId,
            'education_min' => $offer['education_level'] !== null ? (int)$offer['education_level'] : (int)($job['education_min'] ?? 2),
            'education_eliminatory' => 0, 'experience_min' => 0,
            'languages' => $langs ? implode(',', $langs) : ($job['languages'] ?? ''), 'languages_blocking' => null,
            'remote' => 0, 'city_id' => $city['id'] ?? null, 'country_id' => $countryId ? (int)$countryId : null,
            'city_name' => $city['name'] ?? ($offer['city'] ?: 'ville non précisée'), 'start_date' => null,
            'sector_id' => $job['sector_id'] ?? null, 'skills' => array_values($skills), 'virtual' => true,
        ];
    }

    /**
     * Évalue le profil sur les offres fournies et enregistre le bilan.
     * @return array{score:?int, ready:bool, threshold:int, offers:list<array>, scored:int, gaps:list<array>, demanded:list<array>, strengths:list<array>, cv:array, version:int}
     */
    public static function evaluate(int $userId, array $offers, string $query, string $country, ?int $occupationId, bool $persist = true): array
    {
        $p = ProfileService::load($userId, true);
        $threshold = (int)(Ref::rules()['employability']['ready'] ?? 70);
        $rows = [];
        $scores = [];
        $skillRatios = [];
        $gapAgg = [];
        $strengthAgg = [];
        $demand = [];
        foreach ($offers as $o) {
            $job = self::jobFor($o, $p);
            $row = ['offer' => $o, 'job' => $job, 'm' => null];
            if ($job) {
                $m = MatchingEngine::compute($p, $job, false);
                $row['m'] = $m;
                $scores[] = $m['score'];
                $skillRatios[] = (float)$m['criteria']['skills']['ratio'];
                foreach ($m['gap_items'] as $g) {
                    if (in_array($g['type'], ['mobility'], true)) {
                        continue;
                    }
                    $k = $g['key'];
                    $gapAgg[$k] ??= ['gap' => $g, 'count' => 0, 'lost' => 0.0, 'offers' => []];
                    $gapAgg[$k]['count']++;
                    $gapAgg[$k]['lost'] += $g['lost'];
                    $gapAgg[$k]['offers'][] = (int)$o['id'];
                    if (($g['expected'] ?? 0) > ($gapAgg[$k]['gap']['expected'] ?? 0)) {
                        $gapAgg[$k]['gap'] = $g;
                    }
                }
                foreach ($m['strength_items'] as $s) {
                    $strengthAgg[$s['text']] = ($strengthAgg[$s['text']] ?? 0) + 1;
                }
                foreach ($job['skills'] as $s) {
                    $item = null;
                    foreach ($m['skill_items'] as $i) {
                        if ($i['id'] === (int)$s['id']) {
                            $item = $i;
                        }
                    }
                    $demand[(int)$s['id']] ??= ['name' => $s['name'], 'count' => 0, 'have' => $item['have'] ?? 0, 'expected' => (int)$s['level'], 'from_offer' => 0];
                    $demand[(int)$s['id']]['count']++;
                    $demand[(int)$s['id']]['from_offer'] += !empty($s['from_offer']) ? 1 : 0;
                }
            }
            $rows[] = $row;
        }
        $n = count($scores);
        foreach ($gapAgg as &$a) {
            $a['avg_lost'] = round($a['lost'] / max(1, $a['count']), 1);
            $a['share'] = $n ? (int)round(100 * $a['count'] / $n) : 0;
            $a['priority'] = $a['count'] * $a['avg_lost'];
        }
        unset($a);
        uasort($gapAgg, fn($x, $y) => $y['priority'] <=> $x['priority']);
        $gaps = [];
        foreach (array_slice($gapAgg, 0, 6, true) as $a) {
            $g = $a['gap'];
            $a['recos'] = in_array($g['type'], ['skill', 'level', 'language', 'education', 'experience'], true)
                ? array_slice(GapAnalysisService::recommendations($g, ['id' => 0]), 0, 3) : [];
            $gaps[] = $a;
        }
        uasort($demand, fn($x, $y) => $y['count'] <=> $x['count'] ?: strcmp($x['name'], $y['name']));
        arsort($strengthAgg);
        // Prêt : score moyen au seuil ET compétences demandées majoritairement acquises
        // (une compétence absente garde une part du critère quand le niveau attendu est bas : le score seul ne suffit pas)
        $skillsRatio = $n ? array_sum($skillRatios) / $n : 0.0;
        $result = [
            'score' => $n ? (int)round(array_sum($scores) / $n) : null,
            'ready' => $n && array_sum($scores) / $n >= $threshold && $skillsRatio >= self::SKILLS_READY,
            'skills_ratio' => (int)round(100 * $skillsRatio),
            'skills_ready' => (int)round(100 * self::SKILLS_READY),
            'threshold' => $threshold,
            'offers' => $rows,
            'scored' => $n,
            'gaps' => $gaps,
            'demanded' => array_slice(array_values($demand), 0, 10),
            'strengths' => array_slice(array_map(fn($t, $c) => ['text' => $t, 'count' => $c], array_keys($strengthAgg), $strengthAgg), 0, 4),
            'cv' => ['quality' => (int)($p['cv_quality'] ?? 0), 'tip' => $p['cv_quality_tip'] ?? null],
            'version' => Ref::version(),
        ];
        if ($persist && $n) {
            DB::insert('internship_reviews', [
                'user_id' => $userId, 'query' => mb_substr($query, 0, 160), 'country_code' => $country, 'occupation_id' => $occupationId, 'offers' => $n,
                'score' => $result['score'], 'ready' => $result['ready'] ? 1 : 0, 'ref_version' => $result['version'], 'created_at' => now(),
                'result' => json_encode(['offers' => array_map(fn($r) => ['id' => (int)$r['offer']['id'], 'score' => $r['m']['score'] ?? null], $rows),
                    'gaps' => array_map(fn($g) => ['key' => $g['gap']['key'], 'text' => $g['gap']['text'], 'count' => $g['count']], $gaps)], JSON_UNESCAPED_UNICODE),
            ]);
        }
        return $result;
    }
}
