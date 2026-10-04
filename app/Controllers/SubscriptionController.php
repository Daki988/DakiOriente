<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\DB;
use App\Services\PaymentService;
use App\Services\PlanService;

final class SubscriptionController extends Controller
{
    private function audience(): string
    {
        return match ($this->user()['role']) {
            'company' => 'company',
            'school'  => 'school',
            default   => 'candidate',
        };
    }

    public function index(): string
    {
        $plans = DB::all('SELECT * FROM plans WHERE audience = :a ORDER BY sort', ['a' => $this->audience()]);
        foreach ($plans as &$p) {
            $p['features_list'] = json_decode((string)$p['features'], true) ?: [];
        }
        unset($p);
        $u = $this->user();
        $current = $u['role'] === 'company' ? (current_company()['plan_code'] ?? 'BIZ_FREE') : PlanService::effectiveCode($u);
        $payments = DB::all('SELECT p.*, i.id AS invoice_id, i.number FROM payments p LEFT JOIN invoices i ON i.payment_id = p.id WHERE p.user_id = :u ORDER BY p.created_at DESC LIMIT 20', ['u' => $u['id']]);
        $selected = (string)input('plan', '');
        return $this->app('account/subscription', compact('plans', 'current', 'payments', 'selected') + ['title' => 'Abonnement', 'methods' => PaymentService::METHODS]);
    }

    public function pay(): void
    {
        $plan = PlanService::plan((string)input('plan'));
        if (!$plan || $plan['audience'] !== $this->audience() || (int)$plan['price'] <= 0) {
            flash('error', 'Offre invalide.');
            redirect('/abonnement');
        }
        $method = (string)input('method');
        if (!isset(PaymentService::METHODS[$method])) {
            flash('error', 'Choisis un moyen de paiement.');
            redirect('/abonnement?plan=' . $plan['code']);
        }
        $phone = trim((string)input('phone', ''));
        if ($method !== 'card' && !preg_match('/^\+?[0-9 ]{8,16}$/', $phone)) {
            flash('error', 'Numéro Mobile Money invalide (ex. +241 077 12 34 56).');
            redirect('/abonnement?plan=' . $plan['code']);
        }
        try {
            $payment = PaymentService::initiate($this->uid(), $plan['code'], $method, $phone ?: null, trim((string)input('coupon', '')) ?: null);
        } catch (\InvalidArgumentException $e) {
            flash('error', $e->getMessage());
            redirect('/abonnement?plan=' . $plan['code']);
        }
        redirect('/abonnement/paiement/' . $payment['reference']);
    }

    private function payment(string $ref): array
    {
        $p = DB::one('SELECT * FROM payments WHERE reference = :r AND user_id = :u', ['r' => $ref, 'u' => $this->uid()]);
        if (!$p) {
            abort(404);
        }
        return $p;
    }

    public function status(string $ref): string
    {
        $payment = $this->payment($ref);
        $plan = PlanService::plan($payment['plan_code']);
        return $this->app('account/payment', compact('payment', 'plan') + ['methods' => PaymentService::METHODS, 'sandbox' => config('payment.driver') === 'sandbox', 'title' => 'Paiement']);
    }

    /** Sandbox : simule la validation (ou le refus) côté opérateur. En production : webhook signé de l'agrégateur. */
    public function confirm(string $ref): void
    {
        if (config('payment.driver') !== 'sandbox') {
            abort(403);
        }
        $payment = $this->payment($ref);
        $ok = input('result') === 'success';
        PaymentService::confirm((int)$payment['id'], $ok);
        flash($ok ? 'success' : 'error', $ok ? 'Paiement confirmé ! Ton offre ' . $payment['plan_code'] . ' est active.' : 'Paiement refusé ou annulé. Aucun montant n\'a été débité.');
        redirect('/abonnement/paiement/' . $ref);
    }

    public function invoice(string $id): string
    {
        $inv = DB::one('SELECT i.*, p.plan_code, p.method, p.reference, p.discount, p.coupon_code, p.created_at AS paid_at, u.first_name, u.last_name, u.email, u.id AS uid
            FROM invoices i JOIN payments p ON p.id = i.payment_id JOIN users u ON u.id = p.user_id WHERE i.id = :id', ['id' => (int)$id]);
        if (!$inv || ((int)$inv['uid'] !== $this->uid() && !\App\Core\Auth::is('admin'))) {
            abort(404);
        }
        $plan = PlanService::plan($inv['plan_code']);
        return \App\Core\View::render('account/invoice', compact('inv', 'plan') + ['methods' => PaymentService::METHODS, 'title' => 'Facture ' . $inv['number']], 'bare');
    }
}
