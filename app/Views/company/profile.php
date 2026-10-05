<?php $c ??= []; ?>
<div class="page-head"><div><h1>Profil entreprise</h1><p>Ces informations apparaissent sur vos offres et votre page publique.</p></div>
<?php if (!empty($c['slug']) && $c['status'] === 'verified'): ?><a class="btn btn-ghost" href="<?= e(url('/entreprises/' . $c['slug'])) ?>" target="_blank"><?= icon('eye') ?> Page publique</a><?php endif; ?></div>
<?php if (!empty($c)): ?>
    <div class="alert alert-<?= $c['status'] === 'verified' ? 'success' : ($c['status'] === 'rejected' ? 'error' : 'warning') ?> mb-3"><?= icon('shield-check') ?><div>Statut de vérification : <b><?= e(['verified' => 'Entreprise vérifiée', 'pending' => 'En cours de vérification', 'rejected' => 'Vérification refusée — contactez contact@neamindustry.com'][$c['status']] ?? $c['status']) ?></b></div></div>
<?php endif; ?>
<div class="layout-aside">
    <form method="post" action="<?= e(url('/entreprise/profil')) ?>" class="card card-lg">
        <?= csrf_field() ?>
        <div class="form-grid cols-2">
            <div class="field span-2"><label for="name">Raison sociale *</label><input id="name" name="name" required value="<?= e(old('name', $c['name'] ?? '')) ?>"><?= error_for('name') ?></div>
            <div class="field"><label for="sector_id">Secteur *</label><select id="sector_id" name="sector_id"><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)($c['sector_id'] ?? 0) === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="city_id">Ville *</label><select id="city_id" name="city_id"><?php foreach ($cities as $ci): ?><option value="<?= (int)$ci['id'] ?>" <?= (int)($c['city_id'] ?? 0) === (int)$ci['id'] ? 'selected' : '' ?>><?= e($ci['name'] . ' — ' . $ci['country']) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="size">Effectif</label><select id="size" name="size"><?php foreach (['1-10', '11-50', '51-250', '250+'] as $s): ?><option <?= ($c['size'] ?? '') === $s ? 'selected' : '' ?>><?= $s ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="rccm">RCCM</label><input id="rccm" name="rccm" value="<?= e($c['rccm'] ?? '') ?>"></div>
            <div class="field"><label for="website">Site web</label><input id="website" name="website" type="url" value="<?= e($c['website'] ?? '') ?>"><?= error_for('website') ?></div>
            <div class="field"><label for="email">E-mail de contact</label><input id="email" name="email" type="email" value="<?= e($c['email'] ?? '') ?>"></div>
            <div class="field"><label for="phone">Téléphone</label><input id="phone" name="phone" type="tel" value="<?= e($c['phone'] ?? '') ?>"><?= error_for('phone') ?></div>
            <div class="field"><label for="color">Couleur de marque</label><input id="color" name="color" type="color" value="<?= e($c['color'] ?? '#0057ff') ?>" style="padding:4px;height:48px"></div>
            <div class="field span-2"><label for="description">Présentation</label><textarea id="description" name="description" style="min-height:160px"><?= e($c['description'] ?? '') ?></textarea></div>
        </div>
        <button class="btn btn-primary mt-2" type="submit"><?= icon('check') ?> Enregistrer</button>
    </form>
    <aside class="card">
        <h3><?= icon('users') ?> Équipe de recrutement</h3>
        <ul class="list"><?php foreach ($team as $t): ?><li><span class="avatar avatar-sm" style="background:<?= e(avatar_color($t['email'])) ?>"><?= e(initials($t['first_name'], $t['last_name'])) ?></span><span class="grow small"><b><?= e($t['first_name'] . ' ' . $t['last_name']) ?></b><br><span class="muted"><?= e($t['email']) ?></span></span><span class="badge badge-gray"><?= e($t['role']) ?></span></li><?php endforeach; ?></ul>
        <p class="small muted mt-1">Multi-recruteurs, notes partagées et collaboration inclus dans l'offre Entreprise Pro.</p>
    </aside>
</div>
