<section class="section-sm" style="background:linear-gradient(180deg,#f2f7ff,#fff)">
    <div class="container">
        <nav class="breadcrumb"><a href="<?= e(url('/entreprises')) ?>">Entreprises</a> <?= icon('chevron-right') ?> <span><?= e($company['name']) ?></span></nav>
        <div class="card card-lg">
            <div class="flex flex-wrap" style="gap:20px">
                <span class="logo-box" style="--s:88px;background:<?= e($company['color']) ?>"><?= e(mb_strtoupper(mb_substr($company['name'], 0, 2))) ?></span>
                <div class="grow">
                    <h1 style="font-size:2rem;margin-bottom:4px"><?= e($company['name']) ?></h1>
                    <div class="flex flex-wrap muted small" style="gap:6px 18px">
                        <span><?= icon('briefcase-business') ?> <?= e($company['sector_name']) ?></span><span><?= icon('map-pin') ?> <?= e($company['city_name']) ?></span><span><?= icon('users') ?> <?= e($company['size']) ?> salariés</span>
                        <span class="badge badge-blue"><?= icon('badge-check') ?> Vérifiée par NEAM</span>
                    </div>
                </div>
                <div class="flex" style="gap:24px">
                    <div class="text-center"><b style="font-size:1.6rem;color:var(--navy)"><?= count($jobs) ?></b><br><small class="muted">offres actives</small></div>
                    <div class="text-center"><b style="font-size:1.6rem;color:var(--navy)"><?= $hired ?></b><br><small class="muted">recrutements</small></div>
                </div>
            </div>
            <p class="mt-2 mb-0" style="max-width:820px"><?= e($company['description']) ?></p>
            <?php if ($company['website']): ?><p class="mt-1 mb-0 small"><?= icon('globe') ?> <?= e($company['website']) ?></p><?php endif; ?>
        </div>
    </div>
</section>
<section class="section-sm">
    <div class="container">
        <h2>Offres en cours</h2>
        <?php if (!$jobs): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'briefcase-business', 'heading' => 'Pas d\'offre en ce moment', 'text' => 'Ajoute ton profil sur Tremplin : tu seras alerté·e dès que cette entreprise publie une offre qui te correspond.']) ?>
        <?php else: ?>
            <div class="grid-2"><?php foreach ($jobs as $job): ?><?= App\Core\View::partial('partials/job_card', ['job' => $job]) ?><?php endforeach; ?></div>
        <?php endif; ?>
    </div>
</section>
