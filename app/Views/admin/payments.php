<div class="page-head"><div><h1>Paiements & abonnements</h1><p>Transactions Mobile Money et carte, codes promo.</p></div><a class="btn btn-ghost" href="<?= e(url('/admin/export/paiements')) ?>"><?= icon('file-down') ?> Export CSV</a></div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki green"><?= icon('wallet') ?></span><div><b><?= e(money($totals['success'], false)) ?></b><span>Encaissé (FCFA)</span></div></div>
    <div class="kpi"><span class="ki"><?= icon('check') ?></span><div><b><?= $totals['count'] ?></b><span>Paiements réussis</span></div></div>
    <div class="kpi"><span class="ki pink"><?= icon('circle-x') ?></span><div><b><?= $totals['failed'] ?></b><span>Échecs</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('users') ?></span><div><b><?= $totals['active_subs'] ?></b><span>Abonnements actifs</span></div></div>
</div>
<div class="layout-aside">
    <div class="table-wrap"><table class="table">
        <thead><tr><th>Référence</th><th>Client</th><th>Offre</th><th>Montant</th><th>Moyen</th><th>Statut</th><th>Date</th></tr></thead>
        <tbody><?php foreach ($payments as $p): ?>
            <tr><td class="small"><code><?= e($p['reference']) ?></code></td><td class="small"><?= e($p['first_name'] . ' ' . $p['last_name']) ?></td><td><?= e($p['plan_code']) ?></td><td class="tabular"><?= e(money((int)$p['amount'])) ?><?= $p['coupon_code'] ? '<br><small class="muted">' . e($p['coupon_code']) . '</small>' : '' ?></td>
                <td class="small"><?= e($methods[$p['method']][0] ?? $p['method']) ?></td>
                <td><span class="badge badge-<?= ['success' => 'green', 'pending' => 'amber', 'failed' => 'red'][$p['status']] ?? 'gray' ?>"><?= e($p['status']) ?></span></td><td class="small nowrap"><?= e(date_fr($p['created_at'])) ?></td></tr>
        <?php endforeach; ?></tbody>
    </table></div>
    <aside class="stack">
        <section class="card"><h3>Par moyen de paiement</h3><ul class="list small"><?php foreach ($byMethod as $m): ?><li><span class="grow"><?= e($methods[$m['method']][0] ?? $m['method']) ?></span><b><?= e(money((int)$m['total'])) ?></b> <span class="muted">(<?= (int)$m['n'] ?>)</span></li><?php endforeach; ?></ul></section>
        <section class="card">
            <h3>Codes promo</h3>
            <ul class="list small"><?php foreach ($coupons as $c): ?><li><span class="grow"><b><?= e($c['code']) ?></b> −<?= (int)$c['percent'] ?> %</span><span class="muted"><?= (int)$c['uses'] ?>/<?= (int)$c['max_uses'] ?></span></li><?php endforeach; ?></ul>
            <form method="post" action="<?= e(url('/admin/coupons')) ?>" class="stack-sm mt-2">
                <?= csrf_field() ?>
                <div class="flex"><input class="input" name="code" placeholder="CODE" required aria-label="Code"><input class="input" name="percent" type="number" min="1" max="100" placeholder="%" required style="width:90px" aria-label="Pourcentage"></div>
                <div class="flex"><input class="input" name="max_uses" type="number" min="1" value="100" aria-label="Utilisations max"><input class="input" name="expires_at" type="date" aria-label="Expiration"></div>
                <button class="btn btn-soft btn-sm" type="submit"><?= icon('plus') ?> Créer</button>
            </form>
        </section>
    </aside>
</div>
