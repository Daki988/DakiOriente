<?php
/** @var array $r recommandation  @var string $gapKey  @var array $planned libellés déjà dans le plan  @var bool $canPlan */
$canPlan ??= false;
$planned ??= [];
$icons = ['certification' => 'award', 'training' => 'graduation-cap', 'project' => 'lightbulb', 'action' => 'route'];
$kinds = ['certification' => 'Certification', 'training' => 'Formation', 'project' => 'Projet', 'action' => 'Action'];
$label = $r['kind'] === 'project' ? 'Projet : ' . mb_substr($r['subtitle'], 0, 150) : $r['title'];
$inPlan = in_array($label, $planned, true);
?>
<li class="reco reco-<?= e($r['kind']) ?>">
    <span class="ri" aria-hidden="true"><?= icon($icons[$r['kind']] ?? 'zap') ?></span>
    <div class="grow">
        <div class="flex flex-wrap" style="gap:6px;align-items:center">
            <small class="eyebrow" style="margin:0"><?= e($kinds[$r['kind']] ?? '') ?></small>
            <?php if (!empty($r['cost'])): ?><span class="badge badge-<?= e($r['cost_color'] ?? ($r['cost'] === 'Gratuit' ? 'green' : 'gray')) ?>"><?= e($r['cost']) ?></span><?php endif; ?>
            <?php if (!empty($r['partner'])): ?><span class="badge badge-violet" title="Formation partenaire : aucun avantage dans le classement">Partenaire</span><?php endif; ?>
        </div>
        <b class="reco-title"><?= e($r['title']) ?></b>
        <p class="small muted mb-0"><?= e($r['subtitle']) ?></p>
        <?php if (!empty($r['closes'])): ?><p class="small mb-0 reco-note"><?= icon('target') ?> Écart comblé : <?= e($r['closes']) ?></p><?php endif; ?>
        <?php if (!empty($r['note'])): ?><p class="small mb-0 reco-note"><?= icon('target') ?> <?= e($r['note']) ?></p><?php endif; ?>
        <div class="flex flex-wrap mt-1" style="gap:8px">
            <?php if (!empty($r['link'])): ?>
                <a class="btn btn-ghost btn-sm" href="<?= e($r['external'] ? $r['link'] : url($r['link'])) ?>" <?= $r['external'] ? 'target="_blank" rel="noopener noreferrer"' : '' ?>><?= $r['external'] ? 'Site officiel ' . icon('external-link') : 'Voir ' . icon('arrow-right') ?></a>
            <?php endif; ?>
            <?php if ($canPlan && $r['kind'] !== 'action'): ?>
                <?php if ($inPlan): ?>
                    <span class="badge badge-green"><?= icon('check') ?> Dans mon plan</span>
                <?php else: ?>
                    <form method="post" action="<?= e(url('/espace/progression/objectifs')) ?>">
                        <?= csrf_field() ?>
                        <input type="hidden" name="kind" value="<?= e($r['kind']) ?>"><input type="hidden" name="ref_id" value="<?= (int)($r['id'] ?? 0) ?>">
                        <input type="hidden" name="label" value="<?= e($label) ?>"><input type="hidden" name="gap_key" value="<?= e($gapKey ?? '') ?>">
                        <button class="btn btn-soft btn-sm" type="submit"><?= icon('plus') ?> Ajouter à mon plan</button>
                    </form>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</li>
