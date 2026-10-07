<?php
$statuses = application_statuses();
$order = ['sent', 'viewed', 'shortlisted', 'interview', 'accepted'];
$sent = array_sum($counts);
$chart = [
    'type' => 'line',
    'data' => [
        'labels' => array_map(fn($h) => date_fr($h['created_at']), $history),
        'datasets' => [['label' => 'Score d\'employabilité', 'data' => array_map(fn($h) => (int)$h['score'], $history)]],
    ],
    'options' => ['scales' => ['y' => ['min' => 0, 'max' => 100]]],
];
?>
<div class="welcome mb-3 fade-up">
    <span class="deco"></span><span class="deco2"></span>
    <div class="flex flex-wrap between" style="gap:20px;align-items:center">
        <div style="max-width:640px">
            <p class="hand" style="font-size:1.6rem;color:var(--yellow);margin:0">Bonjour <?= e($p['first_name']) ?> !</p>
            <h1 style="font-size:clamp(1.4rem,3vw,2rem);margin:4px 0 8px"><?= $completion['percent'] < 70 ? 'Encore quelques étapes et les recruteurs te verront.' : 'Ton avenir avance, étape par étape.' ?></h1>
            <p style="margin:0">Profil complété à <b style="color:#fff"><?= $completion['percent'] ?> %</b> · <?= count($recos) ?> nouvelles offres compatibles · <?= $sent ?> candidature<?= $sent > 1 ? 's' : '' ?> en cours</p>
            <div class="bar mt-2" style="background:rgba(255,255,255,.25);max-width:420px"><i data-w="<?= $completion['percent'] ?>" style="background:var(--yellow)"></i></div>
        </div>
        <div class="flex" style="gap:16px;background:rgba(255,255,255,.12);border-radius:18px;padding:14px 18px">
            <div class="ring ring-lg high" style="--p:<?= $employ['score'] ?>;--c:#ffc21a;background:radial-gradient(closest-side,#0b4fe0 calc(100% - 11px),transparent calc(100% - 10px)),conic-gradient(#ffc21a calc(<?= $employ['score'] ?>*1%),rgba(255,255,255,.2) 0)"><b style="color:#fff"><?= $employ['score'] ?></b></div>
            <div><b style="color:#fff">Score d'employabilité</b><br><small><?= e($employ['label']) ?></small><br><a href="<?= e(url('/espace/employabilite')) ?>" style="color:#fff;font-weight:700;font-size:.85rem">Comprendre mon score <?= icon('arrow-right') ?></a></div>
        </div>
    </div>
</div>

<div class="card mb-3" style="border-color:#ffe3a3;background:linear-gradient(90deg,#fffaf0,#fff)">
    <div class="flex flex-wrap" style="gap:16px">
        <span class="kpi" style="border:0;padding:0;background:none"><span class="ki amber"><?= icon($next[3]) ?></span></span>
        <div class="grow"><small class="eyebrow" style="margin:0">Ta prochaine action</small><h2 style="font-size:1.15rem;margin:2px 0"><?= e($next[0]) ?></h2><p class="muted small mb-0"><?= e($next[1]) ?></p></div>
        <a class="btn btn-cta" href="<?= e(url($next[2])) ?>">J'y vais <?= icon('arrow-right') ?></a>
    </div>
</div>

<?php if (!empty($gaps['gaps'])): $g1 = $gaps['gaps'][0]; ?>
<a class="card card-hover mb-3 gap-teaser" href="<?= e(url('/espace/progression')) ?>" style="color:inherit">
    <div class="flex flex-wrap" style="gap:16px;align-items:center">
        <span class="kpi" style="border:0;padding:0;background:none"><span class="ki green"><?= icon('trending-up') ?></span></span>
        <div class="grow" style="min-width:220px">
            <small class="eyebrow" style="margin:0">Ton axe de progression n°1</small>
            <h2 style="font-size:1.08rem;margin:2px 0"><?= e($g1['label']) ?></h2>
            <p class="muted small mb-0">Demandé dans <?= (int)$g1['count'] ?> de tes <?= count($gaps['jobs']) ?> meilleures offres, +<?= (int)$g1['avg_gain'] ?> pts en moyenne. En comblant tes 3 premiers écarts, ton score moyen passe de <?= (int)$gaps['avg'] ?> à <b style="color:var(--green)"><?= (int)$gaps['potential'] ?></b>.</p>
        </div>
        <span class="btn btn-soft">Voir comment <?= icon('arrow-right') ?></span>
    </div>
</a>
<?php endif; ?>

<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki"><?= icon('send') ?></span><div><b><?= $sent ?></b><span>Candidatures</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('star') ?></span><div><b><?= ($counts['shortlisted'] ?? 0) + ($counts['interview'] ?? 0) ?></b><span>Présélections & entretiens</span></div></div>
    <div class="kpi"><span class="ki pink"><?= icon('heart') ?></span><div><b><?= $favorites ?></b><span>Offres favorites</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('ticket') ?></span><div><b><?= $quota['limit'] === null ? '∞' : $quota['remaining'] ?></b><span>Candidatures restantes ce mois</span></div></div>
</div>

<div class="layout-aside">
    <div class="stack">
        <section class="card">
            <div class="card-title"><h2><?= icon('sparkles') ?> Offres faites pour toi</h2><a class="small" href="<?= e(url('/espace/recommandations')) ?>">Tout voir</a></div>
            <?php if (!$recos): ?>
                <?= App\Core\View::partial('partials/empty', ['icon' => 'sparkles', 'heading' => 'Tes recommandations arrivent', 'text' => 'Ajoute tes compétences : dès les premières, tu verras les offres faites pour toi, classées et expliquées.', 'cta' => ['Compléter mon profil', '/espace/profil']]) ?>
            <?php else: ?>
                <div class="stack">
                    <?php foreach ($recos as $r): ?>
                        <?= App\Core\View::partial('partials/job_card', ['job' => $r['job'], 'match' => $r['match']]) ?>
                        <?php if ($r['match']['strengths'] || $r['match']['gaps']): ?>
                            <p class="small muted" style="margin:-8px 4px 0"><?= icon('info') ?> <b>Pourquoi ?</b> <?= e(excerpt($r['match']['strengths'][0] ?? '', 90)) ?><?= $r['match']['gaps'] ? ' · À améliorer : ' . e(excerpt($r['match']['gaps'][0], 70)) : '' ?></p>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </section>

        <section class="card">
            <div class="card-title"><h2><?= icon('send') ?> Suivi de mes candidatures</h2><a class="small" href="<?= e(url('/espace/candidatures')) ?>">Toutes</a></div>
            <?php if (!$apps): ?>
                <?= App\Core\View::partial('partials/empty', ['icon' => 'send', 'heading' => 'Prêt·e pour ta première candidature ?', 'text' => 'Commence par une offre où ton score dépasse 70 % : tes chances y sont les meilleures.', 'cta' => ['Trouver une offre', '/offres']]) ?>
            <?php else: ?>
                <ul class="list">
                    <?php foreach ($apps as $a):
                        $idx = array_search($a['status'], $order, true); ?>
                        <li>
                            <a class="list-link" href="<?= e(url('/espace/candidatures/' . $a['id'])) ?>">
                                <span class="logo-box" style="--s:44px;background:<?= e($a['company_color']) ?>"><?= e(mb_strtoupper(mb_substr($a['company_name'], 0, 2))) ?></span>
                                <span class="grow">
                                    <b style="color:var(--navy);font-size:.93rem"><?= e($a['title']) ?></b><br>
                                    <small class="muted"><?= e($a['company_name']) ?> · mise à jour <?= e(time_ago($a['updated_at'])) ?></small>
                                    <span class="progress-steps mt-1" aria-hidden="true">
                                        <?php foreach ($order as $k => $s): ?><i class="<?= $a['status'] === 'rejected' ? ($k < 2 ? 'on' : 'ko') : ($idx !== false && $k <= $idx ? ($a['status'] === 'accepted' ? 'ok' : 'on') : '') ?>"></i><?php endforeach; ?>
                                    </span>
                                </span>
                                <?= status_badge($a['status']) ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>
    </div>

    <aside class="stack">
        <?php if ($interviews): ?>
            <section class="card card-navy">
                <h3><?= icon('calendar') ?> Entretiens à venir</h3>
                <?php foreach ($interviews as $i): ?>
                    <div style="background:rgba(255,255,255,.08);border-radius:12px;padding:12px;margin-top:10px">
                        <b style="color:#fff"><?= e(date_fr($i['scheduled_at'], true)) ?></b><br>
                        <small><?= e($i['title']) ?> — <?= e($i['company_name']) ?></small><br>
                        <small><?= icon($i['mode'] === 'visio' ? 'globe' : 'map-pin') ?> <?= e($i['location']) ?></small>
                    </div>
                <?php endforeach; ?>
                <a class="btn btn-cta btn-sm btn-block mt-2" href="<?= e(url('/espace/entretien')) ?>"><?= icon('mic') ?> M'entraîner maintenant</a>
            </section>
        <?php endif; ?>

        <section class="card">
            <h3><?= icon('trending-up') ?> Ma progression</h3>
            <?php if (count($history) > 1): ?>
                <div class="chart-box sm"><canvas data-chart='<?= e(json_encode($chart)) ?>' aria-label="Évolution du score d'employabilité de <?= (int)$history[0]['score'] ?> à <?= (int)end($history)['score'] ?>" role="img"></canvas></div>
            <?php else: ?><p class="small muted">Ta courbe de progression apparaîtra ici au fil de tes mises à jour.</p><?php endif; ?>
            <?php if ($employ['tips']): ?><div class="alert alert-info mt-2 small"><?= icon('lightbulb') ?><div><?= e($employ['tips'][0]) ?></div></div><?php endif; ?>
        </section>

        <section class="card">
            <div class="card-title"><h3 class="mb-0"><?= icon('bell') ?> Notifications</h3><a class="small" href="<?= e(url('/notifications')) ?>">Tout voir</a></div>
            <ul class="list">
                <?php foreach ($notifications as $n): ?>
                    <li class="notif <?= $n['read_at'] ? '' : 'unread' ?>"><a class="list-link" href="<?= e(url($n['link'] ?: '/notifications')) ?>"><span class="ni"><?= icon(['interview' => 'calendar', 'job_match' => 'target', 'status' => 'eye', 'payment' => 'wallet'][$n['type']] ?? 'bell') ?></span><span class="grow"><b style="font-size:.86rem;color:var(--navy)"><?= e($n['title']) ?></b><br><small class="muted"><?= e(time_ago($n['created_at'])) ?></small></span></a></li>
                <?php endforeach; ?>
            </ul>
        </section>

        <section class="card">
            <h3><?= icon('compass') ?> Mon orientation</h3>
            <?php if ($p['riasec_code']): ?>
                <p class="small mb-1">Ton profil RIASEC : <b style="font-size:1.1rem;color:var(--blue);letter-spacing:.1em"><?= e($p['riasec_code']) ?></b></p>
                <p class="small muted"><?= e(implode(' · ', array_map(fn($l) => App\Services\RiasecService::TYPES[$l][0], str_split($p['riasec_code'])))) ?></p>
                <a class="btn btn-ghost btn-sm" href="<?= e(url('/espace/orientation')) ?>">Voir mes métiers recommandés</a>
            <?php else: ?>
                <p class="small muted">Découvre les métiers qui correspondent à ta personnalité.</p>
                <a class="btn btn-primary btn-sm" href="<?= e(url('/espace/orientation')) ?>">Passer le test (10 min)</a>
            <?php endif; ?>
        </section>
    </aside>
</div>
