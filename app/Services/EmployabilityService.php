<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/**
 * Score d'employabilité explicable (0–100) : chaque facteur indique sa contribution et le levier d'amélioration.
 */
final class EmployabilityService
{
    public static function compute(int $userId, bool $persist = false): array
    {
        $p = ProfileService::load($userId, true);
        $completion = ProfileService::completion($p);
        $months = max($p['experience_months'], MatchingEngine::experienceMonths($p['experiences']));
        $projects = count(array_filter($p['experiences'], fn($x) => $x['kind'] === 'projet'));
        $techSkills = array_filter($p['skills'], fn($s) => $s['category'] === 'tech');
        $skillPts = array_sum(array_map(fn($s) => min(5, (int)$s['level']), $techSkills));
        $apps = (int)DB::value('SELECT COUNT(*) FROM applications WHERE user_id = :u AND created_at >= :d', ['u' => $userId, 'd' => date('Y-m-d', strtotime('-60 days'))]);
        $interviews = (int)DB::value("SELECT COUNT(*) FROM interview_sessions WHERE user_id = :u", ['u' => $userId]);
        $langCount = count($p['languages_list']);
        $hasEnglish = (bool)array_filter($p['languages_list'], fn($l) => str_starts_with(normalize($l['name'] ?? ''), 'angl'));

        $factors = [
            'profile' => [
                'label' => 'Profil complet', 'max' => 15,
                'value' => $completion['percent'] / 100 * 15,
                'tip'   => $completion['missing'] ? reset($completion['missing']) : null,
            ],
            'skills' => [
                'label' => 'Compétences techniques', 'max' => 20,
                'value' => min(20, $skillPts * 20 / 24),
                'tip'   => count($techSkills) < 6 ? 'Ajoute tes compétences techniques et évalue ton niveau honnêtement : un niveau juste vaut mieux qu\'un niveau gonflé en entretien' : null,
            ],
            'experience' => [
                'label' => 'Expérience & projets', 'max' => 20,
                'value' => min(20, $months * 20 / 18 + $projects * 3),
                'tip'   => $months < 6 ? 'Pas encore d\'expérience ? Un stage, un job étudiant ou un projet personnel concret compte aussi, et il pèse lourd' : null,
            ],
            'education' => [
                'label' => 'Formation', 'max' => 15,
                'value' => min(15, $p['education_level'] * 15 / 6),
                'tip'   => $p['education_level'] < 4 ? 'Une formation courte certifiante peut compenser un diplôme moins élevé : les recruteurs regardent aussi ce que tu sais faire' : null,
            ],
            'languages' => [
                'label' => 'Langues', 'max' => 10,
                'value' => min(10, $langCount * 4 + ($hasEnglish ? 3 : 0)),
                'tip'   => !$hasEnglish ? 'L\'anglais ouvre beaucoup de portes au Gabon (pétrole, mines, ONG, digital) : même un niveau intermédiaire fait la différence' : null,
            ],
            'orientation' => [
                'label' => 'Orientation (RIASEC)', 'max' => 5,
                'value' => $p['riasec_code'] ? 5 : 0,
                'tip'   => !$p['riasec_code'] ? 'Passe le test d\'orientation : 10 minutes pour clarifier ton projet et cibler les bons métiers' : null,
            ],
            'soft' => [
                'label' => 'Soft skills', 'max' => 5,
                'value' => min(5, count($p['soft_list']) * 1.25),
                'tip'   => count($p['soft_list']) < 4 ? 'Mets en avant tes qualités (rigueur, travail en équipe…) : à compétences égales, c\'est souvent ce qui départage' : null,
            ],
            'activity' => [
                'label' => 'Dynamique de recherche', 'max' => 10,
                'value' => min(10, $apps * 2 + $interviews * 2),
                'tip'   => $apps < 3 ? 'Garde le rythme : 3 à 5 candidatures ciblées par semaine valent mieux que 30 envoyées au hasard' : null,
            ],
        ];
        $score = 0;
        foreach ($factors as &$f) {
            $f['value'] = round($f['value'], 1);
            $f['percent'] = (int)round($f['value'] / $f['max'] * 100);
            $score += $f['value'];
        }
        unset($f);
        $score = (int)round($score);

        if ($persist) {
            DB::update('candidate_profiles', ['employability_score' => $score], 'user_id = :u', ['u' => $userId]);
            $last = DB::one('SELECT score, created_at FROM employability_scores WHERE user_id = :u ORDER BY id DESC LIMIT 1', ['u' => $userId]);
            if (!$last || (int)$last['score'] !== $score) {
                DB::insert('employability_scores', [
                    'user_id' => $userId, 'score' => $score,
                    'details' => json_encode(array_map(fn($f) => $f['value'], $factors)), 'created_at' => now(),
                ]);
            }
        }

        $tips = array_values(array_filter(array_map(fn($f) => $f['tip'], $factors)));
        return ['score' => $score, 'label' => self::label($score), 'factors' => $factors, 'tips' => $tips];
    }

    public static function label(int $score): string
    {
        return match (true) {
            $score >= 80 => 'Prêt·e à décrocher',
            $score >= 60 => 'Très bonne dynamique',
            $score >= 40 => 'En progression',
            default      => 'À construire',
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
        foreach ($topMissing as $s) {
            $d60[] = "Se former sur « $s » (compétence la plus demandée dans tes matchs)";
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
