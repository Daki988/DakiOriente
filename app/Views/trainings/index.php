<?php
/** @var array $trainings  @var array $platforms  @var array $skills  @var array $f  @var array $forMe  @var array $mine */
$qs = array_filter(['q' => $f['q'], 'plateforme' => $f['platform'], 'langue' => $f['lang'], 'competence' => $f['skill'], 'gratuit' => $f['free'] ? 1 : null]);
?>
<section class="hero" style="padding:32px 0">
    <div class="container">
        <span class="eyebrow">Se former</span>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">Les formations que les employeurs attendent</h1>
        <p class="muted" style="max-width:700px">Des cours en ligne en français et en anglais, sélectionnés sur Coursera, OpenClassrooms, Udemy, edX et d'autres plateformes reconnues. Pour chacun, tu vois combien d'offres demandent les compétences qu'il t'apporte. Tu suis le cours sur la plateforme d'origine, puis tu relies ton certificat à ton profil.</p>
        <form method="get" action="<?= e(url('/formations')) ?>" class="card mt-2 training-filters">
            <div class="field grow" style="min-width:220px"><label class="sr-only" for="tq">Rechercher</label><input id="tq" name="q" value="<?= e($f['q']) ?>" placeholder="Compétence, titre, organisme… (ex. Excel, SQL, anglais)"></div>
            <div class="field"><label class="sr-only" for="tp">Plateforme</label><select id="tp" name="plateforme"><option value="">Toutes les plateformes</option><?php foreach ($platforms as $p): ?><option value="<?= e($p['slug']) ?>" <?= $f['platform'] === $p['slug'] ? 'selected' : '' ?>><?= e($p['name']) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label class="sr-only" for="tl">Langue</label><select id="tl" name="langue"><option value="">Français et anglais</option><option value="fr" <?= $f['lang'] === 'fr' ? 'selected' : '' ?>>Français</option><option value="en" <?= $f['lang'] === 'en' ? 'selected' : '' ?>>Anglais</option></select></div>
            <div class="field"><label class="sr-only" for="ts">Compétence</label><select id="ts" name="competence"><option value="">Toutes les compétences</option><?php foreach ($skills as $s): ?><option <?= $f['skill'] === $s ? 'selected' : '' ?>><?= e($s) ?></option><?php endforeach; ?></select></div>
            <label class="check" style="align-self:center"><input type="checkbox" name="gratuit" value="1" <?= $f['free'] ? 'checked' : '' ?>> Gratuit</label>
            <button class="btn btn-primary" type="submit"><?= icon('search') ?> Chercher</button>
        </form>
    </div>
</section>
<section class="section-sm">
    <div class="container">
        <div class="platform-strip mb-3">
            <?php foreach ($platforms as $p): ?>
                <a class="platform-tile" href="<?= e(url('/formations/plateformes/' . $p['slug'])) ?>" style="--pc:<?= e($p['color']) ?>">
                    <span class="pt-logo" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($p['name'], 0, 1))) ?></span>
                    <span><b><?= e($p['name']) ?></b><small><?= (int)$p['courses'] ?> formation<?= $p['courses'] > 1 ? 's' : '' ?></small></span>
                </a>
            <?php endforeach; ?>
            <a class="platform-tile more" href="<?= e(url('/formations/plateformes')) ?>"><span><b>Comparer les plateformes</b><small>Prix, certificats, conseils</small></span><?= icon('arrow-right') ?></a>
        </div>

        <?php if ($forMe): ?>
            <div class="card card-lg mb-3" style="border-color:#ffe3a3;background:linear-gradient(180deg,#fffaf0,#fff)">
                <h2 style="font-size:1.2rem"><?= icon('sparkles') ?> Recommandées pour toi</h2>
                <p class="small muted">Elles comblent les écarts qui reviennent le plus dans les offres qui te correspondent. <a href="<?= e(url('/espace/progression')) ?>">Voir mon analyse complète</a></p>
                <ul class="reco-list grid-3" style="gap:12px">
                    <?php foreach ($forMe as $r): ?><?= App\Core\View::partial('partials/reco_item', ['r' => $r + ['note' => 'Pour : ' . $r['why'] . ' · demandé dans ' . $r['count'] . ' offre(s), +' . $r['gain'] . ' pts en moyenne'], 'gapKey' => '', 'planned' => [], 'canPlan' => false]) ?><?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <div class="flex between flex-wrap mb-2"><p class="small muted mb-0"><b class="tabular" style="color:var(--navy)"><?= (int)$total ?></b> formation<?= $total > 1 ? 's' : '' ?> · classées par demande des employeurs</p><a class="small" href="<?= e(url('/certifications')) ?>"><?= icon('award') ?> Voir aussi les certifications reconnues</a></div>
        <?php if (!$trainings): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'graduation-cap', 'heading' => 'Aucune formation trouvée', 'text' => 'Essaie un mot-clé plus général, par exemple « Excel » plutôt que « Excel avancé », ou retire un filtre.']) ?>
        <?php else: ?>
            <div class="grid-3">
                <?php foreach ($trainings as $t): ?><?= App\Core\View::partial('partials/training_card', ['t' => $t, 'status' => $mine[(int)$t['id']] ?? null]) ?><?php endforeach; ?>
            </div>
            <?= App\Core\View::partial('partials/pagination', ['page' => $page, 'pages' => $pages, 'query' => $qs, 'path' => '/formations']) ?>
        <?php endif; ?>
        <p class="small muted mt-3"><?= icon('info') ?> Tremplin n'est pas affilié à ces plateformes : les formations sont suivies sur leur site, aux conditions de chaque plateforme. Prix et modalités à vérifier sur la page du cours.</p>
    </div>
</section>
