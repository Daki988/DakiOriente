<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;
use App\Services\Referential\Ref;

/**
 * Moteur de matching v1.1 : le référentiel décide, l'IA explique (cahier des charges §8-§9).
 *
 * Le CV et l'offre sont exprimés dans les codes des référentiels ; le score est calculé par des règles
 * appliquées à ces données normalisées, selon la version publiée du référentiel Objectifs & Seuils :
 *   compétences 40 %, diplôme 20 %, expérience 15 %, langues 10 %, qualité du CV 10 %, localisation 5 %.
 * Chaque critère est noté de 0 à 1 puis pondéré. Une compétence vaut 1 si le niveau du candidat atteint
 * le niveau exigé et perd 0,35 par niveau manquant ; sans preuve, le niveau retenu est plafonné à 2.
 * Les prérequis bloquants sont contrôlés en premier. Aucun appel à l'IA : même entrée, même score.
 */
final class MatchingEngine
{
    /** Compatibilité : critères et poids de départ (les poids en vigueur viennent de Ref::rules()). */
    public const CRITERIA = [
        'skills'     => ['Compétences', 40],
        'degree'     => ['Diplôme', 20],
        'experience' => ['Expérience', 15],
        'languages'  => ['Langues', 10],
        'cv'         => ['Qualité du CV', 10],
        'location'   => ['Localisation et disponibilité', 5],
    ];

    public const LANG_LEVELS = ['A1' => 1, 'A2' => 2, 'B1' => 3, 'B2' => 4, 'C1' => 5, 'C2' => 6];

    private static array $jobCache = [];

    /** Poids en vigueur (version publiée), ramenés à un total de 100. */
    public static function weights(?int $sectorId = null): array
    {
        $w = Ref::rules()['weights'];
        $total = array_sum($w) ?: 1;
        return array_map(fn($v) => $v * 100 / $total, $w);
    }

    public static function loadJob(int $jobId): ?array
    {
        if (isset(self::$jobCache[$jobId])) {
            return self::$jobCache[$jobId];
        }
        $job = DB::one(
            'SELECT j.*, c.name AS city_name, c.country_id, co.name AS company_name, co.color AS company_color, co.slug AS company_slug,
                    co.status AS company_status, s.name AS sector_name, o.code AS occupation_code, o.title AS occupation_title
             FROM jobs j JOIN companies co ON co.id = j.company_id
             LEFT JOIN cities c ON c.id = j.city_id LEFT JOIN sectors s ON s.id = j.sector_id
             LEFT JOIN occupations o ON o.id = j.occupation_id
             WHERE j.id = :id',
            ['id' => $jobId]
        );
        if (!$job) {
            return null;
        }
        $job['skills'] = DB::all(
            'SELECT s.id, s.name, s.category, s.credential, js.required, js.weight, js.level, js.blocking FROM job_skills js JOIN skills s ON s.id = js.skill_id
             WHERE js.job_id = :j ORDER BY js.blocking DESC, js.required DESC, js.weight DESC',
            ['j' => $jobId]
        );
        return self::$jobCache[$jobId] = $job;
    }

    public static function forget(int $jobId): void
    {
        unset(self::$jobCache[$jobId]);
    }

    /** Offre « virtuelle » construite à partir d'une fiche métier (écart avec un métier cible). */
    public static function occupationJob(int $occupationId): ?array
    {
        $o = Ref::occupation($occupationId);
        if (!$o) {
            return null;
        }
        $skills = [];
        foreach ($o['skills'] as $s) {
            $meta = Ref::skill($s['id']) ?? ['name' => '?', 'category' => 'technique', 'credential' => 0];
            $skills[] = ['id' => $s['id'], 'name' => $meta['name'], 'category' => $meta['category'], 'credential' => $meta['credential'],
                'required' => 1, 'weight' => $s['weight'], 'level' => $s['level'], 'blocking' => 0];
        }
        $langs = [];
        foreach ($o['languages'] as $name => $lvl) {
            $langs[] = "$name:$lvl";
        }
        return [
            'id' => 0, 'title' => $o['title'], 'type' => 'premier_emploi', 'occupation_id' => $occupationId, 'occupation_code' => $o['code'], 'occupation_title' => $o['title'],
            'education_min' => $o['education'], 'education_eliminatory' => 0, 'experience_min' => 0, 'languages' => implode(',', $langs), 'languages_blocking' => null,
            'remote' => 2, 'city_id' => null, 'country_id' => null, 'city_name' => null, 'start_date' => null, 'sector_id' => $o['sector_id'], 'skills' => $skills, 'virtual' => true,
        ];
    }

    /* ================================================================== Calcul */

    /** Score d'adéquation candidat ↔ offre, verdict, explication structurée. */
    public static function compute(array $p, array $job, bool $withActions = true): array
    {
        $r = Ref::rules();
        $w = self::weights();
        $occ = Ref::occupation(isset($job['occupation_id']) ? (int)$job['occupation_id'] : null);
        $cand = self::candidateSkills($p, $r);
        $criteria = [];
        $blocking = [];
        $strengths = [];
        $gaps = [];

        /* ---------- 1. Prérequis bloquants (contrôlés en premier) ---------- */
        foreach ($job['skills'] as $s) {
            if (!(int)$s['blocking']) {
                continue;
            }
            $have = $cand[(int)$s['id']]['eff'] ?? 0;
            if ($have < max(1, (int)$s['level'])) {
                $isCred = (int)($s['credential'] ?? 0) === 1;
                $blocking[] = ['type' => 'skill', 'ref' => (int)$s['id'], 'label' => $s['name'],
                    'detail' => $isCred ? (isset($cand[(int)$s['id']]) ? 'justificatif à ajouter à ton profil' : 'absent de ton profil') : 'niveau ' . (int)$s['level'] . ' minimum exigé'];
            }
        }
        [$candLevel, $degreeNote] = self::degreeLevel($p, $job);
        $reqLevel = (int)$job['education_min'];
        if ((int)$job['education_eliminatory']) {
            if (!empty($occ['regulated'])) {
                if (!self::hasDegree($p, (string)$occ['regulated'])) {
                    $blocking[] = ['type' => 'degree', 'ref' => $reqLevel, 'label' => $occ['regulated'], 'detail' => 'diplôme réglementé exigé pour exercer'];
                }
            } elseif ($candLevel < $reqLevel) {
                $blocking[] = ['type' => 'degree', 'ref' => $reqLevel, 'label' => 'Diplôme ' . Ref::degreeLabel($reqLevel), 'detail' => 'niveau minimum rendu obligatoire par le recruteur'];
            }
        }
        $candLangs = [];
        foreach ($p['languages_list'] as $l) {
            $candLangs[normalize($l['name'] ?? '')] = self::LANG_LEVELS[$l['level'] ?? 'B1'] ?? 3;
        }
        $reqLangs = self::parseLangs((string)($job['languages'] ?? ''));
        foreach (array_filter(array_map('trim', explode(',', (string)($job['languages_blocking'] ?? '')))) as $lb) {
            $need = $reqLangs[$lb] ?? 3;
            if (($candLangs[normalize($lb)] ?? 0) < $need) {
                $blocking[] = ['type' => 'language', 'ref' => $lb, 'label' => $lb . ' ' . (array_flip(self::LANG_LEVELS)[$need] ?? 'B1'), 'detail' => 'langue obligatoire pour ce poste'];
            }
        }

        /* ---------- 2. Compétences (40 %) ---------- */
        $items = [];
        $tw = 0;
        $got = 0.0;
        foreach ($job['skills'] as $s) {
            if ((int)$s['blocking'] || Ref::category((string)$s['category']) === 'linguistique') {
                continue;
            }
            $req = max(1, min(4, (int)($s['level'] ?? 3)));
            $wt = max(1, (int)$s['weight']);
            $c = $cand[(int)$s['id']] ?? null;
            $eff = $c['eff'] ?? 0;
            $val = $eff >= $req ? 1.0 : max(0.0, 1 - $r['level_penalty'] * ($req - $eff));
            $tw += $wt;
            $got += $wt * $val;
            $items[] = ['id' => (int)$s['id'], 'name' => $s['name'], 'category' => Ref::category((string)$s['category']), 'expected' => $req, 'have' => $eff,
                'declared' => $c['level'] ?? 0, 'proof' => $c['proof'] ?? null, 'capped' => $c && $c['level'] > $eff, 'pending' => $c['pending'] ?? false,
                'value' => round($val, 2), 'weight' => $wt];
        }
        if ($tw) {
            $ratio = $got / $tw;
            $ok = count(array_filter($items, fn($i) => $i['value'] >= 1));
            $detail = "$ok / " . count($items) . ' compétences au niveau attendu';
        } else {
            $ratio = 0.7;
            $detail = 'Aucune compétence précisée dans l\'offre : critère évalué à 70 %';
        }
        $criteria['skills'] = [$ratio, $detail];
        foreach ($items as $i) {
            $pts = $tw ? $w['skills'] * $i['weight'] / $tw : 0;
            if ($i['value'] >= 1) {
                $strengths[] = ['points' => $pts, 'text' => $i['name'] . ' : niveau ' . $i['have'] . ' (' . Ref::LEVELS[$i['have']][0] . '), ' . ($i['have'] > $i['expected'] ? 'au-delà du niveau ' . $i['expected'] . ' attendu' : 'le niveau attendu')];
            } else {
                $lost = $pts * (1 - $i['value']);
                $cur = $i['have'] ? 'niveau ' . $i['have'] . ' (' . Ref::LEVELS[$i['have']][0] . ')' : ($i['pending'] ? 'à confirmer dans ton profil' : 'absente de ton profil');
                $note = $i['capped'] ? ' — tu as déclaré le niveau ' . $i['declared'] . ', retenu à ' . $i['have'] . ' faute de preuve' : '';
                $gaps[] = ['key' => 'skill:' . $i['id'], 'type' => $i['have'] ? 'level' : 'skill', 'ref' => $i['id'], 'name' => $i['name'], 'lost' => $lost,
                    'current' => $i['have'], 'expected' => $i['expected'], 'capped' => $i['capped'], 'declared' => $i['declared'],
                    'text' => $i['name'] . ' : ' . $cur . ', niveau ' . $i['expected'] . ' (' . Ref::LEVELS[$i['expected']][0] . ') attendu' . $note];
            }
        }

        /* ---------- 3. Diplôme (20 %) ---------- */
        $diff = $candLevel - $reqLevel;
        $lvl = $diff >= 0 ? 1.0 : (float)($r['degree']['gap'][min(3, -$diff)] ?? 0);
        $fields = $occ['fields'] ?? [];
        $mine = $p['study_fields'] ?? [];
        $domain = null;
        if ($fields) {
            $domain = $mine ? (array_intersect($fields, $mine) ? 1.0 : (float)$r['degree']['domain_other']) : (float)$r['degree']['domain_unknown'];
        }
        $share = (float)$r['degree']['level_share'];
        $ratio = $domain === null ? $lvl : $share * $lvl + (1 - $share) * $domain;
        $detail = Ref::degreeLabel($candLevel, true) . ($degreeNote ? " ($degreeNote)" : '') . ' pour ' . Ref::degreeLabel($reqLevel) . ' attendu';
        if ($domain !== null) {
            $detail .= $domain >= 1 ? ' · domaine d\'études adapté' : ($mine ? ' · domaine d\'études différent (' . implode(', ', array_map([Ref::class, 'fieldLabel'], array_slice($fields, 0, 2))) . ' attendu)' : ' · domaine d\'études à préciser');
        }
        $criteria['degree'] = [$ratio, $detail];
        if ($ratio >= 0.95) {
            $strengths[] = ['points' => $w['degree'], 'text' => 'Diplôme : ' . Ref::degreeLabel($candLevel, true) . ' pour ' . Ref::degreeLabel($reqLevel, true) . ' attendu' . ($domain ? ', dans le bon domaine' : '')];
        } elseif ($ratio < 1) {
            $gaps[] = ['key' => 'degree:' . $reqLevel, 'type' => $diff < 0 ? 'education' : 'domain', 'ref' => $reqLevel, 'name' => 'Diplôme', 'lost' => $w['degree'] * (1 - $ratio),
                'current' => $candLevel, 'expected' => $reqLevel, 'text' => $diff < 0 ? 'Diplôme : ' . Ref::degreeLabel($candLevel) . ', ' . Ref::degreeLabel($reqLevel) . ' attendu' : 'Domaine d\'études : ' . ($mine ? 'différent de celui attendu' : 'non précisé dans ton profil')];
        }

        /* ---------- 4. Expérience (15 %) ---------- */
        [$relMonths, $otherMonths, $projects, $relevantTitles] = self::experience($p, $job, $occ);
        $min = (int)$job['experience_min'];
        $effective = $relMonths + $r['experience']['other_share'] * $otherMonths + $r['experience']['project_months'] * $projects;
        if ($min > 0) {
            $ratio = min(1, $effective / $min);
        } else {
            $ratio = ($relMonths > 0 || $projects > 0) ? 1.0 : ($otherMonths > 0 ? 0.85 : (float)$r['experience']['beginner']);
        }
        $detail = ($relMonths ? self::monthsLabel($relMonths) . ' d\'expérience en lien avec le poste' : ($otherMonths ? self::monthsLabel($otherMonths) . ' d\'expérience dans un autre domaine' : 'Pas encore d\'expérience'))
            . ($relMonths && $otherMonths ? ' + ' . self::monthsLabel($otherMonths) . ' ailleurs' : '') . ($projects ? " + $projects projet(s)" : '')
            . ($min ? ' — attendu : ' . self::monthsLabel($min) : ' — débutants acceptés');
        $criteria['experience'] = [$ratio, $detail];
        if ($ratio >= 1 && ($relMonths || $projects)) {
            $strengths[] = ['points' => $w['experience'], 'text' => 'Expérience : ' . ($relevantTitles ? implode(', ', array_slice($relevantTitles, 0, 2)) : self::monthsLabel($relMonths)) . ' en lien avec le poste'];
        } elseif ($ratio < 1) {
            $gaps[] = ['key' => 'exp:' . $min, 'type' => 'experience', 'ref' => $min, 'name' => 'Expérience', 'lost' => $w['experience'] * (1 - $ratio),
                'current' => (int)round($effective), 'expected' => $min, 'text' => $min ? 'Expérience : ' . ($effective ? self::monthsLabel((int)round($effective)) . ' pris en compte' : 'aucune') . ', ' . self::monthsLabel($min) . ' attendus' : 'Expérience : une première expérience ou un projet en lien avec le poste ferait la différence'];
        }

        /* ---------- 5. Langues (10 %) ---------- */
        $missingLangs = [];
        $names = array_flip(self::LANG_LEVELS);
        if ($reqLangs) {
            $sum = 0;
            foreach ($reqLangs as $name => $need) {
                $have = $candLangs[normalize($name)] ?? 0;
                $v = $have >= $need ? 1.0 : max(0.0, 1 - $r['languages']['per_level'] * ($need - $have));
                $sum += $v;
                if ($v < 1) {
                    $missingLangs[] = $have ? "$name (niveau à renforcer)" : $name;
                    $gaps[] = ['key' => 'lang:' . normalize($name), 'type' => 'language', 'ref' => $name, 'name' => $name, 'lost' => $w['languages'] * (1 - $v) / count($reqLangs),
                        'current' => $have, 'expected' => $need, 'text' => $name . ' : ' . ($have ? 'niveau ' . $names[$have] : 'non renseigné') . ', ' . $names[$need] . ' attendu'];
                }
            }
            $ratio = $sum / count($reqLangs);
            $detail = $missingLangs ? 'À renforcer : ' . implode(', ', $missingLangs) : 'Toutes les langues demandées sont au niveau attendu';
            if (!$missingLangs) {
                $strengths[] = ['points' => $w['languages'], 'text' => 'Langues : ' . implode(', ', array_map(fn($n, $l) => "$n " . $names[$l], array_keys($reqLangs), $reqLangs)) . ' au niveau attendu'];
            }
        } else {
            $ratio = 1.0;
            $detail = 'Pas d\'exigence linguistique particulière';
        }
        $criteria['languages'] = [$ratio, $detail];

        /* ---------- 6. Qualité du CV (10 %) ---------- */
        $q = (int)($p['cv_quality'] ?? 0);
        $criteria['cv'] = [$q / 100, "Score qualité du CV : $q / 100" . (!empty($p['cv_quality_tip']) ? ' · à améliorer : ' . lcfirst($p['cv_quality_tip']) : '')];
        if ($q < 100) {
            $gaps[] = ['key' => 'cv', 'type' => 'cv', 'ref' => null, 'name' => 'CV', 'lost' => $w['cv'] * (1 - $q / 100), 'current' => $q, 'expected' => 100,
                'text' => 'Qualité du CV : ' . $q . ' / 100' . (!empty($p['cv_quality_tip']) ? ' — ' . lcfirst($p['cv_quality_tip']) : '')];
        }

        /* ---------- 7. Localisation et disponibilité (5 %) ---------- */
        $L = $r['location'];
        if ((int)($job['remote'] ?? 0) === 2) {
            [$loc, $ld] = [1.0, 'Poste 100 % à distance'];
        } elseif (!$p['city_id']) {
            [$loc, $ld] = [(float)$L['unknown'], 'Ville non renseignée'];
        } elseif ((int)$p['city_id'] === (int)$job['city_id']) {
            [$loc, $ld] = [(float)$L['same_city'], 'Même ville : ' . $job['city_name']];
        } elseif ((int)$p['country_id'] === (int)$job['country_id']) {
            [$loc, $ld] = $p['mobility'] === 'ville' ? [(float)$L['city_only'], $job['city_name'] . ' — hors de ta zone de mobilité'] : [(float)$L['national'], $job['city_name'] . ' — compatible avec ta mobilité nationale'];
        } else {
            [$loc, $ld] = $p['mobility'] === 'international' ? [(float)$L['abroad_mobile'], 'Poste à l\'étranger (' . $job['city_name'] . ')'] : [(float)$L['abroad'], 'Poste à l\'étranger (' . $job['city_name'] . ') — hors de ta mobilité'];
        }
        if ((int)($job['remote'] ?? 0) === 1) {
            $loc = max($loc, 0.75);
            $ld .= ' · télétravail partiel possible';
        }
        $late = $p['availability_date'] && !empty($job['start_date']) && $p['availability_date'] > $job['start_date'];
        $dispo = $late ? (float)$L['late'] : 1.0;
        $ratio = $L['share'] * $loc + (1 - $L['share']) * $dispo;
        $criteria['location'] = [$ratio, $ld . ($late ? ' · disponible après la date de début' : '')];
        if ($ratio < 1) {
            $gaps[] = ['key' => 'mob', 'type' => 'mobility', 'ref' => null, 'name' => 'Localisation', 'lost' => $w['location'] * (1 - $ratio), 'current' => null, 'expected' => null,
                'text' => 'Localisation et disponibilité : ' . lcfirst($criteria['location'][1])];
        }

        /* ---------- Agrégation ---------- */
        $score = 0.0;
        $result = [];
        foreach (self::CRITERIA as $key => [$label]) {
            [$ratio, $detail] = $criteria[$key];
            $ratio = max(0, min(1, (float)$ratio));
            $points = $ratio * $w[$key];
            $score += $points;
            $result[$key] = ['label' => $label, 'weight' => round($w[$key], 1), 'ratio' => round($ratio, 2), 'points' => round($points, 1), 'detail' => $detail];
        }
        $score = (int)round($score);
        $blocked = (bool)$blocking;
        $verdict = Ref::verdict($score, $blocked);

        usort($strengths, fn($a, $b) => $b['points'] <=> $a['points']);
        usort($gaps, fn($a, $b) => $b['lost'] <=> $a['lost']);
        foreach ($gaps as &$g) {
            $g['lost'] = round($g['lost'], 1);
        }
        unset($g);
        $missing = array_values(array_map(fn($i) => ['id' => $i['id'], 'name' => $i['name'], 'required' => $i['expected'] >= 3, 'level' => $i['expected'], 'have' => $i['have']],
            array_filter($items, fn($i) => $i['have'] === 0)));

        $out = [
            'score'          => $score,
            'verdict'        => $verdict,
            'level'          => $verdict['label'],
            'blocked'        => $blocked,
            'blocking'       => $blocking,
            'eliminated'     => $blocked,
            'elimination'    => $blocked ? 'Prérequis manquant : ' . implode(' ; ', array_map(fn($b) => $b['label'] . ' (' . $b['detail'] . ')', $blocking)) . '.' : null,
            'criteria'       => $result,
            'skill_items'    => $items,
            'strength_items' => array_slice($strengths, 0, 3),
            'strengths'      => array_map(fn($s) => $s['text'], array_slice($strengths, 0, 3)),
            'gap_items'      => $gaps,
            'gaps'           => array_map(fn($g) => $g['text'], array_slice($gaps, 0, 4)),
            'missing_skills' => $missing,
            'missing_langs'  => $missingLangs,
            'version'        => Ref::version(),
            'occupation'     => $occ ? ['code' => $occ['code'], 'title' => $occ['title']] : null,
            'actions'        => [],
        ];
        if ($withActions) {
            $out['actions'] = self::actions($out, $job, $p);
        }
        return $out;
    }

    /** Niveaux retenus pour chaque compétence du candidat (plafond sans preuve, titres sans justificatif). */
    private static function candidateSkills(array $p, array $r): array
    {
        $cand = [];
        foreach ($p['skills'] as $s) {
            $lvl = max(0, min(4, (int)$s['level']));
            $proof = (string)($s['proof'] ?? 'aucune');
            $cred = (int)($s['credential'] ?? (Ref::skill((int)$s['id'])['credential'] ?? 0));
            $pending = isset($s['confirmed']) && !(int)$s['confirmed'];
            $eff = $pending ? 0 : ($proof === 'aucune' ? ($cred ? 0 : min($lvl, (int)$r['unproven_cap'])) : $lvl);
            $cur = $cand[(int)$s['id']] ?? null;
            if (!$cur || $eff > $cur['eff']) {
                $cand[(int)$s['id']] = ['level' => $lvl, 'eff' => $eff, 'proof' => $proof, 'pending' => $pending];
            }
        }
        return $cand;
    }

    /** Niveau de diplôme retenu : un diplôme en cours compte avec son année d'études (§7). */
    private static function degreeLevel(array $p, array $job): array
    {
        $level = (int)$p['education_level'];
        $note = null;
        $inProgress = $p['degree_in_progress'] ?? null;
        if ($inProgress && (int)$inProgress['level'] >= $level) {
            $note = trim($inProgress['label'] . ' en cours');
            // Pour un stage ou une alternance, le diplôme préparé est le bon repère ; pour un emploi, le niveau précédent
            $level = in_array($job['type'] ?? '', ['stage', 'alternance'], true) ? (int)$inProgress['level'] : max(0, (int)$inProgress['level'] - 1);
        }
        return [$level, $note];
    }

    private static function hasDegree(array $p, string $regulated): bool
    {
        $target = normalize($regulated);
        foreach ($p['educations'] as $e) {
            $t = normalize((string)$e['degree']);
            if ($t !== '' && (str_contains($t, $target) || str_contains($target, $t)) && !(int)($e['in_progress'] ?? 0)) {
                return true;
            }
        }
        return false;
    }

    /** Mois d'expérience en lien avec le poste, ailleurs, et projets (stages, emplois, projets, bénévolat). */
    private static function experience(array $p, array $job, ?array $occ): array
    {
        $related = $occ ? array_merge([$occ['code']], $occ['related']) : [];
        $jobTokens = \App\Services\Referential\Normalizer::tokens((string)$job['title']);
        $skillNames = array_map(fn($s) => normalize($s['name']), $job['skills']);
        $rel = $other = $projects = 0;
        $titles = [];
        foreach ($p['experiences'] as $x) {
            $code = $x['occupation_code'] ?? null;
            $text = normalize($x['title'] . ' ' . $x['description']);
            $relevant = !empty($x['force_relevant']) || ($code && in_array($code, $related, true))
                || count(array_intersect($jobTokens, \App\Services\Referential\Normalizer::tokens((string)$x['title']))) >= max(1, (int)ceil(count($jobTokens) / 2))
                || count(array_filter($skillNames, fn($s) => $s !== '' && str_contains(" $text ", " $s "))) >= 2;
            if (in_array($x['kind'], ['projet', 'benevolat'], true)) {
                if ($relevant) {
                    $projects++;
                    $titles[] = $x['title'];
                }
                continue;
            }
            $m = self::months($x);
            if ($relevant) {
                $rel += $m;
                $titles[] = $x['title'];
            } else {
                $other += $m;
            }
        }
        // Expérience déclarée globalement sans détail : comptée comme expérience générale
        $declared = (int)$p['experience_months'];
        if ($declared > $rel + $other) {
            $other = $declared - $rel;
        }
        return [$rel, max(0, $other), $projects, array_values(array_unique($titles))];
    }

    private static function months(array $x): int
    {
        if (empty($x['start_date'])) {
            return 0;
        }
        $start = strtotime((string)$x['start_date']);
        $end = !empty($x['end_date']) ? strtotime((string)$x['end_date']) : time();
        return max(0, (int)round(($end - $start) / (30 * 86400)));
    }

    public static function level(int $score): string
    {
        return Ref::verdict($score)['label'];
    }

    /** Action recommandée et pistes concrètes, avec le gain de score estimé. */
    private static function actions(array $m, array $job, array $p): array
    {
        $actions = [];
        if ($m['blocked']) {
            foreach ($m['blocking'] as $b) {
                $actions[] = ['type' => 'block', 'text' => 'Prérequis indispensable : ' . $b['label'], 'link' => '/espace/profil', 'extra' => ucfirst($b['detail'])];
            }
        }
        foreach (array_slice($m['gap_items'], 0, 3) as $g) {
            $gain = self::gain($p, $job, $g);
            $extra = $gain > 0 ? '+' . $gain . ' point' . ($gain > 1 ? 's' : '') . ' estimé' . ($gain > 1 ? 's' : '') . ' si cet écart est comblé' : null;
            $actions[] = match ($g['type']) {
                'skill', 'level' => ['type' => 'skill', 'text' => ($g['capped'] ?? false) ? 'Ajoute une preuve pour « ' . $g['name'] . ' » (certificat, stage, projet)' : 'Progresser en « ' . $g['name'] . ' » jusqu\'au niveau ' . $g['expected'], 'link' => ($g['capped'] ?? false) ? '/espace/profil#competences' : '/formations?q=' . urlencode($g['name']), 'extra' => $extra],
                'education' => ['type' => 'education', 'text' => 'Viser le niveau ' . Ref::degreeLabel((int)$g['expected']) . ' (formation diplômante, alternance, validation des acquis)', 'link' => '/espace/progression', 'extra' => $extra],
                'domain' => ['type' => 'education', 'text' => 'Précise ton domaine d\'études ou valorise une formation dans le domaine du poste', 'link' => '/espace/profil#formations', 'extra' => $extra],
                'experience' => ['type' => 'experience', 'text' => 'Ajoute un stage, un emploi ou un projet en lien avec le poste', 'link' => '/espace/profil#experiences', 'extra' => $extra],
                'language' => ['type' => 'language', 'text' => 'Renforce ton niveau en ' . $g['name'], 'link' => '/formations?q=' . urlencode($g['name']), 'extra' => $extra],
                'cv' => ['type' => 'cv', 'text' => 'Améliore ton CV : ' . lcfirst($p['cv_quality_tip'] ?? 'complète-le'), 'link' => '/espace/cv', 'extra' => $extra],
                default => ['type' => 'mobility', 'text' => 'Précise ta mobilité et ta disponibilité', 'link' => '/espace/profil', 'extra' => $extra],
            };
        }
        if (!$actions || $m['verdict']['key'] === 'adapte') {
            array_unshift($actions, ['type' => 'apply', 'text' => $m['verdict']['action'], 'link' => !empty($job['id']) ? '/espace/lettres?job=' . $job['id'] : '/offres', 'extra' => null]);
        }
        return array_slice($actions, 0, 4);
    }

    /** Gain de score estimé si un écart est comblé : le moteur est relancé sur le profil corrigé. */
    public static function gain(array $p, array $job, array $g): int
    {
        $q = self::closeGap($p, $g);
        if ($q === null) {
            return 0;
        }
        $base = self::compute($p, $job, false)['score'];
        return max(0, self::compute($q, $job, false)['score'] - $base);
    }

    /** Profil où l'écart est comblé (compétence au niveau attendu avec preuve, diplôme, expérience…). */
    public static function closeGap(array $p, array $g): ?array
    {
        switch ($g['type']) {
            case 'skill':
            case 'level':
                $found = false;
                foreach ($p['skills'] as &$s) {
                    if ((int)$s['id'] === (int)$g['ref']) {
                        $s['level'] = max((int)$s['level'], (int)$g['expected']);
                        $s['proof'] = $s['proof'] === 'aucune' || empty($s['proof']) ? 'certificat' : $s['proof'];
                        $s['confirmed'] = 1;
                        $found = true;
                    }
                }
                unset($s);
                if (!$found) {
                    $p['skills'][] = ['id' => (int)$g['ref'], 'name' => $g['name'], 'slug' => '', 'category' => 'technique', 'level' => (int)$g['expected'], 'proof' => 'certificat', 'confirmed' => 1];
                }
                return $p;
            case 'education':
                $p['education_level'] = (int)$g['expected'];
                $p['degree_in_progress'] = null;
                return $p;
            case 'domain':
                return null;
            case 'experience':
                $p['experiences'][] = ['title' => 'Expérience en lien', 'kind' => 'stage', 'description' => '', 'start_date' => date('Y-m-d', strtotime('-' . max(3, (int)$g['expected']) . ' months')), 'end_date' => date('Y-m-d'), 'force_relevant' => true];
                return $p;
            case 'language':
                $names = array_flip(self::LANG_LEVELS);
                $done = false;
                foreach ($p['languages_list'] as &$l) {
                    if (normalize($l['name'] ?? '') === normalize((string)$g['ref'])) {
                        $l['level'] = $names[$g['expected']];
                        $done = true;
                    }
                }
                unset($l);
                if (!$done) {
                    $p['languages_list'][] = ['name' => $g['ref'], 'level' => $names[$g['expected']]];
                }
                return $p;
            case 'cv':
                $p['cv_quality'] = 100;
                return $p;
            case 'mobility':
                $p['mobility'] = 'international';
                $p['availability_date'] = null;
                return $p;
        }
        return null;
    }

    /* ================================================================== Requêtes */

    public static function forUser(int $userId, int $jobId, bool $persist = false): ?array
    {
        $p = ProfileService::load($userId);
        $job = self::loadJob($jobId);
        if (!$p || !$job) {
            return null;
        }
        $m = self::compute($p, $job);
        if ($persist) {
            self::persist($userId, $jobId, $m, $p);
        }
        return $m;
    }

    /** Traçabilité : chaque score enregistre la version des référentiels et des règles, et la méthode d'extraction (§9). */
    public static function persist(int $userId, int $jobId, array $m, array $p): void
    {
        DB::delete('match_scores', 'user_id = :u AND job_id = :j', ['u' => $userId, 'j' => $jobId]);
        DB::insert('match_scores', [
            'user_id' => $userId, 'job_id' => $jobId, 'score' => $m['score'], 'verdict' => $m['verdict']['key'], 'ref_version' => $m['version'],
            'extraction' => $p['extraction'] ?? 'formulaire',
            'details' => json_encode(['criteria' => $m['criteria'], 'strengths' => $m['strengths'], 'gaps' => $m['gaps'], 'blocking' => $m['blocking']], JSON_UNESCAPED_UNICODE),
            'computed_at' => now(),
        ]);
    }

    /** Offres publiées classées par compatibilité pour un candidat (prérequis manquants exclus). */
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
            $m = self::compute($p, $job, false);
            if ($m['blocked'] || $m['verdict']['key'] === 'eloigne') {
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
            $m = self::compute($p, $job, false);
            if (!empty($filters['min_score']) && $m['score'] < (int)$filters['min_score']) {
                continue;
            }
            $out[] = ['profile' => $p, 'match' => $m];
        }
        usort($out, fn($a, $b) => [(int)!$b['match']['blocked'], $b['match']['score']] <=> [(int)!$a['match']['blocked'], $a['match']['score']]);
        return array_slice($out, 0, $limit);
    }

    /* ================================================================== Utilitaires */

    public static function experienceMonths(array $experiences): int
    {
        $months = 0;
        foreach ($experiences as $x) {
            if ($x['kind'] === 'projet') {
                continue;
            }
            $months += self::months($x);
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
}
