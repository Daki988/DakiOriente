<?php $selectedPlan = null; foreach ($plans as $p) { if ($p['code'] === $selected && $p['price'] > 0) { $selectedPlan = $p; } } ?>
<div class="page-head"><div><h1>Abonnement</h1><p>Offre actuelle : <b><?= e($current) ?></b><?= user()['plan_expires_at'] && $current !== 'FREE' ? ' · valable jusqu\'au ' . e(date_fr(user()['plan_expires_at'])) : '' ?></p></div></div>

<?php if ($selectedPlan): ?>
    <form method="post" action="<?= e(url('/abonnement/payer')) ?>" class="card card-lg mb-3" style="border-color:var(--blue);box-shadow:var(--shadow-lg)">
        <?= csrf_field() ?>
        <input type="hidden" name="plan" value="<?= e($selectedPlan['code']) ?>">
        <div class="flex between flex-wrap">
            <div><span class="eyebrow">Paiement sécurisé</span><h2 style="font-size:1.3rem;margin:0">Offre <?= e($selectedPlan['name']) ?> — <?= e(money((int)$selectedPlan['price'])) ?> / 30 jours</h2></div>
            <a class="btn btn-ghost btn-sm" href="<?= e(url('/abonnement')) ?>">Changer d'offre</a>
        </div>
        <fieldset class="mt-2"><legend class="label">Moyen de paiement</legend>
            <div class="choice-grid">
                <?php foreach ($methods as $k => [$label, $color]): ?>
                    <label class="choice"><input type="radio" name="method" value="<?= e($k) ?>" <?= $k === 'airtel_money' ? 'checked' : '' ?> required><span><i style="width:12px;height:12px;border-radius:50%;background:<?= e($color) ?>;display:inline-block"></i><?= e($label) ?></span></label>
                <?php endforeach; ?>
            </div>
        </fieldset>
        <div class="form-grid cols-2 mt-2">
            <div class="field"><label for="phone">Numéro Mobile Money</label><input id="phone" name="phone" type="tel" value="<?= e(user()['phone']) ?>" placeholder="+241 077 12 34 56" autocomplete="tel"><span class="hint">Non requis pour la carte bancaire.</span></div>
            <div class="field"><label for="coupon">Code promo</label><input id="coupon" name="coupon" placeholder="Ex. BIENVENUE25" style="text-transform:uppercase"></div>
        </div>
        <div class="flex between flex-wrap mt-2">
            <small class="muted"><?= icon('shield-check') ?> Aucun prélèvement automatique. Tu confirmes sur ton téléphone avec ton code secret.</small>
            <button class="btn btn-cta btn-lg" type="submit"><?= icon('wallet') ?> Payer <?= e(money((int)$selectedPlan['price'])) ?></button>
        </div>
    </form>
<?php endif; ?>

<div class="plans" style="<?= count($plans) < 5 ? 'grid-template-columns:repeat(auto-fit,minmax(240px,1fr))' : '' ?>">
    <?php foreach ($plans as $p): ?>
        <div class="plan <?= $p['highlight'] ? 'highlight' : '' ?> <?= $current === $p['code'] ? 'current' : '' ?>">
            <h3><?= e($p['name']) ?> <?php if ($current === $p['code']): ?><span class="badge badge-green">Actuelle</span><?php endif; ?></h3>
            <small class="muted"><?= e($p['tagline']) ?></small>
            <div class="price tabular"><?= $p['price'] ? nf($p['price']) : '0' ?> <small>FCFA / mois</small></div>
            <ul><?php foreach ($p['features_list'] as $f): ?><li><?= icon('check') ?><span><?= e($f) ?></span></li><?php endforeach; ?></ul>
            <?php if ($p['price'] > 0): ?>
                <a class="btn <?= $p['highlight'] ? 'btn-cta' : 'btn-primary' ?> btn-block" href="<?= e(url('/abonnement?plan=' . $p['code'])) ?>"><?= $current === $p['code'] ? 'Prolonger' : 'Choisir' ?></a>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
</div>

<h2 class="mt-4" style="font-size:1.2rem">Historique des paiements</h2>
<?php if (!$payments): ?>
    <p class="muted">Aucun paiement pour le moment.</p>
<?php else: ?>
    <div class="table-wrap"><table class="table">
        <thead><tr><th>Date</th><th>Offre</th><th>Montant</th><th>Moyen</th><th>Statut</th><th>Facture</th></tr></thead>
        <tbody><?php foreach ($payments as $p): ?>
            <tr><td><?= e(date_fr($p['created_at'])) ?></td><td><?= e($p['plan_code']) ?></td><td class="tabular"><?= e(money((int)$p['amount'])) ?></td><td><?= e($methods[$p['method']][0] ?? $p['method']) ?></td>
                <td><span class="badge badge-<?= ['success' => 'green', 'pending' => 'amber', 'failed' => 'red'][$p['status']] ?? 'gray' ?>"><?= e(['success' => 'Payé', 'pending' => 'En attente', 'failed' => 'Échoué'][$p['status']] ?? $p['status']) ?></span></td>
                <td><?php if ($p['invoice_id'] && $p['status'] === 'success'): ?><a href="<?= e(url('/abonnement/facture/' . $p['invoice_id'])) ?>" target="_blank"><?= e($p['number']) ?></a><?php elseif ($p['status'] === 'pending'): ?><a href="<?= e(url('/abonnement/paiement/' . $p['reference'])) ?>">Finaliser</a><?php else: ?>—<?php endif; ?></td></tr>
        <?php endforeach; ?></tbody>
    </table></div>
<?php endif; ?>
