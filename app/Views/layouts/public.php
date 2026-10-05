<?php
$u = user();
$publicNav = [['Accueil', '/'], ['Offres', '/offres'], ['Se former', '/formations'], ['Entreprises', '/entreprises'], ['Conseils', '/conseils']];
$isActive = fn(string $href) => $href === '/' ? is_current('/', true) : is_current($href);
?>
<!doctype html>
<html lang="fr">
<head>
<?= App\Core\View::partial('partials/head', get_defined_vars()) ?>
</head>
<body>
<a class="skip-link" href="#contenu">Aller au contenu</a>
<?php if (launch_mode()): ?><div class="launch-bar"><b>Phase de lancement</b> — Tremplin est entièrement gratuit pendant cette période. <a href="<?= e(url('/tarifs')) ?>">En savoir plus</a></div><?php endif; ?>
<header class="site-header">
    <div class="container header-bar">
        <button class="icon-btn hide-desktop" type="button" data-menu-open aria-expanded="false" aria-controls="mobile-menu" aria-label="Ouvrir le menu"><?= icon('menu') ?></button>
        <?= App\Core\View::partial('partials/brand') ?>
        <nav class="main-nav" aria-label="Navigation principale">
            <?php foreach ($publicNav as [$label, $href]): ?>
                <a href="<?= e(url($href)) ?>" class="<?= $isActive($href) ? 'active' : '' ?>" <?= $isActive($href) ? 'aria-current="page"' : '' ?>><?= e($label) ?></a>
            <?php endforeach; ?>
        </nav>
        <div class="header-actions">
            <a class="icon-btn hide-mobile" href="<?= e(url('/offres')) ?>" aria-label="Rechercher une offre"><?= icon('search') ?></a>
            <?php if ($u): ?>
                <a class="icon-btn" href="<?= e(url('/notifications')) ?>" aria-label="Notifications<?= unread_notifications() ? ' (' . unread_notifications() . ' non lues)' : '' ?>">
                    <?= icon('bell') ?><?php if ($n = unread_notifications()): ?><span class="dot-count"><?= $n ?></span><?php endif; ?>
                </a>
                <a class="btn btn-primary hide-mobile" href="<?= e(url(App\Core\Auth::homeUrl())) ?>"><?= icon('layout-dashboard') ?> Mon espace</a>
            <?php else: ?>
                <a class="btn btn-outline hide-mobile" href="<?= e(url('/connexion')) ?>">Se connecter</a>
                <a class="btn btn-cta hide-mobile" href="<?= e(url('/inscription')) ?>">S'inscrire</a>
                <a class="icon-btn hide-desktop" href="<?= e(url('/connexion')) ?>" aria-label="Se connecter"><?= icon('user') ?></a>
            <?php endif; ?>
        </div>
    </div>
</header>

<div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="scrim" data-menu-close></div>
    <div class="panel">
        <div class="flex between mb-2"><?= App\Core\View::partial('partials/brand') ?><button class="icon-btn" type="button" data-menu-close aria-label="Fermer le menu"><?= icon('x') ?></button></div>
        <?php foreach ([['Accueil', '/', 'house'], ['Offres', '/offres', 'briefcase-business'], ['Se former', '/formations', 'graduation-cap'], ['Entreprises', '/entreprises', 'building-2'], ['Conseils', '/conseils', 'lightbulb'], ['Tarifs', '/tarifs', 'wallet']] as [$l, $h, $i]): ?>
            <a class="item <?= $isActive($h) ? 'active' : '' ?>" href="<?= e(url($h)) ?>"><?= icon($i) ?> <?= e($l) ?></a>
        <?php endforeach; ?>
        <div class="divider"></div>
        <?php if ($u): ?>
            <a class="btn btn-primary btn-block" href="<?= e(url(App\Core\Auth::homeUrl())) ?>">Mon espace</a>
        <?php else: ?>
            <a class="btn btn-outline btn-block" href="<?= e(url('/connexion')) ?>">Se connecter</a>
            <a class="btn btn-cta btn-block mt-1" href="<?= e(url('/inscription')) ?>">S'inscrire gratuitement</a>
        <?php endif; ?>
    </div>
</div>

<main id="contenu">
    <?= $content ?>
</main>

<footer class="site-footer">
    <div class="container">
        <div class="footer-grid">
            <div>
                <span class="footer-logo"><img src="<?= e(asset('img/logo.png')) ?>" alt="Tremplin by NEAM" width="69" height="52"></span>
                <p class="mt-2" style="max-width:320px">La plateforme intelligente de stages, d'insertion professionnelle et de matching candidats–entreprises au Gabon et en Afrique francophone.</p>
                <p class="hand" style="font-size:1.5rem;color:var(--yellow);margin:0">Transformer le potentiel en opportunités.</p>
            </div>
            <div>
                <h4>Candidats</h4>
                <ul>
                    <li><a href="<?= e(url('/offres')) ?>">Trouver un stage</a></li>
                    <li><a href="<?= e(url('/espace/cv')) ?>">Créer mon CV</a></li>
                    <li><a href="<?= e(url('/espace/orientation')) ?>">Test d'orientation</a></li>
                    <li><a href="<?= e(url('/tarifs')) ?>"><?= launch_mode() ? 'Gratuit pendant le lancement' : 'Offres & tarifs' ?></a></li>
                </ul>
            </div>
            <div>
                <h4>Recruteurs</h4>
                <ul>
                    <li><a href="<?= e(url('/inscription?role=company')) ?>">Publier une offre</a></li>
                    <li><a href="<?= e(url('/entreprise/cvtheque')) ?>">CVthèque</a></li>
                    <li><a href="<?= e(url('/tarifs#entreprises')) ?>">Offres entreprises</a></li>
                </ul>
            </div>
            <div>
                <h4>Écoles</h4>
                <ul>
                    <li><a href="<?= e(url('/inscription?role=school')) ?>">Espace établissement</a></li>
                    <li><a href="<?= e(url('/tarifs#ecoles')) ?>">Licence établissement</a></li>
                </ul>
            </div>
            <div>
                <h4>Tremplin</h4>
                <ul>
                    <li><a href="<?= e(url('/conseils')) ?>">Conseils carrière</a></li>
                    <li><a href="<?= e(url('/api')) ?>">API partenaires</a></li>
                    <li><a href="<?= e(url('/confidentialite')) ?>">Confidentialité</a></li>
                    <li><a href="mailto:contact@neamindustry.com">contact@neamindustry.com</a></li>
                </ul>
            </div>
        </div>
        <hr style="border-color:rgba(255,255,255,.1)">
        <div class="flex between flex-wrap small">
            <span>© <?= date('Y') ?> NEAM Softwares Industry — Libreville, Gabon</span>
            <span>Fait avec ambition pour la jeunesse africaine</span>
        </div>
    </div>
</footer>
<?= App\Core\View::partial('partials/flash') ?>
<script src="<?= e(asset('js/app.js')) ?>" defer></script>
</body>
</html>
