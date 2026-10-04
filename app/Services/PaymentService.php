<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/**
 * Paiements Mobile Money (Airtel Money, Moov Money) et carte.
 * Le pilote « sandbox » simule la demande de confirmation USSD : en production, brancher ici
 * l'agrégateur retenu (CinetPay, Ebilling, PVit…) sans modifier le reste du produit.
 * Toute activation d'abonnement se fait dans une transaction : état toujours cohérent.
 */
final class PaymentService
{
    public const METHODS = [
        'airtel_money' => ['Airtel Money', '#e4002b'],
        'moov_money'   => ['Moov Money', '#0066b3'],
        'card'         => ['Carte bancaire', '#0f172a'],
    ];

    public static function initiate(int $userId, string $planCode, string $method, ?string $phone, ?string $coupon): array
    {
        $plan = PlanService::plan($planCode);
        if (!$plan || (int)$plan['price'] <= 0) {
            throw new \InvalidArgumentException('Offre invalide.');
        }
        $discount = 0;
        $couponCode = null;
        if ($coupon) {
            $c = DB::one('SELECT * FROM coupons WHERE code = :c AND active = 1', ['c' => mb_strtoupper(trim($coupon))]);
            if (!$c || (int)$c['uses'] >= (int)$c['max_uses'] || ($c['expires_at'] && $c['expires_at'] < date('Y-m-d'))) {
                throw new \InvalidArgumentException('Code promo invalide ou expiré.');
            }
            $discount = (int)round((int)$plan['price'] * (int)$c['percent'] / 100);
            $couponCode = $c['code'];
        }
        $reference = 'TRP-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $id = DB::insert('payments', [
            'user_id' => $userId, 'plan_code' => $planCode, 'amount' => (int)$plan['price'] - $discount, 'discount' => $discount,
            'currency' => 'XAF', 'method' => $method, 'phone' => $phone, 'reference' => $reference, 'coupon_code' => $couponCode,
            'status' => 'pending', 'created_at' => now(), 'updated_at' => now(),
        ]);
        audit('payment.initiated', 'payment', $id, ['plan' => $planCode, 'method' => $method]);
        return DB::one('SELECT * FROM payments WHERE id = :id', ['id' => $id]);
    }

    /** Confirmation (callback opérateur en production ; validation manuelle en sandbox). */
    public static function confirm(int $paymentId, bool $success, ?string $providerRef = null): array
    {
        return DB::transaction(function () use ($paymentId, $success, $providerRef) {
            $p = DB::one('SELECT * FROM payments WHERE id = :id', ['id' => $paymentId]);
            if (!$p || $p['status'] !== 'pending') {
                return $p ?? [];
            }
            DB::update('payments', [
                'status' => $success ? 'success' : 'failed',
                'provider_ref' => $providerRef ?? 'SBX-' . strtoupper(bin2hex(random_bytes(4))),
                'updated_at' => now(),
            ], 'id = :id', ['id' => $paymentId]);
            if ($success) {
                PlanService::activate((int)$p['user_id'], $p['plan_code'], $paymentId);
                if ($p['coupon_code']) {
                    DB::run('UPDATE coupons SET uses = uses + 1 WHERE code = :c', ['c' => $p['coupon_code']]);
                }
                $number = 'FAC-' . date('Y') . '-' . str_pad((string)$paymentId, 5, '0', STR_PAD_LEFT);
                DB::insert('invoices', ['payment_id' => $paymentId, 'number' => $number, 'amount' => $p['amount'], 'created_at' => now()]);
                NotificationService::notify((int)$p['user_id'], 'payment', 'Paiement confirmé — abonnement ' . $p['plan_code'] . ' activé',
                    'Montant : ' . money((int)$p['amount']) . ' · Référence ' . $p['reference'], '/abonnement');
            }
            audit($success ? 'payment.success' : 'payment.failed', 'payment', $paymentId);
            return DB::one('SELECT * FROM payments WHERE id = :id', ['id' => $paymentId]);
        });
    }
}
