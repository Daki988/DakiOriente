<?php $st = application_statuses(); ?>
<div class="page-head"><div><h1>Mes candidatures</h1><p>Suis chaque étape, du dépôt à la réponse.</p></div><a class="btn btn-primary" href="<?= e(url('/offres')) ?>"><?= icon('search') ?> Trouver d'autres offres</a></div>
<nav class="tabs mb-3" aria-label="Filtrer par statut">
    <a href="<?= e(url('/espace/candidatures')) ?>" class="<?= $status === '' ? 'active' : '' ?>">Toutes <span class="count"><?= $counts[''] ?></span></a>
    <?php foreach ($st as $k => [$label]): if ($k === 'draft') continue; ?>
        <a href="<?= e(url('/espace/candidatures', ['statut' => $k])) ?>" class="<?= $status === $k ? 'active' : '' ?>"><?= e($label) ?> <span class="count"><?= $counts[$k] ?? 0 ?></span></a>
    <?php endforeach; ?>
</nav>
<?php if (!$apps): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'send', 'heading' => 'Aucune candidature ici', 'text' => 'Tes candidatures apparaîtront ici avec leur statut en temps réel.', 'cta' => ['Voir mes offres recommandées', '/espace/recommandations']]) ?>
<?php else: ?>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>Offre</th><th>Match</th><th>Statut</th><th class="hide-mobile">Envoyée</th><th class="hide-mobile">Prochaine étape</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>
            <?php foreach ($apps as $a): ?>
                <tr>
                    <td><div class="flex"><span class="logo-box" style="--s:38px;background:<?= e($a['company_color']) ?>"><?= e(mb_strtoupper(mb_substr($a['company_name'], 0, 2))) ?></span><div><b style="color:var(--navy)"><?= e($a['title']) ?></b><br><small class="muted"><?= e($a['company_name']) ?> · <?= e($a['city_name']) ?></small></div></div></td>
                    <td><div class="ring ring-sm <?= score_class((int)$a['match_score']) ?>" style="--p:<?= (int)$a['match_score'] ?>"><b><?= (int)$a['match_score'] ?></b></div></td>
                    <td><?= status_badge($a['status']) ?></td>
                    <td class="hide-mobile nowrap"><?= e(date_fr($a['created_at'])) ?></td>
                    <td class="hide-mobile small"><?= $a['interview_at'] && $a['status'] === 'interview' ? icon('calendar') . ' Entretien le ' . e(date_fr($a['interview_at'], true)) : ($a['status'] === 'sent' ? 'En attente de lecture' : ($a['status'] === 'accepted' ? 'Félicitations ! 🎉' : '—')) ?></td>
                    <td><a class="btn btn-ghost btn-sm" href="<?= e(url('/espace/candidatures/' . $a['id'])) ?>">Détails</a></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>
