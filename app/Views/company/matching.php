<nav class="breadcrumb"><a href="<?= e(url('/entreprise/offres')) ?>"><?= icon('chevron-left') ?> Mes offres</a></nav>
<div class="page-head">
    <div><h1 style="font-size:1.6rem"><?= icon('sparkles') ?> Profils compatibles</h1><p>« <?= e($job['title']) ?> » — candidats visibles classés par score, avec explication.</p></div>
    <a class="btn btn-ghost" href="<?= e(url('/entreprise/offres/' . $job['id'] . '/candidatures')) ?>"><?= icon('kanban') ?> Pipeline</a>
</div>
<form method="get" class="card flex flex-wrap mb-3" style="align-items:flex-end" data-autosubmit>
    <div class="field"><label for="m-city">Ville</label><select id="m-city" name="city"><option value="">Toutes</option><?php foreach ($cities as $ci): ?><option value="<?= (int)$ci['id'] ?>" <?= (int)$filters['city_id'] === (int)$ci['id'] ? 'selected' : '' ?>><?= e($ci['name']) ?></option><?php endforeach; ?></select></div>
    <div class="field"><label for="m-edu">Niveau min.</label><select id="m-edu" name="edu"><option value="">Tous</option><?php foreach (education_levels() as $k => $l): ?><option value="<?= $k ?>" <?= $filters['education_min'] !== '' && (int)$filters['education_min'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
    <div class="field"><label for="m-min">Score minimum</label><select id="m-min" name="min"><?php foreach ([0, 40, 50, 60, 70, 80] as $s): ?><option value="<?= $s ?>" <?= $filters['min_score'] === $s ? 'selected' : '' ?>><?= $s ?> %</option><?php endforeach; ?></select></div>
    <noscript><button class="btn btn-primary" type="submit">Filtrer</button></noscript>
</form>
<?php if (!$results): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'users', 'heading' => 'Aucun profil au-dessus de ce seuil', 'text' => 'Abaissez légèrement le score minimum : les écarts affichés vous diront précisément ce qu\'il manque à chaque profil.']) ?>
<?php else: ?>
    <div class="stack">
        <?php foreach ($results as $r): $p = $r['p'] ?? $r['profile']; $m = $r['match']; ?>
            <article class="card">
                <div class="flex flex-wrap" style="align-items:flex-start;gap:16px">
                    <span class="avatar avatar-lg" style="background:<?= e(avatar_color($p['email'])) ?>"><?= e(initials($p['first_name'], $p['last_name'])) ?></span>
                    <div class="grow" style="min-width:220px">
                        <h3 class="mb-0"><a href="<?= e(url('/entreprise/candidats/' . $p['user_id'] . '?job=' . $job['id'])) ?>"><?= e($p['first_name'] . ' ' . mb_substr((string)$p['last_name'], 0, 1) . '.') ?></a> <?php if (in_array($p['user_id'], $applied)): ?><span class="badge badge-green">A postulé</span><?php endif; ?> <?php if (in_array($p['plan_code'], ['PREMIUM', 'CAREER'], true)): ?><span class="badge badge-yellow"><?= icon('badge-check') ?> Profil vérifié</span><?php endif; ?></h3>
                        <small class="muted"><?= e($p['headline']) ?> · <?= e($p['city_name']) ?> · <?= e(education_levels()[$p['education_level']] ?? '') ?></small>
                        <div class="tags mt-1"><?php foreach (array_slice($p['skills'], 0, 6) as $s): ?><span class="tag"><?= e($s['name']) ?></span><?php endforeach; ?></div>
                        <div class="grid-2 mt-1 small">
                            <ul class="explain-list ok"><?php foreach (array_slice($m['strengths'], 0, 2) as $s): ?><li><?= icon('check') ?><span><?= e($s) ?></span></li><?php endforeach; ?></ul>
                            <ul class="explain-list gap"><?php foreach (array_slice($m['gaps'], 0, 2) as $g): ?><li><?= icon('alert-triangle') ?><span><?= e($g) ?></span></li><?php endforeach; ?></ul>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="ring <?= score_class($m['score']) ?>" style="--p:<?= $m['score'] ?>"><b><?= $m['score'] ?><small>%</small></b></div>
                        <div class="ring-label"><?= e($m['level']) ?></div>
                        <?php if (!in_array($p['user_id'], $applied)): ?>
                            <form method="post" action="<?= e(url('/entreprise/candidats/' . $p['user_id'] . '/inviter')) ?>" class="mt-1"><?= csrf_field() ?><input type="hidden" name="job_id" value="<?= (int)$job['id'] ?>"><button class="btn btn-cta btn-sm" type="submit"><?= icon('send') ?> Inviter</button></form>
                        <?php endif; ?>
                    </div>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
<?php endif; ?>
