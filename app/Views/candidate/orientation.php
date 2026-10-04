<div class="page-head">
    <div><h1>Orientation RIASEC</h1><p>30 situations du quotidien au Gabon pour révéler ce qui te motive vraiment.</p></div>
    <?php if (!$retake): ?><a class="btn btn-ghost" href="<?= e(url('/espace/orientation?refaire=1')) ?>"><?= icon('refresh-cw') ?> Refaire le test</a><?php endif; ?>
</div>

<?php if (!$retake): $scores = $p['riasec']; ?>
    <div class="grid-2 mb-3">
        <section class="card card-lg">
            <span class="eyebrow">Ton profil</span>
            <h2 style="font-size:2.4rem;letter-spacing:.12em;color:var(--blue);margin:0"><?= e($p['riasec_code']) ?></h2>
            <p class="muted"><?= e(implode(' · ', array_map(fn($l) => $types[$l][0], str_split($p['riasec_code'])))) ?></p>
            <div class="riasec-bars mt-2">
                <?php foreach ($types as $k => [$name, $desc, $color]): ?>
                    <div class="riasec-bar"><span class="l" style="background:<?= e($color) ?>"><?= $k ?></span><div><div class="flex between small"><b style="color:var(--navy)"><?= e($name) ?></b></div><div class="bar"><i data-w="<?= (int)($scores[$k] ?? 0) ?>" style="background:<?= e($color) ?>"></i></div></div><b class="tabular small"><?= (int)($scores[$k] ?? 0) ?> %</b></div>
                <?php endforeach; ?>
            </div>
        </section>
        <section class="card card-lg">
            <h3>Ce que cela dit de toi</h3>
            <?php foreach (str_split($p['riasec_code']) as $i => $l): ?>
                <div class="flex mt-2" style="align-items:flex-start"><span class="kpi" style="border:0;padding:0;background:none"><span class="ki" style="background:<?= e($types[$l][2]) ?>22;color:<?= e($types[$l][2]) ?>"><?= icon($types[$l][3]) ?></span></span><div><b style="color:var(--navy)"><?= ['Dominante', 'Secondaire', 'Tertiaire'][$i] ?> : <?= e($types[$l][0]) ?></b><p class="small muted mb-0"><?= e($types[$l][1]) ?></p></div></div>
            <?php endforeach; ?>
        </section>
    </div>
    <h2 style="font-size:1.3rem">Métiers recommandés pour toi</h2>
    <div class="grid-2 mt-2">
        <?php foreach ($careers as $c): ?>
            <div class="card">
                <div class="flex between"><h3 class="mb-0" style="font-size:1.02rem"><?= e($c['name']) ?></h3><span class="badge badge-blue"><?= (int)$c['fit'] ?> % d'affinité</span></div>
                <p class="small muted mt-1"><?= e($c['description']) ?></p>
                <div class="flex flex-wrap small" style="gap:8px">
                    <span class="badge badge-gray"><?= e($c['sector_name']) ?></span>
                    <span class="badge badge-green">Débouchés : <?= e($c['outlook']) ?></span>
                    <span class="badge badge-violet">Code <?= e($c['riasec']) ?></span>
                    <span class="badge badge-amber">Dès <?= e(education_levels()[(int)$c['education_min']] ?? '') ?></span>
                </div>
                <p class="small mt-1 mb-1"><b>Compétences clés :</b> <?= e(str_replace(',', ', ', (string)$c['skills'])) ?></p>
                <a class="small" href="<?= e(url('/offres', ['q' => trim(explode(',', (string)$c['skills'])[0])])) ?>">Voir les offres <?= icon('arrow-right') ?></a>
            </div>
        <?php endforeach; ?>
    </div>
<?php else: ?>
    <form method="post" action="<?= e(url('/espace/orientation')) ?>" class="card card-lg">
        <?= csrf_field() ?>
        <p class="muted">Pour chaque activité, indique si elle te plaît. Il n'y a pas de bonne ou de mauvaise réponse : sois spontané·e.</p>
        <?php foreach ($questions as $i => [$type, $q]): ?>
            <fieldset class="q-row">
                <legend class="sr-only">Question <?= $i + 1 ?></legend>
                <div><span class="muted small tabular"><?= $i + 1 ?>/<?= count($questions) ?></span> <b style="color:var(--navy)"><?= e($q) ?></b></div>
                <div class="opts">
                    <?php foreach (['Pas du tout', 'Un peu', 'Beaucoup'] as $v => $label): ?>
                        <label class="choice"><input type="radio" name="a[<?= $i ?>]" value="<?= $v ?>" required><span><?= e($label) ?></span></label>
                    <?php endforeach; ?>
                </div>
            </fieldset>
        <?php endforeach; ?>
        <div class="flex mt-3" style="justify-content:flex-end"><button class="btn btn-cta btn-lg" type="submit">Découvrir mon profil <?= icon('arrow-right') ?></button></div>
    </form>
<?php endif; ?>
