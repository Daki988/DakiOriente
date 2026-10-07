<?php
/** @var array $plan résultat de GapAnalysisService::forJob  @var array $job  @var array $planned */
$sev = App\Services\GapAnalysisService::SEVERITY;
$planned ??= [];
?>
<section class="card card-lg" id="combler">
    <div class="card-title">
        <div><h2 style="font-size:1.25rem;margin:0"><?= icon('route') ?> Combler l'écart pour ce poste</h2><p class="small muted mb-0">Gains mesurés par le moteur de matching sur ton profil. Au plus trois formations par écart, la gratuite d'abord quand elle existe.</p></div>
        <?php if ($plan['potential'] > $plan['score']): ?><div class="gap-mini"><span><?= (int)$plan['score'] ?> %</span><?= icon('arrow-right') ?><b><?= (int)$plan['potential'] ?> %</b></div><?php endif; ?>
    </div>
    <?php if (!$plan['gaps']): ?>
        <div class="alert alert-success"><?= icon('trophy') ?><div><b>Aucun écart significatif.</b> Ton profil répond à ce que recherche le recruteur : soigne ta lettre et prépare ton entretien pour faire la différence.</div></div>
    <?php else: ?>
        <div class="stack">
            <?php foreach (array_slice($plan['gaps'], 0, 4) as $g): [$sl, $sc] = $sev[$g['severity']]; ?>
                <div class="gap-row">
                    <div class="flex between" style="align-items:flex-start;gap:12px">
                        <div class="grow">
                            <span class="badge badge-<?= $sc ?>"><?= e($sl) ?></span>
                            <h3 class="mt-1 mb-0" style="font-size:1rem"><?= e($g['label']) ?></h3>
                            <p class="small muted mb-0"><?= e($g['detail']) ?></p>
                        </div>
                        <?php if ($g['gain']): ?><div class="gap-gain sm"><b>+<?= (int)$g['gain'] ?></b><span>pts</span></div><?php endif; ?>
                    </div>
                    <?php $recos = array_slice(array_values(array_filter($g['recos'], fn($r) => $r['kind'] !== 'action' || !in_array($g['type'], ['skill', 'level'], true))), 0, in_array($g['type'], ['skill', 'level'], true) ? 4 : 2); ?>
                    <?php if ($recos): ?>
                        <ul class="reco-list mt-1">
                            <?php foreach ($recos as $r): ?><?= App\Core\View::partial('partials/reco_item', ['r' => $r, 'gapKey' => $g['key'], 'planned' => $planned, 'canPlan' => true]) ?><?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
    <a class="btn btn-ghost btn-sm mt-2" href="<?= e(url('/espace/progression')) ?>"><?= icon('trending-up') ?> Voir mes axes de progression sur toutes mes offres</a>
</section>
