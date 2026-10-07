<?php
/** @var string $current */
$tabs = [
    'index' => ['Vue d\'ensemble', '/admin/referentiels'], 'metiers' => ['Métiers', '/admin/referentiels/metiers'], 'competences' => ['Compétences', '/admin/referentiels/competences'],
    'diplomes' => ['Diplômes', '/admin/referentiels/diplomes'], 'formations' => ['Formations', '/admin/formations'], 'regles' => ['Objectifs & seuils', '/admin/referentiels/regles'],
    'versions' => ['Versions & jeu de référence', '/admin/referentiels/versions'], 'curation' => ['File de curation', '/admin/curation'], 'qualite' => ['Qualité & calibrage', '/admin/qualite'],
];
$open = App\Services\Referential\Curation::openCount();
?>
<nav class="ref-tabs" aria-label="Référentiels">
    <?php foreach ($tabs as $k => [$l, $u]): ?><a class="<?= $current === $k ? 'on' : '' ?>" href="<?= e(url($u)) ?>"><?= e($l) ?><?= $k === 'curation' && $open ? ' · ' . $open : '' ?></a><?php endforeach; ?>
</nav>
