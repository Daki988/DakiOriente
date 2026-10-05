<?php
/** @var array $analysis  @var array $goals  @var ?array $advice  @var array $planned  @var int $n */
$sev = App\Services\GapAnalysisService::SEVERITY;
$a = $analysis;
$goalStatus = ['todo' => ['À faire', 'gray'], 'en_cours' => ['En cours', 'amber'], 'fait' => ['Atteint', 'green']];
$done = count(array_filter($goals, fn($g) => $g['status'] === 'fait'));
?>
<div class="page-head">
    <div><h1>Mes axes de progression</h1><p>Ce que recherchent les entreprises, ce qui te manque encore, et le chemin le plus court pour le combler. Chaque gain est mesuré par notre moteur de matching, pas estimé au hasard.</p></div>
    <form method="get" action="<?= e(url('/espace/progression')) ?>" class="flex" data-autosubmit>
        <label class="small muted" for="n">Analyser mes</label>
        <select id="n" name="n" class="input" style="width:auto;min-height:40px"><?php foreach ([5, 10, 20] as $k): ?><option value="<?= $k ?>" <?= $n === $k ? 'selected' : '' ?>><?= $k ?> offres les plus proches</option><?php endforeach; ?></select>
        <noscript><button class="btn btn-ghost btn-sm" type="submit">OK</button></noscript>
    </form>
</div>

<?php if (!$a['jobs']): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'target', 'heading' => 'Pas encore d\'offre à analyser', 'text' => 'Dès que des offres sont publiées, tu verras ici ce qui te sépare de chacune et comment progresser.', 'cta' => ['Compléter mon profil', '/espace/profil']]) ?>
<?php else: ?>
<section class="welcome mb-3 fade-up">
    <span class="deco"></span><span class="deco2"></span>
    <div class="gap-hero">
        <div>
            <p class="hand" style="font-size:1.5rem;color:var(--yellow);margin:0">Ton potentiel, chiffré</p>
            <h2 style="font-size:clamp(1.3rem,2.6vw,1.8rem);margin:4px 0 8px">
                <?php if ($a['potential'] > $a['avg']): ?>En comblant 3 écarts, tu passes de <?= $a['avg'] ?> à <?= $a['potential'] ?>/100 sur tes <?= count($a['jobs']) ?> meilleures offres.<?php else: ?>Ton profil couvre déjà l'essentiel de tes <?= count($a['jobs']) ?> meilleures offres.<?php endif; ?>
            </h2>
            <p style="margin:0;max-width:560px">Ce score moyen est recalculé à partir des vraies exigences des recruteurs. Commence par l'écart n°1 : c'est celui qui débloque le plus d'offres.</p>
            <?php if ($a['strengths']): ?>
                <p class="small mt-2 mb-0" style="color:#e2ecff"><b style="color:#fff">Tes atouts les plus demandés :</b>
                    <?php foreach ($a['strengths'] as $s): ?><span class="tag" style="background:rgba(255,255,255,.14);color:#fff;border-color:transparent;margin:2px"><?= icon('check') ?><?= e($s['name']) ?> · <?= (int)$s['count'] ?> offre<?= $s['count'] > 1 ? 's' : '' ?></span><?php endforeach; ?></p>
            <?php endif; ?>
        </div>
        <div class="gap-rings" aria-label="Score moyen actuel <?= $a['avg'] ?>, potentiel <?= $a['potential'] ?>">
            <div class="text-center"><div class="ring ring-lg" style="--p:<?= $a['avg'] ?>;background:radial-gradient(closest-side,#0b4fe0 calc(100% - 11px),transparent calc(100% - 10px)),conic-gradient(#fff calc(<?= $a['avg'] ?>*1%),rgba(255,255,255,.2) 0)"><b style="color:#fff"><?= $a['avg'] ?></b></div><small>Aujourd'hui</small></div>
            <span class="gap-arrow"><?= icon('arrow-right') ?></span>
            <div class="text-center"><div class="ring ring-lg" style="--p:<?= $a['potential'] ?>;background:radial-gradient(closest-side,#0b4fe0 calc(100% - 11px),transparent calc(100% - 10px)),conic-gradient(#ffc21a calc(<?= $a['potential'] ?>*1%),rgba(255,255,255,.2) 0)"><b style="color:#fff"><?= $a['potential'] ?></b></div><small>Ton potentiel</small></div>
        </div>
    </div>
</section>

<div class="layout-aside">
    <div class="stack">
        <details class="faq">
            <summary><?= icon('circle-help') ?> Comment ces recommandations sont-elles calculées ?</summary>
            <p class="small mb-1">Nous comparons ton profil aux <?= count($a['jobs']) ?> offres qui te correspondent le mieux, critère par critère : compétences, niveau, langues, études, expérience, qualités, mobilité.</p>
            <p class="small mb-1">Pour chaque écart, le moteur de matching est relancé sur une version de ton profil où cet écart est comblé. Le gain affiché est donc la différence réelle de score, offre par offre. Les écarts sont ensuite classés par gain total : ceux qui reviennent dans le plus d'offres passent en premier.</p>
            <p class="small mb-0">Les certifications proposées sont reconnues par les employeurs et reliées à chaque compétence. Les tarifs et modalités évoluent : vérifie-les toujours auprès de l'organisme.</p>
        </details>

        <?php if (!$a['gaps']): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'trophy', 'heading' => 'Aucun écart significatif', 'text' => 'Ton profil répond déjà aux attentes de tes meilleures offres. La priorité : postuler et préparer tes entretiens.', 'cta' => ['Voir mes offres', '/espace/recommandations']]) ?>
        <?php endif; ?>

        <?php foreach ($a['gaps'] as $i => $g): [$sl, $sc] = $sev[$g['severity']]; ?>
            <article class="card card-lg gap-card <?= in_array($g['key'], $a['focus'], true) ? 'focus' : '' ?>" id="ecart-<?= $i + 1 ?>">
                <div class="gap-head">
                    <span class="gap-rank"><?= $i + 1 ?></span>
                    <div class="grow">
                        <div class="flex flex-wrap" style="gap:6px"><span class="badge badge-<?= $sc ?>"><?= e($sl) ?></span><?php if (in_array($g['key'], $a['focus'], true)): ?><span class="badge badge-yellow"><?= icon('star') ?> Priorité du moment</span><?php endif; ?></div>
                        <h2 class="mt-1 mb-0" style="font-size:1.12rem"><?= e($g['label']) ?></h2>
                        <p class="small muted mb-0"><?= e($g['detail']) ?></p>
                    </div>
                    <div class="gap-gain"><b>+<?= (int)$g['avg_gain'] ?></b><span>pts en moyenne</span></div>
                </div>
                <p class="small mt-2 mb-1"><b>Demandé dans <?= (int)$g['count'] ?> de tes <?= count($a['jobs']) ?> meilleures offres</b> · gain cumulé +<?= (int)$g['total'] ?> pts</p>
                <div class="flex flex-wrap" style="gap:6px">
                    <?php foreach (array_slice($g['jobs'], 0, 4) as $j): ?>
                        <a class="tag" href="<?= e(url('/offres/' . $j['id'])) ?>"><?= e(excerpt($j['title'], 34)) ?> · <?= (int)$j['score'] ?> %<?php if ($j['gain']): ?> <b style="color:var(--green)">+<?= (int)$j['gain'] ?></b><?php endif; ?></a>
                    <?php endforeach; ?>
                    <?php if (count($g['jobs']) > 4): ?><span class="tag">+<?= count($g['jobs']) - 4 ?> autres</span><?php endif; ?>
                </div>
                <?php if ($g['recos']): ?>
                    <h3 class="mt-3 mb-1" style="font-size:.95rem"><?= icon('route') ?> Comment le combler</h3>
                    <ul class="reco-list reco-grid">
                        <?php foreach (array_slice($g['recos'], 0, 2) as $r): ?><?= App\Core\View::partial('partials/reco_item', ['r' => $r, 'gapKey' => $g['key'], 'planned' => $planned, 'canPlan' => true]) ?><?php endforeach; ?>
                    </ul>
                    <?php if (count($g['recos']) > 2): ?>
                        <details class="reco-more mt-1">
                            <summary><?= icon('chevron-down') ?> <?= count($g['recos']) - 2 ?> autre<?= count($g['recos']) > 3 ? 's' : '' ?> piste<?= count($g['recos']) > 3 ? 's' : '' ?> pour combler cet écart</summary>
                            <ul class="reco-list reco-grid mt-1">
                                <?php foreach (array_slice($g['recos'], 2) as $r): ?><?= App\Core\View::partial('partials/reco_item', ['r' => $r, 'gapKey' => $g['key'], 'planned' => $planned, 'canPlan' => true]) ?><?php endforeach; ?>
                            </ul>
                        </details>
                    <?php endif; ?>
                <?php endif; ?>
            </article>
        <?php endforeach; ?>
    </div>

    <aside class="stack">
        <section class="card card-lg" id="plan">
            <div class="card-title"><h2 style="font-size:1.1rem"><?= icon('list-checks') ?> Mon plan</h2><?php if ($goals): ?><span class="badge badge-green"><?= $done ?> / <?= count($goals) ?> atteint<?= $done > 1 ? 's' : '' ?></span><?php endif; ?></div>
            <?php if (!$goals): ?>
                <p class="small muted mb-0">Ajoute une certification, une formation ou un projet depuis les écarts : tu suivras ici ta progression. Quand tu marques une certification « atteinte », elle rejoint automatiquement ton profil et ton CV.</p>
            <?php else: ?>
                <div class="bar mb-2"><i data-w="<?= (int)round($done / count($goals) * 100) ?>"></i></div>
                <ul class="list">
                    <?php foreach ($goals as $g): [$gl, $gc] = $goalStatus[$g['status']] ?? ['À faire', 'gray']; ?>
                        <li class="goal">
                            <div class="flex between" style="align-items:flex-start;gap:8px">
                                <div class="grow"><b class="small" style="color:var(--navy)"><?= e($g['label']) ?></b><?php if ($g['issuer']): ?><br><small class="muted"><?= e($g['issuer']) ?><?= $g['prep_time'] ? ' · ' . e($g['prep_time']) : '' ?></small><?php endif; ?></div>
                                <span class="badge badge-<?= $gc ?>"><?= e($gl) ?></span>
                            </div>
                            <div class="flex mt-1" style="gap:6px">
                                <form method="post" action="<?= e(url('/espace/progression/objectifs/' . $g['id'])) ?>" class="flex grow" style="gap:6px">
                                    <?= csrf_field() ?>
                                    <label class="sr-only" for="gs<?= (int)$g['id'] ?>">Statut</label>
                                    <select id="gs<?= (int)$g['id'] ?>" name="status" class="input" style="min-height:34px;font-size:.82rem"><?php foreach ($goalStatus as $k => [$l]): ?><option value="<?= $k ?>" <?= $g['status'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
                                    <button class="btn btn-soft btn-sm" type="submit" aria-label="Mettre à jour"><?= icon('check') ?></button>
                                </form>
                                <form method="post" action="<?= e(url('/espace/progression/objectifs/' . $g['id'] . '/supprimer')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Retirer"><?= icon('trash-2') ?></button></form>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>

        <section class="card card-lg card-blue" id="coach">
            <h2 style="font-size:1.1rem"><?= icon('sparkles') ?> L'avis de ton coach</h2>
            <?php if ($advice): ?>
                <div class="coach-text"><?= nl2p($advice['text']) ?></div>
                <small style="color:#e2ecff">Rédigé par <?= e($advice['provider']) ?> <?= e(time_ago($advice['at'] ?? null)) ?>.</small>
            <?php else: ?>
                <p class="small" style="color:#e2ecff">Un conseil personnalisé qui part de tes atouts, explique dans quel ordre attaquer tes écarts et pourquoi.</p>
            <?php endif; ?>
            <form method="post" action="<?= e(url('/espace/progression/conseil')) ?>" class="mt-2">
                <?= csrf_field() ?>
                <button class="btn btn-cta btn-block" type="submit"><?= icon('sparkles') ?> <?= $advice ? 'Actualiser mon conseil' : 'Obtenir mon conseil' ?></button>
            </form>
            <small style="color:#e2ecff">Moteur : <?= e($provider) ?> · <?= (int)$usage['remaining'] ?>/<?= (int)$usage['limit'] ?> générations IA restantes ce mois</small>
        </section>

        <section class="card">
            <h3 style="font-size:1rem"><?= icon('award') ?> Toutes les certifications</h3>
            <p class="small muted">Langues, numérique, data, HSE, finance, gestion de projet… parcours le catalogue complet, avec les options gratuites mises en avant.</p>
            <a class="btn btn-ghost btn-sm" href="<?= e(url('/certifications')) ?>">Voir le catalogue <?= icon('arrow-right') ?></a>
        </section>
    </aside>
</div>
<?php endif; ?>
