<div class="page-head"><div><h1>Mes favoris</h1><p>Les offres que tu as mises de côté, avec ta compatibilité à jour. N'attends pas trop : les meilleures offres partent vite.</p></div></div>
<?php if (!$items): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'heart', 'heading' => 'Pas encore de favori', 'text' => 'Une offre te plaît mais tu veux y réfléchir ? Clique sur son cœur : tu la retrouveras ici, avec ton score à jour.', 'cta' => ['Parcourir les offres', '/offres']]) ?>
<?php else: ?>
    <div class="grid-2"><?php foreach ($items as $it): ?><?= App\Core\View::partial('partials/job_card', ['job' => $it['job'], 'match' => $it['match'], 'isFav' => true]) ?><?php endforeach; ?></div>
<?php endif; ?>
