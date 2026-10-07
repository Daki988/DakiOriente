<?php [$mLabel, $mColor] = $methods[$payment['method']] ?? [$payment['method'], '#0f172a']; ?>
<div style="max-width:560px;margin:0 auto" class="text-center">
    <?php if ($payment['status'] === 'pending'): ?>
        <h1 style="font-size:1.7rem">Confirme le paiement sur ton téléphone</h1>
        <p class="muted">Une demande de <b><?= e(money((int)$payment['amount'])) ?></b> a été envoyée<?= $payment['phone'] ? ' au <b>' . e($payment['phone']) . '</b>' : '' ?> via <b><?= e($mLabel) ?></b>.</p>
        <div class="ussd" <?= $sandbox ? "" : "data-poll-payment" ?>>
            <span class="badge" style="background:<?= e($mColor) ?>;color:#fff"><?= e($mLabel) ?></span>
            <div class="screen">
                Paiement marchand<br>TREMPLIN BY NEAM<br>Montant : <?= e(money((int)$payment['amount'])) ?><br>Réf : <?= e($payment['reference']) ?><br><br>Entrez votre code secret pour confirmer :<br>_ _ _ _
            </div>
            <div class="flex" style="justify-content:center"><span class="spinner"></span><small>En attente de confirmation…</small></div>
        </div>
        <?php if ($sandbox): ?>
            <div class="alert alert-warning mt-3 text-center" style="justify-content:center;text-align:left"><?= icon('info') ?><div class="small"><b>Mode démonstration</b> : aucun débit réel. Simule la réponse de l'opérateur :</div></div>
            <div class="flex mt-2" style="justify-content:center">
                <form method="post" action="<?= e(url('/abonnement/paiement/' . $payment['reference'] . '/confirmer')) ?>"><?= csrf_field() ?><input type="hidden" name="result" value="success"><button class="btn btn-success" type="submit"><?= icon('check') ?> Valider avec le code</button></form>
                <form method="post" action="<?= e(url('/abonnement/paiement/' . $payment['reference'] . '/confirmer')) ?>"><?= csrf_field() ?><input type="hidden" name="result" value="failed"><button class="btn btn-danger" type="submit"><?= icon('x') ?> Refuser</button></form>
            </div>
        <?php endif; ?>
    <?php elseif ($payment['status'] === 'success'): ?>
        <span class="empty" style="display:block;border-style:solid;border-color:#bfe9d0;background:var(--green-50)">
            <span class="ei" style="background:var(--green);color:#fff"><?= icon('circle-check-big') ?></span>
            <h1 style="font-size:1.7rem">Paiement réussi !</h1>
            <p>Ton offre <b><?= e($plan['name'] ?? $payment['plan_code']) ?></b> est active pour 30 jours. Merci de ta confiance.</p>
            <a class="btn btn-primary" href="<?= e(url(App\Core\Auth::homeUrl())) ?>">Profiter de mon offre <?= icon('arrow-right') ?></a>
        </span>
    <?php else: ?>
        <span class="empty" style="display:block">
            <span class="ei" style="background:var(--red-50);color:var(--red)"><?= icon('circle-x') ?></span>
            <h1 style="font-size:1.7rem">Paiement non abouti</h1>
            <p>Aucun montant n'a été débité. Vérifie ton solde ou réessaie avec un autre moyen de paiement.</p>
            <a class="btn btn-primary" href="<?= e(url('/abonnement?plan=' . $payment['plan_code'])) ?>">Réessayer</a>
        </span>
    <?php endif; ?>
    <p class="small muted mt-3">Référence <?= e($payment['reference']) ?> · <?= e(date_fr($payment['created_at'], true)) ?></p>
</div>
