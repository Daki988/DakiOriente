<?php /** @var ?array $t formation liée (facultatif)  @var array $platforms */ $t ??= null; $uid = uniqid('cf'); ?>
<form method="post" action="<?= e(url('/espace/certificats')) ?>" enctype="multipart/form-data" class="stack-sm">
    <?= csrf_field() ?>
    <?php if ($t): ?><input type="hidden" name="training_id" value="<?= (int)$t['id'] ?>"><?php endif; ?>
    <div class="field"><label for="<?= $uid ?>-t">Intitulé du certificat</label><input id="<?= $uid ?>-t" name="title" required maxlength="190" value="<?= e($t['title'] ?? '') ?>"></div>
    <div class="field"><label for="<?= $uid ?>-i">Délivré par</label><input id="<?= $uid ?>-i" name="issuer" maxlength="160" value="<?= e($t ? trim($t['platform_name'] . ($t['provider'] && $t['provider'] !== $t['platform_name'] ? ' · ' . $t['provider'] : '')) : '') ?>" placeholder="Coursera · Google, OpenClassrooms…"></div>
    <div class="field"><label for="<?= $uid ?>-u">Lien de vérification</label><input id="<?= $uid ?>-u" name="credential_url" type="url" inputmode="url" placeholder="https://…" maxlength="255"><span class="hint">Le lien public de ton certificat sur la plateforme : c'est la preuve que regardent les recruteurs.</span></div>
    <div class="form-grid cols-2">
        <div class="field"><label for="<?= $uid ?>-d">Obtenu le</label><input id="<?= $uid ?>-d" name="issued_at" type="date" max="<?= date('Y-m-d') ?>"></div>
        <div class="field"><label for="<?= $uid ?>-c">N° de certificat <span class="muted">(facultatif)</span></label><input id="<?= $uid ?>-c" name="credential_id" maxlength="120"></div>
    </div>
    <div class="field"><label for="<?= $uid ?>-f">Ou le fichier <span class="muted">(PDF, JPG ou PNG, 5 Mo max.)</span></label><input id="<?= $uid ?>-f" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"></div>
    <button class="btn btn-cta btn-block" type="submit"><?= icon('award') ?> Relier à mon profil</button>
</form>
