<div class="page-head"><div><h1>Modération des offres</h1><p>Validez, refusez, archivez ou mettez en avant les offres.</p></div><a class="btn btn-ghost" href="<?= e(url('/admin/export/offres')) ?>"><?= icon('file-down') ?> Export CSV</a></div>
<div class="flex flex-wrap between mb-3">
    <nav class="tabs"><?php foreach (['' => 'Toutes', 'pending' => 'À modérer', 'published' => 'Publiées', 'rejected' => 'Refusées', 'archived' => 'Archivées'] as $k => $l): ?><a class="<?= (string)$status === $k ? 'active' : '' ?>" href="<?= e(url('/admin/offres', ['statut' => $k])) ?>"><?= e($l) ?></a><?php endforeach; ?></nav>
    <form method="get" class="flex"><input type="hidden" name="statut" value="<?= e($status) ?>"><label class="sr-only" for="jq">Rechercher</label><input id="jq" class="input" name="q" value="<?= e($q) ?>" placeholder="Titre, entreprise"><button class="btn btn-primary" type="submit"><?= icon('search') ?></button></form>
</div>
<div class="table-wrap"><table class="table">
    <thead><tr><th>Offre</th><th>Statut</th><th>Signalements</th><th>Candidatures</th><th>Actions</th></tr></thead>
    <tbody><?php foreach ($jobs as $j): ?>
        <tr>
            <td><a href="<?= e(url('/offres/' . $j['id'])) ?>" target="_blank"><b><?= e($j['title']) ?></b></a> <?= $j['featured'] ? '<span class="badge badge-yellow">À la une</span>' : '' ?><br><small class="muted"><?= e($j['company_name']) ?> <?= $j['company_status'] !== 'verified' ? '(non vérifiée)' : '' ?> · <?= e($j['city_name']) ?> · <?= e(time_ago($j['created_at'])) ?></small></td>
            <td><?= App\Core\View::partial('company/_job_status', ['s' => $j['status']]) ?></td>
            <td><?= $j['reports'] ? '<span class="badge badge-red">' . icon('flag') . (int)$j['reports'] . '</span>' : '—' ?></td>
            <td class="tabular"><?= (int)$j['apps'] ?></td>
            <td>
                <form method="post" action="<?= e(url('/admin/offres/' . $j['id'])) ?>" class="actions" style="justify-content:flex-start">
                    <?= csrf_field() ?>
                    <?php if ($j['status'] !== 'published'): ?><button class="btn btn-success btn-sm" name="decision" value="approve" type="submit">Publier</button><?php endif; ?>
                    <?php if (in_array($j['status'], ['pending', 'published'], true)): ?><button class="btn btn-danger btn-sm" name="decision" value="reject" type="submit">Refuser</button><?php endif; ?>
                    <?php if ($j['status'] === 'published'): ?><button class="btn btn-ghost btn-sm" name="decision" value="feature" type="submit"><?= icon('star') ?></button><button class="btn btn-ghost btn-sm" name="decision" value="archive" type="submit" aria-label="Archiver"><?= icon('archive') ?></button><?php endif; ?>
                    <input name="note" class="input" style="min-height:34px;max-width:170px;font-size:.8rem" placeholder="Motif de refus" aria-label="Motif">
                </form>
            </td>
        </tr>
    <?php endforeach; ?></tbody>
</table></div>
