<?php
/** @var string|null $title */
/** @var string|null $description */
$pageTitle = isset($title) && $title ? $title . ' · Tremplin by NEAM' : 'Tremplin by NEAM — Stages, emplois et formations au Gabon';
?>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($pageTitle) ?></title>
<meta name="description" content="<?= e($description ?? 'Tremplin by NEAM t\'accompagne à chaque étape : trouve des stages et emplois au Gabon, crée ton CV, découvre ton score de compatibilité et postule simplement.') ?>">
<meta name="theme-color" content="#0057ff">
<meta name="csrf-token" content="<?= e(App\Core\Csrf::token()) ?>">
<meta property="og:title" content="<?= e($pageTitle) ?>">
<meta property="og:description" content="Transformer le potentiel en opportunités.">
<meta property="og:image" content="<?= e(url('assets/img/logo.png')) ?>">
<link rel="icon" type="image/png" href="<?= e(asset('img/favicon.png')) ?>">
<link rel="apple-touch-icon" href="<?= e(asset('img/favicon.png')) ?>">
<link rel="preload" href="<?= e(url('assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2')) ?>" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>">
<link rel="stylesheet" href="<?= e(asset('css/cv.css')) ?>">
