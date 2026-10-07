<div class="page-head"><div><h1>Entreprises</h1><p>Vérification des entreprises (RCCM, coordonnées) avant publication.</p></div></div>
<nav class="tabs mb-3"><?php foreach (['' => 'Toutes', 'pending' => 'À vérifier', 'verified' => 'Vérifiées', 'rejected' => 'Refusées'] as $k => $l): ?><a class="<?= (string)$status === $k ? 'active' : '' ?>" href="<?= e(url('/admin/entreprises', ['statut' => $k])) ?>"><?= e($l) ?></a><?php endforeach; ?></nav>
<div class="stack">
    <?php foreach ($companies as $c): ?>
        <article class="card">
            <div class="flex flex-wrap" style="align-items:flex-start;gap:16px">
                <span class="logo-box" style="background:<?= e($c['color']) ?>"><?= e(mb_strtoupper(mb_substr($c['name'], 0, 2))) ?></span>
                <div class="grow" style="min-width:240px">
                    <h3 class="mb-0"><?= e($c['name']) ?> <span class="badge badge-<?= ['verified' => 'green', 'pending' => 'amber', 'rejected' => 'red'][$c['status']] ?>"><?= e(['verified' => 'Vérifiée', 'pending' => 'À vérifier', 'rejected' => 'Refusée'][$c['status']]) ?></span></h3>
                    <small class="muted"><?= e($c['sector_name']) ?> · <?= e($c['city_name']) ?> · <?= e($c['size']) ?> · <?= (int)$c['jobs_count'] ?> offre(s) · inscrite <?= e(time_ago($c['created_at'])) ?></small>
                    <p class="small mt-1 mb-0"><b>RCCM :</b> <?= e($c['rccm'] ?: 'non fourni') ?> · <b>Contact :</b> <?= e($c['owner_email']) ?> <?= $c['phone'] ? '· ' . e($c['phone']) : '' ?> <?= $c['website'] ? '· ' . e($c['website']) : '' ?></p>
                </div>
                <form method="post" action="<?= e(url('/admin/entreprises/' . $c['id'])) ?>" class="flex flex-wrap" style="gap:6px;align-items:center">
                    <?= csrf_field() ?>
                    <input name="note" class="input" style="min-height:38px;max-width:220px" placeholder="Motif (si refus)" aria-label="Motif">
                    <?php if ($c['status'] !== 'verified'): ?><button class="btn btn-success btn-sm" name="decision" value="verified" type="submit"><?= icon('badge-check') ?> Vérifier</button><?php endif; ?>
                    <?php if ($c['status'] !== 'rejected'): ?><button class="btn btn-danger btn-sm" name="decision" value="rejected" type="submit">Refuser</button><?php endif; ?>
                </form>
            </div>
        </article>
    <?php endforeach; ?>
</div>
