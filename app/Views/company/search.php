<div class="page-head"><div><h1>CVthèque</h1><p>Profils visibles (sans coordonnées). Sélectionnez une offre pour classer les candidats par compatibilité.</p></div></div>
<form method="get" class="card mb-3">
    <div class="form-grid cols-3" style="align-items:end">
        <div class="field"><label for="q">Compétence, métier, domaine</label><input id="q" name="q" value="<?= e($q) ?>" placeholder="Ex. comptabilité, PHP, HSE"></div>
        <div class="field"><label for="job">Classer selon l'offre</label><select id="job" name="job"><option value="">— Sans classement —</option><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>" <?= $jobId === (int)$j['id'] ? 'selected' : '' ?>><?= e($j['title']) ?></option><?php endforeach; ?></select></div>
        <div class="field"><label for="city">Ville</label><select id="city" name="city"><option value="">Toutes</option><?php foreach ($cities as $ci): ?><option value="<?= (int)$ci['id'] ?>" <?= (int)input('city') === (int)$ci['id'] ? 'selected' : '' ?>><?= e($ci['name']) ?></option><?php endforeach; ?></select></div>
        <div class="field"><label for="edu">Niveau minimum</label><select id="edu" name="edu"><option value="">Tous</option><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>" <?= input('edu', '') !== '' && (int)input('edu') === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
        <label class="check"><input type="checkbox" name="available" value="1" <?= input('available') ? 'checked' : '' ?>> <span>Disponible sous 30 jours</span></label>
        <button class="btn btn-primary" type="submit"><?= icon('search') ?> Rechercher</button>
    </div>
</form>
<p class="muted small"><?= count($results) ?> profil(s)</p>
<?php if (!$results): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'users', 'heading' => 'Aucun profil trouvé', 'text' => 'Élargissez vos critères.']) ?>
<?php else: ?>
    <div class="grid-2">
        <?php foreach ($results as $r): $p = $r['p']; $m = $r['match']; ?>
            <a class="card card-hover" href="<?= e(url('/entreprise/candidats/' . $p['user_id'] . ($jobId ? '?job=' . $jobId : ''))) ?>" style="color:inherit">
                <div class="flex" style="align-items:flex-start">
                    <span class="avatar" style="background:<?= e(avatar_color($p['email'])) ?>"><?= e(initials($p['first_name'], $p['last_name'])) ?></span>
                    <div class="grow"><b style="color:var(--navy)"><?= e($p['first_name'] . ' ' . mb_substr((string)$p['last_name'], 0, 1) . '.') ?></b><br><small class="muted"><?= e($p['headline']) ?></small><br><small class="muted"><?= icon('map-pin') ?> <?= e($p['city_name']) ?> · <?= e(education_levels()[$p['education_level']] ?? '') ?> · employabilité <?= (int)$p['employability_score'] ?></small></div>
                    <?php if ($m): ?><div class="ring ring-sm <?= score_class($m['score']) ?>" style="--p:<?= $m['score'] ?>"><b><?= $m['score'] ?></b></div><?php endif; ?>
                </div>
                <div class="tags mt-1"><?php foreach (array_slice(array_filter($p['skills'], fn($s) => $s['category'] === 'tech'), 0, 5) as $s): ?><span class="tag"><?= e($s['name']) ?></span><?php endforeach; ?></div>
            </a>
        <?php endforeach; ?>
    </div>
<?php endif; ?>
