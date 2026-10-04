<div class="no-print" style="padding:12px;text-align:center"><button class="btn btn-primary btn-sm" type="button" data-print><?= icon('printer') ?> Imprimer / PDF</button></div>
<div class="cv-sheet" style="padding:48px;max-width:760px;margin:12px auto">
    <div class="flex between" style="align-items:flex-start">
        <img src="<?= e(asset('img/logo.png')) ?>" alt="Tremplin by NEAM" style="height:70px;width:auto">
        <div style="text-align:right"><h1 style="font-size:1.6rem;margin:0">FACTURE</h1><b><?= e($inv['number']) ?></b><br><span class="muted"><?= e(date_fr($inv['paid_at'])) ?></span></div>
    </div>
    <div class="grid-2 mt-4">
        <div><h4>Émetteur</h4>NEAM Softwares Industry<br>Libreville, Gabon<br>contact@tremplin.ga</div>
        <div><h4>Client</h4><?= e($inv['first_name'] . ' ' . $inv['last_name']) ?><br><?= e($inv['email']) ?></div>
    </div>
    <table class="table mt-4" style="border:1px solid var(--line)">
        <thead><tr><th>Désignation</th><th style="text-align:right">Montant</th></tr></thead>
        <tbody>
            <tr><td>Abonnement <?= e($plan['name'] ?? $inv['plan_code']) ?> — 30 jours</td><td style="text-align:right" class="tabular"><?= e(money((int)$inv['amount'] + (int)$inv['discount'])) ?></td></tr>
            <?php if ($inv['discount']): ?><tr><td>Remise (<?= e($inv['coupon_code']) ?>)</td><td style="text-align:right" class="tabular">− <?= e(money((int)$inv['discount'])) ?></td></tr><?php endif; ?>
            <tr><td><b>Total payé</b></td><td style="text-align:right" class="tabular"><b><?= e(money((int)$inv['amount'])) ?></b></td></tr>
        </tbody>
    </table>
    <p class="small muted mt-3">Payé par <?= e($methods[$inv['method']][0] ?? $inv['method']) ?> · Référence de transaction <?= e($inv['reference']) ?></p>
</div>
