<?php
/**
 * Feuille de CV (aperçu web et PDF). Pas de flexbox ni de grid : dompdf doit pouvoir la mettre en page.
 * @var array $d données (CvRenderer::data)  @var array $s réglages  @var array $t modèle  @var string $mode web|pdf|thumb  @var string $density
 */
$key = $t['key'];
$layout = $t['layout'];
$sideLeft = ($t['side'] ?? 'left') === 'left';
$nameInSide = $layout === 'side' && $key !== 'horizon' && ($t['side_name'] ?? true);
$pal = App\Services\Cv\CvTemplates::PALETTES[$s['palette']];
$ico = fn(string $name, string $color, string $class = 'cv-ico') => App\Services\Cv\CvIcons::img($name, $color, $class);
$timeline = in_array($key, ['chrono', 'prestige'], true);
$pillDates = $key === 'prestige';
$listSkills = in_array($key, ['prestige', 'signature', 'parcours'], true);
$chips = in_array($key, ['creatif', 'premier', 'douceur', 'impact', 'executif', 'chrono'], true);
$labels = ['phone' => 'Tél.', 'email' => 'E-mail', 'city' => 'Ville', 'linkedin' => 'LinkedIn', 'web' => 'Site'];

$sectionIcons = ['Profil' => 'user', 'Expériences professionnelles' => 'briefcase-business', 'Stages, projets & expériences' => 'briefcase-business', 'Formation' => 'graduation-cap',
    'Certifications' => 'award', 'Compétences' => 'star', 'Langues' => 'languages', 'Qualités' => 'sparkles', 'Centres d\'intérêt' => 'heart', 'Contact' => 'phone'];
$h = function (string $title, bool $main = true) use ($key, $ico, $sectionIcons): string {
    // Parcours : pictogramme posé sur la frise (colonne principale)
    $pic = $key === 'parcours' && $main && isset($sectionIcons[$title]) ? '<span class="cv-h-ico">' . $ico($sectionIcons[$title], '#ffffff') . '</span>' : '';
    return '<h4 class="cv-h">' . $pic . '<span class="cv-h-t">' . e($title) . '</span><i class="cv-h-r"><b></b></i></h4>';
};
/** Puces structurées : sous-titres et intitulés en gras. */
$bulletList = function (array $items): string {
    $o = '';
    $open = false;
    foreach ($items as $b) {
        if ($b['t'] === 'sub') {
            $o .= ($open ? '</ul>' : '') . '<div class="cv-sub">' . e($b['text']) . '</div>';
            $open = false;
            continue;
        }
        if (!$open) {
            $o .= '<ul class="cv-ul">';
            $open = true;
        }
        $o .= '<li>' . ($b['lead'] ? '<b>' . e($b['lead']) . ' :</b> ' : '') . e($b['text']) . '</li>';
    }
    return $o . ($open ? '</ul>' : '');
};
$nameHtml = fn() => '<h1 class="cv-name"><span class="cv-first">' . e($d['first']) . '</span> <span class="cv-last">' . e($d['last']) . '</span></h1>';
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
    $img = '<img class="cv-photo ' . ($s['photo_shape'] === 'square' ? 'sq' : 'rd') . '" src="' . e($d['photo']) . '" alt="Photo de ' . e($d['name']) . '">';
    return '<div class="cv-photo-wrap ph-' . ($s['photo_shape'] === 'square' ? 'sq' : 'rd') . '">' . ($s['photo_shape'] !== 'square' ? '<span class="cv-photo-ring">' . $img . '</span>' : $img) . '</div>';
};
$contactLines = function () use ($d, $labels, $key, $ico, $pal): string {
    $o = '';
    foreach ($d['contact'] as [$type, $value]) {
        if (in_array($key, ['signature', 'parcours'], true)) {
            $icon = $key === 'signature' ? '<span class="cv-ct-pill">' . $ico(App\Services\Cv\CvIcons::CONTACT[$type], '#ffffff') . '</span>' : $ico(App\Services\Cv\CvIcons::CONTACT[$type], $pal['dark']);
            $o .= '<div class="cv-ct cv-ct-i"><span class="cv-ct-ic">' . $icon . '</span><span class="cv-ct-v">' . e($value) . '</span></div>';
        } else {
            $o .= '<div class="cv-ct"><span class="cv-ct-l">' . e($labels[$type]) . '</span> ' . e($value) . '</div>';
        }
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
    return '<div class="cv-sec cv-summary">' . (in_array($key, ['classique', 'elegant', 'impact', 'ats', 'prestige', 'signature', 'parcours'], true) ? $h('Profil') : '') . '<p>' . nl2br(e($d['summary'])) . '</p></div>';
};
$experiences = function () use ($d, $h, $key, $timeline, $pillDates, $bulletList): string {
    if (!$d['experiences']) {
        return '';
    }
    $o = '<div class="cv-sec cv-exps">' . $h($key === 'premier' ? 'Stages, projets & expériences' : 'Expériences professionnelles');
    foreach ($d['experiences'] as $x) {
        $where = implode(' · ', array_filter([$x['org'], $x['place']]));
        $o .= '<div class="cv-item">' . ($timeline ? '<span class="cv-tl-dot"></span>' : '') . ($key === 'parcours' ? '<span class="cv-pc-dot"></span>' : '');
        if ($key === 'parcours') {
            $o .= '<div class="cv-title">' . e($x['title']) . '</div><div class="cv-org"><b>' . e(implode(' | ', array_filter([$where, $x['period']]))) . '</b></div>';
        } else {
            $o .= '<div class="cv-item-head"><span class="cv-when' . ($pillDates ? ' pill' : '') . '">' . e($x['period']) . '</span><b class="cv-title">' . e($x['title']) . '</b></div>'
                . ($where ? '<div class="cv-org">' . e($where) . '</div>' : '');
        }
        if ($x['bullets']) {
            $o .= $bulletList($x['bullets']);
        } elseif ($x['text'] !== '') {
            $o .= '<p class="cv-desc">' . nl2br(e($x['text'])) . '</p>';
        }
        $o .= '</div>';
    }
    return $o . '</div>';
};
$educations = function (string $style = 'main') use ($d, $h, $key): string {
    if (!$d['educations']) {
        return '';
    }
    if ($style === 'side') {
        $o = '<div class="cv-sec cv-edus side">' . $h('Formation', false);
        foreach ($d['educations'] as $e) {
            $o .= '<div class="cv-edu-s"><b>' . e($e['degree']) . ($e['field'] ? ' — ' . e($e['field']) : '') . '</b><div class="cv-edu-school">' . e($e['school']) . '</div><div class="cv-edu-years">' . e($e['period']) . '</div></div>';
        }
        return $o . '</div>';
    }
    $o = '<div class="cv-sec cv-edus">' . $h('Formation');
    foreach ($d['educations'] as $e) {
        if ($key === 'parcours') {
            $o .= '<div class="cv-item"><span class="cv-pc-dot"></span><div class="cv-org"><b>' . e(implode(' | ', array_filter([$e['school'], $e['period']]))) . '</b></div><div class="cv-title">' . e($e['degree']) . ($e['field'] ? ' — ' . e($e['field']) : '') . '</div>'
                . ($e['text'] !== '' ? '<p class="cv-desc">' . e($e['text']) . '</p>' : '') . '</div>';
            continue;
        }
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
$li = fn(string $text) => '<div class="cv-li"><span class="cv-mk"><i></i></span><span class="cv-lt">' . e($text) . '</span></div>';
$skills = function (string $style) use ($d, $h, $dots, $bar, $key, $listSkills, $li): string {
    if (!$d['skills']) {
        return '';
    }
    $o = '<div class="cv-sec cv-skills">' . $h('Compétences', $style !== 'side');
    if ($style === 'side' && $listSkills) {
        foreach ($d['skills'] as $sk) {
            $o .= $li($sk['name']);
        }
    } elseif ($style === 'side') {
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
    $o = '<div class="cv-sec cv-langs">' . $h('Langues', $style !== 'side');
    if ($style === 'side') {
        foreach ($d['langs'] as $l) {
            $o .= '<div class="cv-skill"><span class="cv-skill-n">' . e($l['name']) . '</span><span class="cv-lvl">' . e($l['level'] ?? '') . '</span></div>';
        }
    } else {
        $o .= '<p class="cv-inline">' . implode(' · ', array_map(fn($l) => '<b>' . e($l['name']) . '</b>' . (!empty($l['level']) ? ' (' . e($l['level']) . ')' : ''), $d['langs'])) . '</p>';
    }
    return $o . '</div>';
};
$soft = function (string $style) use ($d, $h, $listSkills, $li): string {
    if (!$d['soft']) {
        return '';
    }
    if ($style === 'side' && $listSkills) {
        return '<div class="cv-sec cv-soft">' . $h('Qualités', false) . implode('', array_map($li, $d['soft'])) . '</div>';
    }
    return '<div class="cv-sec cv-soft">' . $h('Qualités', $style !== 'side') . ($style === 'chips'
        ? '<div class="cv-chips">' . implode(' ', array_map(fn($x) => '<span class="cv-chip alt">' . e($x) . '</span>', $d['soft'])) . '</div>'
        : '<p class="cv-inline">' . e(implode(' · ', $d['soft'])) . '</p>') . '</div>';
};
$interests = function (string $style = 'inline') use ($d, $h, $key, $listSkills, $li): string {
    if (!$d['interests']) {
        return '';
    }
    if ($key === 'prestige' && $style !== 'side') {
        $rows = '';
        foreach (array_chunk($d['interests'], 2) as $pair) {
            $rows .= '<tr>' . implode('', array_map(fn($x) => '<td><div class="cv-card">' . e($x) . '</div></td>', $pair)) . (count($pair) === 1 ? '<td></td>' : '') . '</tr>';
        }
        return '<div class="cv-sec cv-int">' . $h('Centres d\'intérêt') . '<table class="cv-cards">' . $rows . '</table></div>';
    }
    if ($style === 'side' && $listSkills) {
        return '<div class="cv-sec cv-int">' . $h('Centres d\'intérêt', false) . implode('', array_map($li, $d['interests'])) . '</div>';
    }
    return '<div class="cv-sec cv-int">' . $h('Centres d\'intérêt', $style !== 'side') . '<p class="cv-inline">' . e(implode(' · ', $d['interests'])) . '</p></div>';
};
$qr = function (bool $withTitle = true) use ($d, $h): string {
    return $d['qr'] ? '<div class="cv-sec cv-qr">' . ($withTitle ? $h('CV en ligne', false) : '') . '<img src="' . e($d['qr']) . '" alt="QR code vers le CV en ligne"><div class="cv-qr-t">Scannez pour voir mon CV en ligne</div></div>' : '';
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
    if ($key === 'prestige') {
        $bgs .= '<div class="cv-topline bg-prestige"></div>';
    } elseif ($key === 'signature') {
        $bgs .= '<div class="cv-mainbg bg-signature"></div><div class="cv-deco bg-signature"></div>';
    } elseif ($key === 'parcours') {
        $bgs .= '<div class="cv-tline bg-parcours"></div>';
    }
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
    [$sideBlocks, $moved] = App\Services\Cv\CvRenderer::sideBlocks($d, $density, $nameInSide, $sideMoves ?? null, $t['side_blocks'] ?? null);
    $contactTitle = $key === 'signature' ? 'Informations' : 'Contact';
    $render = ['contact' => fn($st) => '<div class="cv-sec cv-contact-b">' . $h($contactTitle, false) . $contactLines() . '</div>', 'skills' => $skills, 'langs' => $langs, 'soft' => $soft,
        'interests' => $interests, 'qr' => fn($st) => $qr(), 'edu' => $educations];
    $eduInSide = in_array('edu', $sideBlocks, true); ?>
    <div class="cv-side">
        <?= $photo() ?>
        <?php if ($nameInSide): ?><?= $nameHtml() ?><?php if ($d['headline']): ?><div class="cv-headline"><?= e($d['headline']) ?></div><?php endif; ?><?php endif; ?>
        <?php foreach ($sideBlocks as $b): ?><?= $render[$b]('side') ?><?php endforeach; ?>
    </div>
    <div class="cv-main">
        <?php if (!$nameInSide): ?><div class="cv-head"><?= $nameHtml() ?><?php if ($d['headline']): ?><div class="cv-headline"><?= e($d['headline']) ?></div><?php endif; ?></div><?php endif; ?>
        <?= $summary() ?>
        <?= $eduInSide ? $experiences() : $parcours() ?>
        <?= $certs() ?>
        <?php if ($key === 'prestige'): ?><?= $interests('main') ?><?php endif; ?>
        <?php foreach ($moved as $b): ?><?= $render[$b]('inline') ?><?php endforeach; ?>
        <?= $footer() ?>
    </div>
<?php elseif ($layout === 'label'):
    $row = fn(string $label, string $content) => $content === '' ? '' : '<table class="cv-row"><tr><td class="cv-lbl">' . e($label) . '</td><td class="cv-cnt">' . $content . '</td></tr></table>';
    $strip = fn(string $html) => preg_replace('#<h4 class="cv-h">.*?</h4>#s', '', $html); ?>
    <div class="cv-head"><div class="cv-head-row<?= $d['photo'] ? ' with-photo' : '' ?>">
        <?php if ($d['photo']): ?><div class="cv-head-photo"><?= $photo() ?></div><?php endif; ?>
        <div class="cv-head-txt">
            <?= $nameHtml() ?>
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
            . ($x['bullets'] ? $bulletList($x['bullets']) : ($x['text'] !== '' ? '<p class="cv-desc">' . nl2br(e($x['text'])) . '</p>' : ''))
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
            <?= $nameHtml() ?>
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
