<?php
$monthsFr = ['01' => 'Janv.', '02' => 'Févr.', '03' => 'Mars', '04' => 'Avr.', '05' => 'Mai', '06' => 'Juin', '07' => 'Juil.', '08' => 'Août', '09' => 'Sept.', '10' => 'Oct.', '11' => 'Nov.', '12' => 'Déc.'];
$months = [];
for ($i = 5; $i >= 0; $i--) {
    $months[] = date('Y-m', strtotime("first day of -$i months"));
}
$label = fn($m) => $monthsFr[substr($m, 5, 2)];
$sig = [];
foreach ($signups as $r) {
    $sig[$r['role']][$r['m']] = (int)$r['n'];
}
$rev = array_column($revenue, 'total', 'm');
$ap = array_column($apps, 'n', 'm');
$growth = ['type' => 'bar', 'data' => ['labels' => array_map($label, $months), 'datasets' => [
    ['label' => 'Candidats', 'data' => array_map(fn($m) => $sig['candidate'][$m] ?? 0, $months), 'color' => '#0057ff'],
    ['label' => 'Recruteurs', 'data' => array_map(fn($m) => $sig['company'][$m] ?? 0, $months), 'color' => '#ffc21a'],
]], 'options' => ['scales' => ['x' => ['stacked' => true], 'y' => ['stacked' => true]]]];
$revChart = ['type' => 'line', 'data' => ['labels' => array_map($label, $months), 'datasets' => [['label' => 'Revenus (FCFA)', 'data' => array_map(fn($m) => (int)($rev[$m] ?? 0), $months), 'color' => '#12a150']]]];
$appChart = ['type' => 'line', 'data' => ['labels' => array_map($label, $months), 'datasets' => [['label' => 'Candidatures', 'data' => array_map(fn($m) => (int)($ap[$m] ?? 0), $months), 'color' => '#7c4dff']]]];
$planChart = ['type' => 'doughnut', 'data' => ['labels' => array_column($plans, 'plan_code'), 'datasets' => [['label' => 'Candidats', 'data' => array_map('intval', array_column($plans, 'n')), 'backgroundColor' => ['#cbd5e1', '#00b4ff', '#0057ff', '#7c4dff', '#ffc21a']]]]];
?>
<div class="page-head">
    <div><h1>Vue d'ensemble</h1><p>Pilotage de la plateforme TREMPLIN · <?= e(date_fr(now())) ?></p></div>
    <div class="flex flex-wrap"><a class="btn btn-ghost" href="<?= e(url('/admin/export/kpi')) ?>"><?= icon('file-down') ?> Export KPI</a><a class="btn btn-ghost" href="<?= e(url('/api/v1/admin/analytics')) ?>" title="Nécessite un jeton API admin"><?= icon('database') ?> API analytics</a></div>
</div>
<div class="grid-4 mb-2">
    <div class="kpi"><span class="ki"><?= icon('users') ?></span><div><b><?= nf($k['candidates']) ?></b><span>Candidats · +<?= $k['new_users_30d'] ?> en 30 j</span></div></div>
    <div class="kpi"><span class="ki amber"><?= icon('building-2') ?></span><div><b><?= nf($k['companies']) ?></b><span>Entreprises vérifiées</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('briefcase-business') ?></span><div><b><?= nf($k['jobs_active']) ?></b><span>Offres actives</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('wallet') ?></span><div><b><?= e(money($k['revenue_30d'], false)) ?></b><span>Revenus 30 j (FCFA)</span></div></div>
</div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki"><?= icon('send') ?></span><div><b><?= nf($k['applications']) ?></b><span>Candidatures · réponse <?= str_replace('.', ',', (string)$k['response_rate']) ?> %</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('trophy') ?></span><div><b><?= nf($k['placements']) ?></b><span>Placements · <?= str_replace('.', ',', (string)$k['placement_rate']) ?> %</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('target') ?></span><div><b><?= $k['match_avg'] ?> %</b><span>Score de match moyen</span></div></div>
    <div class="kpi"><span class="ki pink"><?= icon('trending-up') ?></span><div><b><?= str_replace('.', ',', (string)$k['conversion_free_paid']) ?> %</b><span>Conversion free → payant · ARPU <?= nf($k['arpu']) ?></span></div></div>
</div>
<div class="grid-2 mb-3">
    <section class="card"><h3>Inscriptions par mois</h3><div class="chart-box"><canvas data-chart='<?= e(json_encode($growth)) ?>' role="img" aria-label="Inscriptions mensuelles candidats et recruteurs"></canvas></div></section>
    <section class="card"><h3>Revenus (Mobile Money + carte)</h3><div class="chart-box"><canvas data-chart='<?= e(json_encode($revChart)) ?>' role="img" aria-label="Revenus mensuels"></canvas></div></section>
    <section class="card"><h3>Candidatures par mois</h3><div class="chart-box sm"><canvas data-chart='<?= e(json_encode($appChart)) ?>' role="img" aria-label="Candidatures mensuelles"></canvas></div></section>
    <section class="card"><h3>Répartition des abonnements</h3><div class="chart-box sm"><canvas data-chart='<?= e(json_encode($planChart)) ?>' role="img" aria-label="Répartition des candidats par offre"></canvas></div></section>
</div>
<div class="grid-3">
    <section class="card">
        <div class="card-title"><h3 class="mb-0"><?= icon('shield-check') ?> À modérer</h3></div>
        <?php foreach ($pending['companies'] as $c): ?><div class="flex between small" style="padding:6px 0"><span><?= icon('building-2') ?> <?= e($c['name']) ?></span><a href="<?= e(url('/admin/entreprises?statut=pending')) ?>">Vérifier</a></div><?php endforeach; ?>
        <?php foreach ($pending['jobs'] as $j): ?><div class="flex between small" style="padding:6px 0"><span><?= icon('briefcase-business') ?> <?= e(excerpt($j['title'], 34)) ?></span><a href="<?= e(url('/admin/offres?statut=pending')) ?>">Modérer</a></div><?php endforeach; ?>
        <?php foreach ($pending['reports'] as $r): ?><div class="flex between small" style="padding:6px 0;color:var(--red)"><span><?= icon('flag') ?> <?= e(excerpt($r['subject'], 34)) ?></span><a href="<?= e(url('/admin/signalements')) ?>">Traiter</a></div><?php endforeach; ?>
        <?php if (!array_filter($pending)): ?><p class="small muted">Rien en attente.</p><?php endif; ?>
    </section>
    <section class="card">
        <h3><?= icon('activity') ?> Qualité & profils</h3>
        <div class="criteria small">
            <div class="criterion"><div class="top">Complétion moyenne des profils <span><?= $k['profile_completion_avg'] ?> %</span></div><div class="bar"><i data-w="<?= $k['profile_completion_avg'] ?>"></i></div></div>
            <div class="criterion"><div class="top">Employabilité moyenne <span><?= $k['employability_avg'] ?></span></div><div class="bar green"><i data-w="<?= $k['employability_avg'] ?>"></i></div></div>
            <div class="criterion"><div class="top">Taux de réponse recruteurs <span><?= $k['response_rate'] ?> %</span></div><div class="bar sun"><i data-w="<?= $k['response_rate'] ?>"></i></div></div>
        </div>
        <h4 class="mt-2">Secteurs les plus actifs</h4>
        <ul class="list small"><?php foreach ($topSectors as $s): ?><li><span class="grow"><?= e($s['name']) ?></span><b><?= (int)$s['n'] ?></b></li><?php endforeach; ?></ul>
    </section>
    <section class="card">
        <div class="card-title"><h3 class="mb-0"><?= icon('scroll-text') ?> Activité récente</h3><a class="small" href="<?= e(url('/admin/audit')) ?>">Journal</a></div>
        <ul class="list small"><?php foreach ($activity as $a): ?><li><span class="grow"><b><?= e($a['action']) ?></b><br><span class="muted"><?= e(trim(($a['first_name'] ?? 'Système') . ' ' . ($a['last_name'] ?? ''))) ?> · <?= e(time_ago($a['created_at'])) ?></span></span></li><?php endforeach; ?></ul>
    </section>
</div>
