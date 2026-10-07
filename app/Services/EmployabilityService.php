<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;
use App\Services\Referential\Normalizer;
use App\Services\Referential\Ref;

/**
 * Score d'employabilité v1.1 (référentiel Objectifs & Seuils, §8) :
 * moyenne des scores d'adéquation sur les 10 offres les plus proches du métier visé, mise à jour à chaque
 * modification du profil. Le candidat choisit un à trois métiers cibles ; la plateforme calcule l'écart avec
 * chacun (score face à la fiche métier). Le profil est « prêt » pour un métier à partir de 70.
 */
final class EmployabilityService
{
    /** Métiers cibles : choix du candidat, sinon métier visé reconnu dans son profil. */
    public static function targets(array $p): array
    {
        $max = (int)(Ref::rules()['employability']['max_targets'] ?? 3);
        $ids = array_slice(array_values(array_filter(array_map('intval', explode(',', (string)($p['target_occupations'] ?? ''))))), 0, $max);
        $ids = array_values(array_filter($ids, fn($id) => Ref::occupation($id) !== null));
        $inferred = false;
        if (!$ids && !empty($p['desired_job'])) {
            $m = Normalizer::occupation((string)$p['desired_job']);
            if ($m && $m['confidence'] >= 60 && Ref::occupation($m['id'])) {
                $ids = [$m['id']];
                $inferred = true;
            }
        }
        return [$ids, $inferred];
    }

    /** Les offres publiées les plus proches des métiers cibles : même métier, puis métiers proches, puis même famille professionnelle ROME. */
    public static function closestJobs(array $targets, int $limit): array
    {
        $codes = $related = $families = [];
        foreach ($targets as $id) {
            $o = Ref::occupation($id);
            $codes[$id] = $o['code'];
            $related = array_merge($related, $o['related']);
            $families[] = $o['family'];
        }
        $rows = DB::all("SELECT j.id, j.occupation_id, j.sector_id, j.published_at FROM jobs j
            WHERE j.status = 'published' AND (j.deadline IS NULL OR j.deadline >= :d) ORDER BY j.published_at DESC LIMIT 400", ['d' => date('Y-m-d')]);
        $ranked = [];
        foreach ($rows as $r) {
            $o = Ref::occupation($r['occupation_id'] ? (int)$r['occupation_id'] : null);
            $rank = match (true) {
                $o && in_array((int)$r['occupation_id'], $targets, true) => 0,
                $o && in_array($o['code'], $related, true) => 1,
                $o && in_array($o['family'], $families, true) => 2,
                default => null,
            };
            if ($rank !== null) {
                $ranked[] = [$rank, (int)$r['id']];
            }
        }
        usort($ranked, fn($a, $b) => $a[0] <=> $b[0]);
        return array_map(fn($r) => ['id' => $r[1], 'rank' => $r[0]], array_slice($ranked, 0, $limit));
    }

    public static function compute(int $userId, bool $persist = false, bool $withPlan = false): array
    {
        $p = ProfileService::load($userId, true);
        $rules = Ref::rules()['employability'];
        [$targets, $inferred] = self::targets($p);
        $jobs = [];
        $basis = 'offres';
        if ($targets) {
            foreach (self::closestJobs($targets, (int)$rules['offers']) as $c) {
                if ($job = MatchingEngine::loadJob($c['id'])) {
                    $jobs[] = $job + ['_rank' => $c['rank']];
                }
            }
        } else {
            // Sans métier cible : les offres les plus compatibles, en attendant le choix du candidat
            $basis = 'meilleures';
            foreach (MatchingEngine::recommendJobs($userId, (int)$rules['offers']) as $r) {
                $jobs[] = $r['job'] + ['_rank' => 9];
            }
        }
        $fiches = [];
        foreach ($targets as $id) {
            $job = MatchingEngine::occupationJob($id);
            $m = MatchingEngine::compute($p, $job, false);
            $fiches[] = ['id' => $id, 'code' => $job['occupation_code'], 'title' => $job['title'], 'score' => $m['score'], 'ready' => $m['score'] >= (int)$rules['ready'] && !$m['blocked'],
                'verdict' => $m['verdict'], 'gaps' => array_slice($m['gap_items'], 0, 3), 'strengths' => $m['strengths'], 'job' => $job];
        }
        if (!$jobs && $fiches) {
            $basis = 'fiches';
        }
        $scored = [];
        foreach ($jobs as $job) {
            $m = MatchingEngine::compute($p, $job, false);
            $scored[] = ['job' => $job, 'match' => $m];
        }
        $pool = $scored ?: array_map(fn($f) => ['job' => $f['job'], 'match' => MatchingEngine::compute($p, $f['job'], false)], $fiches);
        $score = $pool ? (int)round(array_sum(array_map(fn($x) => $x['match']['score'], $pool)) / count($pool)) : 0;
        $ready = (int)$rules['ready'];

        $plan = [];
        $tips = [];
        if ($pool) {
            $agg = [];
            foreach ($pool as $x) {
                foreach ($x['match']['gap_items'] as $g) {
                    if (in_array($g['type'], ['mobility'], true)) {
                        continue;
                    }
                    $k = $g['key'];
                    $agg[$k] ??= $g + ['count' => 0, 'lost_total' => 0];
                    $agg[$k]['count']++;
                    $agg[$k]['lost_total'] += $g['lost'];
                    $agg[$k]['expected'] = max((int)$agg[$k]['expected'], (int)$g['expected']);
                }
            }
            uasort($agg, fn($a, $b) => $b['lost_total'] <=> $a['lost_total']);
            foreach (array_slice($agg, 0, $withPlan ? 8 : 4, true) as $g) {
                // Gain estimé : nouveau score d'employabilité si l'écart est comblé (moteur relancé sur chaque offre)
                $q = MatchingEngine::closeGap($p, $g);
                $gain = 0;
                if ($q !== null) {
                    $after = array_sum(array_map(fn($x) => MatchingEngine::compute($q, $x['job'], false)['score'], $pool)) / count($pool);
                    $gain = max(0, (int)round($after - $score));
                }
                $plan[] = ['key' => $g['key'], 'type' => $g['type'], 'ref' => $g['ref'], 'name' => $g['name'], 'expected' => $g['expected'], 'current' => $g['current'],
                    'capped' => $g['capped'] ?? false, 'label' => self::planLabel($g), 'count' => $g['count'], 'of' => count($pool), 'gain' => $gain];
            }
            usort($plan, fn($a, $b) => $b['gain'] <=> $a['gain']);
            foreach ($plan as $s) {
                if ($s['gain'] > 0) {
                    $tips[] = $s['label'] . ' : +' . $s['gain'] . ' point' . ($s['gain'] > 1 ? 's' : '') . ' d\'employabilité estimé' . ($s['gain'] > 1 ? 's' : '');
                }
            }
        }
        if (!$targets) {
            array_unshift($tips, 'Choisis jusqu\'à trois métiers cibles : ton score sera calculé sur les offres les plus proches de ces métiers');
        }

        if ($persist) {
            DB::update('candidate_profiles', ['employability_score' => $score], 'user_id = :u', ['u' => $userId]);
            $last = DB::one('SELECT score FROM employability_scores WHERE user_id = :u ORDER BY id DESC LIMIT 1', ['u' => $userId]);
            if (!$last || (int)$last['score'] !== $score) {
                DB::insert('employability_scores', [
                    'user_id' => $userId, 'score' => $score,
                    'details' => json_encode(['basis' => $basis, 'targets' => $targets, 'offers' => array_map(fn($x) => [(int)$x['job']['id'], $x['match']['score']], $pool), 'version' => Ref::version()]),
                    'created_at' => now(),
                ]);
            }
        }

        return [
            'score' => $score, 'label' => self::label($score), 'ready' => $score >= $ready, 'threshold' => $ready, 'basis' => $basis,
            'targets' => $fiches, 'inferred' => $inferred, 'offers' => array_map(fn($x) => ['id' => (int)$x['job']['id'], 'title' => $x['job']['title'], 'company' => $x['job']['company_name'] ?? null,
                'score' => $x['match']['score'], 'verdict' => $x['match']['verdict'], 'rank' => $x['job']['_rank'] ?? null], $scored),
            'plan' => $plan, 'tips' => $tips, 'version' => Ref::version(), 'factors' => [],
        ];
    }

    private static function planLabel(array $g): string
    {
        return match ($g['type']) {
            'skill' => 'Acquérir « ' . $g['name'] . ' » (niveau ' . $g['expected'] . ')',
            'level' => ($g['capped'] ?? false) ? 'Prouver ton niveau en « ' . $g['name'] . ' » (certificat, stage, projet)' : 'Passer au niveau ' . $g['expected'] . ' en « ' . $g['name'] . ' »',
            'education' => 'Atteindre le niveau ' . Ref::degreeLabel((int)$g['expected']),
            'domain' => 'Rapprocher ton domaine d\'études des métiers visés',
            'experience' => 'Ajouter une expérience ou un projet en lien',
            'language' => ucfirst($g['name']) . ' : viser le niveau ' . (array_flip(MatchingEngine::LANG_LEVELS)[$g['expected']] ?? 'B1'),
            'cv' => 'Améliorer la qualité de ton CV',
            default => $g['name'],
        };
    }

    public static function label(int $score): string
    {
        $ready = (int)(Ref::rules()['employability']['ready'] ?? 70);
        return match (true) {
            $score >= $ready => 'Prêt·e pour le métier visé',
            $score >= 55 => 'Proche du seuil de préparation',
            $score >= 40 => 'En progression',
            default => 'À construire',
        };
    }

    /** Plan d'action 30 / 60 / 90 jours à partir des écarts identifiés. */
    public static function actionPlan(int $userId): array
    {
        $p = ProfileService::load($userId);
        $e = self::compute($userId);
        $recos = MatchingEngine::recommendJobs($userId, 5);
        $missing = [];
        foreach ($recos as $r) {
            foreach ($r['match']['missing_skills'] as $s) {
                $missing[$s['name']] = ($missing[$s['name']] ?? 0) + ($s['required'] ? 2 : 1);
            }
        }
        arsort($missing);
        $topMissing = array_slice(array_keys($missing), 0, 3);
        $completion = ProfileService::completion($p);

        $d30 = [];
        foreach (array_slice($completion['missing'], 0, 3) as $m) {
            $d30[] = $m;
        }
        if (!$p['riasec_code']) {
            $d30[] = 'Passer le test d\'orientation RIASEC (10 min)';
        }
        $d30[] = 'Finaliser ton CV avec un modèle Tremplin et le télécharger en PDF';
        $d30[] = 'Envoyer 5 candidatures ciblées parmi tes meilleurs matchs';

        $d60 = [];
        foreach (array_slice(GapAnalysisService::market($userId, 10)['gaps'], 0, 3) as $g) {
            $pick = null;
            foreach ($g['recos'] as $r) {
                if (in_array($r['kind'], ['certification', 'training'], true)) {
                    $pick = $r;
                    break;
                }
            }
            $d60[] = $pick
                ? ($pick['kind'] === 'certification' ? 'Préparer la certification « ' : 'Suivre la formation « ') . $pick['title'] . ' » pour : ' . lcfirst($g['label']) . ' (+' . $g['avg_gain'] . ' pts en moyenne sur ' . $g['count'] . ' offre(s))'
                : ucfirst($g['label']) . ' (+' . $g['avg_gain'] . ' pts en moyenne sur ' . $g['count'] . ' offre(s))';
        }
        if (!$d60) {
            foreach ($topMissing as $s) {
                $d60[] = "Se former sur « $s » (compétence la plus demandée dans tes matchs)";
            }
        }
        $d60[] = 'Faire 2 simulations d\'entretien et retravailler les réponses faibles';
        $d60[] = 'Réaliser un projet concret à ajouter dans ton profil (portfolio, étude de cas, bénévolat)';

        $d90 = [
            'Viser un score d\'employabilité ≥ ' . min(95, $e['score'] + 20) . ' (actuel : ' . $e['score'] . ')',
            'Relancer les recruteurs 7 jours après chaque candidature sans réponse',
            'Développer ton réseau : 1 événement professionnel ou associatif par mois à ' . ($p['city_name'] ?: 'ta ville'),
            'Mettre à jour ton profil avec les nouvelles compétences acquises',
        ];
        return ['30' => array_slice($d30, 0, 5), '60' => array_slice($d60, 0, 5), '90' => $d90, 'missing' => $topMissing, 'score' => $e['score']];
    }
}
