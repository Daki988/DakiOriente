<?php $lvl = ['debutant' => 'Débutant', 'intermediaire' => 'Intermédiaire', 'avance' => 'Avancé']; ?>
<section class="hero" style="padding:32px 0">
    <div class="container">
        <span class="eyebrow">Se former</span>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">Développe les compétences qui recrutent</h1>
        <p class="muted" style="max-width:640px">Il te manque une compétence pour une offre qui te plaît ? Ce n'est pas un mur, c'est une étape. Ces formations courtes, en ligne ou près de chez toi, sont choisies pour combler précisément les écarts que révèle ton score. Tu veux prouver ton niveau ? <a href="<?= e(url('/certifications')) ?>">Découvre les certifications reconnues</a>.</p>
        <form method="get" class="flex flex-wrap mt-2" action="<?= e(url('/formations')) ?>">
            <div class="field grow" style="min-width:220px"><label class="sr-only" for="tq">Compétence</label><input id="tq" name="q" value="<?= e($q) ?>" placeholder="Compétence, organisme… (ex. Excel, SQL, HSE)"></div>
            <label class="check" style="align-self:center"><input type="checkbox" name="free" value="1" <?= input('free') ? 'checked' : '' ?>> Gratuites uniquement</label>
            <button class="btn btn-primary" type="submit"><?= icon('search') ?> Chercher</button>
        </form>
    </div>
</section>
<section class="section-sm">
    <div class="container">
        <?php if ($recommended): ?>
            <div class="card card-lg mb-3" style="border-color:#ffe3a3;background:linear-gradient(180deg,#fffaf0,#fff)">
                <h2 style="font-size:1.2rem"><?= icon('sparkles') ?> Recommandées pour toi</h2>
                <p class="small muted">Ces compétences reviennent le plus souvent dans les offres qui te correspondent.</p>
                <div class="grid-3">
                    <?php foreach ($recommended as $t): ?>
                        <a class="card card-hover" href="<?= e(url('/formations/' . $t['id'])) ?>" style="color:inherit"><span class="badge badge-amber"><?= e($t['skill_name']) ?></span><h3 class="mt-1" style="font-size:1rem"><?= e($t['title']) ?></h3><small class="muted"><?= e($t['provider']) ?> · <?= e($t['duration']) ?> · <?= $t['price'] ? e(money((int)$t['price'])) : 'Gratuit' ?></small></a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>
        <?php if (!$trainings): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'graduation-cap', 'heading' => 'Aucune formation trouvée', 'text' => 'Essaie un mot-clé plus général, par exemple « Excel » plutôt que « Excel avancé ».']) ?>
        <?php else: ?>
            <div class="grid-3">
                <?php foreach ($trainings as $t): ?>
                    <a class="card card-hover stack-sm" href="<?= e(url('/formations/' . $t['id'])) ?>" style="color:inherit">
                        <div class="flex between"><span class="badge badge-violet"><?= e($t['skill_name'] ?? 'Langues') ?></span><?= $t['price'] ? '<b class="tabular" style="color:var(--navy)">' . e(money((int)$t['price'])) . '</b>' : '<span class="badge badge-green">Gratuit</span>' ?></div>
                        <h3 style="font-size:1.02rem;margin:4px 0 0"><?= e($t['title']) ?></h3>
                        <small class="muted"><?= e($t['provider']) ?></small>
                        <div class="flex flex-wrap small muted" style="gap:12px"><span><?= icon('clock') ?> <?= e($t['duration']) ?></span><span><?= icon('globe') ?> <?= e($t['format']) ?></span><span><?= icon('activity') ?> <?= e($lvl[$t['level']] ?? $t['level']) ?></span></div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</section>
