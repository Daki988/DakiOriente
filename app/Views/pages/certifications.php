<?php
/** @var array $certs  @var array $domains  @var string $domain  @var string $q  @var array $forMe */
$cost = App\Services\GapAnalysisService::COST;
$lvl = ['debutant' => 'Débutant', 'intermediaire' => 'Intermédiaire', 'avance' => 'Avancé'];
$planned = user() && user()['role'] === 'candidate' ? App\Core\DB::column('SELECT label FROM candidate_goals WHERE user_id = :u', ['u' => user()['id']]) : [];
?>
<section class="hero" style="padding:32px 0">
    <div class="container">
        <span class="eyebrow">Se certifier</span>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">Les certifications qui font la différence</h1>
        <p class="muted" style="max-width:680px">Un diplôme dit ce que tu as étudié. Une certification prouve ce que tu sais faire. Nous avons sélectionné celles que les employeurs reconnaissent, reliées aux compétences demandées dans les offres, avec les options gratuites mises en avant.</p>
        <form method="get" class="flex flex-wrap mt-2" action="<?= e(url('/certifications')) ?>">
            <div class="field grow" style="min-width:220px"><label class="sr-only" for="cq">Rechercher</label><input id="cq" name="q" value="<?= e($q) ?>" placeholder="Compétence, langue, organisme… (ex. Excel, anglais, HSE)"></div>
            <div class="field" style="min-width:200px"><label class="sr-only" for="cd">Domaine</label>
                <select id="cd" name="domaine"><option value="">Tous les domaines</option><?php foreach ($domains as $d): ?><option <?= $domain === $d ? 'selected' : '' ?>><?= e($d) ?></option><?php endforeach; ?></select></div>
            <label class="check" style="align-self:center"><input type="checkbox" name="gratuit" value="1" <?= input('gratuit') ? 'checked' : '' ?>> Cours gratuits</label>
            <button class="btn btn-primary" type="submit"><?= icon('search') ?> Chercher</button>
        </form>
    </div>
</section>
<section class="section-sm">
    <div class="container">
        <?php if ($forMe): ?>
            <div class="card card-lg mb-3" style="border-color:#ffe3a3;background:linear-gradient(180deg,#fffaf0,#fff)">
                <h2 style="font-size:1.2rem"><?= icon('sparkles') ?> Recommandées pour toi</h2>
                <p class="small muted">Elles comblent les écarts qui reviennent le plus dans les offres qui te correspondent. <a href="<?= e(url('/espace/progression')) ?>">Voir mon analyse complète</a></p>
                <ul class="reco-list grid-3" style="gap:12px">
                    <?php foreach ($forMe as $r): ?>
                        <?= App\Core\View::partial('partials/reco_item', ['r' => $r + ['note' => 'Pour : ' . $r['why'] . ' · demandé dans ' . $r['count'] . ' offre(s), +' . $r['gain'] . ' pts en moyenne'], 'gapKey' => '', 'planned' => $planned, 'canPlan' => true]) ?>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php elseif (!user()): ?>
            <div class="alert alert-info mb-3"><?= icon('target') ?><div><b>Laquelle choisir ?</b> Crée ton profil gratuit : Tremplin compare ton profil aux offres et t'indique les certifications qui te feront gagner le plus de points. <a href="<?= e(url('/inscription')) ?>">Je crée mon profil</a></div></div>
        <?php endif; ?>

        <?php if (!$certs): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'award', 'heading' => 'Aucune certification trouvée', 'text' => 'Essaie un mot-clé plus général ou retire le filtre de domaine.']) ?>
        <?php else: ?>
            <p class="small muted"><?= count($certs) ?> certification<?= count($certs) > 1 ? 's' : '' ?> · tarifs et modalités à vérifier auprès de chaque organisme.</p>
            <div class="grid-3">
                <?php foreach ($certs as $c): [$cl, $cc] = $cost[$c['cost']] ?? ['Payant', 'gray']; ?>
                    <article class="card stack-sm cert-card" id="c<?= (int)$c['id'] ?>">
                        <div class="flex between" style="gap:8px"><span class="badge badge-violet"><?= e($c['domain']) ?></span><span class="badge badge-<?= $cc ?>"><?= e($cl) ?></span></div>
                        <h3 style="font-size:1.02rem;margin:4px 0 0"><?= e($c['name']) ?></h3>
                        <small class="muted"><?= e($c['issuer']) ?></small>
                        <p class="small mb-0"><?= e($c['description']) ?></p>
                        <?php if ($c['value_note']): ?><p class="small mb-0 reco-note"><?= icon('target') ?> <?= e($c['value_note']) ?></p><?php endif; ?>
                        <div class="flex flex-wrap small muted" style="gap:10px"><span><?= icon('clock') ?> <?= e($c['prep_time']) ?></span><span><?= icon('activity') ?> <?= e($lvl[$c['level']] ?? $c['level']) ?></span><span><?= icon('globe') ?> <?= e($c['format']) ?></span></div>
                        <?php if ($c['skills'] || $c['language']): ?><div class="tags"><?php foreach (array_filter(array_map('trim', explode(',', (string)($c['skills'] ?: $c['language'])))) as $s): ?><a class="tag" href="<?= e(url('/offres', ['q' => $s])) ?>"><?= e($s) ?></a><?php endforeach; ?></div><?php endif; ?>
                        <div class="flex flex-wrap mt-1" style="gap:8px">
                            <?php if ($c['url']): ?><a class="btn btn-ghost btn-sm" href="<?= e($c['url']) ?>" target="_blank" rel="noopener noreferrer">Site officiel <?= icon('external-link') ?></a><?php endif; ?>
                            <?php if ($planned !== [] || (user() && user()['role'] === 'candidate')): ?>
                                <?php if (in_array($c['name'], $planned, true)): ?><span class="badge badge-green"><?= icon('check') ?> Dans mon plan</span>
                                <?php else: ?>
                                    <form method="post" action="<?= e(url('/espace/progression/objectifs')) ?>"><?= csrf_field() ?><input type="hidden" name="kind" value="certification"><input type="hidden" name="ref_id" value="<?= (int)$c['id'] ?>"><input type="hidden" name="label" value="<?= e($c['name']) ?>"><button class="btn btn-soft btn-sm" type="submit"><?= icon('plus') ?> Ajouter à mon plan</button></form>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</section>
