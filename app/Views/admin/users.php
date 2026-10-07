<div class="page-head"><div><h1>Utilisateurs</h1><p><?= nf($total) ?> compte(s)</p></div><a class="btn btn-ghost" href="<?= e(url('/admin/export/utilisateurs')) ?>"><?= icon('file-down') ?> Export CSV</a></div>
<form method="get" class="flex flex-wrap mb-2">
    <label class="sr-only" for="uq">Rechercher</label><input id="uq" name="q" class="input" style="max-width:320px" value="<?= e($q) ?>" placeholder="Nom, e-mail, téléphone…">
    <select name="role" class="input" style="max-width:200px" aria-label="Rôle"><option value="">Tous les rôles</option><?php foreach (['candidate', 'company', 'school', 'admin'] as $r): ?><option value="<?= $r ?>" <?= $role === $r ? 'selected' : '' ?>><?= e(role_label($r)) ?></option><?php endforeach; ?></select>
    <button class="btn btn-primary" type="submit"><?= icon('search') ?> Filtrer</button>
</form>
<div class="table-wrap"><table class="table">
    <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Offre</th><th>Profil</th><th>Inscription</th><th>Statut</th><th>Actions</th></tr></thead>
    <tbody><?php foreach ($users as $u): ?>
        <tr>
            <td><div class="flex"><span class="avatar avatar-sm" style="background:<?= e(avatar_color($u['email'])) ?>"><?= e(initials($u['first_name'], $u['last_name'])) ?></span><div><b><?= e($u['first_name'] . ' ' . $u['last_name']) ?></b><br><small class="muted"><?= e($u['email']) ?></small></div></div></td>
            <td><span class="badge badge-gray"><?= e(role_label($u['role'])) ?></span></td>
            <td><?= e($u['plan_code']) ?></td>
            <td class="small"><?= $u['role'] === 'candidate' ? (int)$u['completion'] . ' % · ' . (int)$u['employability_score'] . '/100' : '—' ?></td>
            <td class="small nowrap"><?= e(date_fr($u['created_at'])) ?><br><span class="muted"><?= $u['last_login_at'] ? 'vu ' . e(time_ago($u['last_login_at'])) : '' ?></span></td>
            <td><span class="badge badge-<?= $u['status'] === 'active' ? 'green' : 'red' ?>"><?= $u['status'] === 'active' ? 'Actif' : 'Suspendu' ?></span></td>
            <td><?php if ((int)$u['id'] !== (int)user()['id']): ?>
                <form method="post" action="<?= e(url('/admin/utilisateurs/' . $u['id'])) ?>" class="flex" style="gap:6px" <?= $u['status'] === 'active' ? 'data-confirm="Suspendre ce compte ?"' : '' ?>>
                    <?= csrf_field() ?>
                    <input type="hidden" name="status" value="<?= $u['status'] === 'active' ? 'suspended' : 'active' ?>">
                    <button class="btn btn-sm <?= $u['status'] === 'active' ? 'btn-danger' : 'btn-success' ?>" type="submit"><?= $u['status'] === 'active' ? 'Suspendre' : 'Réactiver' ?></button>
                </form>
                <?php if ($u['role'] === 'candidate'): ?>
                    <form method="post" action="<?= e(url('/admin/utilisateurs/' . $u['id'])) ?>" class="flex mt-1" style="gap:6px"><?= csrf_field() ?><select name="plan_code" class="input" style="min-height:34px;font-size:.8rem" aria-label="Offre"><?php foreach (['FREE', 'STARTER', 'PRO', 'PREMIUM', 'CAREER'] as $pc): ?><option <?= $u['plan_code'] === $pc ? 'selected' : '' ?>><?= $pc ?></option><?php endforeach; ?></select><button class="btn btn-ghost btn-sm" type="submit" aria-label="Changer l'offre"><?= icon('check') ?></button></form>
                <?php endif; ?>
            <?php endif; ?></td>
        </tr>
    <?php endforeach; ?></tbody>
</table></div>
<?= App\Core\View::partial('partials/pagination', ['page' => $page, 'pages' => $pages, 'query' => array_filter(['q' => $q, 'role' => $role]), 'path' => '/admin/utilisateurs']) ?>
