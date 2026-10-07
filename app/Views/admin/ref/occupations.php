<?php $R = App\Services\Referential\Ref::class; ?>
<div class="page-head"><div><h1>Référentiel Métiers & Emplois</h1><p><?= count($rows) ?> fiche(s). Chaque fiche porte un code Tremplin stable, ses correspondances ROME 4.0, ESCO et ISCO-08, ses appellations locales et les compétences requises.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'metiers']) ?>
<form class="card flex flex-wrap mb-3" style="gap:10px;align-items:end" method="get">
    <div class="field grow"><label for="q">Recherche</label><input id="q" name="q" value="<?= e($q) ?>" placeholder="Intitulé, appellation, code TRM ou ROME"></div>
    <div class="field"><label for="st">Statut</label><select id="st" name="statut"><option value="">Tous</option><?php foreach ($R::STATUSES as $k => [$l]): ?><option value="<?= $k ?>" <?= $status === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
    <div class="field"><label for="sec">Secteur</label><select id="sec" name="secteur"><option value="">Tous</option><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= $sector === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
    <button class="btn btn-soft" type="submit"><?= icon('search') ?> Filtrer</button>
</form>
<details class="card mb-3"><summary><b><?= icon('plus') ?> Nouvelle fiche depuis une fiche ROME 4.0</b></summary>
    <form method="post" action="<?= e(url('/admin/referentiels/metiers')) ?>" class="form-grid cols-3 mt-2" style="align-items:end">
        <?= csrf_field() ?>
        <div class="field"><label for="rome">Code ROME</label><input id="rome" name="rome" required pattern="[A-Na-n][0-9]{4}" placeholder="Ex. N1103"><span class="hint">L'intitulé et toutes les appellations ROME sont repris.</span></div>
        <div class="field"><label for="prefix">Famille Tremplin</label><select id="prefix" name="prefix"><?php foreach ($prefixes as $p): ?><option><?= e($p) ?></option><?php endforeach; ?></select></div>
        <div class="field"><label for="sector_id">Secteur</label><select id="sector_id" name="sector_id"><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>"><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
        <div><button class="btn btn-primary" type="submit">Créer en brouillon</button></div>
    </form>
</details>
<div class="card"><div class="table-wrap"><table class="table">
    <thead><tr><th>Code</th><th>Fiche</th><th>ROME / ISCO</th><th>Niveau</th><th>Compétences</th><th>Offres</th><th>Statut</th></tr></thead>
    <tbody><?php foreach ($rows as $o): [$sl, $sc] = $R::STATUSES[$o['status']]; ?>
        <tr>
            <td><a href="<?= e(url('/admin/referentiels/metiers/' . $o['id'])) ?>"><b><?= e($o['code']) ?></b></a></td>
            <td><a href="<?= e(url('/admin/referentiels/metiers/' . $o['id'])) ?>"><?= e($o['title']) ?></a><br><small class="muted"><?= e($o['sector']) ?> · <?= (int)$o['nlabels'] ?> appellations</small></td>
            <td class="small"><?= e($o['rome_code']) ?><br><?= e($o['isco_code']) ?><?= $o['esco_uri'] ? ' · ESCO' : '' ?></td>
            <td class="small"><?= e($R::degreeLabel((int)$o['education_min'], true)) ?></td>
            <td><?= (int)$o['nskills'] ?></td>
            <td><?= (int)$o['njobs'] ?></td>
            <td><span class="badge badge-<?= $sc ?>"><?= e($sl) ?></span><br><small class="muted">rév. <?= (int)$o['revision'] ?></small></td>
        </tr>
    <?php endforeach; ?></tbody>
</table></div></div>
