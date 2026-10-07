<?php
$isEdit = !empty($job['id']);
$v = fn(string $k, $d = '') => old($k, $job[$k] ?? $d);
$err = errors();
$cls = fn(string $k) => isset($err[$k]) ? 'has-error' : '';
$langs = array_filter(array_map('trim', explode(',', (string)($job['languages'] ?? ''))));
$softSel = array_filter(array_map('trim', explode(',', (string)($job['soft_skills'] ?? ''))));
$rows = $jobSkills ?: [];
while (count($rows) < max(8, count($jobSkills) + 2)) {
    $rows[] = ['skill_id' => '', 'required' => 1, 'weight' => 10, 'level' => 3, 'blocking' => 0];
}
$langBlock = array_filter(array_map('trim', explode(',', (string)($job['languages_blocking'] ?? ''))));
$R = App\Services\Referential\Ref::class;
$byCat = [];
foreach ($skills as $s) {
    $byCat[$s['credential'] ? 'titres' : $s['category']][] = $s;
}
$catLabels = ['technique' => 'Techniques', 'numerique' => 'Numériques', 'transverse' => 'Transverses', 'comportementale' => 'Comportementales', 'titres' => 'Permis et habilitations'];
$occBySector = [];
foreach ($occupations as $o) {
    $occBySector[$o['sector'] ?: 'Autres'][] = $o;
}
$curOcc = (int)$v('occupation_id', 0);
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

        <section class="card card-lg" data-occ-form data-suggest="<?= e(url('/entreprise/metiers/suggerer')) ?>" data-sheet="<?= e(url('/entreprise/metiers')) ?>">
            <h2 style="font-size:1.15rem">2. Fiche métier et critères de matching</h2>
            <p class="small muted">Chaque offre est rattachée à un code du référentiel Métiers Tremplin (ROME 4.0, ESCO, ISCO-08) : candidats et offres sont ainsi comparés sur la même base. Le code est proposé automatiquement à partir de l'intitulé ; vérifie-le et confirme-le.</p>
            <div class="form-grid cols-2">
                <div class="field span-2"><label for="occupation_id">Code métier</label>
                    <select id="occupation_id" name="occupation_id"><option value="">— Choisir la fiche métier —</option>
                        <?php foreach ($occBySector as $sec => $list): ?><optgroup label="<?= e($sec) ?>"><?php foreach ($list as $o): ?><option value="<?= (int)$o['id'] ?>" <?= $curOcc === (int)$o['id'] ? 'selected' : '' ?>><?= e($o['code'] . ' — ' . $o['title']) ?></option><?php endforeach; ?></optgroup><?php endforeach; ?>
                    </select>
                    <span class="hint" data-occ-hint><?= !empty($job['occupation_id']) && empty($job['occupation_confirmed']) ? 'Code proposé automatiquement : à confirmer.' : '' ?></span></div>
                <label class="check"><input type="checkbox" name="occupation_confirmed" value="1" <?= !empty($job['occupation_confirmed']) ? 'checked' : '' ?>> <span class="small">Je confirme ce code métier</span></label>
                <div><button class="btn btn-soft btn-sm" type="button" data-occ-fill><?= icon('download') ?> Reprendre les compétences de la fiche</button></div>
            </div>
            <p class="small muted mt-2">Compétences : 40 % du score. Niveau attendu de 1 (Notions) à 4 (Expert) ; le poids règle l'importance relative. Un <b>prérequis bloquant</b> (permis, habilitation, compétence indispensable) écarte le profil qui ne l'a pas, quel que soit son score.</p>
            <div class="table-wrap"><table class="table" data-occ-rows>
                <thead><tr><th>Compétence</th><th>Niveau attendu</th><th>Poids</th><th>Bloquant ?</th></tr></thead>
                <tbody><?php foreach ($rows as $i => $r): ?>
                    <tr>
                        <td><label class="sr-only" for="sk<?= $i ?>">Compétence</label><select id="sk<?= $i ?>" name="skill_id[]" class="input" style="min-height:40px"><option value="">—</option><?php foreach ($catLabels as $ck => $cl): if (empty($byCat[$ck])) continue; ?><optgroup label="<?= e($cl) ?>"><?php foreach ($byCat[$ck] as $sk): ?><option value="<?= (int)$sk['id'] ?>" <?= (int)$r['skill_id'] === (int)$sk['id'] ? 'selected' : '' ?>><?= e($sk['name']) ?></option><?php endforeach; ?></optgroup><?php endforeach; ?></select></td>
                        <td><select name="skill_level[]" class="input" style="min-height:40px" aria-label="Niveau attendu"><?php foreach ($R::LEVELS as $lk => [$ll]): ?><option value="<?= $lk ?>" <?= (int)($r['level'] ?? 3) === $lk ? 'selected' : '' ?>><?= $lk ?> — <?= e($ll) ?></option><?php endforeach; ?></select></td>
                        <td><input name="skill_weight[]" type="number" min="1" max="100" class="input" style="min-height:40px;width:90px" aria-label="Poids" value="<?= max(1, (int)$r['weight']) ?>"></td>
                        <td><select name="skill_blocking[]" class="input" style="min-height:40px" aria-label="Prérequis bloquant"><option value="0">Non</option><option value="1" <?= !empty($r['blocking']) ? 'selected' : '' ?>>Oui</option></select></td>
                    </tr>
                <?php endforeach; ?></tbody>
            </table></div>
            <div class="form-grid cols-2 mt-2">
                <div class="field"><label for="education_min">Niveau minimum</label><select id="education_min" name="education_min"><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>" <?= (int)$v('education_min') === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
                    <label class="check mt-1"><input type="checkbox" name="education_eliminatory" value="1" <?= !empty($job['education_eliminatory']) ? 'checked' : '' ?>> <span class="small">Diplôme bloquant (niveau ou diplôme réglementé exigé)</span></label>
                    <span class="hint">Sinon, un écart d'un niveau réduit le score sans écarter le candidat.</span></div>
                <div class="field"><label for="experience_min">Expérience minimum (mois)</label><input id="experience_min" name="experience_min" type="number" min="0" max="240" value="<?= (int)$v('experience_min', 0) ?>"><span class="hint">0 = débutants acceptés</span></div>
            </div>
            <p class="label mt-2">Langues requises</p>
            <?php for ($i = 0; $i < 3; $i++): [$ln, $ll] = array_pad(explode(':', $langs[$i] ?? ''), 2, 'B1'); ?>
                <div class="flex flex-wrap mb-1"><input class="input grow" name="lang_name[]" value="<?= e($ln) ?>" placeholder="<?= ['Français', 'Anglais', 'Autre'][$i] ?>" aria-label="Langue <?= $i + 1 ?>"><select class="input" name="lang_level[]" style="width:180px" aria-label="Niveau"><?php foreach (language_levels() as $k => $lab): ?><option value="<?= $k ?>" <?= $ll === $k ? 'selected' : '' ?>><?= $k ?> — <?= e($lab) ?></option><?php endforeach; ?></select>
                    <label class="check"><input type="checkbox" name="lang_block[<?= $i ?>]" value="1" <?= $ln !== '' && in_array($ln, $langBlock, true) ? 'checked' : '' ?>> <span class="small">Obligatoire</span></label></div>
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
