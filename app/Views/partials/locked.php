<?php $plan = App\Services\PlanService::plan($required); ?>
<div class="lock-panel">
    <span class="li"><?= icon('lock') ?></span>
    <h3><?= e($heading ?? 'Fonctionnalité réservée') ?></h3>
    <p class="muted" style="max-width:460px;margin:0 auto 16px"><?= e($text ?? '') ?> Disponible à partir de l'offre <b><?= e($plan['name'] ?? $required) ?></b> (<?= e(money((int)($plan['price'] ?? 0))) ?>/mois).</p>
    <a class="btn btn-cta" href="<?= e(url('/abonnement')) ?>"><?= icon('sparkles') ?> Débloquer avec <?= e($plan['name'] ?? $required) ?></a>
</div>
