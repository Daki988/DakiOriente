<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Auth;
use App\Core\DB;

/** Journal d'audit des actions sensibles (cahier des charges §10 et §17). */
final class AuditLogger
{
    public static function log(string $action, ?string $entity = null, ?int $entityId = null, array $meta = []): void
    {
        try {
            DB::insert('audit_logs', [
                'user_id'   => Auth::id(),
                'action'    => $action,
                'entity'    => $entity,
                'entity_id' => $entityId,
                'meta'      => $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
                'ip'        => client_ip(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            error_log('[audit] ' . $e->getMessage());
        }
    }
}
