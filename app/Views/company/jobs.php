<div class="page-head"><div><h1>Mes offres</h1><p>Publiez, modifiez, dupliquez et archivez vos offres. Une offre précise attire des candidats plus compatibles.</p></div><a class="btn btn-cta" href="<?= e(url('/entreprise/offres/nouvelle')) ?>"><?= icon('plus') ?> Nouvelle offre</a></div>
<nav class="tabs mb-3">
    <?php foreach (['' => 'Toutes', 'published' => 'Publiées', 'pending' => 'En modération', 'draft' => 'Brouillons', 'archived' => 'Archivées'] as $k => $l): ?>
        <a class="<?= (string)$status === $k ? 'active' : '' ?>" href="<?= e(url('/entreprise/offres', ['statut' => $k])) ?>"><?= e($l) ?></a>
    <?php endforeach; ?>
</nav>
<?php if (!$jobs): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'briefcase-business', 'heading' => 'Aucune offre pour l\'instant', 'text' => 'Publiez votre première offre : en quelques minutes, vous recevez des candidats classés par compatibilité.', 'cta' => ['Publier une offre', '/entreprise/offres/nouvelle']]) ?>
<?php else: ?>
    <div class="table-wrap"><table class="table">
        <thead><tr><th>Offre</th><th>Statut</th><th class="hide-mobile">Publiée</th><th>Vues</th><th>Candidats</th><th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
        <?php foreach ($jobs as $j): ?>
            <tr>
                <td><a href="<?= e(url('/offres/' . $j['id'])) ?>"><b><?= e($j['title']) ?></b></a><br><small class="muted"><?= e(job_types()[$j['type']] ?? '') ?> · <?= e($j['city_name']) ?><?= $j['deadline'] ? ' · clôture ' . e(date_fr($j['deadline'])) : '' ?></small><?php if ($j['moderation_note']): ?><br><small style="color:var(--red)"><?= icon('info') ?> <?= e($j['moderation_note']) ?></small><?php endif; ?></td>
                <td><?= App\Core\View::partial('company/_job_status', ['s' => $j['status']]) ?></td>
                <td class="hide-mobile nowrap"><?= e(date_fr($j['published_at'])) ?></td>
                <td class="tabular"><?= nf($j['views']) ?></td>
                <td><b><?= (int)$j['apps'] ?></b><?= $j['new_apps'] ? ' <span class="badge badge-amber">+' . (int)$j['new_apps'] . '</span>' : '' ?></td>
                <td><div class="actions">
                    <a class="btn btn-soft btn-sm" href="<?= e(url('/entreprise/offres/' . $j['id'] . '/candidatures')) ?>"><?= icon('kanban') ?> Pipeline</a>
                    <a class="btn btn-ghost btn-sm" href="<?= e(url('/entreprise/offres/' . $j['id'] . '/matching')) ?>" title="Profils compatibles"><?= icon('sparkles') ?></a>
                    <a class="btn btn-ghost btn-sm" href="<?= e(url('/entreprise/offres/' . $j['id'] . '/modifier')) ?>" aria-label="Modifier"><?= icon('pencil') ?></a>
                    <form method="post" action="<?= e(url('/entreprise/offres/' . $j['id'] . '/dupliquer')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit" aria-label="Dupliquer"><?= icon('copy') ?></button></form>
                    <?php if ($j['status'] !== 'archived'): ?><form method="post" action="<?= e(url('/entreprise/offres/' . $j['id'] . '/archiver')) ?>" data-confirm="Archiver cette offre ? Elle ne sera plus visible."><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit" aria-label="Archiver"><?= icon('archive') ?></button></form><?php endif; ?>
                </div></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table></div>
<?php endif; ?>
