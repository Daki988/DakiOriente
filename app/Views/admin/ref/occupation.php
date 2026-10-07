<?php
$R = App\Services\Referential\Ref::class;
[$sl, $sc] = $R::STATUSES[$o['status']];
$langs = json_decode((string)$o['languages'], true) ?: [];
$myFields = array_filter(explode(',', (string)$o['fields']));
$rows = $skills;
while (count($rows) < count($skills) + 4) {
    $rows[] = ['skill_id' => '', 'level' => 2, 'weight' => 10, 'blocking' => 0];
}
$total = array_sum(array_map(fn($s) => (int)$s['weight'], $skills));
?>
<nav class="breadcrumb"><a href="<?= e(url('/admin/referentiels/metiers')) ?>"><?= icon('chevron-left') ?> Métiers</a></nav>
<div class="page-head"><div><h1><?= e($o['title']) ?></h1><p><span class="badge badge-gray"><?= e($o['code']) ?></span> <span class="badge badge-<?= $sc ?>"><?= e($sl) ?></span> révision <?= (int)$o['revision'] ?> · <?= e($o['family']) ?></p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'metiers']) ?>
<div class="layout-aside">
<form method="post" action="<?= e(url('/admin/referentiels/metiers/' . $o['id'])) ?>" class="stack">
    <?= csrf_field() ?>
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Fiche</h2>
        <div class="form-grid cols-2">
            <div class="field span-2"><label for="title">Intitulé de référence</label><input id="title" name="title" value="<?= e($o['title']) ?>" required></div>
            <div class="field"><label for="sector_id">Secteur</label><select id="sector_id" name="sector_id"><option value="">—</option><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)$o['sector_id'] === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="education_min">Niveau d'accès habituel</label><select id="education_min" name="education_min"><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>" <?= (int)$o['education_min'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label>Correspondance ROME 4.0</label><input value="<?= e($o['rome_code']) ?>" disabled></div>
            <div class="field"><label for="isco_code">ISCO-08 <small class="muted">(<?= e($o['isco_source'] ?: '—') ?>)</small></label><input id="isco_code" name="isco_code" value="<?= e($o['isco_code']) ?>" pattern="\d{4}"><span class="hint"><?= e($o['isco_label']) ?></span></div>
            <div class="field"><label for="esco_uri">ESCO (URI)</label><input id="esco_uri" name="esco_uri" value="<?= e($o['esco_uri']) ?>" placeholder="http://data.europa.eu/esco/occupation/…"></div>
            <div class="field"><label for="esco_label">ESCO (libellé)</label><input id="esco_label" name="esco_label" value="<?= e($o['esco_label']) ?>"></div>
            <div class="field span-2"><label for="regulated_degree">Diplôme réglementé <small class="muted">(bloquant par défaut sur les offres)</small></label><input id="regulated_degree" name="regulated_degree" value="<?= e($o['regulated_degree']) ?>" placeholder="Ex. Diplôme d'État d'infirmier"></div>
            <div class="field span-2"><label for="related">Métiers proches (passerelles), codes séparés par des virgules</label><input id="related" name="related" value="<?= e($o['related']) ?>"></div>
            <div class="field span-2"><label for="description">Description</label><textarea id="description" name="description" style="min-height:80px"><?= e($o['description']) ?></textarea></div>
        </div>
        <p class="label mt-2">Domaines d'études habituels</p>
        <div class="choice-grid"><?php foreach ($fields as $k => [$l]): ?><label class="choice"><input type="checkbox" name="fields[]" value="<?= e($k) ?>" <?= in_array($k, $myFields, true) ? 'checked' : '' ?>><span><?= e($l) ?></span></label><?php endforeach; ?></div>
        <p class="label mt-2">Langues attendues</p>
        <?php for ($i = 0; $i < 2; $i++): $ln = array_keys($langs)[$i] ?? ''; $ll = $langs[$ln] ?? 'B1'; ?>
            <div class="flex mb-1"><input class="input grow" name="lang_name[]" value="<?= e($ln) ?>" placeholder="Ex. Anglais" aria-label="Langue"><select class="input" name="lang_level[]" style="width:160px" aria-label="Niveau"><?php foreach (language_levels() as $k => $lab): ?><option value="<?= $k ?>" <?= $ll === $k ? 'selected' : '' ?>><?= $k ?></option><?php endforeach; ?></select></div>
        <?php endfor; ?>
    </section>
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Compétences requises <small class="muted">(poids total : <?= $total ?>)</small></h2>
        <p class="small muted">Niveau attendu 1 Notions · 2 Opérationnel · 3 Maîtrise · 4 Expert. Les poids sont ramenés à 100 dans le calcul. Un prérequis bloquant écarte le profil qui ne l'a pas.</p>
        <div class="table-wrap"><table class="table"><thead><tr><th>Compétence</th><th>Niveau</th><th>Poids</th><th>Bloquant</th></tr></thead><tbody>
            <?php foreach ($rows as $i => $r): ?><tr>
                <td><select name="skill_id[]" class="input" aria-label="Compétence"><option value="">—</option><?php foreach ($allSkills as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)$r['skill_id'] === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></td>
                <td><select name="skill_level[]" class="input" aria-label="Niveau"><?php foreach ($R::LEVELS as $k => [$l]): ?><option value="<?= $k ?>" <?= (int)$r['level'] === $k ? 'selected' : '' ?>><?= $k ?> — <?= e($l) ?></option><?php endforeach; ?></select></td>
                <td><input name="skill_weight[]" type="number" min="0" max="100" class="input" style="width:80px" value="<?= (int)$r['weight'] ?>" aria-label="Poids"></td>
                <td><select name="skill_blocking[<?= $i ?>]" class="input" aria-label="Bloquant"><option value="">Non</option><option value="1" <?= (int)$r['blocking'] ? 'selected' : '' ?>>Oui</option></select></td>
            </tr><?php endforeach; ?>
        </tbody></table></div>
    </section>
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Appellations (<?= count($labels) ?>)</h2>
        <p class="small muted">Variantes employées dans les offres et les CV : elles alimentent la normalisation. Coche pour retirer.</p>
        <div class="choice-grid"><?php foreach ($labels as $l): ?><label class="choice"><input type="checkbox" name="remove_label[]" value="<?= (int)$l['id'] ?>"><span><?= e($l['label']) ?> <small class="muted"><?= e(['rome' => 'ROME', 'local' => 'Gabon', 'curation' => 'curation'][$l['source']] ?? $l['source']) ?></small></span></label><?php endforeach; ?></div>
        <div class="field mt-2"><label for="new_labels">Ajouter des appellations locales (une par ligne)</label><textarea id="new_labels" name="new_labels" placeholder="Ex. Gestionnaire de stock"></textarea></div>
    </section>
    <div><button class="btn btn-primary btn-lg" type="submit"><?= icon('check') ?> Enregistrer la fiche</button></div>
</form>
<aside class="stack">
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Cycle de vie</h2>
        <p class="small muted">Statut actuel : <b><?= e($sl) ?></b>.<?= $o['reviewed_at'] ? ' Relue le ' . e(date_fr($o['reviewed_at'])) . '.' : '' ?><?= $o['validated_at'] ? ' Validée le ' . e(date_fr($o['validated_at'])) . '.' : '' ?></p>
        <div class="stack-sm">
            <?php foreach ([['relu', 'Marquer comme relue (expert)', $canReview, 'btn-soft'], ['valide', 'Valider (responsable)', $canValidate, 'btn-primary'], ['brouillon', 'Repasser en brouillon', true, 'btn-ghost'], ['archive', 'Archiver', $canValidate, 'btn-ghost']] as [$to, $lab, $ok, $cls]): if ($to === $o['status'] || !$ok) continue; ?>
                <form method="post" action="<?= e(url('/admin/referentiels/metiers/' . $o['id'] . '/statut')) ?>"><?= csrf_field() ?><input type="hidden" name="status" value="<?= $to ?>"><button class="btn <?= $cls ?> btn-block" type="submit"><?= e($lab) ?></button></form>
            <?php endforeach; ?>
        </div>
        <p class="small muted mt-2">Les candidats voient les changements à la prochaine version publiée.</p>
    </section>
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Offres rattachées</h2>
        <?php if (!$jobs): ?><p class="small muted">Aucune.</p><?php endif; ?>
        <ul class="list"><?php foreach ($jobs as $j): ?><li class="small"><a href="<?= e(url('/offres/' . $j['id'])) ?>"><?= e($j['title']) ?></a> · <?= e($j['company']) ?><?= $j['occupation_confirmed'] ? '' : ' <span class="badge badge-amber">à confirmer</span>' ?></li><?php endforeach; ?></ul>
    </section>
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Historique</h2>
        <ul class="list"><?php foreach ($history as $h): ?><li class="small"><span class="grow"><?= e($h['summary']) ?><br><small class="muted"><?= e(date_fr($h['created_at'], true)) ?><?= $h['first_name'] ? ' · ' . e($h['first_name']) : '' ?><?= $h['version_id'] ? '' : ' · à publier' ?></small></span></li><?php endforeach; ?></ul>
    </section>
</aside>
</div>
