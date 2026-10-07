<?php $R = App\Services\Referential\Ref::class; ?>
<div class="page-head"><div><h1>Référentiel Compétences</h1><p><?= count($rows) ?> compétence(s). Taxonomie ESCO, DigComp 2.2 pour le numérique, CECRL pour les langues. Chaque compétence est définie une seule fois, avec ses synonymes et quatre niveaux observables.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'competences']) ?>
<form class="card flex flex-wrap mb-3" style="gap:10px;align-items:end" method="get">
    <div class="field grow"><label for="q">Recherche</label><input id="q" name="q" value="<?= e($q) ?>" placeholder="Nom, synonyme ou code"></div>
    <div class="field"><label for="cat">Catégorie</label><select id="cat" name="categorie"><option value="">Toutes</option><?php foreach ($R::CATEGORIES as $k => [$l]): ?><option value="<?= $k ?>" <?= $cat === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
    <button class="btn btn-soft" type="submit"><?= icon('search') ?> Filtrer</button>
</form>
<div class="alert alert-info mb-3"><?= icon('info') ?><div class="small"><b>Échelle de maîtrise commune :</b> <?php foreach ($R::LEVELS as $k => [$l, $c]): ?><?= $k ?> <?= e($l) ?> (<?= e(mb_strtolower(rtrim($c, '.'))) ?>)<?= $k < 4 ? ' · ' : '' ?><?php endforeach; ?>. Sans preuve, une compétence déclarée compte au niveau <?= (int)$R::rules()['unproven_cap'] ?> au maximum.</div></div>
<?php $form = function (?array $s) use ($R) { $crit = json_decode((string)($s['level_criteria'] ?? ''), true) ?: []; ob_start(); ?>
    <form method="post" action="<?= e(url('/admin/referentiels/competences')) ?>" class="form-grid cols-2 mt-2">
        <?= csrf_field() ?><input type="hidden" name="id" value="<?= (int)($s['id'] ?? 0) ?>">
        <div class="field"><label>Nom</label><input name="name" required value="<?= e($s['name'] ?? '') ?>"></div>
        <div class="field"><label>Catégorie</label><select name="category"><?php foreach ($R::CATEGORIES as $k => [$l]): ?><option value="<?= $k ?>" <?= ($s['category'] ?? '') === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
        <div class="field span-2"><label>Définition</label><input name="definition" maxlength="255" value="<?= e($s['definition'] ?? '') ?>"></div>
        <div class="field span-2"><label>Synonymes (séparés par des virgules)</label><input name="aliases" value="<?= e($s['aliases'] ?? '') ?>"></div>
        <div class="field"><label>ESCO (URI)</label><input name="esco_uri" value="<?= e($s['esco_uri'] ?? '') ?>"></div>
        <div class="field"><label>Cadre de référence</label><input name="framework" value="<?= e($s['framework'] ?? '') ?>" placeholder="ESCO, DigComp 2.2 — 1.3…, CECRL"></div>
        <?php foreach ($R::LEVELS as $k => [$l, $c]): ?><div class="field"><label>Critère niveau <?= $k ?> (<?= e($l) ?>)</label><input name="criteria[<?= $k ?>]" value="<?= e($crit[$k] ?? '') ?>" placeholder="<?= e($c) ?>"></div><?php endforeach; ?>
        <label class="check"><input type="checkbox" name="credential" value="1" <?= !empty($s['credential']) ? 'checked' : '' ?>> <span class="small">Permis, habilitation ou certificat (jamais retenu sans preuve)</span></label>
        <div class="field"><label>Statut</label><select name="status"><?php foreach ($R::STATUSES as $k => [$l]): ?><option value="<?= $k ?>" <?= ($s['status'] ?? 'brouillon') === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
        <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer</button></div>
    </form>
<?php return ob_get_clean(); }; ?>
<details class="card mb-3"><summary><b><?= icon('plus') ?> Nouvelle compétence</b></summary><?= $form(null) ?></details>
<div class="card"><div class="table-wrap"><table class="table">
    <thead><tr><th>Compétence</th><th>Catégorie</th><th>Cadre</th><th>Usage</th><th>Statut</th></tr></thead>
    <tbody><?php foreach ($rows as $s): [$sl, $sc] = $R::STATUSES[$s['status']] ?? ['—', 'gray']; ?>
        <tr><td><b><?= e($s['name']) ?></b> <small class="muted"><?= e($s['code']) ?></small><?= (int)$s['credential'] ? ' <span class="badge badge-amber">titre</span>' : '' ?><br><small class="muted"><?= e($s['definition']) ?></small>
            <details><summary class="small">Modifier</summary><?= $form($s) ?></details></td>
            <td class="small"><?= e($R::CATEGORIES[$R::category((string)$s['category'])][0]) ?></td>
            <td class="small"><?= $s['esco_uri'] ? '<a href="' . e($s['esco_uri']) . '" target="_blank" rel="noopener">ESCO</a>' : '' ?><?= $s['framework'] && $s['framework'] !== 'ESCO' ? '<br>' . e($s['framework']) : '' ?></td>
            <td class="small"><?= (int)$s['nocc'] ?> fiches · <?= (int)$s['ntrain'] ?> formations · <?= (int)$s['ncand'] ?> profils</td>
            <td><span class="badge badge-<?= $sc ?>"><?= e($sl) ?></span></td></tr>
    <?php endforeach; ?></tbody>
</table></div></div>
