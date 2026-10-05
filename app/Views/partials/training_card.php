<?php
/** @var array $t formation (TrainingCatalog::BASE + demand)  @var ?string $status statut de suivi du candidat */
$cert = App\Services\Training\TrainingCatalog::CERT[$t['certificate']] ?? null;
$st = isset($status) && $status ? App\Controllers\Candidate\LearningController::STATUS[$status] ?? null : null;
$skills = array_slice(array_filter(array_map('trim', explode(',', (string)$t['skills']))), 0, 3);
?>
<article class="card card-hover training-card">
    <div class="flex between" style="gap:8px">
        <span class="platform-chip" style="--pc:<?= e($t['platform_color'] ?? '#0057ff') ?>"><i aria-hidden="true"></i><?= e($t['platform_name'] ?? '') ?></span>
        <span class="badge badge-<?= $t['language'] === 'fr' ? 'blue' : 'violet' ?>" title="Langue du cours"><?= $t['language'] === 'fr' ? 'FR' : 'EN' ?></span>
    </div>
    <h3 class="mb-0"><a href="<?= e(url('/formations/' . $t['id'])) ?>"><?= e($t['title']) ?></a></h3>
    <small class="muted"><?= e(implode(' · ', array_filter([$t['provider'] !== ($t['platform_name'] ?? '') ? $t['provider'] : null, $t['duration']]))) ?></small>
    <?php if ($skills): ?><div class="tags"><?php foreach ($skills as $s): ?><span class="tag"><?= e($s) ?></span><?php endforeach; ?></div><?php endif; ?>
    <div class="flex flex-wrap" style="gap:6px;margin-top:auto">
        <?php if (!empty($t['demand'])): ?><span class="badge badge-amber" title="Offres publiées qui demandent ces compétences"><?= icon('briefcase-business') ?> Demandée dans <?= (int)$t['demand'] ?> offre<?= $t['demand'] > 1 ? 's' : '' ?></span><?php endif; ?>
        <?php if ($cert): ?><span class="badge badge-<?= $cert[1] ?>"><?= e($cert[0]) ?></span><?php endif; ?>
        <?php if ($st): ?><span class="badge badge-<?= $st[1] ?>"><?= icon('check') ?> <?= e($st[0]) ?></span><?php endif; ?>
        <?php if (!empty($t['next_session'])): ?><span class="badge badge-sky"><?= $t['next_session'] === 'ouvert' ? 'Inscriptions ouvertes' : 'Session le ' . e(date_fr($t['next_session'])) ?></span><?php endif; ?>
    </div>
</article>
