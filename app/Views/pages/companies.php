<section class="hero" style="padding:32px 0">
    <div class="container">
        <span class="eyebrow">Entreprises</span>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">Elles recrutent sur Tremplin</h1>
        <p class="muted">Des entreprises vérifiées par l'équipe NEAM, au Gabon et en Afrique centrale.</p>
        <form method="get" class="flex flex-wrap mt-2" action="<?= e(url('/entreprises')) ?>">
            <div class="field grow" style="min-width:220px"><label class="sr-only" for="cq">Rechercher</label><input id="cq" name="q" value="<?= e($q) ?>" placeholder="Nom, activité…"></div>
            <div class="field" style="min-width:220px"><label class="sr-only" for="cs">Secteur</label>
                <select id="cs" name="sector"><option value="">Tous les secteurs</option><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= $sector === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
            <button class="btn btn-primary" type="submit"><?= icon('search') ?> Filtrer</button>
        </form>
    </div>
</section>
<section class="section-sm">
    <div class="container">
        <?php if (!$companies): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'building-2', 'heading' => 'Aucune entreprise trouvée', 'text' => 'Modifie ta recherche.']) ?>
        <?php else: ?>
            <div class="grid-3">
                <?php foreach ($companies as $c): ?>
                    <a class="card card-hover" href="<?= e(url('/entreprises/' . $c['slug'])) ?>" style="color:inherit">
                        <div class="flex">
                            <span class="logo-box" style="--s:56px;background:<?= e($c['color']) ?>"><?= e(mb_strtoupper(mb_substr($c['name'], 0, 2))) ?></span>
                            <div class="grow"><h3 class="mb-0"><?= e($c['name']) ?> <span style="color:var(--blue)"><?= icon('badge-check') ?></span></h3><small class="muted"><?= e($c['sector_name']) ?> · <?= e($c['city_name']) ?></small></div>
                        </div>
                        <p class="small muted mt-2"><?= e(excerpt($c['description'], 130)) ?></p>
                        <div class="flex between"><span class="badge badge-blue"><?= (int)$c['jobs_count'] ?> offre<?= $c['jobs_count'] > 1 ? 's' : '' ?></span><span class="small muted"><?= e($c['size']) ?> salariés</span></div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</section>
