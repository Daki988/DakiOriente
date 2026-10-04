<div class="page-head"><div><h1>Journal d'audit</h1><p>Actions sensibles horodatées : connexions, modérations, paiements, exports, suppressions.</p></div>
    <form method="get" class="flex"><label class="sr-only" for="aq">Filtrer</label><input id="aq" class="input" name="q" value="<?= e($q) ?>" placeholder="Action (ex. payment, job.)"><button class="btn btn-primary" type="submit"><?= icon('search') ?></button></form></div>
<div class="table-wrap"><table class="table">
    <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Objet</th><th>Détails</th><th>IP</th></tr></thead>
    <tbody><?php foreach ($logs as $l): ?>
        <tr><td class="small nowrap"><?= e(date_fr($l['created_at'], true)) ?></td><td class="small"><?= $l['first_name'] ? e($l['first_name'] . ' ' . $l['last_name']) . '<br><span class="muted">' . e(role_label($l['role'])) . '</span>' : '<span class="muted">Visiteur / système</span>' ?></td>
            <td><code class="kbd"><?= e($l['action']) ?></code></td><td class="small"><?= e($l['entity']) ?><?= $l['entity_id'] ? ' #' . (int)$l['entity_id'] : '' ?></td>
            <td class="small muted" style="max-width:280px;overflow-wrap:anywhere"><?= e(excerpt((string)$l['meta'], 120)) ?></td><td class="small"><?= e($l['ip']) ?></td></tr>
    <?php endforeach; ?></tbody>
</table></div>
