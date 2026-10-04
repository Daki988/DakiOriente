<section class="section">
    <div class="container text-center" style="max-width:640px">
        <p class="hand" style="font-size:5rem;line-height:1;color:var(--blue);margin:0"><?= (int)$code ?></p>
        <h1 style="font-size:2rem"><?= e($title) ?></h1>
        <p class="muted"><?= e($message ?: match ((int)$code) {
            403 => 'Tu n\'as pas les droits nécessaires pour accéder à cette page.',
            404 => 'Cette page n\'existe pas ou a été déplacée. Mais ton avenir, lui, est bien là !',
            default => 'Une erreur est survenue.',
        }) ?></p>
        <div class="flex" style="justify-content:center;flex-wrap:wrap">
            <a class="btn btn-primary" href="<?= e(url('/')) ?>"><?= icon('house') ?> Retour à l'accueil</a>
            <a class="btn btn-ghost" href="<?= e(url('/offres')) ?>"><?= icon('search') ?> Voir les offres</a>
        </div>
    </div>
</section>
