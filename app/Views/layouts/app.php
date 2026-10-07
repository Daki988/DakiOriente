<?php
$u = user();
$role = $u['role'];
$items = app_nav($role);
$active = nav_active($items);
$bottom = bottom_nav($role);
$bottomActive = nav_active($bottom);
$unread = unread_notifications();
$planCode = $role === 'candidate' ? App\Services\PlanService::effectiveCode($u) : null;
?>
<!doctype html>
<html lang="fr">
<head>
<?= App\Core\View::partial('partials/head', get_defined_vars()) ?>
</head>
<body class="app-body">
<a class="skip-link" href="#contenu">Aller au contenu</a>
<div class="app-shell">
    <aside class="sidebar" aria-label="Navigation de l'espace">
        <?= App\Core\View::partial('partials/brand') ?>
        <?php foreach ($items as $it): ?>
            <?php if (!empty($it[3])): ?><div class="side-label"><?= e($it[3]) ?></div><?php endif; ?>
            <a class="side-link <?= $active === $it[1] ? 'active' : '' ?>" href="<?= e(url($it[1])) ?>" <?= $active === $it[1] ? 'aria-current="page"' : '' ?>>
                <?= icon($it[2]) ?> <?= e($it[0]) ?>
                <?php if ($it[1] === '/admin/signalements' && ($open = (int)App\Core\DB::value("SELECT COUNT(*) FROM reports WHERE status = 'open'"))): ?><span class="badge badge-red"><?= $open ?></span><?php endif; ?>
                <?php if ($it[1] === '/admin/entreprises' && ($pend = (int)App\Core\DB::value("SELECT COUNT(*) FROM companies WHERE status = 'pending'"))): ?><span class="badge badge-amber"><?= $pend ?></span><?php endif; ?>
            </a>
        <?php endforeach; ?>
        <?php if (launch_mode()): ?>
            <div class="side-upsell">
                <b><?= icon('rocket') ?> Phase de lancement</b>
                Toutes les fonctionnalités sont gratuites pendant cette période, y compris l'assistant IA.
            </div>
        <?php elseif ($role === 'candidate' && in_array($planCode, ['FREE', 'STARTER'], true)): ?>
            <div class="side-upsell">
                <b>Passe à Pro <?= icon('sparkles') ?></b>
                Candidatures illimitées, plan d'action et recommandations avancées.
                <a class="btn btn-cta btn-sm btn-block mt-2" href="<?= e(url('/abonnement')) ?>">Voir les offres</a>
            </div>
        <?php elseif ($role === 'candidate'): ?>
            <div class="side-upsell"><b>Abonnement <?= e($planCode) ?></b>Actif jusqu'au <?= e(date_fr($u['plan_expires_at'])) ?>.</div>
        <?php endif; ?>
    </aside>

    <div class="app-main">
        <header class="topbar">
            <button class="icon-btn hide-desktop" type="button" data-menu-open aria-expanded="false" aria-controls="mobile-menu" aria-label="Ouvrir le menu"><?= icon('menu') ?></button>
            <?= App\Core\View::partial('partials/brand') ?>
            <form class="search-mini" action="<?= e(url($role === 'company' ? '/entreprise/cvtheque' : ($role === 'admin' ? '/admin/utilisateurs' : '/offres'))) ?>" method="get" role="search">
                <?= icon('search') ?>
                <label class="sr-only" for="top-q">Rechercher</label>
                <input id="top-q" name="q" type="search" placeholder="<?= e($role === 'company' ? 'Rechercher un profil, une compétence…' : ($role === 'admin' ? 'Rechercher un utilisateur…' : 'Quel stage ou emploi cherches-tu ?')) ?>">
            </form>
            <div class="flex" style="margin-left:auto;gap:4px">
                <a class="icon-btn" href="<?= e(url('/notifications')) ?>" aria-label="Notifications<?= $unread ? " ($unread non lues)" : '' ?>"><?= icon('bell') ?><?php if ($unread): ?><span class="dot-count"><?= $unread ?></span><?php endif; ?></a>
                <details class="dropdown">
                    <summary class="flex" style="gap:8px;padding:4px;border-radius:12px" aria-label="Menu du compte">
                        <span class="avatar avatar-sm" style="background:<?= e(avatar_color($u['email'])) ?>"><?= e(initials($u['first_name'], $u['last_name'])) ?></span>
                        <span class="hide-mobile" style="line-height:1.2"><b style="font-size:.9rem;color:var(--navy)"><?= e($u['first_name']) ?></b><br><small class="muted"><?= e(role_label($role)) ?><?= !launch_mode() && $planCode && $planCode !== 'FREE' ? ' · ' . e($planCode) : '' ?></small></span>
                        <?= icon('chevron-down', 'hide-mobile') ?>
                    </summary>
                    <div class="dropdown-menu">
                        <a href="<?= e(url('/')) ?>"><?= icon('globe') ?> Site public</a>
                        <a href="<?= e(url('/compte')) ?>"><?= icon('settings') ?> Paramètres du compte</a>
                        <?php if (!launch_mode() && ($role === 'candidate' || $role === 'company')): ?><a href="<?= e(url('/abonnement')) ?>"><?= icon('credit-card') ?> Abonnement</a><?php endif; ?>
                        <a href="<?= e(url('/compte/api')) ?>"><?= icon('key-round') ?> Accès API</a>
                        <div class="divider" style="margin:6px 0"></div>
                        <form action="<?= e(url('/deconnexion')) ?>" method="post"><?= csrf_field() ?><button type="submit" class="danger"><?= icon('log-out') ?> Se déconnecter</button></form>
                    </div>
                </details>
            </div>
        </header>

        <main id="contenu" class="page" tabindex="-1">
            <?= $content ?>
        </main>
    </div>
</div>

<div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu de l'espace">
    <div class="scrim" data-menu-close></div>
    <div class="panel">
        <div class="flex between mb-1"><?= App\Core\View::partial('partials/brand') ?><button class="icon-btn" type="button" data-menu-close aria-label="Fermer le menu"><?= icon('x') ?></button></div>
        <?php foreach ($items as $it): ?>
            <?php if (!empty($it[3])): ?><div class="side-label"><?= e($it[3]) ?></div><?php endif; ?>
            <a class="item <?= $active === $it[1] ? 'active' : '' ?>" href="<?= e(url($it[1])) ?>"><?= icon($it[2]) ?> <?= e($it[0]) ?></a>
        <?php endforeach; ?>
        <div class="divider"></div>
        <a class="item" href="<?= e(url('/compte')) ?>"><?= icon('settings') ?> Paramètres</a>
        <form action="<?= e(url('/deconnexion')) ?>" method="post" class="mt-1"><?= csrf_field() ?><button type="submit" class="btn btn-danger btn-block"><?= icon('log-out') ?> Se déconnecter</button></form>
    </div>
</div>

<nav class="bottom-nav" aria-label="Navigation rapide">
    <?php foreach ($bottom as [$l, $h, $i]): ?>
        <a href="<?= e(url($h)) ?>" class="<?= $bottomActive === $h ? 'active' : '' ?>" <?= $bottomActive === $h ? 'aria-current="page"' : '' ?>><?= icon($i) ?><span><?= e($l) ?></span></a>
    <?php endforeach; ?>
</nav>

<?= App\Core\View::partial('partials/flash') ?>
<?php if (!empty($charts)): ?><script src="<?= e(asset('vendor/chart.umd.min.js')) ?>" defer></script><?php endif; ?>
<script src="<?= e(asset('js/app.js')) ?>" defer></script>
</body>
</html>
