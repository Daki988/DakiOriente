<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;

/**
 * File de curation (§11) : appellations inconnues, compétences non reconnues, diplômes à vérifier,
 * explications signalées par les candidats, liens de formation morts. Rien n'est ignoré en silence.
 */
final class Curation
{
    public const KINDS = [
        'appellation' => ['Appellation inconnue', 'briefcase-business'],
        'competence'  => ['Compétence non reconnue', 'zap'],
        'diplome'     => ['Diplôme à vérifier', 'graduation-cap'],
        'explication' => ['Explication signalée', 'circle-help'],
        'lien'        => ['Lien de formation à revérifier', 'link'],
        'suggestion'  => ['Suggestion d\'une entreprise', 'lightbulb'],
        'offre_stage' => ['Offre externe signalée', 'flag'],
    ];

    /** Ajoute (ou incrémente) un élément ; les doublons ouverts sont regroupés. */
    public static function add(string $kind, string $label, string $source, ?int $refId = null, ?array $suggestion = null, array $context = [], ?int $userId = null): int
    {
        $label = trim(mb_substr($label, 0, 255));
        if ($label === '') {
            return 0;
        }
        $norm = mb_substr(normalize($label), 0, 190);
        $grouped = in_array($kind, ['appellation', 'competence', 'diplome'], true);
        if ($grouped && ($id = DB::value("SELECT id FROM curation_queue WHERE kind = :k AND norm = :n AND status = 'ouvert'", ['k' => $kind, 'n' => $norm]))) {
            DB::run('UPDATE curation_queue SET hits = hits + 1, updated_at = :d WHERE id = :id', ['d' => now(), 'id' => $id]);
            return (int)$id;
        }
        return DB::insert('curation_queue', [
            'kind' => $kind, 'label' => $label, 'norm' => $norm, 'source' => $source, 'ref_id' => $refId,
            'context' => $context ? json_encode($context, JSON_UNESCAPED_UNICODE) : null,
            'suggestion' => $suggestion ? json_encode($suggestion, JSON_UNESCAPED_UNICODE) : null,
            'hits' => 1, 'status' => 'ouvert', 'user_id' => $userId, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public static function close(int $id, string $status, string $resolution, ?int $by): void
    {
        DB::update('curation_queue', ['status' => $status, 'resolution' => mb_substr($resolution, 0, 255), 'handled_by' => $by, 'handled_at' => now(), 'updated_at' => now()], 'id = :id', ['id' => $id]);
    }

    public static function openCount(): int
    {
        try {
            return (int)DB::value("SELECT COUNT(*) FROM curation_queue WHERE status = 'ouvert'");
        } catch (\Throwable) {
            return 0;
        }
    }

    /** Journal des modifications en attente de publication (alimente le journal de la prochaine version). */
    public static function log(string $entity, ?int $entityId, string $action, string $summary, ?int $userId): void
    {
        DB::insert('ref_changes', ['entity' => $entity, 'entity_id' => $entityId, 'action' => $action, 'summary' => mb_substr($summary, 0, 255), 'user_id' => $userId, 'version_id' => null, 'created_at' => now()]);
    }
}
