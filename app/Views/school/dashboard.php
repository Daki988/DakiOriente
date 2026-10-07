<?php
$ist = internship_statuses();
$dough = ['type' => 'doughnut', 'data' => ['labels' => array_map(fn($k) => $ist[$k][0], array_keys($ist)), 'datasets' => [['label' => 'Étudiants', 'data' => array_map(fn($k) => $byStatus[$k] ?? 0, array_keys($ist)), 'backgroundColor' => ['#94a3b8', '#0057ff', '#7c4dff', '#ffc21a', '#00b4ff', '#12a150']]]]];
$bar = ['type' => 'bar', 'data' => ['labels' => array_column($bySector, 'name'), 'datasets' => [['label' => 'Candidatures', 'data' => array_map('intval', array_column($bySector, 'n'))]]], 'options' => ['indexAxis' => 'y']];
$rate = $students ? round($placed / $students * 100) : 0;
?>
<div class="page-head">
    <div><h1><?= e($s['name']) ?></h1><p>Suivi de l'employabilité et de l'insertion de vos étudiants.</p></div>
    <div class="card" style="padding:12px 16px"><small class="muted">Code établissement</small><br><b id="jc" style="font-size:1.3rem;letter-spacing:.12em;color:var(--blue)"><?= e($s['join_code']) ?></b> <button class="btn btn-ghost btn-sm" type="button" data-copy="jc" aria-label="Copier le code"><?= icon('copy') ?></button></div>
</div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki"><?= icon('users') ?></span><div><b><?= $students ?></b><span>Étudiants suivis</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('briefcase-business') ?></span><div><b><?= $rate ?> %</b><span>Placés en stage (<?= $placed ?>)</span></div></div>
    <div class="kpi"><span class="ki amber"><?= icon('gauge') ?></span><div><b><?= $avgEmploy ?></b><span>Employabilité moyenne</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('trophy') ?></span><div><b><?= $graduates ? round($employed / $graduates * 100) . ' %' : '—' ?></b><span>Diplômés en emploi</span></div></div>
</div>
<div class="grid-2 mb-3">
    <section class="card"><h3>Avancement des stages</h3><div class="chart-box"><canvas data-chart='<?= e(json_encode($dough)) ?>' role="img" aria-label="Répartition des étudiants par statut de stage"></canvas></div></section>
    <section class="card"><h3>Secteurs visés par vos étudiants</h3><?php if ($bySector): ?><div class="chart-box"><canvas data-chart='<?= e(json_encode($bar)) ?>' role="img" aria-label="Candidatures par secteur"></canvas></div><?php else: ?><p class="muted small">Pas encore de candidatures.</p><?php endif; ?></section>
</div>
<div class="layout-aside">
    <section class="card">
        <div class="card-title"><h2>Statistiques par filière</h2><a class="btn btn-ghost btn-sm" href="<?= e(url('/ecole/export')) ?>"><?= icon('file-down') ?> Export CSV</a></div>
        <div class="table-wrap"><table class="table">
            <thead><tr><th>Filière</th><th>Étudiants</th><th>Placés</th><th>Taux</th><th>Employabilité moy.</th></tr></thead>
            <tbody><?php foreach ($byProgram as $p): ?>
                <tr><td><b><?= e($p['program']) ?></b></td><td class="tabular"><?= (int)$p['n'] ?></td><td class="tabular"><?= (int)$p['placed'] ?></td>
                    <td style="min-width:120px"><div class="bar"><i data-w="<?= $p['n'] ? round($p['placed'] / $p['n'] * 100) : 0 ?>"></i></div></td><td class="tabular"><?= (int)$p['score'] ?></td></tr>
            <?php endforeach; ?></tbody>
        </table></div>
    </section>
    <aside class="card">
        <h3><?= icon('handshake') ?> Entreprises partenaires</h3>
        <ul class="list"><?php foreach ($partners as $p): ?><li><span class="logo-box" style="--s:36px;background:<?= e($p['color']) ?>"><?= e(mb_strtoupper(mb_substr($p['name'], 0, 2))) ?></span><a class="grow small" href="<?= e(url('/entreprises/' . $p['slug'])) ?>"><?= e($p['name']) ?></a></li><?php endforeach; ?></ul>
        <form method="post" action="<?= e(url('/ecole/partenaires')) ?>" class="flex mt-2"><?= csrf_field() ?><label class="sr-only" for="pc">Entreprise</label><select id="pc" name="company_id" class="input"><?php foreach ($companies as $c): ?><option value="<?= (int)$c['id'] ?>"><?= e($c['name']) ?></option><?php endforeach; ?></select><button class="btn btn-soft btn-sm" type="submit">Proposer</button></form>
    </aside>
</div>
