<?php $cats = ['conseil' => 'Conseil', 'cv' => 'CV & candidature', 'entretien' => 'Entretien', 'marche' => 'Marché de l\'emploi', 'stage' => 'Stage']; $e = $edit ?? []; ?>
<div class="page-head"><div><h1>Contenus éditoriaux</h1><p>Articles « Conseils » publiés sur le site.</p></div></div>
<div class="layout-aside">
    <div class="table-wrap"><table class="table">
        <thead><tr><th>Article</th><th>Catégorie</th><th>Statut</th><th></th></tr></thead>
        <tbody><?php foreach ($contents as $c): ?>
            <tr><td><b><?= e($c['title']) ?></b><br><small class="muted"><?= e(date_fr($c['created_at'])) ?> · <?= (int)$c['reading_minutes'] ?> min</small></td><td><?= e($cats[$c['category']] ?? $c['category']) ?></td>
                <td><span class="badge badge-<?= $c['published'] ? 'green' : 'gray' ?>"><?= $c['published'] ? 'Publié' : 'Brouillon' ?></span></td>
                <td><div class="actions"><a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/contenus?edit=' . $c['id'])) ?>" aria-label="Modifier"><?= icon('pencil') ?></a>
                    <form method="post" action="<?= e(url('/admin/contenus')) ?>" data-confirm="Supprimer cet article ?"><?= csrf_field() ?><input type="hidden" name="delete" value="<?= (int)$c['id'] ?>"><button class="btn btn-ghost btn-sm" type="submit" aria-label="Supprimer"><?= icon('trash-2') ?></button></form></div></td></tr>
        <?php endforeach; ?></tbody>
    </table></div>
    <form method="post" action="<?= e(url('/admin/contenus')) ?>" class="card card-lg stack-sm">
        <?= csrf_field() ?><input type="hidden" name="id" value="<?= (int)($e['id'] ?? 0) ?>">
        <h3><?= $edit ? 'Modifier l\'article' : 'Nouvel article' ?></h3>
        <div class="field"><label for="ct">Titre</label><input id="ct" name="title" required value="<?= e($e['title'] ?? '') ?>"></div>
        <div class="flex"><div class="field grow"><label for="cc">Catégorie</label><select id="cc" name="category"><?php foreach ($cats as $k => $l): ?><option value="<?= $k ?>" <?= ($e['category'] ?? '') === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div><div class="field"><label for="ccol">Couleur</label><input id="ccol" type="color" name="cover_color" value="<?= e($e['cover_color'] ?? '#0057ff') ?>" style="height:48px;padding:4px"></div></div>
        <div class="field"><label for="ce">Chapô</label><input id="ce" name="excerpt" maxlength="300" value="<?= e($e['excerpt'] ?? '') ?>"></div>
        <div class="field"><label for="cb">Contenu</label><textarea id="cb" name="body" required style="min-height:240px"><?= e($e['body'] ?? '') ?></textarea><span class="hint">Paragraphes séparés par une ligne vide ; une ligne courte suivie d'un paragraphe devient un intertitre.</span></div>
        <label class="check"><input type="checkbox" name="published" value="1" <?= ($e['published'] ?? 1) ? 'checked' : '' ?>> Publier</label>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
    </form>
</div>
