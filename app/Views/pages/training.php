<section class="section-sm">
    <div class="container layout-aside">
        <div>
            <nav class="breadcrumb"><a href="<?= e(url('/formations')) ?>">Formations</a> <?= icon('chevron-right') ?> <span><?= e(excerpt($t['title'], 40)) ?></span></nav>
            <div class="article-cover mb-3" style="background:linear-gradient(135deg,#7c4dff,#0057ff)">
                <span class="badge" style="background:rgba(255,255,255,.2);color:#fff"><?= e($t['skill_name'] ?? 'Langues') ?></span>
                <h1 class="mt-2" style="font-size:clamp(1.6rem,3.5vw,2.3rem)"><?= e($t['title']) ?></h1>
                <p style="color:#e4ecff;margin:0"><?= e($t['provider']) ?></p>
            </div>
            <div class="card card-lg">
                <h2 style="font-size:1.2rem">À propos de cette formation</h2>
                <p><?= e($t['description']) ?></p>
                <div class="grid-4 mt-2">
                    <div class="kpi"><span class="ki"><?= icon('clock') ?></span><div><b style="font-size:1rem"><?= e($t['duration']) ?></b><span>Durée</span></div></div>
                    <div class="kpi"><span class="ki violet"><?= icon('globe') ?></span><div><b style="font-size:1rem"><?= e(ucfirst($t['format'])) ?></b><span>Format</span></div></div>
                    <div class="kpi"><span class="ki amber"><?= icon('activity') ?></span><div><b style="font-size:1rem"><?= e(ucfirst($t['level'])) ?></b><span>Niveau</span></div></div>
                    <div class="kpi"><span class="ki green"><?= icon('wallet') ?></span><div><b style="font-size:1rem"><?= $t['price'] ? e(money((int)$t['price'])) : 'Gratuit' ?></b><span>Tarif</span></div></div>
                </div>
            </div>
        </div>
        <aside class="stack">
            <div class="card card-lg">
                <h3>Ce que ça change pour toi</h3>
                <p class="small muted">Une fois la formation suivie, ajoute « <?= e($t['skill_name'] ?? 'la compétence') ?> » à ton profil : ton score de compatibilité est recalculé immédiatement sur toutes les offres.</p>
                <a class="btn btn-primary btn-block" href="<?= e(url(user() ? '/espace/profil#competences' : '/inscription')) ?>"><?= icon('plus') ?> Ajouter à mon profil</a>
            </div>
            <?php if ($jobs): ?>
                <div class="card"><h3>Offres qui demandent cette compétence</h3>
                    <ul class="list"><?php foreach ($jobs as $j): ?><li><a class="list-link" href="<?= e(url('/offres/' . $j['id'])) ?>"><span class="grow"><b style="font-size:.9rem;color:var(--navy)"><?= e($j['title']) ?></b><br><small class="muted"><?= e($j['company_name']) ?></small></span><?= icon('chevron-right') ?></a></li><?php endforeach; ?></ul>
                </div>
            <?php endif; ?>
        </aside>
    </div>
</section>
