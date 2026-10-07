<?php
/**
 * Fiche d'adéquation (cahier des charges v1.1 §10) : score et verdict, détail par critère, trois points forts,
 * écarts du plus au moins pénalisant (niveau actuel / attendu), action recommandée et gain estimé.
 * @var array $match  @var bool $compact  @var bool $showActions  @var ?string $explanation  @var ?int $jobId  @var ?array $feedback
 */
$compact ??= false;
$v = $match['verdict'] ?? ['label' => $match['level'], 'color' => 'blue', 'action' => ''];
$explanation ??= null;
$jobId ??= null;
?>
<div class="score-hero mb-2">
    <div class="ring ring-lg <?= score_class($match['score']) ?>" style="--p:<?= (int)$match['score'] ?>" role="img" aria-label="Score d'adéquation <?= (int)$match['score'] ?> sur 100"><b><?= (int)$match['score'] ?><small>/100</small></b></div>
    <div class="grow">
        <span class="badge badge-<?= e($v['color']) ?>"><?= e($v['label']) ?></span>
        <h3 class="mt-1 mb-0">Pourquoi ce score ?</h3>
        <p class="small muted mb-0">Calculé par des règles publiées à partir des référentiels Tremplin<?= !empty($match['version']) ? ' (version ' . (int)$match['version'] . ')' : '' ?>. L'IA ne fixe jamais le score.</p>
    </div>
</div>
<?php if (!empty($match['occupation'])): ?>
    <p class="small mb-2"><span class="badge badge-gray"><?= e($match['occupation']['code']) ?></span> <?= e($match['occupation']['title']) ?></p>
<?php endif; ?>
<?php if ($match['blocked'] ?? $match['eliminated']): ?>
    <div class="alert alert-error mb-2"><?= icon('circle-alert') ?><div><b>Prérequis manquant</b><ul class="mb-0" style="padding-left:1.1em"><?php foreach ($match['blocking'] ?? [] as $b): ?><li><?= e($b['label']) ?> — <?= e($b['detail']) ?></li><?php endforeach; ?></ul><small>Ce verdict s'applique quel que soit le score.</small></div></div>
<?php endif; ?>
<?php if ($explanation): ?>
    <div class="explain-box mb-2"><p class="mb-0"><?= e($explanation['text']) ?></p><small class="muted"><?= icon('sparkles') ?> <?= $explanation['provider'] === 'Claude' ? 'Reformulé par Claude à partir des éléments calculés' : 'Explication produite par le moteur NEAM' ?></small></div>
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
        <h4><?= icon('circle-check-big') ?> Tes 3 points forts</h4>
        <ul class="explain-list ok">
            <?php foreach ($match['strengths'] ?: ['Complète ton profil (compétences avec preuves, expériences) pour faire ressortir tes atouts.'] as $s): ?><li><?= icon('check') ?><span><?= e($s) ?></span></li><?php endforeach; ?>
        </ul>
    </div>
    <div>
        <h4><?= icon('target') ?> Écarts, du plus au moins pénalisant</h4>
        <ul class="explain-list gap">
            <?php $gi = array_slice($match['gap_items'] ?? [], 0, $compact ? 3 : 5); ?>
            <?php foreach ($gi as $g): ?><li><?= icon('alert-triangle') ?><span><?= e($g['text']) ?><?php if ($g['lost'] >= 0.5): ?> <small class="muted">(−<?= e(number_format($g['lost'], 1, ',', '')) ?> pt<?= $g['lost'] >= 2 ? 's' : '' ?>)</small><?php endif; ?></span></li><?php endforeach; ?>
            <?php if (!$gi): ?><li><?= icon('check') ?><span>Aucun écart : ton profil répond à toutes les exigences calculées.</span></li><?php endif; ?>
        </ul>
    </div>
</div>
<?php if (!empty($showActions)): ?>
    <h4 class="mt-3"><?= icon('rocket') ?> Action recommandée</h4>
    <?php if (!empty($v['action'])): ?><p class="small mb-1"><b><?= e($v['action']) ?></b></p><?php endif; ?>
    <ul class="list">
        <?php foreach ($match['actions'] as $a): ?>
            <li><a class="list-link" href="<?= e(url($a['link'])) ?>"><span class="notif"><span class="ni"><?= icon(['skill' => 'graduation-cap', 'experience' => 'briefcase-business', 'education' => 'school', 'language' => 'languages', 'cv' => 'file-text', 'apply' => 'send', 'block' => 'lock', 'mobility' => 'map-pin'][$a['type']] ?? 'zap') ?></span></span><span class="grow"><b style="font-size:.92rem"><?= e($a['text']) ?></b><?php if ($a['extra']): ?><br><small class="muted"><?= e($a['extra']) ?></small><?php endif; ?></span><?= icon('chevron-right') ?></a></li>
        <?php endforeach; ?>
    </ul>
<?php endif; ?>
<?php if ($jobId && user() && user()['role'] === 'candidate'): ?>
    <div class="explain-feedback mt-3">
        <?php if (empty($feedback)): ?>
            <form method="post" action="<?= e(url('/espace/offres/' . (int)$jobId . '/compris')) ?>" class="flex flex-wrap" style="gap:8px;align-items:center">
                <?= csrf_field() ?><span class="small"><b>Ce score est-il clair pour toi ?</b></span>
                <button class="btn btn-soft btn-sm" name="understood" value="1" type="submit"><?= icon('check') ?> Oui</button>
                <button class="btn btn-ghost btn-sm" name="understood" value="0" type="submit"><?= icon('x') ?> Pas vraiment</button>
            </form>
        <?php else: ?>
            <p class="small muted mb-0"><?= icon('check') ?> Merci pour ton retour : il sert à améliorer nos explications.</p>
        <?php endif; ?>
        <details class="mt-1">
            <summary class="small"><?= icon('flag') ?> Signaler une explication erronée</summary>
            <form method="post" action="<?= e(url('/espace/offres/' . (int)$jobId . '/signaler-explication')) ?>" class="stack-sm mt-1">
                <?= csrf_field() ?>
                <div class="field"><label for="xr-<?= (int)$jobId ?>">Qu'est-ce qui te semble faux ?</label><textarea id="xr-<?= (int)$jobId ?>" name="reason" required minlength="8" maxlength="600" style="min-height:80px" placeholder="Ex. : j'ai bien un BTS dans ce domaine, ou ce niveau ne correspond pas à mon expérience…"></textarea></div>
                <button class="btn btn-ghost btn-sm" type="submit">Envoyer à l'équipe de curation</button>
            </form>
        </details>
    </div>
<?php endif; ?>
