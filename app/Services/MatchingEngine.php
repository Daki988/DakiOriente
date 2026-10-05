<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/**
 * Moteur de matching V1 — règles pondérées et explicables (cahier des charges §8).
 *
 * Chaque critère produit un ratio 0..1, multiplié par son poids (configurable par secteur
 * depuis le back-office). Les critères éliminatoires (niveau d'étude légalement requis)
 * sont distingués des critères pondérés. Le résultat expose : score global, points forts,
 * écarts principaux et actions recommandées — le matching n'est pas une boîte noire.
 */
final class MatchingEngine
{
    public const CRITERIA = [
        'skills'       => ['Compétences techniques', 30],
        'education'    => ['Formation / niveau', 15],
        'experience'   => ['Expérience / projets', 15],
        'job_title'    => ['Métier / fonctions recherchées', 10],
        'location'     => ['Localisation / mobilité', 10],
        'availability' => ['Disponibilité / type d\'opportunité', 5],
        'languages'    => ['Langues / certifications', 5],
        'soft_skills'  => ['Soft skills / comportement', 5],
        'preferences'  => ['Préférences candidat ↔ offre', 5],
    ];

    public const LANG_LEVELS = ['A1' => 1, 'A2' => 2, 'B1' => 3, 'B2' => 4, 'C1' => 5, 'C2' => 6];
    private const STOPWORDS = ['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'un', 'une', 'a', 'au', 'aux', 'pour', 'h', 'f', 'stage', 'stagiaire', 'junior', 'assistant', 'assistante', 'charge', 'chargee'];

    private static array $weightCache = [];
    private static array $jobCache = [];

    /** Poids actifs (secteur spécifique sinon défaut global), normalisés pour totaliser 100. */
    public static function weights(?int $sectorId = null): array
    {
        $key = (string)$sectorId;
        if (isset(self::$weightCache[$key])) {
            return self::$weightCache[$key];
        }
        $w = array_map(fn($c) => $c[1], self::CRITERIA);
        foreach (DB::all('SELECT criterion, weight FROM matching_weights WHERE sector_id IS NULL') as $r) {
            if (isset($w[$r['criterion']])) {
                $w[$r['criterion']] = (int)$r['weight'];
            }
        }
        if ($sectorId) {
            foreach (DB::all('SELECT criterion, weight FROM matching_weights WHERE sector_id = :s', ['s' => $sectorId]) as $r) {
                if (isset($w[$r['criterion']])) {
                    $w[$r['criterion']] = (int)$r['weight'];
                }
            }
        }
        $total = array_sum($w) ?: 1;
        return self::$weightCache[$key] = array_map(fn($v) => $v * 100 / $total, $w);
    }

    public static function loadJob(int $jobId): ?array
    {
        if (isset(self::$jobCache[$jobId])) {
            return self::$jobCache[$jobId];
        }
        $job = DB::one(
            'SELECT j.*, c.name AS city_name, c.country_id, co.name AS company_name, co.color AS company_color, co.slug AS company_slug,
                    co.status AS company_status, s.name AS sector_name
             FROM jobs j JOIN companies co ON co.id = j.company_id
             LEFT JOIN cities c ON c.id = j.city_id LEFT JOIN sectors s ON s.id = j.sector_id
             WHERE j.id = :id',
            ['id' => $jobId]
        );
        if (!$job) {
            return null;
        }
        $job['skills'] = DB::all(
            'SELECT s.id, s.name, s.category, js.required, js.weight FROM job_skills js JOIN skills s ON s.id = js.skill_id
             WHERE js.job_id = :j ORDER BY js.required DESC, js.weight DESC',
            ['j' => $jobId]
        );
        return self::$jobCache[$jobId] = $job;
    }

    public static function forget(int $jobId): void
    {
        unset(self::$jobCache[$jobId]);
    }

    /** Calcule le score de compatibilité candidat ↔ offre. */
    public static function compute(array $p, array $job, bool $withActions = true): array
    {
        $weights = self::weights($job['sector_id'] ? (int)$job['sector_id'] : null);
        $criteria = [];
        $missingSkills = [];
        $eliminated = false;
        $eliminationReason = null;

        // 1. Compétences techniques
        $candSkills = [];
        foreach ($p['skills'] as $s) {
            $candSkills[(int)$s['id']] = (int)$s['level'];
        }
        if ($job['skills']) {
            $total = 0;
            $got = 0;
            $matched = [];
            foreach ($job['skills'] as $s) {
                $w = (int)$s['weight'] * ((int)$s['required'] ? 2 : 1);
                $total += $w;
                $lvl = $candSkills[(int)$s['id']] ?? 0;
                if ($lvl > 0) {
                    $got += $w * ($lvl >= 3 ? 1 : ($lvl === 2 ? 0.7 : 0.45));
                    $matched[] = $s['name'];
                } else {
                    $missingSkills[] = ['id' => (int)$s['id'], 'name' => $s['name'], 'required' => (bool)$s['required']];
                }
            }
            $ratio = $total ? $got / $total : 0;
            $detail = count($matched) . ' / ' . count($job['skills']) . ' compétences maîtrisées'
                . ($matched ? ' (' . implode(', ', array_slice($matched, 0, 4)) . ')' : '');
        } else {
            $ratio = 0.7;
            $detail = 'Aucune compétence technique spécifique exigée';
        }
        $criteria['skills'] = [$ratio, $detail];

        // 2. Formation / niveau
        $diff = $p['education_level'] - (int)$job['education_min'];
        $levels = education_levels();
        $ratio = $diff >= 0 ? 1.0 : ($diff === -1 ? 0.55 : ($diff === -2 ? 0.2 : 0.0));
        $detail = 'Niveau ' . ($levels[$p['education_level']] ?? '?') . ' — requis : ' . ($levels[(int)$job['education_min']] ?? '?');
        if ($diff < 0 && (int)$job['education_eliminatory']) {
            $eliminated = true;
            $eliminationReason = 'Niveau d\'étude minimum obligatoire non atteint (' . ($levels[(int)$job['education_min']] ?? '') . ').';
        }
        $criteria['education'] = [$ratio, $detail];

        // 3. Expérience / projets
        $effective = max($p['experience_months'], self::experienceMonths($p['experiences']));
        $projects = count(array_filter($p['experiences'], fn($x) => in_array($x['kind'], ['projet', 'benevolat'], true)));
        $min = (int)$job['experience_min'];
        if ($min > 0) {
            $ratio = min(1, ($effective + $projects * 2) / $min);
        } else {
            $ratio = $effective > 0 || $projects > 0 ? 1.0 : 0.75;
        }
        $detail = ($effective ? self::monthsLabel($effective) . ' d\'expérience' : 'Pas encore d\'expérience')
            . ($projects ? " + $projects projet(s)" : '') . ($min ? ' — attendu : ' . self::monthsLabel($min) : ' — débutants acceptés');
        $criteria['experience'] = [$ratio, $detail];

        // 4. Métier recherché
        $jobTokens = self::tokens($job['title'] . ' ' . ($job['summary'] ?? ''));
        $candText = ($p['desired_job'] ?? '') . ' ' . ($p['headline'] ?? '') . ' ' . ($p['field_of_study'] ?? '') . ' '
            . implode(' ', array_column($p['experiences'], 'title'));
        $sim = self::similarity(self::tokens($job['title']), self::tokens($candText), $jobTokens);
        $sectorMatch = $p['desired_sector_id'] && (int)$p['desired_sector_id'] === (int)$job['sector_id'];
        $ratio = min(1, $sim + ($sectorMatch ? 0.35 : 0));
        $detail = $sectorMatch ? 'Secteur visé : ' . ($job['sector_name'] ?? '') : 'Correspondance avec « ' . ($p['desired_job'] ?: 'ton projet') . ' »';
        $criteria['job_title'] = [$ratio, $detail];

        // 5. Localisation / mobilité
        if ((int)$job['remote'] === 2) {
            $ratio = 1.0;
            $detail = 'Poste 100 % à distance';
        } elseif (!$p['city_id']) {
            $ratio = 0.5;
            $detail = 'Ville non renseignée';
        } elseif ((int)$p['city_id'] === (int)$job['city_id']) {
            $ratio = 1.0;
            $detail = 'Même ville : ' . $job['city_name'];
        } elseif ((int)$p['country_id'] === (int)$job['country_id']) {
            $ratio = $p['mobility'] === 'ville' ? 0.35 : 0.8;
            $detail = $job['city_name'] . ($p['mobility'] === 'ville' ? ' — hors de ta zone de mobilité' : ' — compatible avec ta mobilité nationale');
        } else {
            $ratio = $p['mobility'] === 'international' ? 0.6 : 0.1;
            $detail = 'Offre à l\'étranger (' . $job['city_name'] . ')';
        }
        if ((int)$job['remote'] === 1) {
            $ratio = max($ratio, 0.75);
            $detail .= ' · télétravail partiel possible';
        }
        $criteria['location'] = [$ratio, $detail];

        // 6. Disponibilité / type
        $typeOk = in_array($job['type'], $p['types_list'], true);
        $ratio = $p['types_list'] ? ($typeOk ? 0.6 : 0.1) : 0.35;
        $availOk = !$p['availability_date'] || !$job['start_date'] || $p['availability_date'] <= $job['start_date'];
        $ratio += $availOk ? 0.4 : 0.1;
        $detail = (job_types()[$job['type']] ?? $job['type']) . ($typeOk ? ' — correspond à ta recherche' : ' — hors de tes types recherchés')
            . ($availOk ? '' : ' · disponibilité après la date de début');
        $criteria['availability'] = [min(1, $ratio), $detail];

        // 7. Langues / certifications
        $reqLangs = self::parseLangs((string)$job['languages']);
        $candLangs = [];
        foreach ($p['languages_list'] as $l) {
            $candLangs[normalize($l['name'] ?? '')] = self::LANG_LEVELS[$l['level'] ?? 'B1'] ?? 3;
        }
        $missingLangs = [];
        if ($reqLangs) {
            $ok = 0;
            foreach ($reqLangs as $name => $lvl) {
                $have = $candLangs[normalize($name)] ?? 0;
                if ($have >= $lvl) {
                    $ok += 1;
                } elseif ($have > 0) {
                    $ok += 0.5;
                    $missingLangs[] = "$name (niveau à renforcer)";
                } else {
                    $missingLangs[] = $name;
                }
            }
            $ratio = $ok / count($reqLangs);
            $detail = $missingLangs ? 'À renforcer : ' . implode(', ', $missingLangs) : 'Toutes les langues requises sont maîtrisées';
        } else {
            $ratio = 0.8;
            $detail = 'Pas d\'exigence linguistique particulière';
        }
        if (!empty($p['certifications'])) {
            $ratio = min(1, $ratio + 0.15);
            $detail .= ' · certifications valorisées';
        }
        $criteria['languages'] = [$ratio, $detail];

        // 8. Soft skills
        $reqSoft = array_filter(array_map(fn($x) => normalize($x), explode(',', (string)$job['soft_skills'])));
        $candSoft = array_map(fn($x) => normalize($x), $p['soft_list']);
        if ($reqSoft) {
            $common = array_intersect($reqSoft, $candSoft);
            $ratio = count($common) / count($reqSoft);
            $detail = count($common) . ' / ' . count($reqSoft) . ' qualités recherchées';
        } else {
            $ratio = $candSoft ? 0.8 : 0.5;
            $detail = 'Qualités comportementales non précisées';
        }
        $criteria['soft_skills'] = [$ratio, $detail];

        // 9. Préférences ↔ offre
        $parts = [];
        $pts = 0;
        $n = 0;
        if ($p['desired_salary'] && ($job['salary_max'] || $job['salary_min'])) {
            $n++;
            $max = (int)($job['salary_max'] ?: $job['salary_min']);
            $ok = $max >= (int)$p['desired_salary'];
            $pts += $ok ? 1 : max(0, $max / (int)$p['desired_salary'] - 0.3);
            $parts[] = $ok ? 'rémunération alignée' : 'rémunération en dessous de tes attentes';
        }
        if ($p['desired_sector_id']) {
            $n++;
            $pts += $sectorMatch ? 1 : 0.3;
            $parts[] = $sectorMatch ? 'secteur préféré' : 'autre secteur';
        }
        if ((int)$p['remote_ok']) {
            $n++;
            $pts += (int)$job['remote'] > 0 ? 1 : 0.5;
            if ((int)$job['remote'] > 0) {
                $parts[] = 'télétravail possible';
            }
        }
        $ratio = $n ? $pts / $n : 0.6;
        $criteria['preferences'] = [$ratio, $parts ? ucfirst(implode(', ', $parts)) : 'Préférences peu renseignées'];

        // Agrégation
        $score = 0.0;
        $result = [];
        foreach (self::CRITERIA as $key => [$label]) {
            [$ratio, $detail] = $criteria[$key];
            $ratio = max(0, min(1, (float)$ratio));
            $points = $ratio * $weights[$key];
            $score += $points;
            $result[$key] = [
                'label'  => $label,
                'weight' => round($weights[$key], 1),
                'ratio'  => round($ratio, 2),
                'points' => round($points, 1),
                'detail' => $detail,
            ];
        }
        $score = (int)round($score);
        if ($eliminated) {
            $score = min($score, 25);
        }

        // Explications
        $strengths = [];
        $gaps = [];
        foreach ($result as $key => $c) {
            if ($c['ratio'] >= 0.8 && $c['weight'] >= 5) {
                $strengths[] = $c['label'] . ' — ' . $c['detail'];
            } elseif ($c['ratio'] < 0.5) {
                $gaps[] = $c['label'] . ' — ' . $c['detail'];
            }
        }
        usort($missingSkills, fn($a, $b) => $b['required'] <=> $a['required']);

        return [
            'score'          => $score,
            'level'          => self::level($score),
            'eliminated'     => $eliminated,
            'elimination'    => $eliminationReason,
            'criteria'       => $result,
            'strengths'      => array_slice($strengths, 0, 4),
            'gaps'           => array_slice($gaps, 0, 4),
            'missing_skills' => $missingSkills,
            'missing_langs'  => $missingLangs,
            'actions'        => $withActions ? self::actions($result, $missingSkills, $missingLangs, $job, $p) : [],
        ];
    }

    public static function level(int $score): string
    {
        return match (true) {
            $score >= 85 => 'Excellent match',
            $score >= 70 => 'Très bon match',
            $score >= 55 => 'Bon potentiel',
            $score >= 40 => 'Match partiel',
            default      => 'Peu compatible',
        };
    }

    /** Actions concrètes pour augmenter la compatibilité. */
    private static function actions(array $criteria, array $missingSkills, array $missingLangs, array $job, array $p): array
    {
        $actions = [];
        foreach (array_slice($missingSkills, 0, 3) as $s) {
            $training = DB::one('SELECT id, title, provider, duration, price FROM trainings WHERE skill_id = :s ORDER BY price ASC LIMIT 1', ['s' => $s['id']]);
            $actions[] = [
                'type'  => 'skill',
                'text'  => ($s['required'] ? 'Acquérir la compétence clé « ' : 'Développer « ') . $s['name'] . ' »',
                'link'  => $training ? '/formations/' . $training['id'] : '/formations?q=' . urlencode($s['name']),
                'extra' => $training ? $training['title'] . ' · ' . $training['duration'] . ' · ' . ($training['price'] ? money((int)$training['price']) : 'Gratuit') : null,
            ];
        }
        if ($criteria['experience']['ratio'] < 0.6) {
            $actions[] = ['type' => 'experience', 'text' => 'Ajoute un projet personnel, associatif ou académique pour démontrer ta pratique', 'link' => '/espace/profil#experiences', 'extra' => null];
        }
        if ($criteria['job_title']['ratio'] < 0.4) {
            $actions[] = ['type' => 'pitch', 'text' => 'Adapte ta lettre pour relier ton parcours au poste de « ' . $job['title'] . ' »', 'link' => '/espace/lettres?job=' . $job['id'], 'extra' => null];
        }
        foreach (array_slice($missingLangs, 0, 1) as $l) {
            $actions[] = ['type' => 'language', 'text' => 'Renforce ton niveau en ' . preg_replace('/ \(.*/', '', $l), 'link' => '/formations?q=' . urlencode(preg_replace('/ \(.*/', '', $l)), 'extra' => null];
        }
        if ($criteria['soft_skills']['ratio'] < 0.5 && $job['soft_skills']) {
            $actions[] = ['type' => 'soft', 'text' => 'Illustre dans ton profil : ' . $job['soft_skills'], 'link' => '/espace/profil#soft', 'extra' => null];
        }
        if (!$actions) {
            $actions[] = ['type' => 'apply', 'text' => 'Ton profil est solide : prépare ton entretien pour faire la différence', 'link' => '/espace/entretien?job=' . $job['id'], 'extra' => null];
        }
        return array_slice($actions, 0, 4);
    }

    /* ---------- Requêtes de haut niveau ---------- */

    public static function forUser(int $userId, int $jobId, bool $persist = false): ?array
    {
        $p = ProfileService::load($userId);
        $job = self::loadJob($jobId);
        if (!$p || !$job) {
            return null;
        }
        $m = self::compute($p, $job);
        if ($persist) {
            DB::delete('match_scores', 'user_id = :u AND job_id = :j', ['u' => $userId, 'j' => $jobId]);
            DB::insert('match_scores', [
                'user_id' => $userId, 'job_id' => $jobId, 'score' => $m['score'],
                'details' => json_encode($m['criteria'], JSON_UNESCAPED_UNICODE), 'computed_at' => now(),
            ]);
        }
        return $m;
    }

    /** Offres publiées classées par compatibilité pour un candidat. */
    public static function recommendJobs(int $userId, int $limit = 6, array $excludeIds = []): array
    {
        $p = ProfileService::load($userId);
        if (!$p) {
            return [];
        }
        $ids = DB::column(
            "SELECT id FROM jobs WHERE status = 'published' AND (deadline IS NULL OR deadline >= :d) ORDER BY published_at DESC LIMIT 300",
            ['d' => date('Y-m-d')]
        );
        $applied = DB::column('SELECT job_id FROM applications WHERE user_id = :u', ['u' => $userId]);
        $out = [];
        foreach ($ids as $id) {
            if (in_array($id, $excludeIds) || in_array($id, $applied)) {
                continue;
            }
            $job = self::loadJob((int)$id);
            $m = self::compute($p, $job);
            if ($m['eliminated']) {
                continue;
            }
            $out[] = ['job' => $job, 'match' => $m];
        }
        usort($out, fn($a, $b) => $b['match']['score'] <=> $a['match']['score']);
        return array_slice($out, 0, $limit);
    }

    /** Candidats visibles classés pour une offre (CVthèque / matching recruteur). */
    public static function candidatesForJob(int $jobId, int $limit = 20, array $filters = []): array
    {
        $job = self::loadJob($jobId);
        if (!$job) {
            return [];
        }
        $where = ["u.role = 'candidate'", "u.status = 'active'", 'cp.visible_to_recruiters = 1'];
        $params = [];
        if (!empty($filters['city_id'])) {
            $where[] = 'cp.city_id = :city';
            $params['city'] = (int)$filters['city_id'];
        }
        if (isset($filters['education_min']) && $filters['education_min'] !== '') {
            $where[] = 'cp.education_level >= :edu';
            $params['edu'] = (int)$filters['education_min'];
        }
        $ids = DB::column('SELECT u.id FROM users u JOIN candidate_profiles cp ON cp.user_id = u.id WHERE ' . implode(' AND ', $where) . ' LIMIT 500', $params);
        $out = [];
        foreach ($ids as $id) {
            $p = ProfileService::load((int)$id);
            $m = self::compute($p, $job);
            if (!empty($filters['min_score']) && $m['score'] < (int)$filters['min_score']) {
                continue;
            }
            $out[] = ['profile' => $p, 'match' => $m];
        }
        usort($out, fn($a, $b) => $b['match']['score'] <=> $a['match']['score']);
        return array_slice($out, 0, $limit);
    }

    /* ---------- Utilitaires ---------- */

    public static function experienceMonths(array $experiences): int
    {
        $months = 0;
        foreach ($experiences as $x) {
            if (!$x['start_date'] || $x['kind'] === 'projet') {
                continue;
            }
            $start = strtotime($x['start_date']);
            $end = $x['end_date'] ? strtotime($x['end_date']) : time();
            $months += max(0, (int)round(($end - $start) / (30 * 86400)));
        }
        return $months;
    }

    public static function monthsLabel(int $m): string
    {
        if ($m < 12) {
            return $m . ' mois';
        }
        $y = intdiv($m, 12);
        $r = $m % 12;
        return $y . ' an' . ($y > 1 ? 's' : '') . ($r ? " $r mois" : '');
    }

    public static function parseLangs(string $s): array
    {
        $out = [];
        foreach (array_filter(array_map('trim', explode(',', $s))) as $item) {
            [$name, $lvl] = array_pad(explode(':', $item), 2, 'B1');
            $out[trim($name)] = self::LANG_LEVELS[trim($lvl)] ?? 3;
        }
        return $out;
    }

    private static function tokens(string $text): array
    {
        $words = preg_split('/\s+/', normalize($text)) ?: [];
        $words = array_filter($words, fn($w) => mb_strlen($w) > 2 && !in_array($w, self::STOPWORDS, true));
        return array_values(array_unique(array_map(fn($w) => substr($w, 0, 6), $words)));
    }

    private static function similarity(array $title, array $cand, array $context): float
    {
        if (!$title || !$cand) {
            return 0.0;
        }
        $hit = count(array_intersect($title, $cand));
        $ctx = count(array_intersect($context, $cand));
        return min(1, $hit / max(1, count($title)) * 0.9 + min(0.3, $ctx * 0.06));
    }
}
