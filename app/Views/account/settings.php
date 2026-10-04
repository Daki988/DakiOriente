<?php $u = user(); $newToken = App\Core\Session::pull('new_token'); ?>
<div class="page-head"><div><h1>Paramètres du compte</h1><p><?= e($u['email']) ?> · <?= e(role_label($u['role'])) ?> · membre depuis <?= e(date_fr($u['created_at'])) ?></p></div></div>
<div class="grid-2">
    <form method="post" action="<?= e(url('/compte/preferences')) ?>" class="card card-lg stack">
        <?= csrf_field() ?>
        <h2 style="font-size:1.15rem"><?= icon('bell') ?> Communications & consentements</h2>
        <label class="check"><input type="checkbox" name="notify_email" value="1" <?= $u['notify_email'] ? 'checked' : '' ?>> <span><b>E-mail</b> — candidatures, entretiens, alertes</span></label>
        <label class="check"><input type="checkbox" name="notify_sms" value="1" <?= $u['notify_sms'] ? 'checked' : '' ?>> <span><b>SMS</b> — alertes importantes uniquement</span></label>
        <label class="check"><input type="checkbox" name="notify_whatsapp" value="1" <?= $u['notify_whatsapp'] ? 'checked' : '' ?>> <span><b>WhatsApp</b> — alertes et rappels</span></label>
        <label class="check"><input type="checkbox" name="consent_marketing" value="1" <?= $u['consent_marketing'] ? 'checked' : '' ?>> <span>Conseils carrière et actualités Tremplin</span></label>
        <?php if ($u['role'] === 'candidate'): ?>
            <div class="field"><label for="alert_frequency">Alertes nouvelles offres</label>
                <select id="alert_frequency" name="alert_frequency"><?php foreach (['instant' => 'Dès publication', 'daily' => 'Résumé quotidien', 'weekly' => 'Résumé hebdomadaire', 'off' => 'Désactivées'] as $k => $l): ?><option value="<?= $k ?>" <?= $u['alert_frequency'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
        <?php endif; ?>
        <div><button class="btn btn-primary" type="submit">Enregistrer</button></div>
    </form>

    <form method="post" action="<?= e(url('/compte/mot-de-passe')) ?>" class="card card-lg stack">
        <?= csrf_field() ?>
        <h2 style="font-size:1.15rem"><?= icon('lock') ?> Mot de passe</h2>
        <div class="field"><label for="current_password">Mot de passe actuel</label><input id="current_password" name="current_password" type="password" required autocomplete="current-password"><?= error_for('current_password') ?></div>
        <div class="field"><label for="password">Nouveau mot de passe</label><input id="password" name="password" type="password" required minlength="8" autocomplete="new-password"><?= error_for('password') ?></div>
        <div class="field"><label for="password_confirmation">Confirmation</label><input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password"></div>
        <div><button class="btn btn-primary" type="submit">Modifier</button></div>
    </form>

    <section class="card card-lg" id="api">
        <h2 style="font-size:1.15rem"><?= icon('key-round') ?> Accès API</h2>
        <p class="small muted">Jetons personnels pour l'<a href="<?= e(url('/api')) ?>">API Tremplin v1</a> (applications mobiles, intégrations partenaires).</p>
        <?php if ($newToken): ?>
            <div class="alert alert-success"><?= icon('key-round') ?><div class="grow" style="min-width:0"><b>Ton nouveau jeton :</b><br><code id="tok" style="overflow-wrap:anywhere;font-size:.8rem"><?= e($newToken) ?></code><br><button class="btn btn-ghost btn-sm mt-1" type="button" data-copy="tok"><?= icon('copy') ?> Copier</button></div></div>
        <?php endif; ?>
        <form method="post" action="<?= e(url('/compte/api')) ?>" class="flex mt-1"><?= csrf_field() ?><label class="sr-only" for="tname">Nom</label><input id="tname" name="name" class="input" placeholder="Nom de l'application"><button class="btn btn-soft" type="submit">Créer</button></form>
        <?php if ($tokens): ?><ul class="list mt-1"><?php foreach ($tokens as $t): ?><li class="small"><?= icon('key-round') ?><span class="grow"><b><?= e($t['name']) ?></b><br><span class="muted">Expire le <?= e(date_fr($t['expires_at'])) ?> · <?= $t['last_used_at'] ? 'utilisé ' . e(time_ago($t['last_used_at'])) : 'jamais utilisé' ?></span></span></li><?php endforeach; ?></ul><?php endif; ?>
    </section>

    <section class="card card-lg">
        <h2 style="font-size:1.15rem"><?= icon('shield-check') ?> Mes données</h2>
        <p class="small muted">Conformément à la réglementation, tu peux exporter ou supprimer tes données à tout moment.</p>
        <a class="btn btn-ghost" href="<?= e(url('/compte/export')) ?>"><?= icon('download') ?> Exporter mes données (JSON)</a>
        <details class="faq mt-2" style="border-color:#f5c2c3">
            <summary style="color:var(--red)"><?= icon('trash-2') ?> Supprimer mon compte</summary>
            <p class="small">Cette action est <b>définitive</b> : profil, CV, candidatures et documents seront effacés.</p>
            <form method="post" action="<?= e(url('/compte/supprimer')) ?>" class="stack-sm" data-confirm="Supprimer définitivement ton compte et toutes tes données ?">
                <?= csrf_field() ?>
                <div class="field"><label for="del-pw">Confirme avec ton mot de passe</label><input id="del-pw" name="password" type="password" required autocomplete="current-password"></div>
                <button class="btn btn-danger" type="submit">Supprimer définitivement</button>
            </form>
        </details>
    </section>
</div>
