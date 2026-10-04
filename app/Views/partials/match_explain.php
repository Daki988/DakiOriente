<?php /** @var array $match  @var bool $compact */ $compact ??= false; ?>
<div class="score-hero mb-2">
    <div class="ring ring-lg <?= score_class($match['score']) ?>" style="--p:<?= (int)$match['score'] ?>" role="img" aria-label="Score de compatibilité <?= (int)$match['score'] ?> sur 100"><b><?= (int)$match['score'] ?><small>%</small></b></div>
    <div class="grow">
        <span class="badge badge-<?= $match['score'] >= 70 ? 'green' : ($match['score'] >= 50 ? 'blue' : 'amber') ?>"><?= e($match['level']) ?></span>
        <h3 class="mt-1 mb-0">Pourquoi ce score ?</h3>
        <p class="small muted mb-0">Calcul transparent sur 9 critères pondérés, sans IA générative : chaque point est justifié.</p>
    </div>
</div>
<?php if ($match['eliminated']): ?>
    <div class="alert alert-error mb-2"><?= icon('circle-alert') ?><div><b>Critère éliminatoire :</b> <?= e($match['elimination']) ?></div></div>
<?php endif; ?>
<?php if (!$compact): ?>
<div class="criteria mb-3">
    <?php foreach ($match['criteria'] as $c): ?>
        <div class="criterion">
            <div class="top"><?= e($c['label']) ?> <span><?= e(number_format($c['points'], 1, ',', ' ')) ?> / <?= e(number_format($c['weight'], 0)) ?> pts</span></div>
            <div class="bar <?= $c['ratio'] >= .75 ? 'green' : ($c['ratio'] < .5 ? 'sun' : '') ?>"><i data-w="<?= (int)round($c['ratio'] * 100) ?>"></i></div>
            <p><?= e($c['detail']) ?></p>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>
<div class="grid-2">
    <div>
        <h4><?= icon('circle-check-big') ?> Points forts</h4>
        <ul class="explain-list ok">
            <?php foreach ($match['strengths'] ?: ['Continue à enrichir ton profil pour faire ressortir tes atouts.'] as $s): ?><li><?= icon('check') ?><span><?= e($s) ?></span></li><?php endforeach; ?>
        </ul>
    </div>
    <div>
        <h4><?= icon('target') ?> Écarts principaux</h4>
        <ul class="explain-list gap">
            <?php foreach ($match['gaps'] ?: ['Aucun écart majeur : ton profil correspond bien.'] as $g): ?><li><?= icon('alert-triangle') ?><span><?= e($g) ?></span></li><?php endforeach; ?>
        </ul>
    </div>
</div>
<?php if ($match['missing_skills']): ?>
    <h4 class="mt-3">Compétences de l'offre</h4>
    <div class="tags">
        <?php foreach ($match['missing_skills'] as $s): ?><span class="tag miss"><?= icon('plus') ?><?= e($s['name']) ?><?= $s['required'] ? ' · clé' : '' ?></span><?php endforeach; ?>
    </div>
<?php endif; ?>
<?php if (!empty($showActions)): ?>
    <h4 class="mt-3"><?= icon('rocket') ?> Actions recommandées</h4>
    <ul class="list">
        <?php foreach ($match['actions'] as $a): ?>
            <li><a class="list-link" href="<?= e(url($a['link'])) ?>"><span class="notif"><span class="ni"><?= icon(['skill' => 'graduation-cap', 'experience' => 'briefcase-business', 'pitch' => 'scroll-text', 'language' => 'languages', 'soft' => 'smile', 'apply' => 'mic'][$a['type']] ?? 'zap') ?></span></span><span class="grow"><b style="font-size:.92rem"><?= e($a['text']) ?></b><?php if ($a['extra']): ?><br><small class="muted"><?= e($a['extra']) ?></small><?php endif; ?></span><?= icon('chevron-right') ?></a></li>
        <?php endforeach; ?>
    </ul>
<?php endif; ?>
