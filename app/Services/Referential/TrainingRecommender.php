<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;
use App\Services\Training\TrainingCatalog;

/**
 * Formations liées à un écart précis (référentiel Formations, §6).
 * - Une formation n'est proposée que si elle développe la compétence manquante.
 * - Au plus trois formations par écart, classées par pertinence (niveau atteint), coût puis durée.
 * - Une option gratuite est proposée chaque fois qu'elle existe.
 * - Une formation non vérifiée depuis 6 mois est masquée ; une formation partenaire est signalée,
 *   sans aucun avantage dans le classement.
 */
final class TrainingRecommender
{
    /** @return array<int, array> formations avec 'closes' (l'écart comblé), 'free', 'hours', 'partner' */
    public static function forGap(int $skillId, int $expected, int $have = 0, ?int $limit = null): array
    {
        $limit ??= (int)(Ref::rules()['trainings']['per_gap'] ?? 3);
        $rows = DB::all(str_replace('SELECT t.*', 'SELECT t.*, ts.level_reached', TrainingCatalog::BASE) . ' JOIN training_skills ts ON ts.training_id = t.id
            WHERE ts.skill_id = :s AND t.active = 1 AND t.platform_id IS NOT NULL AND t.verified_at >= :fresh',
            ['s' => $skillId, 'fresh' => TrainingCatalog::freshSince()]);
        $skill = (string)DB::value('SELECT name FROM skills WHERE id = :id', ['id' => $skillId]);
        foreach ($rows as &$t) {
            $reached = (int)$t['level_reached'];
            $t['relevance'] = $reached >= $expected ? 2 : ($reached > $have ? 1 : 0);
            $t['free'] = self::isFree($t);
            $t['hours'] = self::hours((string)$t['duration']);
            $t['partner'] = (int)($t['partner'] ?? 0) === 1;
            $t['closes'] = $skill . ' : niveau ' . $have . ' → ' . min($reached, 4) . ($reached >= $expected ? ' (niveau ' . $expected . ' attendu atteint)' : ' (niveau ' . $expected . ' attendu : à compléter par la pratique)');
        }
        unset($t);
        $rows = array_values(array_filter($rows, fn($t) => $t['relevance'] > 0));
        // Pertinence, puis coût (gratuit d'abord), puis durée ; le statut de partenaire n'entre pas dans le tri
        usort($rows, fn($a, $b) => [-$a['relevance'], $a['free'] ? 0 : 1, $a['hours'], $a['language'] === 'fr' ? 0 : 1, $a['id']]
            <=> [-$b['relevance'], $b['free'] ? 0 : 1, $b['hours'], $b['language'] === 'fr' ? 0 : 1, $b['id']]);
        $pick = array_slice($rows, 0, $limit);
        if ($pick && !array_filter($pick, fn($t) => $t['free'])) {
            foreach (array_slice($rows, $limit) as $t) {
                if ($t['free']) {
                    $pick[count($pick) - 1] = $t;
                    break;
                }
            }
        }
        return $pick;
    }

    public static function isFree(array $t): bool
    {
        return (int)($t['price'] ?? 0) === 0 && in_array($t['certificate'] ?? '', ['gratuit', 'badge', 'aucun'], true)
            || ($t['platform_slug'] ?? '') === 'freecodecamp';
    }

    /** Durée en heures (estimation pour le classement) ; inconnue = en fin de liste. */
    public static function hours(string $d): int
    {
        $d = normalize($d);
        if (preg_match('/(\d+)\s*(h|heure)/', $d, $m)) {
            return (int)$m[1];
        }
        if (preg_match('/(\d+)\s*(semaine|week)/', $d, $m)) {
            return (int)$m[1] * 5;
        }
        if (preg_match('/(\d+)\s*(mois|month)/', $d, $m)) {
            return (int)$m[1] * 20;
        }
        if (preg_match('/(\d+)\s*(jour|day)/', $d, $m)) {
            return (int)$m[1] * 4;
        }
        return 999;
    }
}
