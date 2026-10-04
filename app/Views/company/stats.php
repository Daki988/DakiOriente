<?php
$monthsFr = ['01' => 'Janv.', '02' => 'Févr.', '03' => 'Mars', '04' => 'Avr.', '05' => 'Mai', '06' => 'Juin', '07' => 'Juil.', '08' => 'Août', '09' => 'Sept.', '10' => 'Oct.', '11' => 'Nov.', '12' => 'Déc.'];
$line = ['type' => 'bar', 'data' => ['labels' => array_map(fn($m) => $monthsFr[substr($m['m'], 5, 2)] . ' ' . substr($m['m'], 2, 2), $monthly), 'datasets' => [['label' => 'Candidatures reçues', 'data' => array_map(fn($m) => (int)$m['n'], $monthly)]]]];
$dough = ['type' => 'doughnut', 'data' => ['labels' => ['< 50 %', '50–69 %', '70–84 %', '≥ 85 %'], 'datasets' => [['label' => 'Candidats', 'data' => $scoreDist, 'backgroundColor' => ['#ffc21a', '#00b4ff', '#0057ff', '#12a150']]]]];
$conv = $totals['views'] ? round($totals['apps'] / $totals['views'] * 100, 1) : 0;
?>
<div class="page-head"><div><h1>Statistiques de recrutement</h1><p>Vues, candidatures, conversion et délais — pour piloter vos offres.</p></div></div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki"><?= icon('eye') ?></span><div><b><?= nf($totals['views']) ?></b><span>Vues des offres</span></div></div>
    <div class="kpi"><span class="ki amber"><?= icon('send') ?></span><div><b><?= nf($totals['apps']) ?></b><span>Candidatures · conversion <?= str_replace('.', ',', (string)$conv) ?> %</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('clock') ?></span><div><b><?= $delays['short'] !== null ? str_replace('.', ',', (string)$delays['short']) . ' j' : '—' ?></b><span>Délai moyen de présélection</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('trophy') ?></span><div><b><?= $delays['hire'] !== null ? str_replace('.', ',', (string)$delays['hire']) . ' j' : '—' ?></b><span>Délai moyen de recrutement</span></div></div>
</div>
<div class="grid-2 mb-3">
    <section class="card"><h3>Candidatures par mois</h3><div class="chart-box"><canvas data-chart='<?= e(json_encode($line)) ?>' role="img" aria-label="Candidatures reçues par mois"></canvas></div></section>
    <section class="card"><h3>Qualité des candidatures (score de compatibilité)</h3><div class="chart-box"><canvas data-chart='<?= e(json_encode($dough)) ?>' role="img" aria-label="Répartition des candidats par score"></canvas></div></section>
</div>
<section class="card">
    <h3>Performance par offre</h3>
    <div class="table-wrap"><table class="table">
        <thead><tr><th>Offre</th><th>Vues</th><th>Candidatures</th><th>Conversion</th><th>Présélectionnés</th><th>Recrutés</th><th>Score moyen</th></tr></thead>
        <tbody><?php foreach ($perJob as $j): ?>
            <tr><td><b><?= e($j['title']) ?></b><br><?= App\Core\View::partial('company/_job_status', ['s' => $j['status']]) ?></td><td class="tabular"><?= nf($j['views']) ?></td><td class="tabular"><?= (int)$j['apps'] ?></td><td class="tabular"><?= $j['views'] ? str_replace('.', ',', (string)round($j['apps'] / $j['views'] * 100, 1)) . ' %' : '—' ?></td><td class="tabular"><?= (int)$j['shortlisted'] ?></td><td class="tabular"><?= (int)$j['hired'] ?></td><td><?= $j['avg_score'] ? '<span class="badge badge-blue">' . (int)$j['avg_score'] . ' %</span>' : '—' ?></td></tr>
        <?php endforeach; ?></tbody>
    </table></div>
</section>
