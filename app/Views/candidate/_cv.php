<?php
/** @var array $p  @var string $template */
$levels = education_levels();
$tech = array_values(array_filter($p['skills'] ?? [], fn($s) => ($s['category'] ?? 'tech') === 'tech'));
$soft = $p['soft_list'] ?? [];
$langs = $p['languages_list'] ?? [];
$name = trim(($p['first_name'] ?? '') . ' ' . ($p['last_name'] ?? ''));
$contact = array_filter([$p['email'] ?? null, $p['phone'] ?? null, $p['city_name'] ?? null]);
$dots = function (int $lvl): string {
    $h = '<span class="level-dots" aria-label="' . $lvl . ' sur 5">';
    for ($i = 1; $i <= 5; $i++) {
        $h .= '<i class="' . ($i <= $lvl ? 'on' : '') . '"></i>';
    }
    return $h . '</span>';
};
$ai = $p['cv_ai_data'] ?? null;
$certifications = function () use ($p) {
    $items = $p['certificates'] ?? [];
    if (!$items && empty($p['certifications'])) {
        return;
    }
    echo '<h4>Certifications</h4>';
    foreach ($items as $c) {
        echo '<div class="cv-item"><b>' . e($c['title']) . '</b>' . ($c['status'] === 'verifie' ? ' <span title="Vérifié par NEAM">✓</span>' : '')
            . '<br><span class="when">' . e(implode(' · ', array_filter([$c['issuer'], $c['issued_at'] ? substr($c['issued_at'], 0, 4) : null]))) . '</span></div>';
    }
    if (!empty($p['certifications'])) {
        echo '<p>' . e($p['certifications']) . '</p>';
    }
};
if ($ai) {
    $p['headline'] = $ai['headline'] ?: ($p['headline'] ?? '');
    $p['bio'] = $ai['summary'] ?: ($p['bio'] ?? '');
}
$period = fn($x) => date_fr($x['start_date'] ?? null) . ' – ' . (!empty($x['end_date']) ? date_fr($x['end_date']) : 'aujourd\'hui');
$experiences = function () use ($p, $period, $ai) {
    foreach ($p['experiences'] ?? [] as $x): $bullets = $ai['experiences'][$x['id']] ?? null; ?>
        <div class="cv-item"><b><?= e($x['title']) ?></b><?= $x['company'] ? ' — ' . e($x['company']) : '' ?><br><span class="when"><?= e($period($x)) ?><?= $x['city'] ? ' · ' . e($x['city']) : '' ?></span>
            <?php if ($bullets): ?><ul style="margin:4px 0 0;padding-left:1.1em"><?php foreach ($bullets as $b): ?><li><?= e($b) ?></li><?php endforeach; ?></ul><?php elseif ($x['description']): ?><div><?= e($x['description']) ?></div><?php endif; ?></div>
    <?php endforeach;
};
$educations = function () use ($p) {
    foreach ($p['educations'] ?? [] as $ed): ?>
        <div class="cv-item"><b><?= e($ed['degree']) ?><?= $ed['field'] ? ' — ' . e($ed['field']) : '' ?></b><br><span class="when"><?= e($ed['school']) ?> · <?= e($ed['start_year']) ?>–<?= e($ed['end_year']) ?></span></div>
    <?php endforeach;
};
?>
<?php if ($template === 'classique'): ?>
<div class="cv-sheet cv-classique">
    <header>
        <h1><?= e($name) ?></h1>
        <div style="font-weight:600;color:var(--blue)"><?= e($p['headline'] ?? '') ?></div>
        <div class="small muted"><?= e(implode(' · ', $contact)) ?><?= !empty($p['linkedin']) ? ' · ' . e(preg_replace('#^https?://(www\.)?#', '', $p['linkedin'])) : '' ?></div>
    </header>
    <?php if (!empty($p['bio'])): ?><h4>Profil</h4><p><?= e($p['bio']) ?></p><?php endif; ?>
    <h4>Expériences & projets</h4><?php $experiences(); ?>
    <h4>Formation</h4><?php $educations(); ?>
    <h4>Compétences</h4>
    <p><?= e(implode(' · ', array_map(fn($s) => $s['name'], $tech))) ?></p>
    <?php if ($soft): ?><p><b>Qualités :</b> <?= e(implode(', ', $soft)) ?></p><?php endif; ?>
    <?php if ($langs): ?><h4>Langues</h4><p><?= e(implode(' · ', array_map(fn($l) => $l['name'] . ' (' . $l['level'] . ')', $langs))) ?></p><?php endif; ?>
    <?php $certifications(); ?>
</div>
<?php elseif ($template === 'creatif'): ?>
<div class="cv-sheet cv-creatif">
    <header>
        <h1 style="position:relative;z-index:1"><?= e($name) ?></h1>
        <div style="position:relative;z-index:1;font-weight:600;font-size:1.05rem"><?= e($p['headline'] ?? '') ?></div>
        <div style="position:relative;z-index:1;opacity:.9" class="small mt-1"><?= e(implode('  ·  ', $contact)) ?></div>
    </header>
    <div class="cv-body">
        <div>
            <?php if (!empty($p['bio'])): ?><h4>À propos</h4><p><?= e($p['bio']) ?></p><?php endif; ?>
            <h4>Expériences & projets</h4><?php $experiences(); ?>
            <h4>Formation</h4><?php $educations(); ?>
        </div>
        <div>
            <h4>Compétences</h4>
            <?php foreach ($tech as $s): ?><div class="cv-skill"><span><?= e($s['name']) ?></span><?= $dots((int)$s['level']) ?></div><?php endforeach; ?>
            <?php if ($soft): ?><h4>Qualités</h4><div class="tags"><?php foreach ($soft as $s): ?><span class="tag"><?= e($s) ?></span><?php endforeach; ?></div><?php endif; ?>
            <?php if ($langs): ?><h4>Langues</h4><?php foreach ($langs as $l): ?><div class="cv-skill"><span><?= e($l['name']) ?></span><b><?= e($l['level']) ?></b></div><?php endforeach; ?><?php endif; ?>
            <?php if (!empty($p['riasec_code'])): ?><h4>Profil RIASEC</h4><p><b style="letter-spacing:.15em;color:var(--blue)"><?= e($p['riasec_code']) ?></b></p><?php endif; ?>
        </div>
    </div>
</div>
<?php else: ?>
<div class="cv-sheet cv-moderne">
    <div class="cv-left">
        <div class="avatar avatar-xl" style="background:<?= e(avatar_color($p['email'] ?? 'x')) ?>;margin-bottom:16px"><?= e(initials($p['first_name'] ?? '', $p['last_name'] ?? '')) ?></div>
        <h1><?= e($name) ?></h1>
        <div style="color:#fff;font-weight:600"><?= e($p['headline'] ?? '') ?></div>
        <h4>Contact</h4>
        <?php foreach ($contact as $c): ?><div class="small" style="overflow-wrap:anywhere"><?= e($c) ?></div><?php endforeach; ?>
        <?php if (!empty($p['linkedin'])): ?><div class="small" style="overflow-wrap:anywhere"><?= e(preg_replace('#^https?://(www\.)?#', '', $p['linkedin'])) ?></div><?php endif; ?>
        <h4>Compétences</h4>
        <?php foreach ($tech as $s): ?><div class="cv-skill"><span><?= e($s['name']) ?></span><?= $dots((int)$s['level']) ?></div><?php endforeach; ?>
        <?php if ($langs): ?><h4>Langues</h4><?php foreach ($langs as $l): ?><div class="cv-skill"><span><?= e($l['name']) ?></span><span><?= e($l['level']) ?></span></div><?php endforeach; ?><?php endif; ?>
        <?php if ($soft): ?><h4>Qualités</h4><div class="small"><?= e(implode(' · ', $soft)) ?></div><?php endif; ?>
    </div>
    <div class="cv-right">
        <?php if (!empty($p['bio'])): ?><h4>Profil</h4><p><?= e($p['bio']) ?></p><?php endif; ?>
        <h4>Expériences & projets</h4><?php $experiences(); ?>
        <h4>Formation</h4><?php $educations(); ?>
        <?php $certifications(); ?>
        <?php if (!empty($p['availability_date'])): ?><h4>Disponibilité</h4><p>À partir du <?= e(date_fr($p['availability_date'])) ?> · Mobilité : <?= e(mobility_labels()[$p['mobility'] ?? 'ville'] ?? '') ?></p><?php endif; ?>
    </div>
</div>
<?php endif; ?>
