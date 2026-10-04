<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/** Abonnements et droits associés (cahier des charges §12). */
final class PlanService
{
    private const ORDER = ['FREE' => 0, 'STARTER' => 1, 'PRO' => 2, 'PREMIUM' => 3, 'CAREER' => 4];

    /** Fonctionnalité → plan minimum requis. */
    public const FEATURES = [
        'ai_letter'      => 'STARTER',
        'cv_templates'   => 'STARTER',
        'action_plan'    => 'PRO',
        'advanced_recos' => 'PRO',
        'interview_sim'  => 'PREMIUM',
        'featured'       => 'PREMIUM',
        'coaching'       => 'CAREER',
    ];

    public static function plan(?string $code): ?array
    {
        $p = DB::one('SELECT * FROM plans WHERE code = :c', ['c' => $code ?? 'FREE']);
        if ($p) {
            $p['features_list'] = json_decode((string)$p['features'], true) ?: [];
            $p['limits_list'] = json_decode((string)$p['limits'], true) ?: [];
        }
        return $p;
    }

    public static function effectiveCode(array $user): string
    {
        $code = $user['plan_code'] ?? 'FREE';
        if ($code !== 'FREE' && $user['plan_expires_at'] && strtotime($user['plan_expires_at']) < time()) {
            DB::update('users', ['plan_code' => 'FREE'], 'id = :id', ['id' => $user['id']]);
            DB::run("UPDATE subscriptions SET status = 'expired' WHERE user_id = :u AND status = 'active'", ['u' => $user['id']]);
            return 'FREE';
        }
        return $code;
    }

    public static function allows(array $user, string $feature): bool
    {
        if ($user['role'] !== 'candidate') {
            return true;
        }
        $need = self::FEATURES[$feature] ?? 'FREE';
        return (self::ORDER[self::effectiveCode($user)] ?? 0) >= (self::ORDER[$need] ?? 0);
    }

    public static function requiredPlan(string $feature): string
    {
        return self::FEATURES[$feature] ?? 'FREE';
    }

    /** Nombre de candidatures autorisées ce mois-ci (null = illimité). */
    public static function applicationQuota(array $user): array
    {
        $plan = self::plan(self::effectiveCode($user));
        $limit = $plan['limits_list']['applications'] ?? 5;
        $used = (int)DB::value('SELECT COUNT(*) FROM applications WHERE user_id = :u AND created_at >= :d', ['u' => $user['id'], 'd' => date('Y-m-01 00:00:00')]);
        return ['limit' => $limit, 'used' => $used, 'remaining' => $limit === null ? null : max(0, $limit - $used)];
    }

    public static function activate(int $userId, string $planCode, ?int $paymentId = null, int $days = 30): void
    {
        $user = DB::one('SELECT plan_code, plan_expires_at FROM users WHERE id = :id', ['id' => $userId]);
        $base = ($user && $user['plan_code'] === $planCode && $user['plan_expires_at'] && strtotime($user['plan_expires_at']) > time())
            ? strtotime($user['plan_expires_at']) : time();
        $expires = date('Y-m-d H:i:s', $base + $days * 86400);
        DB::run("UPDATE subscriptions SET status = 'replaced' WHERE user_id = :u AND status = 'active'", ['u' => $userId]);
        DB::insert('subscriptions', [
            'user_id' => $userId, 'plan_code' => $planCode, 'status' => 'active',
            'started_at' => now(), 'expires_at' => $expires, 'payment_id' => $paymentId,
        ]);
        DB::update('users', ['plan_code' => $planCode, 'plan_expires_at' => $expires, 'updated_at' => now()], 'id = :id', ['id' => $userId]);
        // Offre entreprise : appliquée à l'entreprise du recruteur (crédits de publication inclus)
        if (str_starts_with($planCode, 'BIZ_')) {
            $limits = self::plan($planCode)['limits_list'] ?? [];
            DB::run('UPDATE companies SET plan_code = :p, job_credits = :c WHERE id IN (SELECT company_id FROM company_users WHERE user_id = :u)',
                ['p' => $planCode, 'c' => $limits['jobs'] ?? 999, 'u' => $userId]);
        }
    }
}
