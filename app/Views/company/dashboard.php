<?php
$st = application_statuses();
$funnelOrder = ['sent', 'viewed', 'shortlisted', 'interview', 'accepted'];
$chart = ['type' => 'bar', 'data' => ['labels' => array_map(fn($s) => $st[$s][0], $funnelOrder), 'datasets' => [['label' => 'Candidatures', 'data' => array_map(fn($s) => $funnel[$s] ?? 0, $funnelOrder)]]]];
?>
<?php if ($c['status'] !== 'verified'): ?>
    <div class="alert alert-warning mb-3"><?= icon('shield-check') ?><div><b>Vérification en cours.</b> L'équipe NEAM vérifie <?= e($c['name']) ?> (RCCM, coordonnées). Vos offres seront publiées dès validation — en général sous 24 à 48 h.</div></div>
<?php endif; ?>
<div class="page-head">
    <div><h1>Bonjour <?= e(user()['first_name']) ?> 👋</h1><p><?= e($c['name']) ?> · offre <?= e(str_replace('BIZ_', '', $c['plan_code'])) ?> · <?= (int)$c['job_credits'] ?> offres actives max.</p></div>
    <a class="btn btn-cta" href="<?= e(url('/entreprise/offres/nouvelle')) ?>"><?= icon('plus') ?> Publier une offre</a>
</div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki"><?= icon('briefcase-business') ?></span><div><b><?= $kpi['active'] ?></b><span>Offres actives</span></div></div>
    <div class="kpi"><span class="ki amber"><?= icon('send') ?></span><div><b><?= $kpi['apps'] ?></b><span>Candidatures (<?= $kpi['new'] ?> nouvelles)</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('target') ?></span><div><b><?= $kpi['avgScore'] ?> %</b><span>Compatibilité moyenne</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('trophy') ?></span><div><b><?= $kpi['hired'] ?></b><span>Recrutements</span></div></div>
</div>
<div class="layout-aside">
    <div class="stack">
        <section class="card">
            <div class="card-title"><h2>Mes offres</h2><a class="small" href="<?= e(url('/entreprise/offres')) ?>">Toutes</a></div>
            <?php if (!$jobs): ?>
                <?= App\Core\View::partial('partials/empty', ['icon' => 'briefcase-business', 'heading' => 'Publiez votre première offre', 'text' => 'En 5 minutes, recevez des candidats classés par compatibilité.', 'cta' => ['Publier une offre', '/entreprise/offres/nouvelle']]) ?>
            <?php else: ?>
                <div class="table-wrap"><table class="table">
                    <thead><tr><th>Offre</th><th>Statut</th><th>Candidats</th><th>Meilleur match</th><th></th></tr></thead>
                    <tbody><?php foreach ($jobs as $j): ?>
                        <tr>
                            <td><b style="color:var(--navy)"><?= e($j['title']) ?></b><br><small class="muted"><?= e(job_types()[$j['type']] ?? '') ?> · <?= e($j['city_name']) ?> · <?= nf($j['views']) ?> vues</small></td>
                            <td><?= App\Core\View::partial('company/_job_status', ['s' => $j['status']]) ?></td>
                            <td><b><?= (int)$j['apps'] ?></b><?php if ($j['new_apps']): ?> <span class="badge badge-amber"><?= (int)$j['new_apps'] ?> new</span><?php endif; ?></td>
                            <td><?= $j['best'] ? '<span class="badge badge-' . ($j['best'] >= 70 ? 'green' : 'blue') . '">' . (int)$j['best'] . ' %</span>' : '—' ?></td>
                            <td class="actions"><a class="btn btn-soft btn-sm" href="<?= e(url('/entreprise/offres/' . $j['id'] . '/candidatures')) ?>">Pipeline</a><a class="btn btn-ghost btn-sm" href="<?= e(url('/entreprise/offres/' . $j['id'] . '/matching')) ?>"><?= icon('sparkles') ?> Matching</a></td>
                        </tr>
                    <?php endforeach; ?></tbody>
                </table></div>
            <?php endif; ?>
        </section>
        <section class="card">
            <div class="card-title"><h2><?= icon('star') ?> Meilleurs candidats à traiter</h2></div>
            <?php if (!$topCandidates): ?><p class="muted small">Aucune candidature en attente.</p><?php endif; ?>
            <ul class="list">
                <?php foreach ($topCandidates as $t): ?>
                    <li><a class="list-link" href="<?= e(url('/entreprise/candidatures/' . $t['id'])) ?>">
                        <span class="avatar" style="background:<?= e(avatar_color($t['email'])) ?>"><?= e(initials($t['first_name'], $t['last_name'])) ?></span>
                        <span class="grow"><b style="color:var(--navy)"><?= e($t['first_name'] . ' ' . $t['last_name']) ?></b><br><small class="muted"><?= e($t['headline']) ?> → <?= e($t['title']) ?></small></span>
                        <?= status_badge($t['status']) ?>
                        <div class="ring ring-sm <?= score_class((int)$t['match_score']) ?>" style="--p:<?= (int)$t['match_score'] ?>"><b><?= (int)$t['match_score'] ?></b></div>
                    </a></li>
                <?php endforeach; ?>
            </ul>
        </section>
    </div>
    <aside class="stack">
        <section class="card"><h3>Entonnoir de recrutement</h3><div class="chart-box sm"><canvas data-chart='<?= e(json_encode($chart)) ?>' role="img" aria-label="Entonnoir des candidatures par étape"></canvas></div></section>
        <section class="card card-navy">
            <h3><?= icon('calendar') ?> Entretiens à venir</h3>
            <?php if (!$interviews): ?><p class="small mb-0">Aucun entretien programmé.</p><?php endif; ?>
            <?php foreach ($interviews as $i): ?>
                <a href="<?= e(url('/entreprise/candidatures/' . $i['application_id'])) ?>" style="display:block;color:#dbe5ff;background:rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;margin-top:8px">
                    <b style="color:#fff"><?= e(date_fr($i['scheduled_at'], true)) ?></b><br><small><?= e($i['first_name'] . ' ' . $i['last_name']) ?> · <?= e($i['title']) ?></small>
                </a>
            <?php endforeach; ?>
        </section>
        <section class="card">
            <h3><?= icon('users') ?> CVthèque</h3>
            <p class="small muted">Recherchez proactivement parmi les profils visibles et invitez-les à postuler.</p>
            <a class="btn btn-ghost btn-sm" href="<?= e(url('/entreprise/cvtheque')) ?>">Explorer les profils</a>
        </section>
    </aside>
</div>
