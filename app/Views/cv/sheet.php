<?php
/**
 * Feuille de CV (aperçu web et PDF). Pas de flexbox ni de grid : dompdf doit pouvoir la mettre en page.
 * @var array $d données (CvRenderer::data)  @var array $s réglages  @var array $t modèle  @var string $mode web|pdf|thumb  @var string $density
 */
$key = $t['key'];
$layout = $t['layout'];
$sideLeft = ($t['side'] ?? 'left') === 'left';
$nameInSide = $layout === 'side' && $key !== 'horizon';
$chips = in_array($key, ['creatif', 'premier', 'douceur', 'impact', 'executif', 'chrono'], true);
$labels = ['phone' => 'Tél.', 'email' => 'E-mail', 'city' => 'Ville', 'linkedin' => 'LinkedIn', 'web' => 'Site'];

$h = function (string $title) use ($key): string {
    return '<h4 class="cv-h"><span>' . e($title) . '</span></h4>';
};
$dots = function (int $lvl): string {
    $o = '<span class="cv-dots">';
    for ($i = 1; $i <= 5; $i++) {
        $o .= '<i class="' . ($i <= $lvl ? 'on' : '') . '"></i>';
    }
    return $o . '</span>';
};
$bar = fn(int $lvl): string => '<span class="cv-bar"><i style="width:' . max(10, min(100, $lvl * 20)) . '%"></i></span>';
$photo = function () use ($d, $s): string {
    if (!$d['photo']) {
        return '';
    }
    return '<div class="cv-photo-wrap"><img class="cv-photo ' . ($s['photo_shape'] === 'square' ? 'sq' : 'rd') . '" src="' . e($d['photo']) . '" alt="Photo de ' . e($d['name']) . '"></div>';
};
$contactLines = function () use ($d, $labels): string {
    $o = '';
    foreach ($d['contact'] as [$type, $value]) {
        $o .= '<div class="cv-ct"><span class="cv-ct-l">' . e($labels[$type]) . '</span> ' . e($value) . '</div>';
    }
    return $o;
};
$contactInline = function () use ($d): string {
    return '<div class="cv-contact">' . implode('<span class="sep"> · </span>', array_map(fn($c) => '<span class="nw">' . e($c[1]) . '</span>', $d['contact'])) . '</div>';
};
$summary = function () use ($d, $h, $key): string {
    if ($d['summary'] === '') {
        return '';
    }
    return '<div class="cv-sec cv-summary">' . (in_array($key, ['classique', 'elegant', 'impact', 'ats'], true) ? $h('Profil') : '') . '<p>' . nl2br(e($d['summary'])) . '</p></div>';
};
$experiences = function () use ($d, $h, $key): string {
    if (!$d['experiences']) {
        return '';
    }
    $o = '<div class="cv-sec cv-exps">' . $h($key === 'premier' ? 'Stages, projets & expériences' : 'Expériences professionnelles');
    foreach ($d['experiences'] as $x) {
        $o .= '<div class="cv-item">' . ($key === 'chrono' ? '<span class="cv-tl-dot"></span>' : '')
            . '<div class="cv-item-head"><span class="cv-when">' . e($x['period']) . '</span><b class="cv-title">' . e($x['title']) . '</b></div>'
            . (($x['org'] || $x['place']) ? '<div class="cv-org">' . e(implode(' · ', array_filter([$x['org'], $x['place']]))) . '</div>' : '');
        if ($x['bullets']) {
            $o .= '<ul class="cv-ul">' . implode('', array_map(fn($b) => '<li>' . e($b) . '</li>', $x['bullets'])) . '</ul>';
        } elseif ($x['text'] !== '') {
            $o .= '<p class="cv-desc">' . nl2br(e($x['text'])) . '</p>';
        }
        $o .= '</div>';
    }
    return $o . '</div>';
};
$educations = function () use ($d, $h): string {
    if (!$d['educations']) {
        return '';
    }
    $o = '<div class="cv-sec cv-edus">' . $h('Formation');
    foreach ($d['educations'] as $e) {
        $o .= '<div class="cv-item"><div class="cv-item-head"><span class="cv-when">' . e($e['period']) . '</span><b class="cv-title">' . e($e['degree']) . ($e['field'] ? ' — ' . e($e['field']) : '') . '</b></div>'
            . '<div class="cv-org">' . e($e['school']) . '</div>' . ($e['text'] !== '' ? '<p class="cv-desc">' . e($e['text']) . '</p>' : '') . '</div>';
    }
    return $o . '</div>';
};
$certs = function () use ($d, $h): string {
    if (!$d['certs'] && $d['extra_certs'] === '') {
        return '';
    }
    $o = '<div class="cv-sec cv-certs">' . $h('Certifications');
    foreach ($d['certs'] as $c) {
        $o .= '<div class="cv-cert"><b>' . e($c['title']) . '</b>' . ($c['verified'] ? ' <span class="cv-verif">Vérifié</span>' : '')
            . (($c['issuer'] || $c['year']) ? '<span class="cv-org"> — ' . e(implode(', ', array_filter([$c['issuer'], $c['year']]))) . '</span>' : '') . '</div>';
    }
    if ($d['extra_certs'] !== '') {
        $o .= '<p class="cv-desc">' . e($d['extra_certs']) . '</p>';
    }
    return $o . '</div>';
};
/** Blocs « atouts » : $style = side (colonne), chips, inline */
$skills = function (string $style) use ($d, $h, $dots, $bar, $key): string {
    if (!$d['skills']) {
        return '';
    }
    $o = '<div class="cv-sec cv-skills">' . $h('Compétences');
    if ($style === 'side') {
        foreach ($d['skills'] as $sk) {
            $o .= '<div class="cv-skill"><span class="cv-skill-n">' . e($sk['name']) . '</span>' . ($key === 'moderne' ? $dots((int)$sk['level']) : $bar((int)$sk['level'])) . '</div>';
        }
    } elseif ($style === 'chips') {
        $o .= '<div class="cv-chips">' . implode(' ', array_map(fn($sk) => '<span class="cv-chip">' . e($sk['name']) . '</span>', $d['skills'])) . '</div>';
    } else {
        $o .= '<p class="cv-inline">' . e(implode(' · ', array_column($d['skills'], 'name'))) . '</p>';
    }
    return $o . '</div>';
};
$langs = function (string $style) use ($d, $h): string {
    if (!$d['langs']) {
        return '';
    }
    $o = '<div class="cv-sec cv-langs">' . $h('Langues');
    if ($style === 'side') {
        foreach ($d['langs'] as $l) {
            $o .= '<div class="cv-skill"><span class="cv-skill-n">' . e($l['name']) . '</span><span class="cv-lvl">' . e($l['level'] ?? '') . '</span></div>';
        }
    } else {
        $o .= '<p class="cv-inline">' . implode(' · ', array_map(fn($l) => '<b>' . e($l['name']) . '</b>' . (!empty($l['level']) ? ' (' . e($l['level']) . ')' : ''), $d['langs'])) . '</p>';
    }
    return $o . '</div>';
};
$soft = function (string $style) use ($d, $h): string {
    if (!$d['soft']) {
        return '';
    }
    return '<div class="cv-sec cv-soft">' . $h('Qualités') . ($style === 'chips'
        ? '<div class="cv-chips">' . implode(' ', array_map(fn($x) => '<span class="cv-chip alt">' . e($x) . '</span>', $d['soft'])) . '</div>'
        : '<p class="cv-inline">' . e(implode(' · ', $d['soft'])) . '</p>') . '</div>';
};
$interests = function () use ($d, $h): string {
    return $d['interests'] ? '<div class="cv-sec cv-int">' . $h('Centres d\'intérêt') . '<p class="cv-inline">' . e(implode(' · ', $d['interests'])) . '</p></div>' : '';
};
$qr = function (bool $withTitle = true) use ($d, $h): string {
    return $d['qr'] ? '<div class="cv-sec cv-qr">' . ($withTitle ? $h('CV en ligne') : '') . '<img src="' . e($d['qr']) . '" alt="QR code vers le CV en ligne"><div class="cv-qr-t">Scannez pour voir mon CV en ligne</div></div>' : '';
};
$footer = function () use ($d): string {
    $o = '';
    if ($d['availability']) {
        $o .= '<p class="cv-foot">' . e($d['availability']) . '</p>';
    }
    if ($d['references']) {
        $o .= '<p class="cv-foot">Références disponibles sur demande.</p>';
    }
    return $o ? '<div class="cv-sec cv-footer">' . $o . '</div>' : '';
};
$parcours = fn() => $s['education_first'] ? $educations() . $experiences() : $experiences() . $educations();
$bgs = '';
if ($layout === 'side') {
    $bgs .= '<div class="cv-sidebg bg-' . $key . ' bg-' . ($sideLeft ? 'left' : 'right') . '"></div>';
} elseif ($key === 'impact') {
    $bgs .= '<div class="cv-bandbg bg-impact"></div>';
} elseif ($key === 'corporate') {
    $bgs .= '<div class="cv-topline bg-corporate"></div>';
}
$classes = 'cv t-' . $key . ' l-' . $layout . ' d-' . $density . ' m-' . $mode . ($layout === 'side' ? ($sideLeft ? ' side-left' : ' side-right') : '') . ($d['photo'] ? ' has-photo' : '');
?>
<?= $mode === 'pdf' ? $bgs : '' /* PDF : arrière-plans fixes, enfants directs du corps pour être répétés sur chaque page */ ?>
<div class="<?= e($classes) ?>">
<?= $mode === 'pdf' ? '' : $bgs ?>
<?php if ($layout === 'side'):
    [$sideBlocks, $moved] = App\Services\Cv\CvRenderer::sideBlocks($d, $density, $nameInSide, $sideMoves ?? null);
    $render = ['contact' => fn($st) => '<div class="cv-sec cv-contact-b">' . $h('Contact') . $contactLines() . '</div>', 'skills' => $skills, 'langs' => $langs, 'soft' => $soft,
        'interests' => fn($st) => $interests(), 'qr' => fn($st) => $qr()]; ?>
    <div class="cv-side">
        <?= $photo() ?>
        <?php if ($nameInSide): ?><h1 class="cv-name"><?= e($d['first']) ?> <span class="cv-last"><?= e($d['last']) ?></span></h1><?php if ($d['headline']): ?><div class="cv-headline"><?= e($d['headline']) ?></div><?php endif; ?><?php endif; ?>
        <?php foreach ($sideBlocks as $b): ?><?= $render[$b]('side') ?><?php endforeach; ?>
    </div>
    <div class="cv-main">
        <?php if (!$nameInSide): ?><div class="cv-head"><h1 class="cv-name"><?= e($d['first']) ?> <span class="cv-last"><?= e($d['last']) ?></span></h1><?php if ($d['headline']): ?><div class="cv-headline"><?= e($d['headline']) ?></div><?php endif; ?></div><?php endif; ?>
        <?= $summary() ?>
        <?= $parcours() ?>
        <?= $certs() ?>
        <?php foreach ($moved as $b): ?><?= $render[$b]('inline') ?><?php endforeach; ?>
        <?= $footer() ?>
    </div>
<?php elseif ($layout === 'label'):
    $row = fn(string $label, string $content) => $content === '' ? '' : '<table class="cv-row"><tr><td class="cv-lbl">' . e($label) . '</td><td class="cv-cnt">' . $content . '</td></tr></table>';
    $strip = fn(string $html) => preg_replace('#<h4 class="cv-h">.*?</h4>#s', '', $html); ?>
    <div class="cv-head"><div class="cv-head-row<?= $d['photo'] ? ' with-photo' : '' ?>">
        <?php if ($d['photo']): ?><div class="cv-head-photo"><?= $photo() ?></div><?php endif; ?>
        <div class="cv-head-txt">
            <h1 class="cv-name"><?= e($d['first']) ?> <span class="cv-last"><?= e($d['last']) ?></span></h1>
            <?php if ($d['headline']): ?><div class="cv-headline"><?= e($d['headline']) ?></div><?php endif; ?>
            <?= $contactInline() ?>
        </div>
        <div class="cv-clear"></div>
    </div></div>
    <?= $row('Profil', $d['summary'] !== '' ? '<p>' . nl2br(e($d['summary'])) . '</p>' : '') ?>
    <?php
    $expRows = '';
    foreach ($d['experiences'] as $i => $x) {
        $expRows .= '<table class="cv-row"><tr><td class="cv-lbl">' . ($i === 0 ? 'Expériences' : '') . '<div class="cv-lbl-when">' . e($x['period']) . '</div></td><td class="cv-cnt"><div class="cv-item"><b class="cv-title">' . e($x['title']) . '</b>'
            . (($x['org'] || $x['place']) ? '<div class="cv-org">' . e(implode(' · ', array_filter([$x['org'], $x['place']]))) . '</div>' : '')
            . ($x['bullets'] ? '<ul class="cv-ul">' . implode('', array_map(fn($b) => '<li>' . e($b) . '</li>', $x['bullets'])) . '</ul>' : ($x['text'] !== '' ? '<p class="cv-desc">' . nl2br(e($x['text'])) . '</p>' : ''))
            . '</div></td></tr></table>';
    }
    $eduRows = '';
    foreach ($d['educations'] as $i => $e) {
        $eduRows .= '<table class="cv-row"><tr><td class="cv-lbl">' . ($i === 0 ? 'Formation' : '') . '<div class="cv-lbl-when">' . e($e['period']) . '</div></td><td class="cv-cnt"><div class="cv-item"><b class="cv-title">' . e($e['degree']) . ($e['field'] ? ' — ' . e($e['field']) : '') . '</b><div class="cv-org">' . e($e['school']) . '</div>'
            . ($e['text'] !== '' ? '<p class="cv-desc">' . e($e['text']) . '</p>' : '') . '</div></td></tr></table>';
    }
    echo $s['education_first'] ? $eduRows . $expRows : $expRows . $eduRows;
    ?>
    <?= $row('Compétences', $strip($skills('inline'))) ?>
    <?= $row('Langues', $strip($langs('inline'))) ?>
    <?= $row('Qualités', $strip($soft('inline'))) ?>
    <?= $row('Certifications', $strip($certs())) ?>
    <?= $row('Intérêts', $strip($interests())) ?>
    <?= $row('', $strip($footer())) ?>
    <?php if ($d['qr']): ?><?= $row('CV en ligne', $strip($qr(false))) ?><?php endif; ?>
<?php else: /* single et header */ ?>
    <div class="cv-head"><div class="cv-head-row<?= $d['photo'] ? ' with-photo' : '' ?><?= $d['qr'] && $layout === 'header' ? ' with-qr' : '' ?>">
        <?php if ($d['photo']): ?><div class="cv-head-photo"><?= $photo() ?></div><?php endif; ?>
        <?php if ($d['qr'] && $layout === 'header'): ?><div class="cv-head-qr"><img src="<?= e($d['qr']) ?>" alt="QR code vers le CV en ligne"></div><?php endif; ?>
        <div class="cv-head-txt">
            <h1 class="cv-name"><?= e($d['first']) ?> <span class="cv-last"><?= e($d['last']) ?></span></h1>
            <?php if ($d['headline']): ?><div class="cv-headline"><?= e($d['headline']) ?></div><?php endif; ?>
            <?= $contactInline() ?>
        </div>
        <div class="cv-clear"></div>
    </div></div>
    <div class="cv-body">
        <?= $summary() ?>
        <?php if ($key === 'premier'): ?><?= $skills('chips') ?><?= $soft('chips') ?><?php endif; ?>
        <?= $parcours() ?>
        <?php if ($key !== 'premier'): ?><?= $skills($chips ? 'chips' : 'inline') ?><?php endif; ?>
        <?= $langs('inline') ?>
        <?php if ($key !== 'premier'): ?><?= $soft($chips ? 'chips' : 'inline') ?><?php endif; ?>
        <?= $certs() ?>
        <?= $interests() ?>
        <?= $footer() ?>
        <?php if ($layout !== 'header'): ?><?= $qr() ?><?php endif; ?>
    </div>
<?php endif; ?>
</div>
