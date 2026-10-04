<?php $st = ['open' => ['Ouvert', 'red'], 'in_progress' => ['En cours', 'amber'], 'resolved' => ['Résolu', 'green'], 'rejected' => ['Classé', 'gray']]; ?>
<div class="page-head"><div><h1>Signalements & tickets</h1><p>Offres suspectes, arnaques, contenus inappropriés signalés par les utilisateurs.</p></div></div>
<?php if (!$reports): ?><?= App\Core\View::partial('partials/empty', ['icon' => 'flag', 'heading' => 'Aucun signalement']) ?><?php endif; ?>
<div class="stack">
    <?php foreach ($reports as $r): ?>
        <article class="card">
            <div class="flex between flex-wrap">
                <div><span class="badge badge-<?= $st[$r['status']][1] ?>"><?= e($st[$r['status']][0]) ?></span> <b style="color:var(--navy)"><?= e($r['subject'] ?: 'Signalement') ?></b>
                    <br><small class="muted"><?= e(ucfirst($r['entity'])) ?> #<?= (int)$r['entity_id'] ?><?= $r['target'] ? ' — ' . e($r['target']) : '' ?> · par <?= e(trim(($r['first_name'] ?? 'Compte supprimé') . ' ' . ($r['last_name'] ?? ''))) ?> · <?= e(time_ago($r['created_at'])) ?></small></div>
                <?php if ($r['entity'] === 'job'): ?><a class="btn btn-ghost btn-sm" href="<?= e(url('/offres/' . $r['entity_id'])) ?>" target="_blank"><?= icon('eye') ?> Voir l'offre</a><?php endif; ?>
            </div>
            <p class="mt-1 mb-1"><?= e($r['reason']) ?></p>
            <form method="post" action="<?= e(url('/admin/signalements/' . $r['id'])) ?>" class="flex flex-wrap" style="align-items:center">
                <?= csrf_field() ?>
                <select name="status" class="input" style="max-width:160px" aria-label="Statut"><?php foreach ($st as $k => [$l]): ?><option value="<?= $k ?>" <?= $r['status'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
                <input name="admin_note" class="input grow" value="<?= e($r['admin_note']) ?>" placeholder="Note interne" aria-label="Note">
                <?php if ($r['entity'] === 'job'): ?><label class="check small"><input type="checkbox" name="suspend_job" value="1"> Suspendre l'offre</label><?php endif; ?>
                <button class="btn btn-primary btn-sm" type="submit">Mettre à jour</button>
            </form>
        </article>
    <?php endforeach; ?>
</div>
