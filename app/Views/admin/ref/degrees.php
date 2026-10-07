<?php $R = App\Services\Referential\Ref::class; ?>
<div class="page-head"><div><h1>Référentiel Diplômes & Équivalences</h1><p>Tous les diplômes ramenés à une échelle commune N0 à N6. Un diplôme étranger est rattaché au niveau correspondant ; en cas de doute, il est marqué « à vérifier » plutôt que classé par défaut.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'diplomes']) ?>
<div class="grid-2">
<section class="card card-lg">
    <h2 style="font-size:1.1rem">Échelle et diplômes</h2>
    <div class="table-wrap"><table class="table"><thead><tr><th>Niveau</th><th>Diplôme</th><th>Reconnaissance</th></tr></thead><tbody>
        <?php foreach ($rows as $d): ?><tr><td><b><?= e($R::degreeLabel((int)$d['level'], true)) ?></b></td>
            <td><?= e($d['title']) ?><?= (int)$d['to_verify'] ? ' <span class="badge badge-amber">à vérifier</span>' : '' ?><br><small class="muted"><?= e($d['country']) ?></small>
                <details><summary class="small">Modifier</summary>
                    <form method="post" action="<?= e(url('/admin/referentiels/diplomes')) ?>" class="stack-sm mt-1"><?= csrf_field() ?><input type="hidden" name="id" value="<?= (int)$d['id'] ?>">
                        <input class="input" name="title" value="<?= e($d['title']) ?>" aria-label="Intitulé">
                        <div class="flex"><select class="input" name="level" aria-label="Niveau"><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>" <?= (int)$d['level'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select><input class="input" name="country" value="<?= e($d['country']) ?>" aria-label="Pays"></div>
                        <input class="input" name="recognition" value="<?= e($d['recognition']) ?>" aria-label="Reconnaissance" placeholder="État, CAMES…">
                        <input class="input" name="synonyms" value="<?= e($d['synonyms']) ?>" aria-label="Synonymes" placeholder="Synonymes séparés par des virgules">
                        <label class="check"><input type="checkbox" name="to_verify" value="1" <?= (int)$d['to_verify'] ? 'checked' : '' ?>> <span class="small">À vérifier</span></label>
                        <select class="input" name="status" aria-label="Statut"><?php foreach ($R::STATUSES as $k => [$l]): ?><option value="<?= $k ?>" <?= $d['status'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
                        <button class="btn btn-soft btn-sm" type="submit">Enregistrer</button></form></details></td>
            <td class="small"><?= e($d['recognition']) ?></td></tr><?php endforeach; ?>
    </tbody></table></div>
    <details class="mt-2"><summary><b><?= icon('plus') ?> Ajouter un diplôme</b></summary>
        <form method="post" action="<?= e(url('/admin/referentiels/diplomes')) ?>" class="stack-sm mt-1"><?= csrf_field() ?>
            <input class="input" name="title" required placeholder="Intitulé" aria-label="Intitulé">
            <div class="flex"><select class="input" name="level" aria-label="Niveau"><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>"><?= e($l) ?></option><?php endforeach; ?></select><input class="input" name="country" placeholder="Pays ou zone" aria-label="Pays"></div>
            <input class="input" name="recognition" placeholder="Reconnaissance (État, CAMES…)" aria-label="Reconnaissance"><input class="input" name="synonyms" placeholder="Synonymes" aria-label="Synonymes">
            <button class="btn btn-primary btn-sm" type="submit">Ajouter</button></form></details>
</section>
<section class="card card-lg">
    <h2 style="font-size:1.1rem">Diplômes déclarés à vérifier (<?= count($toVerify) ?>)</h2>
    <p class="small muted">Diplômes non reconnus ou étrangers déclarés par les candidats. Le rattachement fixe leur niveau dans le score.</p>
    <?php if (!$toVerify): ?><p class="muted small">Aucun diplôme en attente.</p><?php endif; ?>
    <ul class="list"><?php foreach ($toVerify as $e): ?><li style="display:block">
        <b><?= e($e['degree']) ?></b><?= $e['field'] ? ' — ' . e($e['field']) : '' ?><br><small class="muted"><?= e($e['school']) ?> · <?= e($e['first_name'] . ' ' . mb_substr($e['last_name'], 0, 1) . '.') ?></small>
        <form method="post" action="<?= e(url('/admin/referentiels/diplomes')) ?>" class="flex mt-1"><?= csrf_field() ?><input type="hidden" name="education_id" value="<?= (int)$e['id'] ?>">
            <select class="input grow" name="degree_id" aria-label="Diplôme du référentiel"><?php foreach ($rows as $d): ?><option value="<?= (int)$d['id'] ?>"><?= e($R::degreeLabel((int)$d['level'], true) . ' — ' . $d['title']) ?></option><?php endforeach; ?></select>
            <button class="btn btn-soft btn-sm" type="submit">Rattacher</button></form></li><?php endforeach; ?></ul>
</section>
</div>
