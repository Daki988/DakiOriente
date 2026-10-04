<div class="page-head"><div><h1>Mes favoris</h1><p>Les offres que tu as mises de côté, avec ta compatibilité à jour.</p></div></div>
<?php if (!$items): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'heart', 'heading' => 'Aucun favori', 'text' => 'Clique sur le cœur d\'une offre pour la retrouver ici.', 'cta' => ['Parcourir les offres', '/offres']]) ?>
<?php else: ?>
    <div class="grid-2"><?php foreach ($items as $it): ?><?= App\Core\View::partial('partials/job_card', ['job' => $it['job'], 'match' => $it['match'], 'isFav' => true]) ?><?php endforeach; ?></div>
<?php endif; ?>
