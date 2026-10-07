<?php
$popular = ['PHP', 'JavaScript', 'SQL', 'Excel avancé', 'Pack Office', 'Comptabilité générale', 'Techniques de vente', 'Gestion de la relation client', 'Gestion des réseaux sociaux', 'Création graphique', 'Logistique', 'HSE', 'Analyse de données', 'Réseaux informatiques', 'Support informatique', 'Rédaction', 'Gestion de projet', 'Marketing digital', 'Secrétariat', 'Soins infirmiers', 'Agronomie', 'Électricité industrielle', 'Gestion des ressources humaines', 'Power BI'];
$skillMap = array_column($skillsTech, 'id', 'name');
?>
<div style="max-width:880px;margin:0 auto">
    <div class="text-center mb-3">
        <p class="hand" style="font-size:2rem;color:var(--blue);margin:0">Bienvenue <?= e($p['first_name']) ?> !</p>
        <h1 style="font-size:clamp(1.5rem,3vw,2.1rem)">Créons ton profil en 2 minutes</h1>
        <p class="muted">Ces informations alimentent le moteur de matching : plus elles sont précises, plus tes recommandations sont pertinentes.</p>
    </div>
    <form method="post" action="<?= e(url('/espace/bienvenue')) ?>" class="stack" novalidate>
        <?= csrf_field() ?>
        <fieldset class="card card-lg">
            <legend class="flex"><span class="badge badge-blue">1</span> Qui es-tu ?</legend>
            <div class="form-grid cols-2">
                <div class="field span-2"><label for="headline">Ton titre en une phrase <span class="req">*</span></label><input id="headline" name="headline" required maxlength="160" placeholder="Ex. Étudiant en Licence Gestion, passionné de finance" value="<?= e(old('headline', $p['headline'])) ?>"><?= error_for('headline') ?></div>
                <div class="field"><label for="city_id">Ta ville <span class="req">*</span></label>
                    <select id="city_id" name="city_id" required><option value="">Choisir…</option><?php foreach ($cities as $c): ?><option value="<?= (int)$c['id'] ?>" <?= (int)old('city_id', $p['city_id']) === (int)$c['id'] ? 'selected' : '' ?>><?= e($c['name'] . ' — ' . $c['country']) ?></option><?php endforeach; ?></select><?= error_for('city_id') ?></div>
                <div class="field"><label for="education_level">Ton niveau d'études <span class="req">*</span></label>
                    <select id="education_level" name="education_level"><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>" <?= (int)old('education_level', $p['education_level']) === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
                <div class="field span-2"><label for="field_of_study">Domaine d'études</label><input id="field_of_study" name="field_of_study" placeholder="Ex. Informatique, Comptabilité, Biologie…" value="<?= e(old('field_of_study', $p['field_of_study'])) ?>"></div>
            </div>
        </fieldset>

        <fieldset class="card card-lg">
            <legend class="flex"><span class="badge badge-blue">2</span> Que cherches-tu ?</legend>
            <div class="form-grid cols-2">
                <div class="field"><label for="desired_job">Le métier que tu vises <span class="req">*</span></label><input id="desired_job" name="desired_job" required placeholder="Ex. Développeur web, Comptable…" value="<?= e(old('desired_job', $p['desired_job'])) ?>"><?= error_for('desired_job') ?></div>
                <div class="field"><label for="desired_sector_id">Secteur préféré</label><select id="desired_sector_id" name="desired_sector_id"><option value="">Peu importe</option><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>"><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
            </div>
            <p class="label mt-2">Types d'opportunités</p>
            <div class="choice-grid">
                <?php foreach (job_types() as $k => $l): ?><label class="choice"><input type="checkbox" name="types[]" value="<?= e($k) ?>" <?= in_array($k, ['stage', 'premier_emploi'], true) ? 'checked' : '' ?>><span><?= e($l) ?></span></label><?php endforeach; ?>
            </div>
        </fieldset>

        <fieldset class="card card-lg">
            <legend class="flex"><span class="badge badge-blue">3</span> Tes compétences</legend>
            <p class="small muted">Sélectionne ce que tu sais déjà faire (tu pourras préciser ton niveau ensuite).</p>
            <div class="choice-grid">
                <?php foreach ($popular as $name): if (!isset($skillMap[$name])) continue; ?>
                    <label class="choice"><input type="checkbox" name="skills[]" value="<?= (int)$skillMap[$name] ?>"><span><?= e($name) ?></span></label>
                <?php endforeach; ?>
            </div>
            <p class="label mt-3">Tes qualités</p>
            <div class="choice-grid">
                <?php foreach ($skillsSoft as $s): ?><label class="choice"><input type="checkbox" name="soft[]" value="<?= (int)$s['id'] ?>"><span><?= e($s['name']) ?></span></label><?php endforeach; ?>
            </div>
        </fieldset>
        <div class="flex between flex-wrap">
            <a class="btn btn-ghost" href="<?= e(url('/espace')) ?>">Plus tard</a>
            <button class="btn btn-cta btn-lg" type="submit">Voir mes offres compatibles <?= icon('arrow-right') ?></button>
        </div>
    </form>
</div>
