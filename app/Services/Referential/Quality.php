<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;
use App\Services\Training\TrainingCatalog;

/**
 * Tableau de bord qualité (§13) et calibrage par les résultats (§11).
 * Chaque indicateur est calculé sur les données réelles de la plateforme ; « non mesurable »
 * quand les données manquent encore (jamais de valeur estimée).
 */
final class Quality
{
    /** @return array<string, array{label:string, definition:string, target:string, value:?float, unit:string, ok:?bool, detail:string}> */
    public static function indicators(): array
    {
        $r = Ref::rules();
        $auto = (int)$r['normalization']['auto'];
        $out = [];

        // 1. Taux de normalisation : offres et éléments de CV rattachés automatiquement à un code
        $jobs = (int)DB::value('SELECT COUNT(*) FROM jobs');
        $jobsAuto = (int)DB::value('SELECT COUNT(*) FROM jobs WHERE occupation_id IS NOT NULL AND occupation_confidence >= :a', ['a' => $auto]);
        $cv = (int)DB::value("SELECT COUNT(*) FROM candidate_skills WHERE source IN ('cv', 'experience')");
        $cvAuto = (int)DB::value("SELECT COUNT(*) FROM candidate_skills WHERE source IN ('cv', 'experience') AND confidence >= :a", ['a' => $auto]);
        $den = $jobs + $cv;
        $out['normalisation'] = self::kpi('Taux de normalisation', 'Part des éléments de CV et d\'offres rattachés automatiquement à un code', '≥ 85 %',
            $den ? 100 * ($jobsAuto + $cvAuto) / $den : null, '%', fn($v) => $v >= 85, "$jobsAuto / $jobs offres, $cvAuto / $cv compétences détectées");

        // 2. Précision : contrôles manuels sur échantillon
        $checks = (int)DB::value('SELECT COUNT(*) FROM normalization_checks');
        $correct = (int)DB::value('SELECT COUNT(*) FROM normalization_checks WHERE correct = 1');
        $out['precision'] = self::kpi('Précision de la normalisation', 'Part des rattachements jugés corrects sur un échantillon contrôlé', '≥ 90 %',
            $checks ? 100 * $correct / $checks : null, '%', fn($v) => $v >= 90, $checks ? "$correct corrects sur $checks contrôlés" : 'Aucun contrôle : lance un contrôle d\'échantillon');

        // 3. Accord avec les experts
        $g = Versions::evaluate();
        $out['experts'] = self::kpi('Accord avec les experts', 'Écart moyen entre score calculé et score des experts sur le jeu de référence', '< 10 points',
            $g['mae'], 'pts', fn($v) => $v < 10, $g['pairs'] . ' couple(s) noté(s) sur ' . (int)$r['golden']['target_pairs'] . ' visés');

        // 4. Pouvoir prédictif : taux d'entretien « adaptés » / « proches »
        $cal = self::calibration();
        $a = $cal['adapte'] ?? null;
        $p = $cal['proche'] ?? null;
        $pred = $a && $p && $a['apps'] >= 5 && $p['apps'] >= 5 && $p['interview_rate'] > 0 ? $a['interview_rate'] / $p['interview_rate'] : null;
        $out['predictif'] = self::kpi('Pouvoir prédictif', 'Taux d\'entretien des profils « adaptés » divisé par celui des profils « proches »', '≥ 1,5',
            $pred, '', fn($v) => $v >= 1.5, $a && $p ? ($a['apps'] . ' candidatures « adaptées », ' . $p['apps'] . ' « proches »' . ($pred === null ? ' (au moins 5 de chaque requises)' : '')) : 'Pas encore assez de candidatures');

        // 5. Couverture métiers : offres publiées rattachées à une fiche validée
        $pub = (int)DB::value("SELECT COUNT(*) FROM jobs WHERE status = 'published'");
        $pubValid = (int)DB::value("SELECT COUNT(*) FROM jobs j JOIN occupations o ON o.id = j.occupation_id WHERE j.status = 'published' AND o.status = 'valide'");
        $pubLinked = (int)DB::value("SELECT COUNT(*) FROM jobs WHERE status = 'published' AND occupation_id IS NOT NULL");
        $out['couverture'] = self::kpi('Couverture métiers', 'Part des offres publiées rattachées à une fiche validée', '≥ 95 %',
            $pub ? 100 * $pubValid / $pub : null, '%', fn($v) => $v >= 95, "$pubValid / $pub offres sur une fiche validée ($pubLinked rattachées, fiches en brouillon comprises)");

        // 6. Fraîcheur des formations
        $active = (int)DB::value('SELECT COUNT(*) FROM trainings WHERE active = 1 AND platform_id IS NOT NULL');
        $fresh = (int)DB::value('SELECT COUNT(*) FROM trainings WHERE active = 1 AND platform_id IS NOT NULL AND verified_at >= :f', ['f' => TrainingCatalog::freshSince()]);
        $out['fraicheur'] = self::kpi('Fraîcheur des formations', 'Part des formations vérifiées depuis moins de 6 mois', '100 % des formations affichées',
            $active ? 100.0 : null, '%', fn($v) => $v >= 100, "Les formations non vérifiées sont masquées automatiquement. Catalogue : $fresh / $active vérifiées depuis moins de 6 mois");

        // 7. Compréhension
        $fb = (int)DB::value('SELECT COUNT(*) FROM score_feedback');
        $yes = (int)DB::value('SELECT COUNT(*) FROM score_feedback WHERE understood = 1');
        $out['comprehension'] = self::kpi('Compréhension', 'Part des candidats déclarant comprendre leur score', '≥ 80 %',
            $fb ? 100 * $yes / $fb : null, '%', fn($v) => $v >= 80, $fb ? "$yes réponses « oui » sur $fb" : 'Aucune réponse pour l\'instant');

        // 8. Explications contestées
        $shown = (int)DB::value('SELECT COUNT(*) FROM match_scores');
        $contested = (int)DB::value("SELECT COUNT(*) FROM curation_queue WHERE kind = 'explication'");
        $out['contestees'] = self::kpi('Explications contestées', 'Part des fiches d\'adéquation signalées comme erronées', '< 3 %',
            $shown ? 100 * $contested / $shown : null, '%', fn($v) => $v < 3, "$contested signalement(s) pour $shown fiche(s) enregistrée(s)");

        // 9. Progression après une formation suivie
        $gains = [];
        foreach (DB::all("SELECT user_id, completed_at FROM candidate_trainings WHERE status = 'terminee' AND completed_at IS NOT NULL") as $t) {
            $before = DB::value('SELECT score FROM employability_scores WHERE user_id = :u AND created_at <= :d ORDER BY created_at DESC LIMIT 1', ['u' => $t['user_id'], 'd' => $t['completed_at']]);
            $after = DB::value('SELECT score FROM employability_scores WHERE user_id = :u AND created_at > :d ORDER BY created_at DESC LIMIT 1', ['u' => $t['user_id'], 'd' => $t['completed_at']]);
            if ($before !== null && $after !== null) {
                $gains[] = (int)$after - (int)$before;
            }
        }
        $out['progression'] = self::kpi('Progression', 'Gain moyen du score d\'employabilité après une formation suivie', '≥ 5 points',
            $gains ? array_sum($gains) / count($gains) : null, 'pts', fn($v) => $v >= 5, count($gains) . ' formation(s) terminée(s) mesurable(s)');
        return $out;
    }

    private static function kpi(string $label, string $def, string $target, ?float $value, string $unit, callable $ok, string $detail): array
    {
        return ['label' => $label, 'definition' => $def, 'target' => $target, 'value' => $value === null ? null : round($value, 1), 'unit' => $unit,
            'ok' => $value === null ? null : (bool)$ok($value), 'detail' => $detail];
    }

    /**
     * Calibrage : par tranche de verdict (score enregistré au moment de la candidature),
     * nombre de candidatures, taux d'entretien et taux d'embauche obtenus.
     */
    public static function calibration(): array
    {
        $bands = [];
        foreach (Ref::rules()['thresholds'] as $t) {
            $bands[$t['key']] = ['label' => $t['label'], 'min' => (int)$t['min'], 'apps' => 0, 'interviews' => 0, 'hired' => 0];
        }
        $rows = DB::all("SELECT a.id, a.match_score, a.status,
            (SELECT COUNT(*) FROM application_events e WHERE e.application_id = a.id AND e.status IN ('interview', 'accepted')) AS reached
            FROM applications a WHERE a.match_score IS NOT NULL AND a.status != 'draft'");
        foreach ($rows as $a) {
            $key = Ref::verdict((int)$a['match_score'])['key'];
            if (!isset($bands[$key])) {
                continue;
            }
            $bands[$key]['apps']++;
            if ((int)$a['reached'] > 0 || in_array($a['status'], ['interview', 'accepted'], true)) {
                $bands[$key]['interviews']++;
            }
            if ($a['status'] === 'accepted') {
                $bands[$key]['hired']++;
            }
        }
        foreach ($bands as &$b) {
            $b['interview_rate'] = $b['apps'] ? $b['interviews'] / $b['apps'] : 0.0;
            $b['hire_rate'] = $b['apps'] ? $b['hired'] / $b['apps'] : 0.0;
        }
        unset($b);
        return $bands;
    }

    /** Échantillon aléatoire de rattachements à contrôler (offres et compétences détectées). */
    public static function sample(int $n = 10): array
    {
        $items = [];
        $rand = DB::driver() === 'mysql' ? 'RAND()' : 'RANDOM()';
        foreach (DB::all("SELECT j.id, j.title, o.code, o.title AS otitle, j.occupation_confidence FROM jobs j JOIN occupations o ON o.id = j.occupation_id ORDER BY $rand LIMIT " . (int)$n) as $j) {
            $items[] = ['kind' => 'metier', 'raw' => $j['title'], 'code' => $j['code'], 'label' => $j['otitle'], 'confidence' => (int)$j['occupation_confidence']];
        }
        return $items;
    }
}
