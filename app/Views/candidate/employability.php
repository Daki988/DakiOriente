<?php
$chart = ['type' => 'line', 'data' => ['labels' => array_map(fn($h) => date_fr($h['created_at']), $history), 'datasets' => [['label' => 'Mon score', 'data' => array_map(fn($h) => (int)$h['score'], $history)]]], 'options' => ['scales' => ['y' => ['min' => 0, 'max' => 100]]]];
$icons = ['profile' => 'user', 'skills' => 'zap', 'experience' => 'briefcase-business', 'education' => 'graduation-cap', 'languages' => 'languages', 'orientation' => 'compass', 'soft' => 'smile', 'activity' => 'activity'];
?>
<div class="page-head"><div><h1>Score d'employabilité</h1><p>Ce score mesure ce que les recruteurs regardent vraiment. Chaque facteur te montre où tu en es et l'action qui te fera progresser le plus vite.</p></div></div>
<div class="grid-2 mb-3">
    <div class="card card-lg">
        <div class="score-hero">
            <div class="ring ring-xl <?= score_class($e['score']) ?>" style="--p:<?= $e['score'] ?>"><b><?= $e['score'] ?><small>/100</small></b></div>
            <div class="grow">
                <span class="badge badge-<?= $e['score'] >= 60 ? 'green' : 'amber' ?>"><?= e($e['label']) ?></span>
                <h2 class="mt-1" style="font-size:1.3rem">Ton employabilité aujourd'hui</h2>
                <p class="small muted mb-0">Moyenne des candidats Tremplin : <b><?= $avg ?></b>. Ce score mesure ta préparation globale ; il est distinct du score de compatibilité propre à chaque offre.</p>
            </div>
        </div>
    </div>
    <div class="card card-lg">
        <h3>Évolution</h3>
        <?php if (count($history) > 1): ?><div class="chart-box sm"><canvas data-chart='<?= e(json_encode($chart)) ?>' role="img" aria-label="Évolution de ton score"></canvas></div>
        <?php else: ?><p class="small muted">Ta courbe apparaîtra dès ta prochaine mise à jour de profil.</p><?php endif; ?>
    </div>
</div>
<div class="grid-2">
    <section class="card card-lg">
        <h2 style="font-size:1.15rem">Détail des 8 facteurs</h2>
        <div class="criteria mt-2">
            <?php foreach ($e['factors'] as $k => $f): ?>
                <div class="criterion">
                    <div class="top"><span style="color:var(--navy)"><?= icon($icons[$k] ?? 'info') ?> <?= e($f['label']) ?></span><span><?= e(number_format($f['value'], 1, ',', '')) ?> / <?= $f['max'] ?></span></div>
                    <div class="bar <?= $f['percent'] >= 75 ? 'green' : ($f['percent'] < 40 ? 'sun' : '') ?>"><i data-w="<?= $f['percent'] ?>"></i></div>
                    <?php if ($f['tip']): ?><p><?= icon('lightbulb') ?> <?= e($f['tip']) ?></p><?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
    </section>
    <section class="stack">
        <div class="card card-lg">
            <h2 style="font-size:1.15rem"><?= icon('rocket') ?> Tes leviers prioritaires</h2>
            <ol class="mt-2" style="padding-left:1.2em;display:grid;gap:10px">
                <?php foreach (array_slice($e['tips'], 0, 5) as $t): ?><li><?= e($t) ?></li><?php endforeach; ?>
            </ol>
            <?php if (!$e['tips']): ?><p class="muted">Excellent travail : tous les facteurs sont au vert !</p><?php endif; ?>
            <div class="flex flex-wrap mt-2"><a class="btn btn-primary" href="<?= e(url('/espace/plan')) ?>"><?= icon('route') ?> Mon plan 30/60/90 jours</a><a class="btn btn-ghost" href="<?= e(url('/formations')) ?>"><?= icon('graduation-cap') ?> Formations</a></div>
        </div>
        <div class="alert alert-info"><?= icon('shield-check') ?><div class="small"><b>Transparence :</b> ce score est calculé par des règles déterministes publiées (profil 15, compétences 20, expérience 20, formation 15, langues 10, orientation 5, soft skills 5, dynamique 10). Aucune donnée sensible (âge, genre, origine) n'est utilisée.</div></div>
    </section>
</div>
