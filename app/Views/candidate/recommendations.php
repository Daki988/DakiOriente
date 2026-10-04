<div class="page-head">
    <div><h1>Offres pour moi</h1><p>Classées par compatibilité avec ton profil — chaque score est expliqué.</p></div>
    <a class="btn btn-ghost" href="<?= e(url('/offres?sort=match')) ?>"><?= icon('search') ?> Recherche avancée</a>
</div>
<div class="layout-aside">
    <div class="stack">
        <?php if (!$recos): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'sparkles', 'heading' => 'Pas encore de recommandation', 'text' => 'Ajoute des compétences et précise le métier visé pour recevoir tes premières offres compatibles.', 'cta' => ['Compléter mon profil', '/espace/profil']]) ?>
        <?php endif; ?>
        <?php foreach ($recos as $i => $r): $m = $r['match']; ?>
            <div class="card" style="padding:0;overflow:hidden">
                <?= App\Core\View::partial('partials/job_card', ['job' => $r['job'], 'match' => $m, 'isFav' => in_array($r['job']['id'], $favs)]) ?>
                <details style="padding:0 18px 14px" <?= $i === 0 ? 'open' : '' ?>>
                    <summary class="small" style="cursor:pointer;font-weight:700;color:var(--blue);padding:4px 0"><?= icon('info') ?> Pourquoi cette offre ? <?= e($m['level']) ?></summary>
                    <div class="grid-2 mt-1 small">
                        <ul class="explain-list ok"><?php foreach (array_slice($m['strengths'], 0, 3) as $s): ?><li><?= icon('check') ?><span><?= e($s) ?></span></li><?php endforeach; ?></ul>
                        <ul class="explain-list gap"><?php foreach (array_slice($m['gaps'], 0, 2) as $g): ?><li><?= icon('alert-triangle') ?><span><?= e($g) ?></span></li><?php endforeach; ?>
                            <?php if ($m['actions']): ?><li><?= icon('rocket') ?><a href="<?= e(url($m['actions'][0]['link'])) ?>"><?= e($m['actions'][0]['text']) ?></a></li><?php endif; ?></ul>
                    </div>
                </details>
            </div>
        <?php endforeach; ?>
        <?php if (!$advanced && $recos): ?>
            <?= App\Core\View::partial('partials/locked', ['required' => 'PRO', 'heading' => 'Débloque toutes tes recommandations', 'text' => 'Accède à 12 offres classées, aux métiers recommandés et à ton plan d\'action personnalisé.']) ?>
        <?php endif; ?>
    </div>
    <aside class="stack">
        <div class="card card-lg">
            <h3><?= icon('compass') ?> Métiers qui te correspondent</h3>
            <?php if (!$p['riasec_code']): ?>
                <p class="small muted">Passe le test d'orientation pour découvrir des métiers adaptés à ta personnalité.</p>
                <a class="btn btn-primary btn-sm" href="<?= e(url('/espace/orientation')) ?>">Passer le test</a>
            <?php else: ?>
                <ul class="list">
                    <?php foreach ($careers as $c): ?>
                        <li><div class="grow"><b style="font-size:.92rem;color:var(--navy)"><?= e($c['name']) ?></b><br><small class="muted"><?= e($c['sector_name']) ?> · débouchés <?= e($c['outlook']) ?></small></div><span class="badge badge-blue"><?= (int)$c['fit'] ?> %</span></li>
                    <?php endforeach; ?>
                </ul>
                <a class="small" href="<?= e(url('/espace/orientation')) ?>">Voir mon profil RIASEC <?= icon('arrow-right') ?></a>
            <?php endif; ?>
        </div>
        <div class="card">
            <h3><?= icon('bell') ?> Alertes</h3>
            <p class="small muted">Tu reçois une alerte dès qu'une offre compatible à plus de <?= (int)setting('match_alert_threshold', 70) ?> % est publiée.</p>
            <a class="btn btn-ghost btn-sm" href="<?= e(url('/compte')) ?>">Gérer mes alertes</a>
        </div>
    </aside>
</div>
