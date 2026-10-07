<?php
$isEdit = !empty($job['id']);
$v = fn(string $k, $d = '') => old($k, $job[$k] ?? $d);
$err = errors();
$cls = fn(string $k) => isset($err[$k]) ? 'has-error' : '';
$langs = array_filter(array_map('trim', explode(',', (string)($job['languages'] ?? ''))));
$softSel = array_filter(array_map('trim', explode(',', (string)($job['soft_skills'] ?? ''))));
$rows = $jobSkills ?: [];
while (count($rows) < max(6, count($jobSkills) + 2)) {
    $rows[] = ['skill_id' => '', 'required' => 1, 'weight' => 3];
}
?>
<nav class="breadcrumb"><a href="<?= e(url('/entreprise/offres')) ?>"><?= icon('chevron-left') ?> Mes offres</a></nav>
<div class="page-head"><div><h1><?= $isEdit ? 'Modifier l\'offre' : 'Publier une offre' ?></h1><p>Des critères précis = un matching plus juste et des candidats mieux classés.</p></div></div>
<form method="post" action="<?= e(url($isEdit ? '/entreprise/offres/' . $job['id'] : '/entreprise/offres')) ?>" class="layout-aside" novalidate>
    <?= csrf_field() ?>
    <div class="stack">
        <section class="card card-lg">
            <h2 style="font-size:1.15rem">1. L'offre</h2>
            <div class="form-grid cols-2">
                <div class="field span-2 <?= $cls('title') ?>"><label for="title">Intitulé <span class="req">*</span></label><input id="title" name="title" required value="<?= e($v('title')) ?>" placeholder="Ex. Stagiaire Assistant·e Comptable"><?= error_for('title') ?></div>
                <div class="field"><label for="type">Type <span class="req">*</span></label><select id="type" name="type"><?php foreach (job_types() as $k => $l): ?><option value="<?= $k ?>" <?= $v('type') === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="sector_id">Secteur <span class="req">*</span></label><select id="sector_id" name="sector_id"><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)$v('sector_id') === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="city_id">Lieu <span class="req">*</span></label><select id="city_id" name="city_id"><?php foreach ($cities as $ci): ?><option value="<?= (int)$ci['id'] ?>" <?= (int)$v('city_id') === (int)$ci['id'] ? 'selected' : '' ?>><?= e($ci['name'] . ' — ' . $ci['country']) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="remote">Télétravail</label><select id="remote" name="remote"><?php foreach (['0' => 'Sur site', '1' => 'Hybride', '2' => '100 % à distance'] as $k => $l): ?><option value="<?= $k ?>" <?= (string)$v('remote', '0') === (string)$k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
                <div class="field span-2 <?= $cls('summary') ?>"><label for="summary">Accroche (affichée dans les résultats) <span class="req">*</span></label><input id="summary" name="summary" maxlength="300" required value="<?= e($v('summary')) ?>"><?= error_for('summary') ?></div>
                <div class="field span-2 <?= $cls('description') ?>"><label for="description">Description <span class="req">*</span></label><textarea id="description" name="description" required style="min-height:160px"><?= e($v('description')) ?></textarea><?= error_for('description') ?></div>
                <div class="field"><label for="missions">Missions <small class="muted">(une par ligne, commençant par « - »)</small></label><textarea id="missions" name="missions"><?= e($v('missions')) ?></textarea></div>
                <div class="field"><label for="profile">Profil recherché</label><textarea id="profile" name="profile"><?= e($v('profile')) ?></textarea></div>
            </div>
        </section>

        <section class="card card-lg">
            <h2 style="font-size:1.15rem">2. Critères de matching</h2>
            <p class="small muted">Compétences techniques : 30 % du score. Les compétences « clés » comptent double ; le poids (1 à 5) affine leur importance.</p>
            <div class="table-wrap"><table class="table">
                <thead><tr><th>Compétence</th><th>Clé ?</th><th>Poids</th></tr></thead>
                <tbody><?php foreach ($rows as $i => $r): ?>
                    <tr>
                        <td><label class="sr-only" for="sk<?= $i ?>">Compétence</label><select id="sk<?= $i ?>" name="skill_id[]" class="input" style="min-height:40px"><option value="">—</option><?php foreach ($skills as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)$r['skill_id'] === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></td>
                        <td><select name="skill_required[]" class="input" style="min-height:40px" aria-label="Compétence clé"><option value="1" <?= (int)$r['required'] ? 'selected' : '' ?>>Clé</option><option value="0" <?= !(int)$r['required'] ? 'selected' : '' ?>>Souhaitée</option></select></td>
                        <td><select name="skill_weight[]" class="input" style="min-height:40px" aria-label="Poids"><?php for ($w = 1; $w <= 5; $w++): ?><option value="<?= $w ?>" <?= (int)$r['weight'] === $w ? 'selected' : '' ?>><?= $w ?></option><?php endfor; ?></select></td>
                    </tr>
                <?php endforeach; ?></tbody>
            </table></div>
            <div class="form-grid cols-2 mt-2">
                <div class="field"><label for="education_min">Niveau minimum</label><select id="education_min" name="education_min"><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>" <?= (int)$v('education_min') === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
                    <label class="check mt-1"><input type="checkbox" name="education_eliminatory" value="1" <?= !empty($job['education_eliminatory']) ? 'checked' : '' ?>> <span class="small">Critère éliminatoire (niveau légalement requis)</span></label></div>
                <div class="field"><label for="experience_min">Expérience minimum (mois)</label><input id="experience_min" name="experience_min" type="number" min="0" max="240" value="<?= (int)$v('experience_min', 0) ?>"><span class="hint">0 = débutants acceptés</span></div>
            </div>
            <p class="label mt-2">Langues requises</p>
            <?php for ($i = 0; $i < 3; $i++): [$ln, $ll] = array_pad(explode(':', $langs[$i] ?? ''), 2, 'B1'); ?>
                <div class="flex mb-1"><input class="input grow" name="lang_name[]" value="<?= e($ln) ?>" placeholder="<?= ['Français', 'Anglais', 'Autre'][$i] ?>" aria-label="Langue <?= $i + 1 ?>"><select class="input" name="lang_level[]" style="width:180px" aria-label="Niveau"><?php foreach (language_levels() as $k => $lab): ?><option value="<?= $k ?>" <?= $ll === $k ? 'selected' : '' ?>><?= $k ?> — <?= e($lab) ?></option><?php endforeach; ?></select></div>
            <?php endfor; ?>
            <p class="label mt-2">Qualités recherchées (3 à 5)</p>
            <div class="choice-grid"><?php foreach ($softs as $s): ?><label class="choice"><input type="checkbox" name="soft[]" value="<?= e($s['name']) ?>" <?= in_array($s['name'], $softSel, true) ? 'checked' : '' ?>><span><?= e($s['name']) ?></span></label><?php endforeach; ?></div>
        </section>
    </div>

    <aside class="stack">
        <section class="card card-lg">
            <h2 style="font-size:1.15rem">3. Conditions</h2>
            <div class="stack-sm">
                <div class="flex"><div class="field grow"><label for="salary_min">Rémunération min.</label><input id="salary_min" name="salary_min" type="number" min="0" step="5000" value="<?= e($v('salary_min')) ?>"></div><div class="field grow"><label for="salary_max">max. (FCFA)</label><input id="salary_max" name="salary_max" type="number" min="0" step="5000" value="<?= e($v('salary_max')) ?>"></div></div>
                <div class="field"><label for="duration">Durée</label><input id="duration" name="duration" value="<?= e($v('duration')) ?>" placeholder="Ex. 6 mois"></div>
                <div class="flex"><div class="field grow"><label for="start_date">Début</label><input id="start_date" name="start_date" type="date" value="<?= e($v('start_date')) ?>"></div><div class="field grow"><label for="deadline">Date limite</label><input id="deadline" name="deadline" type="date" value="<?= e($v('deadline')) ?>"></div></div>
                <div class="field"><label for="positions">Nombre de postes</label><input id="positions" name="positions" type="number" min="1" max="100" value="<?= (int)$v('positions', 1) ?>"></div>
                <div class="field"><label for="apply_mode">Mode de candidature</label><select id="apply_mode" name="apply_mode"><option value="internal" <?= $v('apply_mode') === 'internal' ? 'selected' : '' ?>>Via Tremplin (recommandé)</option><option value="external" <?= $v('apply_mode') === 'external' ? 'selected' : '' ?>>Redirection vers mon site</option></select></div>
                <div class="field <?= $cls('external_url') ?>"><label for="external_url">Lien externe</label><input id="external_url" name="external_url" type="url" value="<?= e($v('external_url')) ?>" placeholder="https://"><?= error_for('external_url') ?></div>
            </div>
        </section>
        <div class="card stack-sm" style="position:sticky;top:90px">
            <?php if ($isEdit): ?>
                <button class="btn btn-primary btn-block" type="submit" name="action" value="save"><?= icon('check') ?> Enregistrer</button>
                <?php if (in_array($job['status'], ['draft', 'archived', 'rejected'], true)): ?><button class="btn btn-cta btn-block" type="submit" name="action" value="publish"><?= icon('send') ?> Publier</button><?php endif; ?>
            <?php else: ?>
                <button class="btn btn-cta btn-block btn-lg" type="submit" name="action" value="publish"><?= icon('send') ?> <?= $c['status'] === 'verified' ? 'Publier l\'offre' : 'Soumettre à validation' ?></button>
                <button class="btn btn-ghost btn-block" type="submit" name="action" value="draft">Enregistrer en brouillon</button>
            <?php endif; ?>
            <p class="small muted mb-0"><?= icon('bell') ?> À la publication, les candidats compatibles à plus de <?= (int)setting('match_alert_threshold', 70) ?> % sont alertés automatiquement.</p>
        </div>
    </aside>
</form>
