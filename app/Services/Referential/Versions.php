<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;
use App\Services\MatchingEngine;
use App\Services\ProfileService;

/**
 * Versionnement des référentiels (§11) et jeu de référence (§9).
 * Chaque publication crée une version numérotée avec son journal ; elle n'est mise en production
 * qu'après passage du jeu de référence : l'écart moyen avec les notes des experts doit rester sous 10 points.
 */
final class Versions
{
    /**
     * Publie une nouvelle version à partir des tables de travail et des règles en cours d'édition.
     * @return array{ok:bool, message:string, number?:int, mae?:?float, pairs?:int}
     */
    public static function publish(?int $userId, string $label, bool $force = false, bool $initial = false): array
    {
        $number = (int)DB::value('SELECT COALESCE(MAX(number), 0) FROM ref_versions') + 1;
        $rules = Ref::draftRules();
        $snap = Ref::build($number, $rules);
        $g = self::evaluate($snap);
        $limits = $rules['golden'];
        $enough = $g['pairs'] >= (int)$limits['min_pairs'];
        if ($enough && $g['mae'] !== null && $g['mae'] >= (float)$limits['max_mae']) {
            return ['ok' => false, 'mae' => $g['mae'], 'pairs' => $g['pairs'],
                'message' => sprintf('Publication refusée : écart moyen de %s points avec les experts sur %d couples (maximum %s). Retravaille les fiches ou les poids avant de publier.', number_format($g['mae'], 1, ',', ' '), $g['pairs'], $limits['max_mae'])];
        }
        if (!$enough && !$force && !$initial) {
            return ['ok' => false, 'mae' => $g['mae'], 'pairs' => $g['pairs'],
                'message' => sprintf('Le jeu de référence ne compte que %d couple(s) noté(s) sur les %d minimum requis. Ajoute des couples notés par les experts, ou confirme la publication avec un jeu incomplet (elle sera signalée dans le journal).', $g['pairs'], $limits['min_pairs'])];
        }
        $changes = DB::all('SELECT * FROM ref_changes WHERE version_id IS NULL ORDER BY id');
        $log = array_map(fn($c) => '- ' . $c['summary'], $changes);
        if ($initial) {
            $log[] = '- Chargement initial : fiches métier (ROME 4.0, ESCO, ISCO-08), compétences (ESCO, DigComp, CECRL), diplômes N0-N6, règles du cahier des charges v1.1.';
        }
        if (!$enough) {
            $log[] = sprintf('- Jeu de référence incomplet : %d couple(s) noté(s) sur %d minimum.', $g['pairs'], $limits['min_pairs']);
        }
        $stats = [
            'occupations' => count($snap['occupations']),
            'validated' => count(array_filter($snap['occupations'], fn($o) => $o['status'] === 'valide')),
            'skills' => count($snap['skills']), 'degrees' => count($snap['degrees']),
        ];
        $dir = STORAGE_PATH . '/referentiels';
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        $file = 'v' . $number . '.json';
        $json = json_encode($snap, JSON_UNESCAPED_UNICODE);
        if (@file_put_contents($dir . '/' . $file, $json) === false) {
            return ['ok' => false, 'message' => 'Impossible d\'écrire la version dans storage/referentiels : vérifie les droits d\'écriture du dossier storage.'];
        }
        $vid = DB::insert('ref_versions', [
            'number' => $number, 'label' => mb_substr($label ?: 'Version ' . $number, 0, 190), 'changelog' => implode("\n", $log) ?: '- Aucune modification de fiche ; règles inchangées.',
            'file' => $file, 'checksum' => hash('sha256', (string)$json), 'golden_pairs' => $g['pairs'], 'golden_mae' => $g['mae'] === null ? null : (string)round($g['mae'], 2),
            'stats' => json_encode($stats), 'published_by' => $userId, 'published_at' => now(),
        ]);
        DB::run('UPDATE ref_changes SET version_id = :v WHERE version_id IS NULL', ['v' => $vid]);
        DB::insert('score_rules', ['version_id' => $vid, 'rules' => json_encode($rules, JSON_UNESCAPED_UNICODE), 'note' => 'Règles de la version ' . $number, 'created_by' => $userId, 'created_at' => now()]);
        Ref::reset();
        return ['ok' => true, 'number' => $number, 'mae' => $g['mae'], 'pairs' => $g['pairs'], 'message' => 'Version ' . $number . ' publiée : elle est désormais utilisée pour tous les scores.'];
    }

    /**
     * Rejoue le jeu de référence avec un instantané donné (par défaut la version en vigueur).
     * @return array{pairs:int, mae:?float, rows:array}
     */
    public static function evaluate(?array $snap = null): array
    {
        $rows = [];
        foreach (DB::all('SELECT * FROM golden_pairs ORDER BY id') as $g) {
            $p = json_decode((string)$g['profile_snapshot'], true);
            $job = json_decode((string)$g['job_snapshot'], true);
            if (!is_array($p) || !is_array($job)) {
                continue;
            }
            $score = $snap ? Ref::withSnapshot($snap, fn() => MatchingEngine::compute($p, $job, false)['score']) : MatchingEngine::compute($p, $job, false)['score'];
            $rows[] = ['id' => (int)$g['id'], 'label' => $g['label'], 'expert' => (int)$g['expert_score'], 'engine' => $score, 'diff' => $score - (int)$g['expert_score'], 'note' => $g['note']];
        }
        $mae = $rows ? array_sum(array_map(fn($r) => abs($r['diff']), $rows)) / count($rows) : null;
        return ['pairs' => count($rows), 'mae' => $mae, 'rows' => $rows];
    }

    /** Ajoute un couple profil-offre noté par un expert ; profil et offre sont figés à la date de notation. */
    public static function addPair(int $userId, int $jobId, int $expertScore, ?int $expertId, string $note = ''): ?int
    {
        $p = ProfileService::load($userId, true);
        $job = MatchingEngine::loadJob($jobId);
        if (!$p || !$job) {
            return null;
        }
        // Données personnelles minimales dans le jeu de référence
        foreach (['email', 'phone', 'birth_date', 'gender', 'linkedin', 'portfolio', 'cv_proof', 'cv_ai', 'cv_ai_data', 'cv_settings', 'riasec_scores', 'bio'] as $k) {
            unset($p[$k]);
        }
        return DB::insert('golden_pairs', [
            'user_id' => $userId, 'job_id' => $jobId, 'label' => mb_substr(trim(($p['first_name'] ?? '') . ' ' . mb_substr((string)($p['last_name'] ?? ''), 0, 1) . '. × ' . $job['title']), 0, 190),
            'profile_snapshot' => json_encode($p, JSON_UNESCAPED_UNICODE), 'job_snapshot' => json_encode($job, JSON_UNESCAPED_UNICODE),
            'expert_score' => max(0, min(100, $expertScore)), 'expert_id' => $expertId, 'note' => mb_substr($note, 0, 255), 'created_at' => now(),
        ]);
    }

    public static function current(): ?array
    {
        try {
            return DB::one('SELECT * FROM ref_versions ORDER BY number DESC LIMIT 1');
        } catch (\Throwable) {
            return null;
        }
    }
}
